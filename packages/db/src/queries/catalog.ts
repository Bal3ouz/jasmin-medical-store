import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  type Brand,
  type Category,
  type Product,
  type ProductImage,
  type ProductVariant,
  brands,
  categories,
  inventory,
  productImages,
  productVariants,
  products,
} from "../schema";

export interface ListedProduct {
  product: Product;
  brand: Brand;
  category: Category;
  primaryImage: ProductImage | null;
  defaultVariant: ProductVariant | null;
  /** 'in_stock' | 'low' | 'out' — derived from inventory.on_hand vs reorder_point. */
  stockStatus: "in_stock" | "low" | "out";
}

export interface ListPublishedProductsOptions {
  categorySlug?: string;
  brandSlug?: string;
  limit?: number;
  offset?: number;
  sort?: "newest" | "price-asc" | "price-desc";
  /** Restrict to products flagged `is_promo` by the admin. */
  onlyPromo?: boolean;
}

export async function listCategories(db: Database) {
  return db.select().from(categories).orderBy(asc(categories.displayOrder), asc(categories.name));
}

export async function getCategoryBySlug(db: Database, slug: string) {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug));
  return rows[0] ?? null;
}

export async function listBrands(db: Database) {
  return db.select().from(brands).orderBy(asc(brands.name));
}

export async function listPublishedProducts(
  db: Database,
  opts: ListPublishedProductsOptions = {},
): Promise<ListedProduct[]> {
  const conds = [eq(products.isPublished, true)];

  if (opts.categorySlug) {
    const cat = await getCategoryBySlug(db, opts.categorySlug);
    if (!cat) return [];
    // Recurse into descendants so that visiting a parent category (e.g. "cosmetique")
    // surfaces all products under its leaves (visage, corps, solaire, cheveux).
    const descendants = await db.execute<{ id: string }>(sql`
      WITH RECURSIVE tree AS (
        SELECT id FROM categories WHERE id = ${cat.id}
        UNION ALL
        SELECT c.id FROM categories c JOIN tree t ON c.parent_id = t.id
      )
      SELECT id FROM tree
    `);
    const descendantRows = Array.isArray(descendants)
      ? (descendants as { id: string }[])
      : ((descendants as { rows: { id: string }[] }).rows ?? []);
    const ids = descendantRows.map((r) => r.id);
    if (ids.length === 0) return [];
    conds.push(inArray(products.categoryId, ids));
  }
  if (opts.brandSlug) {
    const brandRows = await db.select().from(brands).where(eq(brands.slug, opts.brandSlug));
    const brand = brandRows[0];
    if (!brand) return [];
    conds.push(eq(products.brandId, brand.id));
  }
  if (opts.onlyPromo) {
    conds.push(eq(products.isPromo, true));
  }

  const orderBy =
    opts.sort === "price-asc"
      ? asc(products.priceTnd)
      : opts.sort === "price-desc"
        ? desc(products.priceTnd)
        : desc(products.createdAt);

  const productRows = await db
    .select()
    .from(products)
    .where(and(...conds))
    .orderBy(orderBy)
    .limit(opts.limit ?? 60)
    .offset(opts.offset ?? 0);

  if (productRows.length === 0) return [];

  const productIds = productRows.map((p) => p.id);
  const brandIds = Array.from(new Set(productRows.map((p) => p.brandId)));
  const categoryIds = Array.from(new Set(productRows.map((p) => p.categoryId)));

  const [brandRows, categoryRows, imageRows, variantRows, inventoryRows] = await Promise.all([
    db.select().from(brands).where(inArray(brands.id, brandIds)),
    db.select().from(categories).where(inArray(categories.id, categoryIds)),
    db
      .select()
      .from(productImages)
      .where(and(inArray(productImages.productId, productIds), eq(productImages.isPrimary, true))),
    db.select().from(productVariants).where(inArray(productVariants.productId, productIds)),
    db
      .select()
      .from(inventory)
      .where(
        sql`${inventory.productId} IN ${productIds} OR ${inventory.variantId} IN (
        SELECT id FROM ${productVariants} WHERE ${productVariants.productId} IN ${productIds}
      )`,
      ),
  ]);

  const byBrand = new Map(brandRows.map((b) => [b.id, b]));
  const byCategory = new Map(categoryRows.map((c) => [c.id, c]));
  const primaryImageByProduct = new Map(imageRows.map((i) => [i.productId, i]));
  const variantsByProduct = new Map<string, typeof variantRows>();
  for (const v of variantRows) {
    if (!variantsByProduct.has(v.productId)) variantsByProduct.set(v.productId, []);
    variantsByProduct.get(v.productId)?.push(v);
  }
  const inventoryByKey = new Map<string, (typeof inventoryRows)[number]>();
  for (const inv of inventoryRows) {
    const key = inv.productId ?? inv.variantId;
    if (key) inventoryByKey.set(key, inv);
  }

  return productRows.map((p) => {
    const variants = variantsByProduct.get(p.id) ?? [];
    const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null;
    const inv = p.hasVariants
      ? inventoryByKey.get(defaultVariant?.id ?? "")
      : inventoryByKey.get(p.id);
    const onHand = inv?.onHand ?? 0;
    const reorder = inv?.reorderPoint ?? 5;
    const stockStatus: ListedProduct["stockStatus"] =
      onHand <= 0 ? "out" : onHand <= reorder ? "low" : "in_stock";
    return {
      product: p,
      brand: byBrand.get(p.brandId)!,
      category: byCategory.get(p.categoryId)!,
      primaryImage: primaryImageByProduct.get(p.id) ?? null,
      defaultVariant,
      stockStatus,
    };
  });
}

