"use server";

import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { inventory, orderItems, productVariants, products } from "@jasmin/db/schema";
import {
  VariantCreateSchema,
  VariantSetDefaultSchema,
  VariantUpdateSchema,
} from "@jasmin/lib/schemas";
import { and, eq, isNull, ne } from "drizzle-orm";
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
 * Same shape used by the products actions — keeps the client form code
 * uniform whether it consumes useActionState or a direct `<form action>`.
 */
export type VariantActionState =
  | { ok: null }
  | { ok: true; variantId?: string; message?: string }
  | {
      ok: false;
      errors?: { fieldErrors: Record<string, string[]>; formErrors: string[] };
      message?: string;
    };

/** Normalise empty strings → undefined so Zod's optional() works. */
function normaliseForm(formData: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed === "") {
        raw[k] = undefined;
      } else if (k === "isDefault") {
        raw[k] = trimmed === "true" || trimmed === "on" || trimmed === "1";
      } else {
        raw[k] = trimmed;
      }
    } else {
      raw[k] = v;
    }
  }
  if (raw.isDefault === undefined) raw.isDefault = false;
  return raw;
}

function envError(): VariantActionState {
  return {
    ok: false,
    errors: { fieldErrors: {}, formErrors: ["Base de données non configurée."] },
  };
}

/* -------------------------------------------------------------------------- */
/* addVariantAction                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Insert a new variant + its inventory row in a single transaction. If this
 * is the first variant attached to a previously-flat product, the existing
 * product-level inventory row is removed in the same tx so the schema's
 * (product_id XOR variant_id) invariant stays clean.
 */
export async function addVariantAction(
  _prev: VariantActionState,
  formData: FormData,
): Promise<VariantActionState> {
  let session: Awaited<ReturnType<typeof assertRole>>;
  try {
    session = await assertRole(["admin", "manager"]);
  } catch {
    return { ok: false, errors: { fieldErrors: {}, formErrors: ["Action non autorisée."] } };
  }

  const parsed = VariantCreateSchema.safeParse(normaliseForm(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  const data = parsed.data;

  if (!process.env.SUPABASE_DB_URL) return envError();

  let createdId: string;
  try {
    createdId = await db().transaction(async (tx) => {
      // SKU uniqueness pre-check (variants share the global products.sku
      // unique index path indirectly through their own unique on `sku`).
      const collision = await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.sku, data.sku))
        .limit(1);
      if (collision.length > 0) {
        throw new Error(`SKU déjà utilisé: ${data.sku}`);
      }

      // If `isDefault=true`, clear sibling defaults first so we don't end
      // up with two `is_default=true` rows for the same product.
      if (data.isDefault) {
        await tx
          .update(productVariants)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(productVariants.productId, data.productId));
      }

      const [row] = await tx
        .insert(productVariants)
        .values({
          productId: data.productId,
          sku: data.sku,
          name: data.name,
          priceTnd: String(data.priceTnd),
          compareAtPriceTnd: data.compareAtPriceTnd == null ? null : String(data.compareAtPriceTnd),
          weightG: data.weightG ?? null,
          isDefault: data.isDefault,
          displayOrder: data.displayOrder,
        })
        .returning();
      if (!row) throw new Error("Failed to insert variant");

      // First-variant migration: if a product-level inventory row exists,
      // drop it. Track 4.4 created one when has_variants was false; adding
      // a variant promotes inventory tracking down to the variant tier.
      await tx
        .delete(inventory)
        .where(and(eq(inventory.productId, data.productId), isNull(inventory.variantId)));

      // Variant-level inventory row.
      await tx.insert(inventory).values({
        variantId: row.id,
        onHand: 0,
        reserved: 0,
        reorderPoint: 5,
      });

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "variant.create",
        entityType: "variant",
        entityId: row.id,
        after: row,
      });

      return row.id;
    });
  } catch (e) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [(e as Error).message ?? "Erreur lors de la création"],
      },
    };
  }

  revalidatePath(`/catalogue/produits/${data.productId}`);
  return { ok: true, variantId: createdId, message: "Déclinaison ajoutée" };
}

/* -------------------------------------------------------------------------- */
/* updateVariantAction                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Partial update — only fields the form actually submits get written.
 * Mirrors `updateProductAction`'s defined-only spread approach so blanks
 * don't accidentally null-out columns the user didn't intend to clear.
 */
