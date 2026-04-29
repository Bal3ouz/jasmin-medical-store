import { sql } from "drizzle-orm";
import type { Database } from "../../client";

export interface BestSellerRow {
  productId: string;
  slug: string;
  name: string;
  brandName: string | null;
  categoryName: string | null;
  qty: number;
  revenue: number;
}

/**
 * Normalize the result of `db.execute(...)` between PGlite (which wraps rows
 * in `.rows`) and postgres-js (which returns the row list directly). Mirrors
 * the helper inside `bi/sales.ts`; duplicated here to keep each query module
 * self-contained.
 */
function pickRows<T>(res: unknown): T[] {
  return Array.isArray(res) ? (res as T[]) : (res as { rows: T[] }).rows;
}

export async function getBestSellers(
  db: Database,
  p: {
    since: Date | null;
    sortBy: "qty" | "revenue";
    categoryId?: string;
    limit?: number;
  },
): Promise<BestSellerRow[]> {
  const limit = p.limit ?? 50;
  const order =
    p.sortBy === "revenue" ? sql`SUM(oi.line_total_tnd) DESC` : sql`SUM(oi.quantity) DESC`;
  const categoryId = p.categoryId ?? null;
  const rows = await db.execute<{
    product_id: string;
    slug: string;
    name: string;
    brand_name: string | null;
    category_name: string | null;
    qty: number;
    revenue: string | number;
  }>(sql`
    SELECT p.id           AS product_id,
           p.slug         AS slug,
           p.name         AS name,
           b.name         AS brand_name,
           c.name         AS category_name,
           SUM(oi.quantity)::int             AS qty,
           SUM(oi.line_total_tnd)::float     AS revenue
    FROM order_items oi
    JOIN orders o   ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    LEFT JOIN brands b     ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE o.status NOT IN ('cancelled','refunded')
      AND (${p.since}::timestamptz IS NULL OR o.created_at >= ${p.since})
      AND (${categoryId}::uuid IS NULL OR p.category_id = ${categoryId}::uuid)
    GROUP BY p.id, p.slug, p.name, b.name, c.name
    ORDER BY ${order}
    LIMIT ${limit}
  `);
  return pickRows<{
    product_id: string;
    slug: string;
    name: string;
    brand_name: string | null;
    category_name: string | null;
    qty: number;
    revenue: string | number;
  }>(rows).map((r) => ({
    productId: r.product_id,
    slug: r.slug,
    name: r.name,
    brandName: r.brand_name,
    categoryName: r.category_name,
    qty: r.qty,
    revenue: Number(r.revenue) || 0,
  }));
}
