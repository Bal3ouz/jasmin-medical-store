import { afterAll, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDatabase, migrateTestDatabase } from "./pglite-harness";

describe("catalog schema", () => {
  let client: PGlite | null = null;
  afterAll(async () => { await client?.close(); });

  test("creates brands, categories, products, variants, junction, images tables", async () => {
    const created = await createTestDatabase();
    client = created.client;
    await migrateTestDatabase(created.db);

    const result = await created.db.execute(sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname='public' AND tablename IN
        ('brands','categories','products','product_variants','product_categories','product_images')
      ORDER BY tablename`);
    const tables = result.rows.map((r) => (r as { tablename: string }).tablename);

    expect(tables).toContain("brands");
    expect(tables).toContain("categories");
    expect(tables).toContain("products");
    expect(tables).toContain("product_variants");
    expect(tables).toContain("product_categories");
    expect(tables).toContain("product_images");
  });

  test("products has has_variants check constraint", async () => {
    const created = await createTestDatabase();
    client = created.client;
    await migrateTestDatabase(created.db);

    const result = await created.db.execute(sql`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'products'::regclass AND contype = 'c'`);
    const checks = result.rows.map((r) => (r as { conname: string }).conname);
    expect(checks.length).toBeGreaterThan(0);
  });
});
