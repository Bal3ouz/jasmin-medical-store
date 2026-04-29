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

export function createClient(databaseUrl: string, { max = 1 }: CreateClientOptions = {}) {
  const sql = postgres(databaseUrl, { max, prepare: false });
  return drizzle(sql, { schema });
}

/**
 * The transaction handle passed to `db.transaction(async (tx) => { ... })`.
 *
 * Useful when sharing a tx with helpers (e.g. `recordAudit`) so the audit
 * row commits and rolls back atomically with the surrounding mutation.
 */
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
