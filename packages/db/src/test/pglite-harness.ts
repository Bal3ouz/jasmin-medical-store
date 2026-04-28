import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import path from "node:path";
import * as schema from "../schema";

export async function createTestDatabase() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  // pglite has no `auth` schema. Stub `auth.uid()` so RLS DDL parses.
  // It returns NULL — tests asserting a specific caller identity must override
  // this function or set auth.uid() explicitly before each statement.
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS auth`);
  await db.execute(
    sql`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$`,
  );

  return { db, client };
}

export async function migrateTestDatabase(db: Awaited<ReturnType<typeof createTestDatabase>>["db"]) {
  const migrationsFolder = path.resolve(import.meta.dir, "../../migrations");
  await migrate(db, { migrationsFolder });
}
