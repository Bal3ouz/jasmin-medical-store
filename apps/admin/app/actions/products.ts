"use server";

import { getStaffSession } from "@/lib/auth";
import { type DbTransaction, createClient } from "@jasmin/db";
import { inventory, productCategories, productVariants, products } from "@jasmin/db/schema";
import {
  ProductCreateSchema,
  ProductDuplicateSchema,
  ProductPublishSchema,
  ProductUpdateSchema,
} from "@jasmin/lib/schemas";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type AuditEntityType, recordAudit } from "./audit";

/**
 * Build a fresh DB client. The connection string lives in
 * `SUPABASE_DB_URL`; for write actions we never want to silently degrade,
 * so missing config throws at action invocation rather than at module load.
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
 * Normalise empty-string form fields. UUIDs and prices need `undefined`
 * (so Zod's `.optional()` kicks in) while booleans coming from checkboxes
 * are mapped to true/false explicitly. `additionalCategoryIds` is parsed
 * out of the comma-separated form-field shape we use in the form.
 */
function normaliseForm(formData: FormData) {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k === "additionalCategoryIds") continue; // handled separately below
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed === "") {
        raw[k] = undefined;
      } else if (k === "hasVariants" || k === "isPublished" || k === "isFeatured") {
        raw[k] = trimmed === "true" || trimmed === "on" || trimmed === "1";
      } else {
        raw[k] = trimmed;
      }
    } else {
      raw[k] = v;
    }
  }
  // Default checkboxes that were omitted entirely (HTML submits nothing for
  // unchecked boxes) so Zod's defaults are respected.
  if (raw.hasVariants === undefined) raw.hasVariants = false;
  if (raw.isPublished === undefined) raw.isPublished = false;
  if (raw.isFeatured === undefined) raw.isFeatured = false;

  // Multi-value `additionalCategoryIds` arrives as repeated form fields.
  raw.additionalCategoryIds = formData.getAll("additionalCategoryIds").filter((v) => v !== "");
  return raw;
}

/**
 * State shape for `useActionState`-driven forms. `errors` carries the
 * flattened Zod issues (fieldErrors keyed by form-field name).
 */
export type ProductActionState =
  | { ok: null }
  | { ok: true; productId?: string; message?: string }
  | {
      ok: false;
      errors?: { fieldErrors: Record<string, string[]>; formErrors: string[] };
      message?: string;
    };

/** Strip pricing fields from a product mutation payload when role==='stock'. */
function stripPricingForStockRole<T extends { priceTnd?: unknown; compareAtPriceTnd?: unknown }>(
  payload: T,
  role: Role,
): T {
  if (role !== "stock") return payload;
  const { priceTnd: _p, compareAtPriceTnd: _c, ...rest } = payload;
  return rest as T;
}

/**
 * Generate a unique slug for `duplicateProductAction` by appending
 * `-copie`, `-copie-2`, `-copie-3` etc. until no collision is found.
 * Caps at 50 attempts to prevent runaway loops.
 */
async function findUniqueDuplicateSlug(tx: DbTransaction, baseSlug: string): Promise<string> {
  for (let i = 1; i <= 50; i++) {
    const candidate = i === 1 ? `${baseSlug}-copie` : `${baseSlug}-copie-${i}`;
    const existing = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
  }
  throw new Error("Impossible to find unique slug after 50 attempts");
}

