import { sql } from "drizzle-orm";
import type { Database } from "../../client";

export interface CohortRow {
  cohortMonth: string;
  customers: number;
  ordersTotal: number;
  revenueTotal: number;
  repeatRate: number;
  ltv: number;
}

/**
 * Normalize the result of `db.execute(...)` between PGlite (which wraps rows
 * in `.rows`) and postgres-js (which returns the row list directly). Mirrors
 * the `pickRows` helper used by other bi/* queries.
 */
function pickRows<T>(res: unknown): T[] {
  return Array.isArray(res) ? (res as T[]) : (res as { rows: T[] }).rows;
}

/**
 * Monthly cohort table. Cohort = the calendar month of a customer's first
 * confirmed order. Repeat rate = share of cohort customers with ≥2 lifetime
 * confirmed orders. LTV = average lifetime revenue per cohort customer
 * (TND, lifetime — not period-bounded).
 *
 * Customers without `customer_id` (guests) are excluded from cohorts —
 * cohorting requires identity.
 */
export async function getCohortsMonthly(
  db: Database,
  p: { since: Date | null },
): Promise<CohortRow[]> {
  const rows = await db.execute<{
    cohort_month: string | Date;
    customers: number;
    orders_total: number;
    revenue_total: string | number | null;
    repeat_rate: string | number | null;
    ltv: string | number | null;
  }>(sql`
    WITH first_order AS (
      SELECT customer_id,
             date_trunc('month', MIN(created_at)) AS cohort_month
      FROM orders
      WHERE customer_id IS NOT NULL
        AND status NOT IN ('cancelled','refunded')
      GROUP BY customer_id
    ),
    agg AS (
      SELECT fo.cohort_month,
             o.customer_id,
             COUNT(*) AS order_count,
             SUM(o.total_tnd) AS revenue
      FROM first_order fo
      JOIN orders o ON o.customer_id = fo.customer_id
      WHERE o.status NOT IN ('cancelled','refunded')
        AND (${p.since}::timestamptz IS NULL OR fo.cohort_month >= ${p.since})
      GROUP BY fo.cohort_month, o.customer_id
    )
    SELECT cohort_month::date AS cohort_month,
           COUNT(*)::int AS customers,
           SUM(order_count)::int AS orders_total,
           SUM(revenue)::float AS revenue_total,
           ((COUNT(*) FILTER (WHERE order_count >= 2))::float / NULLIF(COUNT(*), 0))::float AS repeat_rate,
           (SUM(revenue) / NULLIF(COUNT(*), 0))::float AS ltv
    FROM agg
    GROUP BY cohort_month
    ORDER BY cohort_month DESC
  `);
  return pickRows<{
    cohort_month: string | Date;
    customers: number;
    orders_total: number;
    revenue_total: string | number | null;
    repeat_rate: string | number | null;
    ltv: string | number | null;
  }>(rows).map((r) => ({
    cohortMonth:
      r.cohort_month instanceof Date ? r.cohort_month.toISOString() : String(r.cohort_month),
    customers: r.customers,
    ordersTotal: r.orders_total,
    revenueTotal: Number(r.revenue_total) || 0,
    repeatRate: Number(r.repeat_rate) || 0,
    ltv: Number(r.ltv) || 0,
  }));
}
