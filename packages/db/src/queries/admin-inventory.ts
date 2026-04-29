import { type SQL, and, asc, between, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  brands,
  inventory,
  productVariants,
  products,
  staffUsers,
  stockMovements,
} from "../schema";

/* -------------------------------------------------------------------------- */
/* listInventoryForAdmin                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Sort tokens accepted by `listInventoryForAdmin`. Whitelisted (we never
 * pass a raw search-param into the query) so the page can forward arbitrary
 * query strings without risking arbitrary column ordering.
 */
export type AdminInventorySort = "name" | "-name" | "onHand" | "-onHand";

export type AdminInventoryStatus = "out" | "low";

export interface ListInventoryParams {
  search?: string;
  status?: AdminInventoryStatus;
  page: number;
  limit: number;
  sort?: AdminInventorySort;
}

export interface AdminInventoryRow {
  inventoryId: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  brandName: string | null;
  sku: string | null;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  status: "in_stock" | "low" | "out";
}

/**
 * Admin-side inventory listing.
 *
 * Inventory rows are keyed by either `product_id` (flat product) or
 * `variant_id` (variant of a has_variants product). To list both flavours
 * uniformly we LEFT JOIN to `product_variants` (variant rows) then COALESCE
 * the variant's `product_id` with `inventory.product_id` so we always have
 * a non-null product handle for joining brand/name lookups.
 *
 * `status` is computed in SQL so the page can sort/filter on it without
 * pulling everything into application memory.
 */
export async function listInventoryForAdmin(
  db: Database,
  p: ListInventoryParams,
): Promise<{ rows: AdminInventoryRow[]; total: number }> {
  // products.id resolved through the variant when the inventory row is
  // variant-scoped. Reused below in JOIN + SELECT.
  const productIdExpr = sql<string>`COALESCE(${inventory.productId}, ${productVariants.productId})`;
  const statusExpr = sql<"in_stock" | "low" | "out">`CASE
      WHEN ${inventory.onHand} = 0 THEN 'out'
      WHEN ${inventory.onHand} > 0 AND ${inventory.onHand} <= ${inventory.reorderPoint} THEN 'low'
      ELSE 'in_stock'
    END`;
  const skuExpr = sql<string | null>`COALESCE(${productVariants.sku}, ${products.sku})`;

  const conditions: SQL[] = [];
  if (p.search) {
    const like = `%${p.search}%`;
    const term = or(
      ilike(products.name, like),
      ilike(productVariants.sku, like),
      ilike(products.sku, like),
    );
    if (term) conditions.push(term);
  }
  if (p.status === "out") {
    conditions.push(eq(inventory.onHand, 0));
  } else if (p.status === "low") {
    conditions.push(
      and(
        sql`${inventory.onHand} > 0`,
        sql`${inventory.onHand} <= ${inventory.reorderPoint}`,
      ) as SQL,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const sortMap = {
    name: asc(products.name),
    "-name": desc(products.name),
    onHand: asc(inventory.onHand),
    "-onHand": desc(inventory.onHand),
  } as const;
  const orderBy = sortMap[p.sort ?? "name"];

  const offset = (p.page - 1) * p.limit;

  const rows = await db
    .select({
      inventoryId: inventory.id,
      productId: inventory.productId,
      variantId: inventory.variantId,
      productName: products.name,
      variantName: productVariants.name,
      brandName: brands.name,
      sku: skuExpr,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      reorderPoint: inventory.reorderPoint,
      status: statusExpr,
    })
    .from(inventory)
    .leftJoin(productVariants, eq(productVariants.id, inventory.variantId))
    .leftJoin(products, eq(products.id, productIdExpr))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(where)
    .orderBy(orderBy)
    .limit(p.limit)
    .offset(offset);

  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inventory)
    .leftJoin(productVariants, eq(productVariants.id, inventory.variantId))
    .leftJoin(products, eq(products.id, productIdExpr))
    .where(where);

  return {
    rows: rows.map((r) => ({
      inventoryId: r.inventoryId,
      productId: r.productId,
      variantId: r.variantId,
      productName: r.productName ?? "—",
      variantName: r.variantName,
      brandName: r.brandName,
      sku: r.sku,
      onHand: r.onHand,
      reserved: r.reserved,
      reorderPoint: r.reorderPoint,
      status: r.status,
    })),
    total: totalRows[0]?.count ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/* listStockMovements                                                         */
/* -------------------------------------------------------------------------- */

export type StockMovementType = "purchase" | "sale" | "adjustment" | "return" | "transfer";

export interface ListStockMovementsParams {
  productId?: string;
  variantId?: string;
  type?: StockMovementType;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
}

export interface AdminStockMovementRow {
  id: string;
  performedAt: Date;
  type: StockMovementType;
  quantity: number;
  productId: string | null;
  variantId: string | null;
  productName: string | null;
  variantName: string | null;
  brandName: string | null;
  sku: string | null;
  performedByName: string | null;
  notes: string | null;
}

/**
 * Stock-movements ledger for admin. Sorted newest-first regardless of caller
 * input — the page exposes filters but not sort. Joins to product/variant for
 * display name resolution, and to staff_users for performer name.
 */
export async function listStockMovements(
  db: Database,
  p: ListStockMovementsParams,
): Promise<{ rows: AdminStockMovementRow[]; total: number }> {
  const conditions: SQL[] = [];
  if (p.productId) conditions.push(eq(stockMovements.productId, p.productId));
  if (p.variantId) conditions.push(eq(stockMovements.variantId, p.variantId));
  if (p.type) conditions.push(eq(stockMovements.type, p.type));
  if (p.dateFrom && p.dateTo) {
    conditions.push(between(stockMovements.performedAt, p.dateFrom, p.dateTo));
  } else if (p.dateFrom) {
    conditions.push(gte(stockMovements.performedAt, p.dateFrom));
  } else if (p.dateTo) {
    conditions.push(lte(stockMovements.performedAt, p.dateTo));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  // products.id resolved through the variant when the movement is variant-scoped.
  const productIdExpr = sql<
    string | null
  >`COALESCE(${stockMovements.productId}, ${productVariants.productId})`;
  const skuExpr = sql<string | null>`COALESCE(${productVariants.sku}, ${products.sku})`;

  const offset = (p.page - 1) * p.limit;

  const rows = await db
    .select({
      id: stockMovements.id,
      performedAt: stockMovements.performedAt,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      productId: stockMovements.productId,
      variantId: stockMovements.variantId,
      productName: products.name,
      variantName: productVariants.name,
      brandName: brands.name,
      sku: skuExpr,
      performedByName: staffUsers.fullName,
      notes: stockMovements.notes,
    })
    .from(stockMovements)
    .leftJoin(productVariants, eq(productVariants.id, stockMovements.variantId))
    .leftJoin(products, eq(products.id, productIdExpr))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(staffUsers, eq(staffUsers.id, stockMovements.performedBy))
    .where(where)
    .orderBy(desc(stockMovements.performedAt))
    .limit(p.limit)
    .offset(offset);

  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stockMovements)
    .where(where);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      performedAt: r.performedAt,
      type: r.type as StockMovementType,
      quantity: r.quantity,
      productId: r.productId,
      variantId: r.variantId,
      productName: r.productName,
      variantName: r.variantName,
      brandName: r.brandName,
      sku: r.sku,
      performedByName: r.performedByName,
      notes: r.notes,
    })),
    total: totalRows[0]?.count ?? 0,
  };
}
