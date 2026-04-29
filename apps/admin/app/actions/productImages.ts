"use server";

import { getStaffSession } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createClient } from "@jasmin/db";
import { productImages, products } from "@jasmin/db/schema";
import { ProductImageReorderSchema, ProductImageUploadSchema } from "@jasmin/lib/schemas";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAudit } from "./audit";

const BUCKET = "product-images";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Lazily build a DB client. Mirrors the pattern in `products.ts` /
 * `variants.ts` so missing config is reported by the action call rather
 * than blowing up at module load.
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

/** Map a validated mime type to its canonical file extension. */
function extensionFor(mime: string): "jpg" | "png" | "webp" {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error(`Unsupported mime ${mime}`);
  }
}

export type ImageActionResult =
  | { ok: true; imageId?: string; message?: string }
  | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/* uploadProductImageAction (spec §10.2)                                       */
/* -------------------------------------------------------------------------- */

/**
 * Upload an image file to Supabase Storage then record a `product_images`
 * row pointing at it. Order-of-ops:
 *  1. Validate role + zod-parse productId/altText/isPrimary.
 *  2. Validate file (type + size).
 *  3. Generate `<slug>/<uuid>.<ext>` storage path; upload via service-role
 *     client (so we bypass RLS and don't need the user JWT for storage).
 *  4. tx: insert product_images row with `displayOrder = MAX+10` (or 0),
 *     flip sibling primaries off if `isPrimary=true`, recordAudit.
 *  5. revalidate the edit page + storefront PDP.
 *
 * Failure modes that surface as `{ ok:false, error }`:
 *  - missing storage env vars
 *  - missing DB env var
 *  - file size / mime violations
 *  - storage upload error from Supabase
 *  - product slug not found (avoids dangling uploads in the bucket)
 */
export async function uploadProductImageAction(formData: FormData): Promise<ImageActionResult> {
  let session: Awaited<ReturnType<typeof assertRole>>;
  try {
    session = await assertRole(["admin", "manager", "stock"]);
  } catch {
    return { ok: false, error: "Action non autorisée." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Fichier manquant." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      error: "Format non supporté. Utilisez JPEG, PNG ou WebP.",
    };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Fichier trop volumineux (8 Mo max)." };
  }

  const parsed = ProductImageUploadSchema.safeParse({
    productId: formData.get("productId"),
    altText: formData.get("altText") ?? undefined,
    isPrimary: formData.get("isPrimary") === "true" || formData.get("isPrimary") === "on",
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msgs = [...Object.values(flat.fieldErrors).flat(), ...flat.formErrors].filter(Boolean);
    return { ok: false, error: msgs.join(" ") || "Champs invalides." };
  }
  const { productId, altText, isPrimary } = parsed.data;

  if (!process.env.SUPABASE_DB_URL) {
    return { ok: false, error: "Base de données non configurée." };
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Storage non configuré." };
  }

  // Resolve the product slug now — we need it to build the storage path,
  // and validating up front avoids leaving an orphan blob in the bucket if
  // the product doesn't exist.
  const productRows = await db()
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  const productSlug = productRows[0]?.slug;
  if (!productSlug) {
    return { ok: false, error: "Produit introuvable." };
  }

  const ext = extensionFor(file.type);
  const path = `${productSlug}/${crypto.randomUUID()}.${ext}`;

  const supabase = createSupabaseServiceClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) {
    return { ok: false, error: `Échec de l'envoi: ${uploadError.message}` };
  }

  let createdId: string;
  try {
    createdId = await db().transaction(async (tx) => {
      // Compute next display_order for this product. We use raw SQL MAX
      // here so sibling rows can be ordered consistently regardless of
      // gaps left by previous deletions.
      const maxRow = await tx
        .select({
          maxOrder: sql<number | null>`MAX(${productImages.displayOrder})`,
        })
        .from(productImages)
        .where(eq(productImages.productId, productId));
      const currentMax = maxRow[0]?.maxOrder;
      const nextOrder = currentMax === null || currentMax === undefined ? 0 : currentMax + 10;

      // If the new image is being marked primary, demote siblings first
      // so we don't end up with multiple primaries for the same product.
      if (isPrimary) {
        await tx
          .update(productImages)
          .set({ isPrimary: false })
          .where(eq(productImages.productId, productId));
      }

      const [row] = await tx
        .insert(productImages)
        .values({
          productId,
          storagePath: path,
          altText: altText ?? null,
          displayOrder: nextOrder,
          isPrimary: !!isPrimary,
        })
        .returning();
      if (!row) throw new Error("Failed to insert product image");

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "product_image.upload",
        entityType: "product_image",
        entityId: row.id,
        after: {
          storagePath: row.storagePath,
          altText: row.altText,
          isPrimary: row.isPrimary,
        },
      });

      return row.id;
    });
  } catch (e) {
    // DB write failed after the upload succeeded — best-effort cleanup so
    // we don't leak orphan blobs. Errors here are swallowed; the user
    // sees the original DB error.
    await supabase.storage
      .from(BUCKET)
      .remove([path])
      .catch(() => undefined);
    return {
      ok: false,
      error: (e as Error).message ?? "Erreur lors de l'enregistrement",
    };
  }

  revalidatePath(`/catalogue/produits/${productId}`);
  revalidatePath(`/produit/${productSlug}`);
  return { ok: true, imageId: createdId, message: "Image ajoutée" };
}

