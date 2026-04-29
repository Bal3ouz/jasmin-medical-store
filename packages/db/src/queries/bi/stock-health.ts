import { sql } from "drizzle-orm";
import type { Database } from "../../client";

export interface TurnoverRow {
  productId: string | null;
  variantId: string | null;
  name: string;
  sold: number;
  currentOnHand: number;
  daysOfCover: number | null;
}

export interface DeadStockRow {
  productId: string | null;
  variantId: string | null;
  name: string;
  currentOnHand: number;
  lastSaleAt: Date | null;
}

export interface ReorderRow {
  productId: string | null;
  variantId: string | null;
  name: string;
  onHand: number;
  reorderPoint: number;
  deficit: number;
}

/**
 * Normalize the result of `db.execute(...)` between PGlite (which wraps rows
 * in `.rows`) and postgres-js (which returns the row list directly).
 */
function pickRows<T>(res: unknown): T[] {
  return Array.isArray(res) ? (res as T[]) : (res as { rows: T[] }).rows;
}

export async function getTurnover(
  db: Database,
  p: { since: Date | null; periodDays: number; limit?: number },
): Promise<TurnoverRow[]> {
  const limit = p.limit ?? 50;
  const rows = await db.execute<{
    product_id: string | null;
    variant_id: string | null;
    name: string;
    sold: number;
    current_on_hand: number;
    days_of_cover: number | null;
  }>(sql`
    WITH sold AS (
      SELECT oi.product_id, oi.variant_id, SUM(oi.quantity)::int AS qty
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled','refunded')
        AND (${p.since}::timestamptz IS NULL OR o.created_at >= ${p.since})
      GROUP BY oi.product_id, oi.variant_id
    )
    SELECT i.product_id            AS product_id,
           i.variant_id            AS variant_id,
           COALESCE(p.name, 'Inconnu') AS name,
           COALESCE(s.qty, 0)::int AS sold,
           i.on_hand::int          AS current_on_hand,
           CASE
             WHEN COALESCE(s.qty, 0) = 0 THEN NULL
             ELSE (i.on_hand::float / (s.qty::float / GREATEST(${p.periodDays}, 1)))
           END                     AS days_of_cover
    FROM inventory i
    LEFT JOIN product_variants v ON v.id = i.variant_id
    LEFT JOIN products p ON p.id = COALESCE(i.product_id, v.product_id)
    LEFT JOIN sold s
      ON s.product_id IS NOT DISTINCT FROM i.product_id
     AND s.variant_id IS NOT DISTINCT FROM i.variant_id
    ORDER BY days_of_cover ASC NULLS LAST, sold DESC
    LIMIT ${limit}
  `);
  return pickRows<{
    product_id: string | null;
    variant_id: string | null;
    name: string;
    sold: number;
    current_on_hand: number;
    days_of_cover: number | null;
  }>(rows).map((r) => ({
    productId: r.product_id,
    variantId: r.variant_id,
    name: r.name,
    sold: r.sold,
    currentOnHand: r.current_on_hand,
    daysOfCover: r.days_of_cover === null ? null : Number(r.days_of_cover),
  }));
}

export async function getDeadStock(
  db: Database,
  p: { since: Date | null; limit?: number },
): Promise<DeadStockRow[]> {
  const limit = p.limit ?? 50;
  const rows = await db.execute<{
    product_id: string | null;
    variant_id: string | null;
    name: string;
    current_on_hand: number;
    last_sale_at: string | null;
  }>(sql`
    WITH sold AS (
      SELECT oi.product_id, oi.variant_id
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled','refunded')
        AND (${p.since}::timestamptz IS NULL OR o.created_at >= ${p.since})
      GROUP BY oi.product_id, oi.variant_id
    ),
    last_sale AS (
      SELECT m.product_id, m.variant_id, MAX(m.performed_at) AS last_sale_at
      FROM stock_movements m
      WHERE m.type = 'sale'
      GROUP BY m.product_id, m.variant_id
    )
    SELECT i.product_id  AS product_id,
           i.variant_id  AS variant_id,
           COALESCE(p.name, 'Inconnu') AS name,
           i.on_hand::int AS current_on_hand,
           ls.last_sale_at AS last_sale_at
    FROM inventory i
    LEFT JOIN product_variants v ON v.id = i.variant_id
    LEFT JOIN products p ON p.id = COALESCE(i.product_id, v.product_id)
    LEFT JOIN sold s
      ON s.product_id IS NOT DISTINCT FROM i.product_id
     AND s.variant_id IS NOT DISTINCT FROM i.variant_id
    LEFT JOIN last_sale ls
      ON ls.product_id IS NOT DISTINCT FROM i.product_id
     AND ls.variant_id IS NOT DISTINCT FROM i.variant_id
    WHERE i.on_hand > 0
      AND s.product_id IS NULL AND s.variant_id IS NULL
    ORDER BY i.on_hand DESC
    LIMIT ${limit}
  `);
  return pickRows<{
    product_id: string | null;
    variant_id: string | null;
    name: string;
    current_on_hand: number;
    last_sale_at: string | null;
  }>(rows).map((r) => ({
    productId: r.product_id,
    variantId: r.variant_id,
    name: r.name,
    currentOnHand: r.current_on_hand,
    lastSaleAt: r.last_sale_at ? new Date(r.last_sale_at) : null,
  }));
}

export async function getReorderCandidates(
  db: Database,
  p: { limit?: number } = {},
): Promise<ReorderRow[]> {
  const limit = p.limit ?? 50;
  const rows = await db.execute<{
    product_id: string | null;
    variant_id: string | null;
    name: string;
    on_hand: number;
    reorder_point: number;
    deficit: number;
  }>(sql`
    SELECT i.product_id  AS product_id,
           i.variant_id  AS variant_id,
           COALESCE(p.name, 'Inconnu') AS name,
           i.on_hand::int        AS on_hand,
           i.reorder_point::int  AS reorder_point,
           (i.reorder_point - i.on_hand)::int AS deficit
    FROM inventory i
    LEFT JOIN product_variants v ON v.id = i.variant_id
    LEFT JOIN products p ON p.id = COALESCE(i.product_id, v.product_id)
    WHERE i.on_hand <= i.reorder_point
    ORDER BY (i.reorder_point - i.on_hand) DESC, i.on_hand ASC
    LIMIT ${limit}
  `);
  return pickRows<{
    product_id: string | null;
    variant_id: string | null;
    name: string;
    on_hand: number;
    reorder_point: number;
    deficit: number;
  }>(rows).map((r) => ({
    productId: r.product_id,
    variantId: r.variant_id,
    name: r.name,
    onHand: r.on_hand,
    reorderPoint: r.reorder_point,
    deficit: r.deficit,
  }));
}
