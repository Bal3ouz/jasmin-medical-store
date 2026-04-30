import { sql } from "drizzle-orm";
import type { Database } from "../../client";

export interface NewsletterFunnel {
  subscribers: number;
  subscribersWhoOrdered: number;
  conversionRate: number;
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
 * Newsletter → first-order conversion funnel for the period.
 *
 * Two CTEs:
 *   - `subs`    : all newsletter subscriber emails (within the window).
 *   - `ordered` : the subset that match a confirmed/non-refunded order, either
 *                 via `customers.email` join or guest_email match.
 *
 * NOTE: spec §13 + plan note — Phase 2 doesn't populate `confirmed_at` on
 * newsletter rows today (no double-opt-in flow yet). So we count every row as
 * a subscriber and skip the `confirmed_at IS NOT NULL` filter the spec SQL
 * originally suggested.
 *
 * TODO when double-opt-in lands: filter confirmed_at IS NOT NULL.
 */
export async function getNewsletterFunnel(
  db: Database,
  p: { since: Date | null },
): Promise<NewsletterFunnel> {
  const rows = await db.execute<{
    subscribers: number;
    subscribers_who_ordered: number;
  }>(sql`
    WITH subs AS (
      SELECT email
      FROM newsletter_subscribers
      WHERE (${p.since === null ? null : p.since.toISOString()}::timestamptz IS NULL OR created_at >= ${p.since === null ? null : p.since.toISOString()})
    ),
    ordered AS (
      SELECT DISTINCT s.email
      FROM subs s
      JOIN orders o ON
           (o.customer_id IS NOT NULL AND o.customer_id IN (
              SELECT id FROM customers WHERE email = s.email))
        OR LOWER(o.guest_email) = LOWER(s.email)
      WHERE o.status NOT IN ('cancelled','refunded')
        AND (${p.since === null ? null : p.since.toISOString()}::timestamptz IS NULL OR o.created_at >= ${p.since === null ? null : p.since.toISOString()})
    )
    SELECT (SELECT COUNT(*) FROM subs)::int    AS subscribers,
           (SELECT COUNT(*) FROM ordered)::int AS subscribers_who_ordered
  `);
  const r = pickRows<{
    subscribers: number;
    subscribers_who_ordered: number;
  }>(rows)[0]!;
  const subscribers = r.subscribers;
  const subscribersWhoOrdered = r.subscribers_who_ordered;
  return {
    subscribers,
    subscribersWhoOrdered,
    conversionRate: subscribers === 0 ? 0 : subscribersWhoOrdered / subscribers,
  };
}
