import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createClient>;

export interface CreateClientOptions {
  /**
   * Postgres-js connection pool size.
   *
   * Default 1 — safe for Next.js Server Actions / route handlers running on
   * DigitalOcean App Platform or any per-request execution model. Long-lived
   * processes (workers, cron jobs) can pass a higher value (e.g., 10) when
   * they know they will benefit from connection reuse and won't saturate the
   * Supabase pooler limits.
   */
  max?: number;
}

/**
 * Per-(URL, max) singleton pool.
 *
 * Next.js dev mode reloads server modules on file change, and every server
 * action / RSC page calling `createClient(url)` previously spawned a fresh
 * postgres-js pool. Under load (concurrent E2E specs, many admin queries)
 * those accumulate and exhaust Postgres' default 100-connection cap.
 *
 * Caching by URL is safe — the URL is the only thing that distinguishes a
 * connection target. Production SUPABASE_DB_URL is set once per process.
 */
const _pools = new Map<string, ReturnType<typeof drizzle<typeof schema>>>();

export function createClient(databaseUrl: string, { max = 5 }: CreateClientOptions = {}) {
  const key = `${databaseUrl}|${max}`;
  let db = _pools.get(key);
  if (!db) {
    const sql = postgres(databaseUrl, { max, prepare: false });
    db = drizzle(sql, { schema });
    _pools.set(key, db);
  }
  return db;
}

/**
 * The transaction handle passed to `db.transaction(async (tx) => { ... })`.
 *
 * Useful when sharing a tx with helpers (e.g. `recordAudit`) so the audit
 * row commits and rolls back atomically with the surrounding mutation.
 */
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
