"use server";

import { getStaffSession } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createClient } from "@jasmin/db";
import { staffUsers } from "@jasmin/db/schema";
import { VOICE } from "@jasmin/lib";
import {
  StaffInviteSchema,
  StaffSetActiveSchema,
  StaffUpdateRoleSchema,
} from "@jasmin/lib/schemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAudit } from "./audit";

/**
 * Lazily build a DB client. Missing `SUPABASE_DB_URL` surfaces as a
 * structured action error so the form keeps working in dev shells without
 * DB credentials wired up.
 */
function db() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL not set");
  return createClient(url);
}

export type StaffActionState =
  | { ok: null }
  | { ok: true; message?: string }
  | {
      ok: false;
      errors?: { fieldErrors: Record<string, string[]>; formErrors: string[] };
      message?: string;
    };

export const staffActionInitialState: StaffActionState = { ok: null };

async function assertAdmin() {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");
  if (session.role !== "admin") throw new Error("Forbidden");
  return session;
}

function normaliseForm(formData: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") {
      const trimmed = v.trim();
      raw[k] = trimmed === "" ? undefined : trimmed;
    } else {
      raw[k] = v;
    }
  }
  return raw;
}

function envError(): StaffActionState {
  return {
    ok: false,
    errors: { fieldErrors: {}, formErrors: ["Base de données non configurée."] },
  };
}

/* -------------------------------------------------------------------------- */
/* inviteStaffAction                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Invite a new staff member by email.
 *
 * Two-step write across separate connections:
 *  1. Supabase Auth's `inviteUserByEmail` creates the `auth.users` row +
 *     emails the magic link. The `is_staff: true` flag in metadata tells
 *     `on_auth_user_created()` to skip inserting a `customers` row (the
 *     trigger covered by `admin: staff invite` schema tests).
 *  2. Drizzle inserts the `staff_users` row in our DB inside a transaction
 *     with the audit row.
 *
 * The auth row and the staff row live in different connections, so if step 2
 * fails we proactively delete the orphan via `auth.admin.deleteUser` to
 * keep the two stores in lockstep. Without that compensation the next admin
 * trying to invite the same email would hit a unique-key error in Supabase.
 */
export async function inviteStaffAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, errors: { fieldErrors: {}, formErrors: ["Action non autorisée."] } };
  }

  const parsed = StaffInviteSchema.safeParse(normaliseForm(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  const { email, fullName, role } = parsed.data;

  if (!process.env.SUPABASE_DB_URL) return envError();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: ["Service Supabase non configuré (URL/clé service manquante)."],
      },
    };
  }

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";
  const serviceRole = createSupabaseServiceClient();

  const invite = await serviceRole.auth.admin.inviteUserByEmail(email, {
    data: { is_staff: true, full_name: fullName, role },
    redirectTo: `${adminUrl}/auth/callback`,
  });

  if (invite.error || !invite.data.user) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [invite.error?.message ?? "Échec de l'invitation."],
      },
    };
  }

  const userId = invite.data.user.id;

  try {
    const session = await getStaffSession();
    if (!session) throw new Error("Unauthenticated");

    await db().transaction(async (tx) => {
      const [row] = await tx
        .insert(staffUsers)
        .values({
          id: userId,
          email,
          fullName,
          role,
          isActive: true,
        })
        .returning();
      if (!row) throw new Error("Échec de la création du staff_user.");
      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "staff.invite",
        entityType: "staff",
        entityId: userId,
        after: { email, fullName, role },
      });
    });
  } catch (e) {
    // Roll back the orphan auth user — otherwise re-inviting the same
    // address would collide on Supabase's unique-email constraint.
    try {
      await serviceRole.auth.admin.deleteUser(userId);
    } catch {
      // Swallow the cleanup failure; surface the original error so the
      // admin sees what actually went wrong with the staff insert.
    }
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [(e as Error).message ?? "Erreur lors de la création du staff."],
      },
    };
  }

  revalidatePath("/equipe");
  return { ok: true, message: VOICE.inviteSent };
}

/* -------------------------------------------------------------------------- */
/* updateStaffRoleAction                                                      */
/* -------------------------------------------------------------------------- */

export async function updateStaffRoleAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    return { ok: false, errors: { fieldErrors: {}, formErrors: ["Action non autorisée."] } };
  }

  const parsed = StaffUpdateRoleSchema.safeParse(normaliseForm(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  const { id, role } = parsed.data;

  if (!process.env.SUPABASE_DB_URL) return envError();

  try {
    await db().transaction(async (tx) => {
      const [before] = await tx.select().from(staffUsers).where(eq(staffUsers.id, id));
      if (!before) throw new Error("Membre introuvable.");

      const [after] = await tx
        .update(staffUsers)
        .set({ role, updatedAt: new Date() })
        .where(eq(staffUsers.id, id))
        .returning();

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "staff.update_role",
        entityType: "staff",
        entityId: id,
        before: { role: before.role },
        after: { role: after?.role ?? role },
      });
    });
  } catch (e) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [(e as Error).message ?? "Erreur lors de la mise à jour du rôle."],
      },
    };
  }

  revalidatePath("/equipe");
  revalidatePath(`/equipe/${id}`);
  return { ok: true, message: "Rôle mis à jour." };
}

/* -------------------------------------------------------------------------- */
/* setStaffActiveAction                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Toggle the `is_active` flag on a staff_users row.
 *
 * Self-deactivation is blocked at the action layer — losing the only admin
 * mid-session by accident would lock the team out of the back office. The
 * UI hides the toggle for the current user as a parallel guard.
 */
export async function setStaffActiveAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    return { ok: false, errors: { fieldErrors: {}, formErrors: ["Action non autorisée."] } };
  }

  // Boolean comes through as the literal string "true"/"false" via FormData.
  const raw = normaliseForm(formData);
  const coerced = {
    ...raw,
    isActive: raw.isActive === "true" || raw.isActive === true,
  };

  const parsed = StaffSetActiveSchema.safeParse(coerced);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  const { id, isActive } = parsed.data;

  if (id === session.authUserId && isActive === false) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: ["Vous ne pouvez pas désactiver votre propre compte."],
      },
    };
  }

  if (!process.env.SUPABASE_DB_URL) return envError();

  try {
    await db().transaction(async (tx) => {
      const [before] = await tx.select().from(staffUsers).where(eq(staffUsers.id, id));
      if (!before) throw new Error("Membre introuvable.");

      const [after] = await tx
        .update(staffUsers)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(staffUsers.id, id))
        .returning();

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "staff.set_active",
        entityType: "staff",
        entityId: id,
        before: { isActive: before.isActive },
        after: { isActive: after?.isActive ?? isActive },
      });
    });
  } catch (e) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [(e as Error).message ?? "Erreur lors de la mise à jour."],
      },
    };
  }

  revalidatePath("/equipe");
  revalidatePath(`/equipe/${id}`);
  return { ok: true, message: isActive ? "Membre réactivé." : "Membre désactivé." };
}
