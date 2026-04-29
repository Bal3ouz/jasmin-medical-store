import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
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

    // Phase-2/3 SQL-side bits the harness needs to mirror so feature tests
    // (walk-in order numbers, staff-invite trigger skip) can exercise them
    // against PGlite the same way Supabase runs them in production. The
    // `sql/rls.sql` file itself isn't loaded — only the structural pieces
    // tests actually depend on.

    // Sequence used by checkout / walk-in to assign order numbers.
    await _shared.db.execute(sql`CREATE SEQUENCE IF NOT EXISTS jms_order_seq START 1`);

    // Stub `auth.users` so the on_auth_user_created trigger can bind.
    await _shared.db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY,
        email text,
        raw_user_meta_data jsonb
      )
    `);

    // Apply the latest on_auth_user_created body — must match the Phase-3
    // version in packages/db/sql/rls.sql (skip customers row when
    // is_staff='true'). SECURITY DEFINER is omitted: PGlite has no role
    // boundary, and production rls.sql still applies it on Supabase.
    await _shared.db.execute(sql`
      CREATE OR REPLACE FUNCTION on_auth_user_created()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF (NEW.raw_user_meta_data ->> 'is_staff') = 'true' THEN
          RETURN NEW;
        END IF;
        INSERT INTO customers (id, email, full_name)
        VALUES (
          NEW.id,
          NEW.email,
          NULLIF(NEW.raw_user_meta_data ->> 'full_name', '')
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = COALESCE(EXCLUDED.full_name, customers.full_name),
          updated_at = now();
        RETURN NEW;
      END;
      $$
    `);
    await _shared.db.execute(sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
    await _shared.db.execute(sql`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION on_auth_user_created()
    `);

    _migrated = true;
  }

  return _shared;
}
