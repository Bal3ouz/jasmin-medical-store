import { type SQL, and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  type Product,
  type ProductImage,
  type ProductVariant,
  brands,
  productCategories,
  productImages,
  productVariants,
  products,
} from "../schema";

/**
 * Sort tokens accepted by `listProductsForAdmin`. Whitelisted here (rather
 * than passing the raw search-param string into the query) so the page can
 * forward arbitrary query strings without risking arbitrary column ordering.
 */
export type AdminProductSort =
  | "name"
  | "-name"
  | "createdAt"
  | "-createdAt"
  | "priceTnd"
  | "-priceTnd";

export interface ListProductsParams {
  search?: string;
  brandId?: string;
  categoryId?: string;
  published?: boolean | undefined;
  page: number;
  limit: number;
  sort?: AdminProductSort;
}

export interface AdminProductRow {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
  isPromo: boolean;
  hasVariants: boolean;
  priceTnd: string | null;
  compareAtPriceTnd: string | null;
  brandName: string | null;
  brandId: string;
  createdAt: Date;
}

/**
 * Admin catalogue listing.
 *
 * Search note: the Phase 3 plan refers to a `products.search_vector` FTS
 * column that has not yet been added by any migration in this repo. Until
 * the FTS column ships we fall back to a case-insensitive ILIKE over name
 * and slug — adequate for the staff-facing list and consistent with the
 * Phase 2 catalog query patterns.
 *
 * `categoryId` filter joins via `product_categories` so primary + additional
 * category assignments both match.
 */
export async function listProductsForAdmin(
  db: Database,
  p: ListProductsParams,
): Promise<{ rows: AdminProductRow[]; total: number }> {
  const conditions: SQL[] = [];
  if (p.search) {
    const like = `%${p.search}%`;
    const term = or(ilike(products.name, like), ilike(products.slug, like));
    if (term) conditions.push(term);
  }
  if (p.brandId) conditions.push(eq(products.brandId, p.brandId));
  if (p.published !== undefined) conditions.push(eq(products.isPublished, p.published));

  // Category filter has to consider both the primary `category_id` column
  // and the many-to-many join, otherwise a product attached to a category
  // only via the join table would be invisible.
  if (p.categoryId) {
    const sub = sql`${products.id} IN (
      SELECT ${productCategories.productId} FROM ${productCategories}
       WHERE ${productCategories.categoryId} = ${p.categoryId}
    )`;
    const term = or(eq(products.categoryId, p.categoryId), sub);
    if (term) conditions.push(term);
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const sortMap = {
    name: asc(products.name),
    "-name": desc(products.name),
    createdAt: asc(products.createdAt),
    "-createdAt": desc(products.createdAt),
    priceTnd: asc(products.priceTnd),
    "-priceTnd": desc(products.priceTnd),
  } as const;
  const orderBy = sortMap[p.sort ?? "-createdAt"];

  const offset = (p.page - 1) * p.limit;
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      isPublished: products.isPublished,
      isPromo: products.isPromo,
      hasVariants: products.hasVariants,
      priceTnd: products.priceTnd,
      compareAtPriceTnd: products.compareAtPriceTnd,
      brandName: brands.name,
      brandId: products.brandId,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(where)
    .orderBy(orderBy)
    .limit(p.limit)
    .offset(offset);

  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  return { rows, total: totalRows[0]?.count ?? 0 };
}

export interface ProductForEdit {
  product: Product;
  variants: ProductVariant[];
  images: ProductImage[];
  /** All `product_categories` rows, including the primary mirror. */
  categoryIds: string[];
}

/**
 * Fetch a single product plus its variants/images/category assignments,
 * sorted by display_order so the editor can render them in stable order.
 */
export async function getProductForEdit(db: Database, id: string): Promise<ProductForEdit | null> {
  const productRow = (await db.select().from(products).where(eq(products.id, id)))[0];
  if (!productRow) return null;

  const [variants, images, joinRows] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.displayOrder)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.displayOrder)),
    db
      .select({ categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(eq(productCategories.productId, id)),
  ]);

  return {
    product: productRow,
    variants,
    images,
    categoryIds: joinRows.map((r) => r.categoryId),
  };
}
