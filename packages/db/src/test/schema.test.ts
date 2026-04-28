import { beforeAll, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { getSharedTestDatabase, type TestDb } from "./pglite-harness";

/**
 * All schema-shape smoke tests live in this single file.
 *
 * Bun's test runner instantiates each test file in its own VM context, but
 * the PGlite WASM module mis-behaves when more than one of those contexts
 * tries to spin up a Postgres in the same process — we get
 * "Out of bounds call_indirect" failures across files. Keeping every
 * describe block here means one PGlite instance for the whole `bun test`
 * run, regardless of how many areas (catalog, inventory, customers, …) we
 * cover.
 */

let db: TestDb;

beforeAll(async () => {
  ({ db } = await getSharedTestDatabase());
});

describe("schema migrations", () => {
  test("apply cleanly on a fresh pglite database and create the enum types", async () => {
    const result = await db.execute(
      sql`SELECT typname FROM pg_type WHERE typname IN ('staff_role','order_status','payment_status','payment_method','stock_movement_type') ORDER BY typname`,
    );
    const enumNames = result.rows.map((r) => (r as { typname: string }).typname);

    expect(enumNames).toContain("order_status");
    expect(enumNames).toContain("payment_method");
    expect(enumNames).toContain("payment_status");
    expect(enumNames).toContain("staff_role");
    expect(enumNames).toContain("stock_movement_type");
    expect(enumNames.length).toBe(5);
  });
});

describe("catalog schema", () => {
  test("creates brands, categories, products, variants, junction, images tables", async () => {
    const result = await db.execute(sql`
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
    const result = await db.execute(sql`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'products'::regclass AND contype = 'c'`);
    const checks = result.rows.map((r) => (r as { conname: string }).conname);
    expect(checks.length).toBeGreaterThan(0);
  });
});

describe("inventory schema", () => {
  test("creates inventory + stock_movements tables and inventory_public view", async () => {
    const tables = (
      await db.execute(
        sql`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('inventory','stock_movements')`,
      )
    ).rows.map((r) => (r as { tablename: string }).tablename);
    expect(tables).toContain("inventory");
    expect(tables).toContain("stock_movements");

    const views = (
      await db.execute(
        sql`SELECT viewname FROM pg_views WHERE schemaname='public' AND viewname='inventory_public'`,
      )
    ).rows;
    expect(views.length).toBe(1);
  });

  test("inventory_public view derives stock_status correctly", async () => {
    // Use unique IDs so we don't collide with future schema-area tests
    // that may seed catalog rows in this same shared DB.
    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','inv-test','InvTest') ON CONFLICT DO NOTHING`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES ('aaaaaaaa-aaaa-4bbb-8aaa-aaaaaaaaaaaa','inv-c','InvCat') ON CONFLICT DO NOTHING`,
    );
    await db.execute(sql`INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd)
      VALUES
        ('aaaaaaaa-aaaa-4ccc-8aaa-000000000001','inv-p1','Out',
         'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4bbb-8aaa-aaaaaaaaaaaa','x','x',false,'INV-SKU-OUT', 1.000),
        ('aaaaaaaa-aaaa-4ccc-8aaa-000000000002','inv-p2','Low',
         'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4bbb-8aaa-aaaaaaaaaaaa','x','x',false,'INV-SKU-LOW', 1.000),
        ('aaaaaaaa-aaaa-4ccc-8aaa-000000000003','inv-p3','InStock',
         'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4bbb-8aaa-aaaaaaaaaaaa','x','x',false,'INV-SKU-OK',  1.000)
      ON CONFLICT DO NOTHING`);
    await db.execute(sql`INSERT INTO inventory (product_id, on_hand, reorder_point) VALUES
      ('aaaaaaaa-aaaa-4ccc-8aaa-000000000001', 0, 5),
      ('aaaaaaaa-aaaa-4ccc-8aaa-000000000002', 3, 5),
      ('aaaaaaaa-aaaa-4ccc-8aaa-000000000003', 50, 5)
      ON CONFLICT DO NOTHING`);

    const result = await db.execute(sql`
      SELECT stock_status FROM inventory_public
      WHERE product_id IN (
        'aaaaaaaa-aaaa-4ccc-8aaa-000000000001'::uuid,
        'aaaaaaaa-aaaa-4ccc-8aaa-000000000002'::uuid,
        'aaaaaaaa-aaaa-4ccc-8aaa-000000000003'::uuid
      )
      ORDER BY stock_status`);
    const statuses = result.rows.map((r) => (r as { stock_status: string }).stock_status);
    expect(statuses).toEqual(["in_stock", "low", "out"]);
  });
});