export async function updateVariantAction(
  _prev: VariantActionState,
  formData: FormData,
): Promise<VariantActionState> {
  let session: Awaited<ReturnType<typeof assertRole>>;
  try {
    session = await assertRole(["admin", "manager"]);
  } catch {
    return { ok: false, errors: { fieldErrors: {}, formErrors: ["Action non autorisée."] } };
  }

  const parsed = VariantUpdateSchema.safeParse(normaliseForm(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  const { id, ...rest } = parsed.data;

  if (!process.env.SUPABASE_DB_URL) return envError();

  let productId: string;
  try {
    productId = await db().transaction(async (tx) => {
      const [before] = await tx.select().from(productVariants).where(eq(productVariants.id, id));
      if (!before) throw new Error("Variant not found");

      // SKU collision pre-check (excluding the row being updated).
      if (rest.sku && rest.sku !== before.sku) {
        const collision = await tx
          .select({ id: productVariants.id })
          .from(productVariants)
          .where(and(eq(productVariants.sku, rest.sku), ne(productVariants.id, id)))
          .limit(1);
        if (collision.length > 0) {
          throw new Error(`SKU déjà utilisé: ${rest.sku}`);
        }
      }

      // If toggling isDefault on, also clear siblings to maintain the
      // single-default invariant.
      if (rest.isDefault === true) {
        await tx
          .update(productVariants)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(productVariants.productId, before.productId), ne(productVariants.id, id)));
      }

      const update: Record<string, unknown> = { updatedAt: new Date() };
      for (const [k, v] of Object.entries(rest)) {
        if (v === undefined) continue;
        if (k === "priceTnd" || k === "compareAtPriceTnd") {
          update[k] = v == null ? null : String(v);
        } else {
          update[k] = v;
        }
      }

      const [after] = await tx
        .update(productVariants)
        .set(update)
        .where(eq(productVariants.id, id))
        .returning();

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "variant.update",
        entityType: "variant",
        entityId: id,
        before,
        after: after ?? null,
      });

      return before.productId;
    });
  } catch (e) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [(e as Error).message ?? "Erreur lors de la mise à jour"],
      },
    };
  }

  revalidatePath(`/catalogue/produits/${productId}`);
  return { ok: true, variantId: id, message: "Déclinaison mise à jour" };
}

/* -------------------------------------------------------------------------- */
/* deleteVariantAction                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Delete a variant + its inventory row in a single tx. The schema's
 * order_items.variant_id FK is `ON DELETE RESTRICT` (variant is nullable
 * but the FK still blocks delete), so when references exist we surface a
 * friendly error instead of letting the constraint error bubble up. The
 * order item snapshot fields (product_name_snapshot, sku_snapshot, …)
 * keep historical lines readable independently.
 */
export async function deleteVariantAction(
  _prev: VariantActionState,
  formData: FormData,
): Promise<VariantActionState> {
  let session: Awaited<ReturnType<typeof assertRole>>;
  try {
    session = await assertRole(["admin", "manager"]);
  } catch {
    return { ok: false, errors: { fieldErrors: {}, formErrors: ["Action non autorisée."] } };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, errors: { fieldErrors: { id: ["manquant"] }, formErrors: [] } };
  }

  if (!process.env.SUPABASE_DB_URL) return envError();

  let productId: string;
  try {
    productId = await db().transaction(async (tx) => {
      const [before] = await tx.select().from(productVariants).where(eq(productVariants.id, id));
      if (!before) throw new Error("Variant not found");

      // Surface a friendly note if the variant has been ordered. We still
      // try the delete — order_items.variant_id is RESTRICT, so the FK
      // will block it; we capture the count for the audit notes.
      const orderRefs = await tx
        .select({ id: orderItems.id })
        .from(orderItems)
        .where(eq(orderItems.variantId, id));
      const orderCount = orderRefs.length;

      if (orderCount > 0) {
        throw new Error(
          `Déclinaison référencée par ${orderCount} ligne(s) de commande — suppression bloquée.`,
        );
      }

      // Inventory row first (FK cascade would also handle it, but explicit
      // is clearer in the audit trail).
      await tx.delete(inventory).where(eq(inventory.variantId, id));
      await tx.delete(productVariants).where(eq(productVariants.id, id));

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "variant.delete",
        entityType: "variant",
        entityId: id,
        before,
      });

      return before.productId;
    });
  } catch (e) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [(e as Error).message ?? "Erreur lors de la suppression"],
      },
    };
  }

  revalidatePath(`/catalogue/produits/${productId}`);
  return { ok: true, message: "Déclinaison supprimée" };
}

/* -------------------------------------------------------------------------- */
/* setDefaultVariantAction                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Flip `is_default=true` on the target variant and `false` on every other
 * variant attached to the same product, atomically. Audited as
 * `variant.update` per spec §13 (no dedicated `set_default` verb).
 */
export async function setDefaultVariantAction(
  _prev: VariantActionState,
  formData: FormData,
): Promise<VariantActionState> {
  let session: Awaited<ReturnType<typeof assertRole>>;
  try {
    session = await assertRole(["admin", "manager"]);
  } catch {
    return { ok: false, errors: { fieldErrors: {}, formErrors: ["Action non autorisée."] } };
  }

  const parsed = VariantSetDefaultSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  const { id } = parsed.data;

  if (!process.env.SUPABASE_DB_URL) return envError();

  let productId: string;
  try {
    productId = await db().transaction(async (tx) => {
      const [target] = await tx.select().from(productVariants).where(eq(productVariants.id, id));
      if (!target) throw new Error("Variant not found");

      // Defensive: ensure the product is actually flagged has_variants.
      const [parent] = await tx
        .select({ id: products.id, hasVariants: products.hasVariants })
        .from(products)
        .where(eq(products.id, target.productId));
      if (!parent) throw new Error("Product not found");

      // Reset all siblings to false …
      await tx
        .update(productVariants)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(productVariants.productId, target.productId));

      // … then promote the target.
      const [after] = await tx
        .update(productVariants)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(productVariants.id, id))
        .returning();

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "variant.update",
        entityType: "variant",
        entityId: id,
        before: { isDefault: target.isDefault },
        after: { isDefault: after?.isDefault ?? true },
      });

      return target.productId;
    });
  } catch (e) {
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [(e as Error).message ?? "Erreur lors de la définition par défaut"],
      },
    };
  }

  revalidatePath(`/catalogue/produits/${productId}`);
  return { ok: true, variantId: id, message: "Déclinaison par défaut mise à jour" };
}