export interface ProductDetail extends ListedProduct {
  variants: ProductVariant[];
  images: ProductImage[];
}

export async function getProductBySlug(db: Database, slug: string): Promise<ProductDetail | null> {
  const productRow = (await db.select().from(products).where(eq(products.slug, slug)))[0];
  if (!productRow) return null;

  const [brand, category, images, variants, inventoryRows] = await Promise.all([
    db
      .select()
      .from(brands)
      .where(eq(brands.id, productRow.brandId))
      .then((r) => r[0]!),
    db
      .select()
      .from(categories)
      .where(eq(categories.id, productRow.categoryId))
      .then((r) => r[0]!),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productRow.id))
      .orderBy(asc(productImages.displayOrder)),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productRow.id))
      .orderBy(asc(productVariants.displayOrder)),
    db
      .select()
      .from(inventory)
      .where(
        sql`${inventory.productId} = ${productRow.id} OR ${inventory.variantId} IN (
        SELECT id FROM ${productVariants} WHERE ${productVariants.productId} = ${productRow.id}
      )`,
      ),
  ]);

  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null;
  const primaryImage = images.find((i) => i.isPrimary) ?? images[0] ?? null;

  const inv = productRow.hasVariants
    ? inventoryRows.find((i) => i.variantId === defaultVariant?.id)
    : inventoryRows.find((i) => i.productId === productRow.id);
  const onHand = inv?.onHand ?? 0;
  const reorder = inv?.reorderPoint ?? 5;
  const stockStatus: ListedProduct["stockStatus"] =
    onHand <= 0 ? "out" : onHand <= reorder ? "low" : "in_stock";

  return {
    product: productRow,
    brand,
    category,
    primaryImage,
    defaultVariant,
    stockStatus,
    variants,
    images,
  };
}

export async function getRelatedProducts(
  db: Database,
  productId: string,
  limit = 4,
): Promise<ListedProduct[]> {
  const productRow = (await db.select().from(products).where(eq(products.id, productId)))[0];
  if (!productRow) return [];
  const all = await listPublishedProducts(db, { limit: limit + 1 });
  return all
    .filter((p) => p.product.id !== productId && p.category.id === productRow.categoryId)
    .slice(0, limit);
}
