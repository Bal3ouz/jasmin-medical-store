import { beforeAll, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { getProductBySlug, listCategories, listPublishedProducts } from "../queries/catalog";
import { type TestDb, getSharedTestDatabase } from "./pglite-harness";

/**
 * Normalize the result of `db.execute(...)` between PGlite (which wraps rows
 * in `.rows`) and postgres-js (which returns the row list directly).
 */
function pickRow<T>(res: { rows: T[] } | T[]): T {
  const rows = Array.isArray(res) ? res : res.rows;
  if (rows.length === 0) throw new Error("pickRow: no rows returned");
  return rows[0]!;
}

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

describe("admin: audit log helper", () => {
  // Compute the import path at runtime so TypeScript doesn't follow it into
  // apps/admin (which lives outside packages/db's rootDir). The runtime
  // resolution by Bun is unaffected.
  const ADMIN_AUDIT_PATH = `${"..".repeat(1)}/../../../apps/admin/app/actions/audit`;

  type RecordAuditFn = (
    tx: unknown,
    args: {
      staffUserId: string;
      action: string;
      entityType: string;
      entityId: string;
      before?: Record<string, unknown> | null;
      after?: Record<string, unknown> | null;
    },
  ) => Promise<void>;

  async function loadRecordAudit(): Promise<RecordAuditFn> {
    const mod = (await import(ADMIN_AUDIT_PATH)) as { recordAudit: RecordAuditFn };
    return mod.recordAudit;
  }

  test("recordAudit inserts row with action, entity, before/after diff, performer", async () => {
    const staffId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO staff_users (id, email, full_name, role, is_active)
      VALUES (${staffId}, ${`audit-test-${staffId}@jasmin.tn`}, 'Audit Tester', 'admin', true)
    `);

    const recordAudit = await loadRecordAudit();
    const entityId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await recordAudit(tx, {
        staffUserId: staffId,
        action: "test.action",
        entityType: "product",
        entityId,
        before: { name: "old" },
        after: { name: "new" },
      });
    });

    const rows = await db.execute(sql`
      SELECT action, entity_type, entity_id, diff
      FROM audit_log
      WHERE staff_user_id = ${staffId}
    `);
    const row = pickRow(rows.rows) as {
      action: string;
      entity_type: string;
      entity_id: string;
      diff: { before: { name: string } | null; after: { name: string } | null };
    };
    expect(row.action).toBe("test.action");
    expect(row.entity_type).toBe("product");
    expect(row.diff.before).toEqual({ name: "old" });
    expect(row.diff.after).toEqual({ name: "new" });
  });

  test("audit row rolls back when the outer transaction aborts", async () => {
    const staffId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO staff_users (id, email, full_name, role, is_active)
      VALUES (${staffId}, ${`audit-rollback-${staffId}@jasmin.tn`}, 'Audit Rollback', 'admin', true)
    `);

    const recordAudit = await loadRecordAudit();
    const entityId = crypto.randomUUID();

    let threw = false;
    try {
      await db.transaction(async (tx) => {
        await recordAudit(tx, {
          staffUserId: staffId,
          action: "test.rollback",
          entityType: "product",
          entityId,
          before: null,
          after: { name: "should-not-persist" },
        });
        throw new Error("force rollback");
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);

    const after = await db.execute(sql`
      SELECT count(*)::int AS n FROM audit_log WHERE staff_user_id = ${staffId}
    `);
    const { n } = pickRow(after.rows) as { n: number };
    expect(n).toBe(0);
  });
});

describe("admin: order transitions", () => {
  // Same trick as the audit-log block above: the import path is built at
  // runtime so TypeScript's project graph never tries to follow it into
  // apps/admin (which lives outside packages/db's rootDir). Bun resolves
  // the spec normally at execution time.
  const ADMIN_ORDERS_PATH = `${"..".repeat(1)}/../../../apps/admin/app/actions/orders`;

  type TransitionOrderCoreFn = (
    database: unknown,
    p: {
      orderId: string;
      toStatus:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded";
      role: "admin" | "manager" | "cashier" | "stock";
      staffUserId: string;
      note?: string | null;
    },
  ) => Promise<unknown>;

  async function loadTransition(): Promise<TransitionOrderCoreFn> {
    const mod = (await import(ADMIN_ORDERS_PATH)) as {
      transitionOrderCore: TransitionOrderCoreFn;
    };
    return mod.transitionOrderCore;
  }

  test("transitionOrder updates status, sets timestamp, writes order_event", async () => {
    const staffId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO staff_users (id, email, full_name, role, is_active)
      VALUES (${staffId}, ${`mgr-${staffId}@jasmin.tn`}, 'Manager Test', 'manager', true)
    `);
    const orderId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO orders (id, order_number, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate)
      VALUES (${orderId}, ${`JMS-2026-T-${staffId.slice(0, 6)}-1`}, 'pending', 'pending',
              'cash_on_delivery',
              100.0, 7.0, 107.0,
              'Test Buyer','+216 11 11 11 11','Rue X','Nabeul','8000','Nabeul')
    `);

    const transitionOrderCore = await loadTransition();
    await transitionOrderCore(db, {
      orderId,
      toStatus: "confirmed",
      role: "manager",
      staffUserId: staffId,
      note: "via test",
    });

    const orderRows = await db.execute(sql`
      SELECT status, confirmed_at FROM orders WHERE id = ${orderId}
    `);
    const order = pickRow(orderRows.rows) as {
      status: string;
      confirmed_at: string | null;
    };
    expect(order.status).toBe("confirmed");
    expect(order.confirmed_at).not.toBeNull();

    const eventRows = await db.execute(sql`
      SELECT event_type, from_status, to_status, notes, performed_by
      FROM order_events WHERE order_id = ${orderId}
    `);
    const ev = pickRow(eventRows.rows) as {
      event_type: string;
      from_status: string;
      to_status: string;
      notes: string | null;
      performed_by: string;
    };
    expect(ev.event_type).toBe("confirmed");
    expect(ev.from_status).toBe("pending");
    expect(ev.to_status).toBe("confirmed");
    expect(ev.notes).toBe("via test");
    expect(ev.performed_by).toBe(staffId);
  });

  test("transitionOrder rejects disallowed transition (cashier cancel)", async () => {
    const staffId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO staff_users (id, email, full_name, role, is_active)
      VALUES (${staffId}, ${`cash-${staffId}@jasmin.tn`}, 'Cash Test', 'cashier', true)
    `);
    const orderId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO orders (id, order_number, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate)
      VALUES (${orderId}, ${`JMS-2026-T-${staffId.slice(0, 6)}-2`}, 'confirmed', 'pending',
              'cash_on_delivery',
              100.0, 7.0, 107.0,
              'Test Buyer','+216 11 11 11 11','Rue X','Nabeul','8000','Nabeul')
    `);

    const transitionOrderCore = await loadTransition();
    await expect(
      transitionOrderCore(db, {
        orderId,
        toStatus: "cancelled",
        role: "cashier",
        staffUserId: staffId,
      }),
    ).rejects.toThrow(/Forbidden|not allowed|interdit/i);
  });
});

