import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import path from "node:path";
import * as schema from "../schema";

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Singleton-per-process PGlite + drizzle test database.
 *
 * Bun runs every test file in the same process. PGlite's WASM module corrupts
 * ("Out of bounds call_indirect") when more than one instance lives in the
 * same process, so we share ONE instance across all test files in a run.
 * Migrations are applied once on first use; subsequent calls return the same
 * `{db, client}` with migrations already in place.
 *
 * Tests must therefore tolerate shared schema state (table existence,
 * constraint metadata) — that's fine for our schema-shape assertions. Tests
 * that insert rows should use unique IDs so they don't collide across files.
 */
let _shared: { db: TestDb; client: PGlite } | null = null;
let _migrated = false;

export async function getSharedTestDatabase(): Promise<{ db: TestDb; client: PGlite }> {
  if (_shared === null) {
    const client = new PGlite();
    const db = drizzle(client, { schema });

    // pglite has no `auth` schema. Stub `auth.uid()` so RLS DDL parses.
    // It returns NULL — tests asserting a specific caller identity must override
    // this function or set auth.uid() explicitly before each statement.
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS auth`);
    await db.execute(
      sql`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$`,
    );

    _shared = { db, client };
  }

  if (!_migrated) {
    const migrationsFolder = path.resolve(import.meta.dir, "../../migrations");
    await migrate(_shared.db, { migrationsFolder });
    _migrated = true;
  }

  return _shared;
}
