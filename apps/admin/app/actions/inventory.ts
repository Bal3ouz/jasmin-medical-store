"use server";

import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { inventory, stockMovements } from "@jasmin/db/schema";
import { InventoryAdjustSchema } from "@jasmin/lib/schemas";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAudit } from "./audit";

/**
 * Lazily build a DB client. Missing `SUPABASE_DB_URL` is reported as a
 * structured action error so the form surface keeps working in dev shells
 * without DB credentials.
 */
function db() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL not set");
  return createClient(url);
}

type Role = "admin" | "manager" | "cashier" | "stock";

async function assertRole(allowed: Role[]) {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");
  if (!allowed.includes(session.role)) throw new Error("Forbidden");
  return session;
}

/**
 * Same shape used by the products/variants actions — keeps the client form
 * code uniform whether it consumes useActionState or a direct `<form action>`.
 */
export type InventoryActionState =
  | { ok: null }
  | { ok: true; message?: string }
  | {
      ok: false;
      errors?: { fieldErrors: Record<string, string[]>; formErrors: string[] };
      message?: string;
    };

/**
 * Normalise empty-string form fields. UUIDs need `undefined` (so Zod's
 * `.optional()` kicks in) and `delta` is sent as a numeric string.
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

function envError(): InventoryActionState {
  return {
    ok: false,
    errors: { fieldErrors: {}, formErrors: ["Base de données non configurée."] },
  };
}

/* -------------------------------------------------------------------------- */
/* adjustInventoryAction                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Apply a signed `delta` to an inventory row keyed by product XOR variant,
 * inserting an `adjustment` row in `stock_movements` and an audit record
 * in the same transaction. The inventory row is locked `FOR UPDATE` so
 * concurrent adjustments serialise on the row instead of racing.
 *
 * Returns `{ ok: false, ... }` for missing inventory or negative result; the
 * caller (a `useActionState`-driven client form) renders the error message.
 */
export async function adjustInventoryAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  let session: Awaited<ReturnType<typeof assertRole>>;
  try {
    session = await assertRole(["admin", "manager", "stock"]);
  } catch {
    return { ok: false, errors: { fieldErrors: {}, formErrors: ["Action non autorisée."] } };
  }

  const parsed = InventoryAdjustSchema.safeParse(normaliseForm(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  const { productId, variantId, delta, reason } = parsed.data;

  if (!process.env.SUPABASE_DB_URL) return envError();

  try {
    await db().transaction(async (tx) => {
      // SELECT … FOR UPDATE on the matching row. The schema enforces XOR via
      // a CHECK constraint plus unique indexes on each FK column; we mirror
      // that here so the lookup hits the right row even if the form swaps
      // which key it sends.
      const where = variantId
        ? eq(inventory.variantId, variantId)
        : and(eq(inventory.productId, productId ?? ""), isNull(inventory.variantId));
      const locked = await tx.select().from(inventory).where(where).for("update");
      const row = locked[0];
      if (!row) {
        // Throwing inside the tx rolls everything back. We catch below and
        // surface the message.
        throw new Error("Inventaire introuvable.");
      }

      const newOnHand = row.onHand + delta;
      if (newOnHand < 0) {
        throw new Error("Stock négatif refusé.");
      }

      await tx
        .update(inventory)
        .set({ onHand: newOnHand, updatedAt: new Date() })
        .where(eq(inventory.id, row.id));

      // Stock-movement ledger entry. `quantity` is signed: positive for
      // additions (`delta > 0`), negative for removals.
      await tx.insert(stockMovements).values({
        productId: row.productId,
        variantId: row.variantId,
        type: "adjustment",
        quantity: delta,
        referenceType: "manual_adjustment",
        referenceId: null,
        notes: reason,
        performedBy: session.authUserId,
      });

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "inventory.adjust",
        entityType: "inventory",
        entityId: row.id,
        before: { onHand: row.onHand },
        after: { onHand: newOnHand, reason },
      });
    });
  } catch (e) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [(e as Error).message ?? "Erreur lors de l'ajustement"],
      },
    };
  }

  revalidatePath("/stock");
  revalidatePath("/stock/mouvements");
  revalidatePath("/");
  return { ok: true, message: "Stock ajusté." };
}