/* -------------------------------------------------------------------------- */
/* deleteProductImageAction                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Hard-delete an image. Removes the storage object then the DB row in tx,
 * recording an audit row. Storage "not found" errors are tolerated so a
 * row whose blob was already deleted out-of-band can still be cleaned up.
 */
export async function deleteProductImageAction(formData: FormData): Promise<ImageActionResult> {
  let session: Awaited<ReturnType<typeof assertRole>>;
  try {
    session = await assertRole(["admin", "manager", "stock"]);
  } catch {
    return { ok: false, error: "Action non autorisée." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "id manquant" };

  if (!process.env.SUPABASE_DB_URL) {
    return { ok: false, error: "Base de données non configurée." };
  }

  // Look up the row first so we have the storage path + productId for
  // cleanup + revalidation.
  const [before] = await db().select().from(productImages).where(eq(productImages.id, id));
  if (!before) return { ok: false, error: "Image introuvable." };

  // Storage cleanup is best-effort: a "not found" response (404) is
  // tolerated so we can still remove the dangling DB row.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.storage.from(BUCKET).remove([before.storagePath]);
    if (error && !/not.*found/i.test(error.message)) {
      return {
        ok: false,
        error: `Échec de la suppression: ${error.message}`,
      };
    }
  }

  let productSlug: string | null = null;
  try {
    productSlug = await db().transaction(async (tx) => {
      await tx.delete(productImages).where(eq(productImages.id, id));

      const [parent] = await tx
        .select({ slug: products.slug })
        .from(products)
        .where(eq(products.id, before.productId));

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "product_image.delete",
        entityType: "product_image",
        entityId: id,
        before,
      });

      return parent?.slug ?? null;
    });
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message ?? "Erreur lors de la suppression",
    };
  }

  revalidatePath(`/catalogue/produits/${before.productId}`);
  if (productSlug) revalidatePath(`/produit/${productSlug}`);
  return { ok: true, message: "Image supprimée" };
}

/* -------------------------------------------------------------------------- */
/* setPrimaryProductImageAction                                                */
/* -------------------------------------------------------------------------- */

/**
 * Mark one image as the product's primary, demoting all siblings in the
 * same tx so the storefront galleries always have a single canonical hero.
 */
