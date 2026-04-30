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
 * Per-(URL, max) singleton pool, parked on `globalThis` so it survives Next.js
 * HMR. Without this, every hot reload of a server-action or RSC page creates a
 * fresh postgres-js pool while the old ones keep their connections — within
 * a few minutes Postgres' 100-connection cap is hit and every query starts
 * failing with `remaining connection slots are reserved for roles…`.
 */
const POOL_KEY = Symbol.for("jasmin.db.pools");
type PoolMap = Map<string, ReturnType<typeof drizzle<typeof schema>>>;
const globalAny = globalThis as { [POOL_KEY]?: PoolMap };
const _pools: PoolMap = globalAny[POOL_KEY] ?? new Map();
globalAny[POOL_KEY] = _pools;

export function createClient(databaseUrl: string, { max = 2 }: CreateClientOptions = {}) {
  const key = `${databaseUrl}|${max}`;
  let db = _pools.get(key);
  if (!db) {
    const sql = postgres(databaseUrl, { max, prepare: false, idle_timeout: 20 });
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
