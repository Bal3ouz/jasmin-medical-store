import { beforeAll, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { getProductBySlug, listCategories, listPublishedProducts } from "../queries/catalog";
import { type TestDb, getSharedTestDatabase } from "./pglite-harness";

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

describe("customer schema", () => {
  test("creates customers, customer_addresses, newsletter_subscribers", async () => {
    const tables = (
      await db.execute(
        sql`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('customers','customer_addresses','newsletter_subscribers') ORDER BY tablename`,
      )
    ).rows.map((r) => (r as { tablename: string }).tablename);
    expect(tables).toEqual(["customer_addresses", "customers", "newsletter_subscribers"]);
  });
});

describe("orders schema", () => {
  test("creates orders, order_items, order_events", async () => {
    const tables = (
      await db.execute(
        sql`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('orders','order_items','order_events') ORDER BY tablename`,
      )
    ).rows.map((r) => (r as { tablename: string }).tablename);
    expect(tables).toEqual(["order_events", "order_items", "orders"]);
  });
});

describe("staff + cart schema", () => {
  test("creates staff_users, audit_log, carts, cart_items", async () => {
    const tables = (
      await db.execute(
        sql`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('staff_users','audit_log','carts','cart_items') ORDER BY tablename`,
      )
    ).rows.map((r) => (r as { tablename: string }).tablename);
    expect(tables).toEqual(["audit_log", "cart_items", "carts", "staff_users"]);
  });

  test("staff_users has role enum with the four roles", async () => {
    const result = await db.execute(sql`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'staff_role'
      ORDER BY enumsortorder`);
    const labels = result.rows.map((r) => (r as { enumlabel: string }).enumlabel);
    expect(labels).toEqual(["admin", "manager", "cashier", "stock"]);
  });
});

describe("query helpers", () => {
  test("listCategories returns root + subcategories", async () => {
    await db.execute(sql`
      INSERT INTO categories (id, slug, name, parent_id, display_order)
      VALUES
        ('cc000000-0000-4000-8000-000000000001','q-cosmetique','Q Cosmétique', NULL, 1),
        ('cc000000-0000-4000-8000-000000000002','q-visage','Q Visage', 'cc000000-0000-4000-8000-000000000001', 1)
      ON CONFLICT DO NOTHING`);
    const cats = await listCategories(db as never);
    expect(cats.find((c) => c.slug === "q-cosmetique")).toBeDefined();
    expect(cats.find((c) => c.slug === "q-visage")).toBeDefined();
  });

  test("listPublishedProducts filters by categorySlug and excludes unpublished", async () => {
    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES ('bb000000-0000-4000-8000-000000000001','qb','QB') ON CONFLICT DO NOTHING`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES ('cc000000-0000-4000-8000-000000000003','q-cat','QCat') ON CONFLICT DO NOTHING`,
    );
    await db.execute(sql`INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES
        ('dd000000-0000-4000-8000-000000000010','q-published-1','Q Published 1','bb000000-0000-4000-8000-000000000001','cc000000-0000-4000-8000-000000000003','x','x',false,'Q-PUB-1', 10.000, true),
        ('dd000000-0000-4000-8000-000000000011','q-draft-1','Q Draft 1','bb000000-0000-4000-8000-000000000001','cc000000-0000-4000-8000-000000000003','x','x',false,'Q-DRF-1', 10.000, false)
      ON CONFLICT DO NOTHING`);
    await db.execute(sql`INSERT INTO inventory (product_id, on_hand, reorder_point) VALUES
      ('dd000000-0000-4000-8000-000000000010', 10, 3),
      ('dd000000-0000-4000-8000-000000000011', 10, 3)
      ON CONFLICT DO NOTHING`);

    const list = await listPublishedProducts(db as never, { categorySlug: "q-cat" });
    const slugs = list.map((p) => p.product.slug);
    expect(slugs).toContain("q-published-1");
    expect(slugs).not.toContain("q-draft-1");
  });

  test("getProductBySlug returns full detail or null", async () => {
    const detail = await getProductBySlug(db as never, "q-published-1");
    expect(detail).not.toBeNull();
    expect(detail?.brand.slug).toBe("qb");
    expect(detail?.stockStatus).toBe("in_stock");

    const missing = await getProductBySlug(db as never, "does-not-exist");
    expect(missing).toBeNull();
  });
});