export async function setPrimaryProductImageAction(formData: FormData): Promise<ImageActionResult> {
  let session: Awaited<ReturnType<typeof assertRole>>;
  try {
    session = await assertRole(["admin", "manager", "stock"]);
  } catch {
    return { ok: false, error: "Action non autorisée." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "id manquant" };

  if (!process.env.SUPABASE_DB_URL) {
    return { ok: false, error: "Base de données non configurée." };
  }

  let productId: string;
  let productSlug: string | null = null;
  try {
    ({ productId, productSlug } = await db().transaction(async (tx) => {
      const [target] = await tx.select().from(productImages).where(eq(productImages.id, id));
      if (!target) throw new Error("Image introuvable.");

      await tx
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, target.productId));

      const [after] = await tx
        .update(productImages)
        .set({ isPrimary: true })
        .where(eq(productImages.id, id))
        .returning();

      const [parent] = await tx
        .select({ slug: products.slug })
        .from(products)
        .where(eq(products.id, target.productId));

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "product_image.set_primary",
        entityType: "product_image",
        entityId: id,
        before: { isPrimary: target.isPrimary },
        after: { isPrimary: after?.isPrimary ?? true },
      });

      return { productId: target.productId, productSlug: parent?.slug ?? null };
    }));
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message ?? "Erreur lors de la mise à jour",
    };
  }

  revalidatePath(`/catalogue/produits/${productId}`);
  if (productSlug) revalidatePath(`/produit/${productSlug}`);
  return { ok: true, message: "Image principale définie" };
}

/* -------------------------------------------------------------------------- */
/* reorderProductImagesAction                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Bulk-update display_order for a product's images. Validates that every
 * id in `orderedIds` belongs to the given product, then writes
 * display_order = i*10 in order. Single audit row captures before/after
 * arrays so the change is reviewable.
 */
export async function reorderProductImagesAction(formData: FormData): Promise<ImageActionResult> {
  let session: Awaited<ReturnType<typeof assertRole>>;
  try {
    session = await assertRole(["admin", "manager", "stock"]);
  } catch {
    return { ok: false, error: "Action non autorisée." };
  }

  const productId = String(formData.get("productId") ?? "");
  const orderedIds = formData.getAll("orderedIds").map((v) => String(v));

  const parsed = ProductImageReorderSchema.safeParse({ productId, orderedIds });
  if (!parsed.success) {
    return { ok: false, error: "Champs invalides." };
  }

  if (!process.env.SUPABASE_DB_URL) {
    return { ok: false, error: "Base de données non configurée." };
  }

  let productSlug: string | null = null;
  try {
    productSlug = await db().transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(productImages)
        .where(and(eq(productImages.productId, productId), inArray(productImages.id, orderedIds)));
      if (existing.length !== orderedIds.length) {
        throw new Error("Certaines images ne correspondent pas au produit ciblé.");
      }

      // Snapshot the previous ordering for the audit diff.
      const beforeOrder = existing
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((r) => ({ id: r.id, displayOrder: r.displayOrder }));

      // Walk the new order; assign 0,10,20,…
      for (let i = 0; i < orderedIds.length; i++) {
        const targetId = orderedIds[i];
        if (!targetId) continue;
        await tx
          .update(productImages)
          .set({ displayOrder: i * 10 })
          .where(eq(productImages.id, targetId));
      }

      const newOrder = orderedIds.map((id, i) => ({ id, displayOrder: i * 10 }));

      const [parent] = await tx
        .select({ slug: products.slug })
        .from(products)
        .where(eq(products.id, productId));

      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "product_image.reorder",
        entityType: "product_image",
        entityId: productId,
        before: { order: beforeOrder },
        after: { order: newOrder },
      });

      return parent?.slug ?? null;
    });
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message ?? "Erreur lors du réordonnancement",
    };
  }

  revalidatePath(`/catalogue/produits/${productId}`);
  if (productSlug) revalidatePath(`/produit/${productSlug}`);
  return { ok: true, message: "Ordre des images mis à jour" };
}
