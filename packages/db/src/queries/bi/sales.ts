import { sql } from "drizzle-orm";
import type { Database } from "../../client";

export interface SalesKpis {
  totalRevenue: number;
  orderCount: number;
  aov: number;
  customerCount: number;
}

/**
 * Normalize the result of `db.execute(...)` between PGlite (which wraps rows
 * in `.rows`) and postgres-js (which returns the row list directly). Mirrors
 * the `pickRow` helper in the schema test file but works on arrays.
 */
function pickRows<T>(res: unknown): T[] {
  return Array.isArray(res) ? (res as T[]) : (res as { rows: T[] }).rows;
}

export async function getSalesKpis(db: Database, p: { since: Date | null }): Promise<SalesKpis> {
  const since = p.since;
  const rows = await db.execute<{
    total_revenue: string | number | null;
    order_count: number;
    customer_count: number;
  }>(sql`
    SELECT
      COALESCE(SUM(total_tnd), 0)::float AS total_revenue,
      COUNT(*)::int                       AS order_count,
      (COUNT(DISTINCT customer_id)
        + COUNT(DISTINCT guest_phone) FILTER (WHERE customer_id IS NULL)
      )::int AS customer_count
    FROM orders
    WHERE status NOT IN ('cancelled','refunded')
      AND (${since}::timestamptz IS NULL OR created_at >= ${since})
  `);
  const r = pickRows<{
    total_revenue: number;
    order_count: number;
    customer_count: number;
  }>(rows)[0]!;
  const totalRevenue = Number(r.total_revenue) || 0;
  const orderCount = r.order_count;
  return {
    totalRevenue,
    orderCount,
    aov: orderCount === 0 ? 0 : totalRevenue / orderCount,
    customerCount: r.customer_count,
  };
}

export interface SalesTrendPoint {
  bucket: Date;
  revenue: number;
  orders: number;
  aov: number;
}

export async function getSalesTrend(
  db: Database,
  p: { since: Date | null; granularity: "day" | "week" | "month" },
): Promise<SalesTrendPoint[]> {
  const rows = await db.execute<{
    bucket: string;
    revenue: string | number;
    orders: number;
  }>(sql`
    SELECT
      date_trunc(${p.granularity}, created_at)::date AS bucket,
      COALESCE(SUM(total_tnd), 0)::float             AS revenue,
      COUNT(*)::int                                  AS orders
    FROM orders
    WHERE status NOT IN ('cancelled','refunded')
      AND (${p.since}::timestamptz IS NULL OR created_at >= ${p.since})
    GROUP BY 1
    ORDER BY 1 ASC
  `);
  return pickRows<{ bucket: string; revenue: number; orders: number }>(rows).map((r) => {
    const revenue = Number(r.revenue) || 0;
    return {
      bucket: new Date(r.bucket),
      revenue,
      orders: r.orders,
      aov: r.orders === 0 ? 0 : revenue / r.orders,
    };
  });
}