describe("admin: refund", () => {
  // Same runtime-string trick as the orders block — keep TypeScript out of
  // apps/admin's tree while Bun resolves the spec at execution time.
  const ADMIN_REFUND_PATH = `${"..".repeat(1)}/../../../apps/admin/app/actions/refund`;

  type RefundOrderCoreFn = (
    tx: unknown,
    p: { orderId: string; staffUserId: string; reason?: string | null },
  ) => Promise<unknown>;

  async function loadRefund(): Promise<RefundOrderCoreFn> {
    const mod = (await import(ADMIN_REFUND_PATH)) as { refundOrderCore: RefundOrderCoreFn };
    return mod.refundOrderCore;
  }

  test("refundOrder revives inventory, writes return movements, flips status", async () => {
    const staffId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO staff_users (id, email, full_name, role, is_active)
      VALUES (${staffId}, ${`refund-admin-${staffId}@jasmin.tn`}, 'Refund Admin', 'admin', true)
    `);

    // Seed product + brand + category + inventory(7).
    const productId = crypto.randomUUID();
    const brandId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES (${brandId}, ${`refund-b-${brandId.slice(0, 6)}`}, 'RefundBrand')`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES (${categoryId}, ${`refund-c-${categoryId.slice(0, 6)}`}, 'RefundCat')`,
    );
    await db.execute(sql`
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES (${productId}, ${`refund-p-${productId.slice(0, 6)}`}, 'RefundProd', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-RFD-${productId.slice(0, 6)}`}, 50.000, true)
    `);
    await db.execute(
      sql`INSERT INTO inventory (product_id, on_hand, reserved, reorder_point) VALUES (${productId}, 7, 0, 5)`,
    );

    // Seed a delivered order with 2 units of that product.
    const orderId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO orders (id, order_number, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate,
                          delivered_at)
      VALUES (${orderId}, ${`JMS-2026-RFD-${orderId.slice(0, 6)}`}, 'delivered', 'paid', 'cash_on_delivery',
              100.0, 7.0, 107.0,
              'Tester','+216 11 22 33','Rue Y','Nabeul','8000','Nabeul', now())
    `);
    await db.execute(sql`
      INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, brand_snapshot, sku_snapshot, unit_price_tnd, quantity, line_total_tnd)
      VALUES (${crypto.randomUUID()}, ${orderId}, ${productId}, 'RefundProd', 'RefundBrand', ${`SKU-RFD-${productId.slice(0, 6)}`}, 50.000, 2, 100.000)
    `);

    const refundOrderCore = await loadRefund();
    await db.transaction(async (tx) => {
      await refundOrderCore(tx, { orderId, staffUserId: staffId, reason: "client retour" });
    });

    const orderRows = await db.execute(sql`
      SELECT status, payment_status FROM orders WHERE id = ${orderId}
    `);
    const order = pickRow(orderRows.rows) as { status: string; payment_status: string };
    expect(order.status).toBe("refunded");
    expect(order.payment_status).toBe("refunded");

    const invRows = await db.execute(sql`
      SELECT on_hand FROM inventory WHERE product_id = ${productId}
    `);
    const inv = pickRow(invRows.rows) as { on_hand: number };
    expect(inv.on_hand).toBe(9); // 7 + 2

    const moveRows = await db.execute(sql`
      SELECT type, quantity, reference_id FROM stock_movements WHERE reference_id = ${orderId}
    `);
    const move = pickRow(moveRows.rows) as {
      type: string;
      quantity: number;
      reference_id: string;
    };
    expect(move.type).toBe("return");
    expect(move.quantity).toBe(2);
    expect(move.reference_id).toBe(orderId);
  });
});

describe("admin: staff invite", () => {
  // The Phase-3 update to `on_auth_user_created()` skips the customers
  // INSERT when `raw_user_meta_data ->> 'is_staff' = 'true'` so an invite
  // doesn't create a stray customer row for what is in fact an internal
  // user. The pglite harness installs the same function body — these
  // tests pin that contract end-to-end.
  test("on_auth_user_created skips customers row when raw_user_meta_data.is_staff='true'", async () => {
    const userId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES (${userId}, ${`staff-${userId}@jasmin.tn`}, '{"is_staff":"true","full_name":"S","role":"admin"}'::jsonb)
    `);
    const customerRows = await db.execute(sql`
      SELECT COUNT(*)::int as count FROM customers WHERE id = ${userId}
    `);
    expect(pickRow(customerRows.rows) as { count: number }).toEqual({ count: 0 });
  });

  test("on_auth_user_created creates customers row when no is_staff flag", async () => {
    const userId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES (${userId}, ${`cust-${userId}@jasmin.tn`}, '{"full_name":"C"}'::jsonb)
    `);
    const customerRows = await db.execute(sql`
      SELECT COUNT(*)::int as count FROM customers WHERE id = ${userId}
    `);
    expect(pickRow(customerRows.rows) as { count: number }).toEqual({ count: 1 });
  });
});

describe("admin: walk-in order", () => {
  // Same runtime-string trick: keep TypeScript out of apps/admin's tree
  // while Bun resolves the spec at execution time.
  const ADMIN_WALKIN_PATH = `${"..".repeat(1)}/../../../apps/admin/app/actions/walkInOrder`;

  type CreateWalkInOrderCoreFn = (
    database: unknown,
    params: {
      staffUserId: string;
      role: "admin" | "manager" | "cashier" | "stock";
      customerId?: string | null;
      guestFullName?: string | null;
      guestPhone?: string | null;
      notesInternal?: string | null;
      lines: Array<{ productId: string; variantId?: string | null; quantity: number }>;
    },
  ) => Promise<{ orderNumber: string; orderId: string }>;

  async function loadWalkIn(): Promise<CreateWalkInOrderCoreFn> {
    const mod = (await import(ADMIN_WALKIN_PATH)) as {
      createWalkInOrderCore: CreateWalkInOrderCoreFn;
    };
    return mod.createWalkInOrderCore;
  }

  test("createWalkInOrderCore atomically creates confirmed paid order + decrements inventory", async () => {
    const staffId = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO staff_users (id, email, full_name, role, is_active)
      VALUES (${staffId}, ${`pos-${staffId}@jasmin.tn`}, 'POS Tester', 'cashier', true)
    `);

    // Seed brand + category + product + inventory(10).
    const productId = crypto.randomUUID();
    const brandId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES (${brandId}, ${`pos-b-${brandId.slice(0, 6)}`}, 'PosBrand')`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES (${categoryId}, ${`pos-c-${categoryId.slice(0, 6)}`}, 'PosCat')`,
    );
    await db.execute(sql`
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES (${productId}, ${`pos-p-${productId.slice(0, 6)}`}, 'PosProd', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-POS-${productId.slice(0, 6)}`}, 25.000, true)
    `);
    await db.execute(
      sql`INSERT INTO inventory (product_id, on_hand, reserved, reorder_point) VALUES (${productId}, 10, 0, 5)`,
    );

    const createWalkInOrderCore = await loadWalkIn();
    const result = await createWalkInOrderCore(db, {
      staffUserId: staffId,
      role: "cashier",
      customerId: null,
      guestFullName: "Walk-in",
      guestPhone: "+216 22 33 44 55",
      notesInternal: null,
      lines: [{ productId, variantId: null, quantity: 3 }],
    });

    expect(result.orderNumber).toMatch(/^JMS-\d{4}-\d{6,}$/);

    // Inventory decremented 10 → 7.
    const invRows = await db.execute(sql`
      SELECT on_hand FROM inventory WHERE product_id = ${productId}
    `);
    expect((pickRow(invRows.rows) as { on_hand: number }).on_hand).toBe(7);

    // Order row exists with confirmed/paid/cash_on_delivery, confirmed_at set.
    const orderRows = await db.execute(sql`
      SELECT id, status, payment_method, payment_status, confirmed_at
      FROM orders WHERE order_number = ${result.orderNumber}
    `);
    const order = pickRow(orderRows.rows) as {
      id: string;
      status: string;
      payment_method: string;
      payment_status: string;
      confirmed_at: string | null;
    };
    expect(order.status).toBe("confirmed");
    expect(order.payment_method).toBe("cash_on_delivery");
    expect(order.payment_status).toBe("paid");
    expect(order.confirmed_at).not.toBeNull();
    expect(order.id).toBe(result.orderId);

    // Order item with quantity=3.
    const itemRows = await db.execute(sql`
      SELECT quantity FROM order_items WHERE order_id = ${result.orderId}
    `);
    expect((pickRow(itemRows.rows) as { quantity: number }).quantity).toBe(3);

    // Stock movement: sale, -3, ref order.
    const moveRows = await db.execute(sql`
      SELECT type, quantity, reference_id FROM stock_movements WHERE reference_id = ${result.orderId}
    `);
    const move = pickRow(moveRows.rows) as {
      type: string;
      quantity: number;
      reference_id: string;
    };
    expect(move.type).toBe("sale");
    expect(move.quantity).toBe(-3);
    expect(move.reference_id).toBe(result.orderId);

    // Two order_events: 'created' AND 'confirmed'.
    const evRows = await db.execute(sql`
      SELECT event_type FROM order_events WHERE order_id = ${result.orderId} ORDER BY performed_at ASC
    `);
    const evTypes = (evRows.rows as { event_type: string }[]).map((r) => r.event_type);
    expect(evTypes).toContain("created");
    expect(evTypes).toContain("confirmed");
  });
});
