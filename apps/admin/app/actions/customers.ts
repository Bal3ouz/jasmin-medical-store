"use server";

import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { customers } from "@jasmin/db/schema";
import { AdminCustomerUpdateSchema } from "@jasmin/lib/schemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAudit } from "./audit";

/**
 * Lazily build a DB client. Missing `SUPABASE_DB_URL` is reported as a
 * structured action error so the form keeps rendering in dev shells without
 * DB credentials.
 */
function db() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL not set");
  return createClient(url);
}

/**
 * Same shape used elsewhere in the admin (products / variants / inventory)
 * so the form code can drive `useActionState` or read the result inline
 * without a per-action discriminator.
 */
export type CustomerActionState =
  | { ok: null }
  | { ok: true; message?: string }
  | {
      ok: false;
      errors?: { fieldErrors: Record<string, string[]>; formErrors: string[] };
      message?: string;
    };

const INITIAL_STATE: CustomerActionState = { ok: null };
export const customerActionInitialState = INITIAL_STATE;

async function assertManagerOrAdmin() {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");
  if (!["admin", "manager"].includes(session.role)) throw new Error("Forbidden");
  return session;
}

/**
 * Normalise empty-string form fields to `undefined` so optional inputs don't
 * trip Zod's max-length / nullability rules.
 */
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

function envError(): CustomerActionState {
  return {
    ok: false,
    errors: { fieldErrors: {}, formErrors: ["Base de données non configurée."] },
  };
}

/* -------------------------------------------------------------------------- */
/* updateCustomerProfileAction                                                */
/* -------------------------------------------------------------------------- */

/**
 * Admin-side customer profile edit. Updates `full_name` + `phone` only —
 * email is owned by Supabase Auth and shouldn't drift from the auth user
 * out of band.
 *
 * Runs inside a transaction so the captured before/after diff and the
 * audit row commit/rollback together with the update.
 */
export async function updateCustomerProfileAction(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  let session: Awaited<ReturnType<typeof assertManagerOrAdmin>>;
  try {
    session = await assertManagerOrAdmin();
  } catch {
    return { ok: false, errors: { fieldErrors: {}, formErrors: ["Action non autorisée."] } };
  }

  const parsed = AdminCustomerUpdateSchema.safeParse(normaliseForm(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  const { id, fullName, phone } = parsed.data;

  if (!process.env.SUPABASE_DB_URL) return envError();

  try {
    await db().transaction(async (tx) => {
      const [before] = await tx.select().from(customers).where(eq(customers.id, id));
      if (!before) throw new Error("Client introuvable.");

      const [after] = await tx
        .update(customers)
        .set({ fullName, phone, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "customer.update",
        entityType: "customer",
        entityId: id,
        before: { fullName: before.fullName, phone: before.phone },
        after: { fullName: after?.fullName ?? null, phone: after?.phone ?? null },
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

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true, message: "Profil client mis à jour." };
}