/* -------------------------------------------------------------------------- */
/* createProductAction                                                        */
/* -------------------------------------------------------------------------- */

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const session = await assertRole(["admin", "manager", "stock"]);
  const parsed = ProductCreateSchema.safeParse(normaliseForm(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }

  const data = stripPricingForStockRole(parsed.data, session.role);

  // Pre-flight slug collision check — we'd rather return a friendly error
  // than let the unique-constraint exception bubble up to error.tsx.
  const existing = await db()
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, data.slug))
    .limit(1);
  if (existing.length > 0) {
    return {
      ok: false,
      errors: {
        fieldErrors: { slug: ["déjà utilisé"] },
        formErrors: [],
      },
    };
  }

  let createdId: string;
  try {
    createdId = await db().transaction(async (tx) => {
      const additionalCategoryIds = data.additionalCategoryIds ?? [];
      const insertValues = {
        slug: data.slug,
        name: data.name,
        brandId: data.brandId,
        categoryId: data.categoryId,
        // Schema is non-null for descriptions; coerce missing → empty so the
        // `notNull` constraint is satisfied. The form requires them anyway.
        shortDescription: data.shortDescription ?? "",
        description: data.description ?? "",
        ingredients: data.ingredients ?? null,
        usage: data.usage ?? null,
        hasVariants: data.hasVariants,
        sku: data.hasVariants ? null : (data.sku ?? null),
        priceTnd:
          session.role === "stock" || data.hasVariants
            ? null
            : data.priceTnd != null
              ? String(data.priceTnd)
              : null,
        compareAtPriceTnd:
          session.role === "stock" || data.compareAtPriceTnd == null
            ? null
            : String(data.compareAtPriceTnd),
        weightG: data.weightG ?? null,
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
      };

      const [row] = await tx.insert(products).values(insertValues).returning();
      if (!row) throw new Error("Failed to insert product");

      // Mirror primary category into the join table, plus any extras the
      // form selected. Dedup so a primary that's also in the extras list
      // doesn't produce a PK violation.
      const allCategoryIds = Array.from(new Set([data.categoryId, ...additionalCategoryIds]));
      if (allCategoryIds.length > 0) {
        await tx
          .insert(productCategories)
          .values(allCategoryIds.map((cid) => ({ productId: row.id, categoryId: cid })));
      }

      // Inventory row only for flat products. has_variants=true means stock
      // tracking lives at the variant level — Track 4.5 will create those
      // inventory rows when variants are added.
      if (!data.hasVariants) {
        await tx.insert(inventory).values({
          productId: row.id,
          onHand: 0,
          reserved: 0,
          reorderPoint: 5,
        });
      }

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "product.create",
        entityType: "product" satisfies AuditEntityType,
        entityId: row.id,
        after: row,
      });

      return row.id;
    });
  } catch (e) {
    // Most likely cause is a unique-constraint race on slug or sku that
    // slipped past the pre-flight check.
    return {
      ok: false,
      errors: {
        fieldErrors: {},
        formErrors: [(e as Error).message ?? "Erreur lors de la création"],
      },
    };
  }

  revalidatePath("/catalogue/produits");
  redirect(`/catalogue/produits/${createdId}`);
}

/* -------------------------------------------------------------------------- */
/* updateProductAction                                                        */
/* -------------------------------------------------------------------------- */

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const session = await assertRole(["admin", "manager", "stock"]);
  const parsed = ProductUpdateSchema.safeParse(normaliseForm(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten() };
  }
  const stripped = stripPricingForStockRole(parsed.data, session.role);
  const { id, additionalCategoryIds, ...rest } = stripped;

  // Slug-collision pre-check (excluding the row being updated).
  if (rest.slug) {
    const collision = await db()
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.slug, rest.slug), ne(products.id, id)))
      .limit(1);
    if (collision.length > 0) {
      return {
        ok: false,
        errors: { fieldErrors: { slug: ["déjà utilisé"] }, formErrors: [] },
      };
    }
  }

  try {
    await db().transaction(async (tx) => {
      const [before] = await tx.select().from(products).where(eq(products.id, id));
      if (!before) throw new Error("Product not found");

      // Build update payload only with defined fields so we don't accidentally
      // null-out columns the form chose not to submit.
      const update: Record<string, unknown> = { updatedAt: new Date() };
      for (const [k, v] of Object.entries(rest)) {
        if (v === undefined) continue;
        if (k === "priceTnd" || k === "compareAtPriceTnd") {
          update[k] = v == null ? null : String(v);
        } else {
          update[k] = v;
        }
      }

      const [after] = await tx.update(products).set(update).where(eq(products.id, id)).returning();

      // Sync product_categories: compute diff on the union of (current
      // primary + join rows) vs (new primary + new extras), then insert
      // only the new ones and delete only the removed ones.
      if (additionalCategoryIds !== undefined || rest.categoryId !== undefined) {
        const currentRows = await tx
          .select({ categoryId: productCategories.categoryId })
          .from(productCategories)
          .where(eq(productCategories.productId, id));
        const current = new Set(currentRows.map((r) => r.categoryId));

        const targetPrimary = rest.categoryId ?? before.categoryId;
        const targetExtras = additionalCategoryIds ?? [];
        const target = new Set<string>([targetPrimary, ...targetExtras]);

        const toInsert = [...target].filter((c) => !current.has(c));
        const toDelete = [...current].filter((c) => !target.has(c));

        if (toInsert.length > 0) {
          await tx
            .insert(productCategories)
            .values(toInsert.map((cid) => ({ productId: id, categoryId: cid })));
        }
        for (const cid of toDelete) {
          await tx
            .delete(productCategories)
            .where(and(eq(productCategories.productId, id), eq(productCategories.categoryId, cid)));
        }
      }

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "product.update",
        entityType: "product",
        entityId: id,
        before,
        after: after ?? null,
      });
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

  revalidatePath("/catalogue/produits");
  revalidatePath(`/catalogue/produits/${id}`);
  return { ok: true, productId: id, message: "Produit mis à jour" };
}

/* -------------------------------------------------------------------------- */
/* publishProductAction                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Toggle `is_published`. Accepts `id` and `isPublished` from the form;
 * the audit verb is chosen by the target value (`product.publish` vs
 * `product.unpublish`) per spec §13.
 */
