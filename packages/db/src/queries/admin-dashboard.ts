import { and, desc, eq, gt, ne, sql } from "drizzle-orm";
import type { Database } from "../client";
import { customers, inventory, orders, products } from "../schema";

/* -------------------------------------------------------------------------- */
/* KPI counters                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Today's revenue and order count, excluding cancelled/refunded orders.
 *
 * `total_tnd` is `numeric(10,3)` so we cast through `::float` so the sum
 * lands as a plain `number` in JS rather than a string. The page formats
 * with `formatTND` / `toFixed(3)` for the visual layer.
 */
export async function getTodayRevenue(
  db: Database,
): Promise<{ totalTnd: number; orderCount: number }> {
  const [row] = await db
    .select({
      totalTnd: sql<number>`coalesce(sum(${orders.totalTnd}), 0)::float`,
      orderCount: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(
      and(
        sql`${orders.createdAt}::date = current_date`,
        ne(orders.status, "cancelled"),
        ne(orders.status, "refunded"),
      ),
    );
  return {
    totalTnd: Number(row?.totalTnd ?? 0),
    orderCount: Number(row?.orderCount ?? 0),
  };
}

/**
 * Count of orders waiting on staff action — `pending`, `confirmed`, or
 * `preparing`. Mirrors the "Commandes à traiter" KPI tile.
 */
export async function countPendingOrders(db: Database): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orders)
    .where(sql`${orders.status} IN ('pending','confirmed','preparing')`);
  return Number(row?.n ?? 0);
}

/**
 * Count of inventory rows below their reorder point but not fully out
 * (`on_hand > 0 AND on_hand <= reorder_point`). Excludes out-of-stock
 * since those have their own treatment elsewhere in the stock module.
 */
export async function countLowStockItems(db: Database): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(inventory)
    .where(and(gt(inventory.onHand, 0), sql`${inventory.onHand} <= ${inventory.reorderPoint}`));
  return Number(row?.n ?? 0);
}

/**
 * Count of published products. Drafts are excluded.
 */
export async function countPublishedProducts(db: Database): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.isPublished, true));
  return Number(row?.n ?? 0);
}

/* -------------------------------------------------------------------------- */
/* Queue lists                                                                */
/* -------------------------------------------------------------------------- */

export interface DashboardPendingOrderRow {
  id: string;
  orderNumber: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  totalTnd: string;
  createdAt: Date;
  customerName: string;
}

/**
 * Pending-orders queue card data. Joins LEFT to `customers` so guest orders
 * (no `customer_id`) still resolve a display name through `shippingFullName`.
 */
export async function listPendingOrders(
  db: Database,
  limit = 8,
): Promise<DashboardPendingOrderRow[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalTnd: orders.totalTnd,
      createdAt: orders.createdAt,
      customerName: sql<string>`COALESCE(${customers.fullName}, ${orders.shippingFullName})`,
    })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .where(sql`${orders.status} IN ('pending','confirmed','preparing')`)
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    status: r.status as DashboardPendingOrderRow["status"],
    totalTnd: r.totalTnd,
    createdAt: r.createdAt,
    customerName: r.customerName,
  }));
}

export interface DashboardLowStockRow {
  productId: string | null;
  variantId: string | null;
  onHand: number;
  reorderPoint: number;
  productName: string | null;
  variantName: string | null;
  brandName: string | null;
}

/**
 * Low-stock queue card data.
 *
 * Inventory rows are keyed by EITHER `product_id` (flat product) or
 * `variant_id` (variant of a `has_variants` product). To resolve the parent
 * product / brand name uniformly we LEFT JOIN to `product_variants` first,
 * then COALESCE `inventory.product_id` with the variant's `product_id` so
 * we always have a non-null product handle for the brand/name lookup.
 *
 * Drizzle's chained leftJoin can't express that COALESCE in the join
 * predicate cleanly, so we fall back to a raw `db.execute(sql\`...\`)`.
 * The result shape is normalized between PGlite (wraps rows in `.rows`)
 * and postgres-js (returns the array directly) — gotcha #5 in the spec.
 */
