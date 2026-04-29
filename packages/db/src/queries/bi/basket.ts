import { sql } from "drizzle-orm";
import type { Database } from "../../client";

export interface BasketPair {
  productAId: string;
  productAName: string;
  productBId: string;
  productBName: string;
  count: number;
  lift: number;
}

/**
 * Normalize the result of `db.execute(...)` between PGlite (which wraps rows
 * in `.rows`) and postgres-js (which returns the row list directly). Mirrors
 * the helper in `bi/sales.ts`.
 */
function pickRows<T>(res: unknown): T[] {
  return Array.isArray(res) ? (res as T[]) : (res as { rows: T[] }).rows;
}

/**
 * Top product pairs that ship together in the same order, scored by the
 * lift formula: `lift = P(A,B) / (P(A) * P(B))`, expanded into raw counts
 * as `count(A,B) * n_orders / (count(A) * count(B))`.
 *
 * - Self-joins `order_items` on `oi1.product_id < oi2.product_id` so each
 *   unordered pair is yielded exactly once (instead of twice).
 * - Ignores cancelled / refunded orders for the pair count, the per-product
 *   frequency, and the order-total denominator.
 * - `lift > 1` means buyers of A pick up B more often than chance predicts.
 *
 * Ordered by `pair_count DESC, lift DESC NULLS LAST` — copy-pasta of spec
 * §5.4. Performance follow-up flagged in spec §13 (materialize when row
 * count crosses several thousand orders).
 */
export async function getBasketPairs(
  db: Database,
  p: { since: Date | null; limit?: number },
): Promise<BasketPair[]> {
  const limit = p.limit ?? 20;
  const rows = await db.execute<{
    a: string;
    a_name: string;
    b: string;
    b_name: string;
    pair_count: number;
    lift: number;
  }>(sql`
    WITH co AS (
      SELECT oi1.product_id AS a, oi2.product_id AS b
      FROM order_items oi1
      JOIN order_items oi2
        ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
      JOIN orders o ON o.id = oi1.order_id
      WHERE o.status NOT IN ('cancelled','refunded')
        AND (${p.since}::timestamptz IS NULL OR o.created_at >= ${p.since})
    ),
    totals AS (
      SELECT GREATEST(COUNT(DISTINCT o.id), 1)::int AS n_orders
      FROM orders o
      WHERE o.status NOT IN ('cancelled','refunded')
        AND (${p.since}::timestamptz IS NULL OR o.created_at >= ${p.since})
    ),
    freq AS (
      SELECT oi.product_id, COUNT(DISTINCT o.id)::int AS n
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled','refunded')
        AND (${p.since}::timestamptz IS NULL OR o.created_at >= ${p.since})
      GROUP BY oi.product_id
    )
    SELECT co.a,
           pa.name AS a_name,
           co.b,
           pb.name AS b_name,
           COUNT(*)::int AS pair_count,
           (COUNT(*)::float
              / NULLIF((fa.n::float * fb.n / t.n_orders), 0))::float AS lift
    FROM co
    JOIN freq fa ON fa.product_id = co.a
    JOIN freq fb ON fb.product_id = co.b
    JOIN products pa ON pa.id = co.a
    JOIN products pb ON pb.id = co.b
    CROSS JOIN totals t
    GROUP BY co.a, co.b, pa.name, pb.name, fa.n, fb.n, t.n_orders
    ORDER BY pair_count DESC, lift DESC NULLS LAST
    LIMIT ${limit}
  `);
  return pickRows<{
    a: string;
    a_name: string;
    b: string;
    b_name: string;
    pair_count: number;
    lift: number;
  }>(rows).map((r) => ({
    productAId: r.a,
    productAName: r.a_name,
    productBId: r.b,
    productBName: r.b_name,
    count: r.pair_count,
    lift: Number(r.lift) || 0,
  }));
}