export async function publishProductAction(formData: FormData) {
  const session = await assertRole(["admin", "manager"]);
  const parsed = ProductPublishSchema.safeParse({
    id: formData.get("id"),
    isPublished: formData.get("isPublished") === "true",
  });
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }
  const { id, isPublished } = parsed.data;

  await db().transaction(async (tx) => {
    const [before] = await tx.select().from(products).where(eq(products.id, id));
    if (!before) throw new Error("Product not found");
    const [after] = await tx
      .update(products)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: isPublished ? "product.publish" : "product.unpublish",
      entityType: "product",
      entityId: id,
      before: { isPublished: before.isPublished },
      after: { isPublished: after?.isPublished ?? isPublished },
    });
  });

  revalidatePath("/catalogue/produits");
  revalidatePath(`/catalogue/produits/${id}`);
  return { ok: true as const };
}

/* -------------------------------------------------------------------------- */
/* duplicateProductAction                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Clone an existing product. Per the plan we copy all product fields and
 * the variants, but explicitly NOT images (those have storage objects
 * tied 1:1 to the source row). The new product is unpublished by default
 * so duplicates don't accidentally show up in storefront listings.
 */
export async function duplicateProductAction(formData: FormData) {
  const session = await assertRole(["admin", "manager"]);
  const parsed = ProductDuplicateSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }
  const { id } = parsed.data;

  const newId = await db().transaction(async (tx) => {
    const [src] = await tx.select().from(products).where(eq(products.id, id));
    if (!src) throw new Error("Product not found");

    const newSlug = await findUniqueDuplicateSlug(tx, src.slug);
    const newSku = src.sku ? `${src.sku}-COPIE` : null;

    const [created] = await tx
      .insert(products)
      .values({
        slug: newSlug,
        name: `${src.name} (copie)`,
        brandId: src.brandId,
        categoryId: src.categoryId,
        shortDescription: src.shortDescription,
        description: src.description,
        ingredients: src.ingredients,
        usage: src.usage,
        hasVariants: src.hasVariants,
        sku: newSku,
        priceTnd: src.priceTnd,
        compareAtPriceTnd: src.compareAtPriceTnd,
        weightG: src.weightG,
        // Always start duplicates as unpublished drafts.
        isPublished: false,
        isFeatured: false,
        metaTitle: src.metaTitle,
        metaDescription: src.metaDescription,
      })
      .returning();
    if (!created) throw new Error("Failed to duplicate product");

    // Mirror the join-table category assignments so the duplicate has the
    // same categorisation as its source. Primary category is included.
    const joinRows = await tx
      .select({ categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(eq(productCategories.productId, id));
    const allCats = Array.from(new Set([created.categoryId, ...joinRows.map((r) => r.categoryId)]));
    if (allCats.length > 0) {
      await tx
        .insert(productCategories)
        .values(allCats.map((cid) => ({ productId: created.id, categoryId: cid })));
    }

    // Variants: clone with `-COPIE` SKU suffix to keep the unique constraint
    // happy. New variants get fresh inventory rows starting at 0.
    if (src.hasVariants) {
      const srcVariants = await tx
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, id));
      for (const v of srcVariants) {
        const [cloned] = await tx
          .insert(productVariants)
          .values({
            productId: created.id,
            sku: `${v.sku}-COPIE`,
            name: v.name,
            priceTnd: v.priceTnd,
            compareAtPriceTnd: v.compareAtPriceTnd,
            weightG: v.weightG,
            isDefault: v.isDefault,
            displayOrder: v.displayOrder,
          })
          .returning();
        if (cloned) {
          await tx.insert(inventory).values({
            variantId: cloned.id,
            onHand: 0,
            reserved: 0,
            reorderPoint: 5,
          });
        }
      }
    } else {
      await tx.insert(inventory).values({
        productId: created.id,
        onHand: 0,
        reserved: 0,
        reorderPoint: 5,
      });
    }

    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: "product.duplicate",
      entityType: "product",
      entityId: created.id,
      before: { sourceId: id },
      after: created,
    });

    return created.id;
  });

  revalidatePath("/catalogue/produits");
  redirect(`/catalogue/produits/${newId}`);
}

/* -------------------------------------------------------------------------- */
/* deleteProductAction                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Hard-delete a product. FK CASCADE handles variants, images, and inventory;
 * we explicitly delete `product_categories` rows first because that table
 * is many-to-many and cascade is set on its own FKs (so deleting parents
 * works), but doing it explicitly makes the audit trail self-documenting.
 */
export async function deleteProductAction(formData: FormData) {
  const session = await assertRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false as const, error: "id manquant" };
  }

  await db().transaction(async (tx) => {
    const [before] = await tx.select().from(products).where(eq(products.id, id));
    if (!before) throw new Error("Product not found");

    await tx.delete(productCategories).where(eq(productCategories.productId, id));
    await tx.delete(products).where(eq(products.id, id));

    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: "product.delete",
      entityType: "product",
      entityId: id,
      before,
    });
  });

  revalidatePath("/catalogue/produits");
  redirect("/catalogue/produits");
}