export async function listLowStockItems(db: Database, limit = 8): Promise<DashboardLowStockRow[]> {
  const res = await db.execute(sql`
    SELECT
      i.product_id    AS "productId",
      i.variant_id    AS "variantId",
      i.on_hand       AS "onHand",
      i.reorder_point AS "reorderPoint",
      p.name          AS "productName",
      v.name          AS "variantName",
      b.name          AS "brandName"
    FROM inventory i
    LEFT JOIN product_variants v ON v.id = i.variant_id
    LEFT JOIN products p ON p.id = COALESCE(i.product_id, v.product_id)
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE i.on_hand > 0 AND i.on_hand <= i.reorder_point
    ORDER BY i.on_hand ASC
    LIMIT ${limit}
  `);

  const rows = (Array.isArray(res) ? res : (res as { rows: unknown[] }).rows) as Array<{
    productId: string | null;
    variantId: string | null;
    onHand: number;
    reorderPoint: number;
    productName: string | null;
    variantName: string | null;
    brandName: string | null;
  }>;

  return rows.map((r) => ({
    productId: r.productId,
    variantId: r.variantId,
    onHand: Number(r.onHand),
    reorderPoint: Number(r.reorderPoint),
    productName: r.productName,
    variantName: r.variantName,
    brandName: r.brandName,
  }));
}

/* -------------------------------------------------------------------------- */
/* Hero visualisations (admin home)                                           */
/* -------------------------------------------------------------------------- */

/**
 * Daily revenue + order-count series for the last N days. Designed for the
 * dashboard hero combo chart: revenue area + order-count bars on the same
 * X axis. Excludes cancelled / refunded orders. Days with zero orders are
 * still represented so the X axis is contiguous.
 */
export interface DashboardActivityPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}

export async function getDashboardActivity(
  db: Database,
  days = 30,
): Promise<DashboardActivityPoint[]> {
  const res = await db.execute(sql`
    WITH days AS (
      SELECT generate_series(
        (current_date - (${days - 1})::int),
        current_date,
        '1 day'::interval
      )::date AS day
    ),
    daily AS (
      SELECT date_trunc('day', created_at)::date AS day,
             COALESCE(SUM(total_tnd), 0)::float  AS revenue,
             COUNT(*)::int                       AS orders
      FROM orders
      WHERE status NOT IN ('cancelled','refunded')
        AND created_at >= (current_date - (${days - 1})::int)
      GROUP BY 1
    )
    SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
           COALESCE(daily.revenue, 0)::float AS revenue,
           COALESCE(daily.orders, 0)::int    AS orders
    FROM days d
    LEFT JOIN daily ON daily.day = d.day
    ORDER BY d.day ASC
  `);
  const rows = (Array.isArray(res) ? res : (res as { rows: unknown[] }).rows) as Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  return rows.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue) || 0,
    orders: Number(r.orders) || 0,
  }));
}

/**
 * Order-status counts over the last N days. Drives the donut on the
 * dashboard hero. Returns one row per status that has at least one order
 * in the window — empty slices are dropped client-side.
 */
export interface DashboardStatusSlice {
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  count: number;
}

export async function getDashboardStatusBreakdown(
  db: Database,
  days = 30,
): Promise<DashboardStatusSlice[]> {
  const res = await db.execute(sql`
    SELECT status, COUNT(*)::int AS count
    FROM orders
    WHERE created_at >= (current_date - (${days - 1})::int)
    GROUP BY status
    ORDER BY count DESC
  `);
  const rows = (Array.isArray(res) ? res : (res as { rows: unknown[] }).rows) as Array<{
    status: DashboardStatusSlice["status"];
    count: number;
  }>;
  return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
}
