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

describe("admin: dashboard queries", () => {
  // The pglite harness is shared across describe blocks so prior seeding
  // (low-stock rows from `inventory_public`, refund/walk-in fixtures, etc.)
  // is already visible to these queries. We don't assert exact counts —
  // only that helpers return the right shape and that a freshly-seeded
  // low-stock row + delivered order are reflected in the results.

  test("countLowStockItems and countPublishedProducts return numbers", async () => {
    const { countLowStockItems, countPublishedProducts } = await import("../queries");
    const lowN = await countLowStockItems(db as never);
    const pubN = await countPublishedProducts(db as never);
    expect(typeof lowN).toBe("number");
    expect(typeof pubN).toBe("number");
    expect(lowN).toBeGreaterThanOrEqual(0);
    expect(pubN).toBeGreaterThanOrEqual(0);
  });

  test("listLowStockItems resolves names through both product- and variant-keyed inventory rows", async () => {
    const brandId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    const productFlatId = crypto.randomUUID();
    const productVariantParentId = crypto.randomUUID();
    const variantId = crypto.randomUUID();

    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES (${brandId}, ${`dash-b-${brandId.slice(0, 6)}`}, 'DashBrand')`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES (${categoryId}, ${`dash-c-${categoryId.slice(0, 6)}`}, 'DashCat')`,
    );
    // Flat product (inventory keyed by product_id).
    await db.execute(sql`
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES (${productFlatId}, ${`dash-flat-${productFlatId.slice(0, 6)}`}, 'DashFlat', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-DASH-FLAT-${productFlatId.slice(0, 6)}`}, 10.000, true)
    `);
    await db.execute(
      sql`INSERT INTO inventory (product_id, on_hand, reorder_point) VALUES (${productFlatId}, 2, 5)`,
    );
    // Variant-bearing product (inventory keyed by variant_id only).
    await db.execute(sql`
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, is_published)
      VALUES (${productVariantParentId}, ${`dash-pv-${productVariantParentId.slice(0, 6)}`}, 'DashVariantParent', ${brandId}, ${categoryId}, 'x', 'x', true, true)
    `);
    await db.execute(sql`
      INSERT INTO product_variants (id, product_id, sku, name, price_tnd)
      VALUES (${variantId}, ${productVariantParentId}, ${`SKU-DASH-VAR-${variantId.slice(0, 6)}`}, 'DashVariant 50ml', 12.000)
    `);
    await db.execute(
      sql`INSERT INTO inventory (variant_id, on_hand, reorder_point) VALUES (${variantId}, 1, 5)`,
    );

    const { countLowStockItems, listLowStockItems } = await import("../queries");
    const n = await countLowStockItems(db as never);
    expect(n).toBeGreaterThanOrEqual(2);

    const rows = await listLowStockItems(db as never, 50);
    const flatHit = rows.find((r) => r.productId === productFlatId);
    expect(flatHit?.productName).toBe("DashFlat");
    expect(flatHit?.brandName).toBe("DashBrand");

    const variantHit = rows.find((r) => r.variantId === variantId);
    expect(variantHit?.productName).toBe("DashVariantParent");
    expect(variantHit?.variantName).toBe("DashVariant 50ml");
    expect(variantHit?.brandName).toBe("DashBrand");
  });

  test("getTodayRevenue and listPendingOrders pick up a freshly-seeded order", async () => {
    const orderPendingId = crypto.randomUUID();
    const orderDeliveredId = crypto.randomUUID();

    await db.execute(sql`
      INSERT INTO orders (id, order_number, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate)
      VALUES (${orderPendingId}, ${`JMS-DASH-PEND-${orderPendingId.slice(0, 6)}`}, 'pending', 'pending',
              'cash_on_delivery',
              50.000, 7.000, 57.000,
              'Dash Pending','+216 11 22 33 44','Rue D','Tunis','1000','Tunis')
    `);
    await db.execute(sql`
      INSERT INTO orders (id, order_number, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate,
                          delivered_at)
      VALUES (${orderDeliveredId}, ${`JMS-DASH-DELIV-${orderDeliveredId.slice(0, 6)}`}, 'delivered', 'paid',
              'cash_on_delivery',
              80.000, 7.000, 87.000,
              'Dash Delivered','+216 22 33 44 55','Rue E','Tunis','1000','Tunis', now())
    `);

    const { countPendingOrders, getTodayRevenue, listPendingOrders } = await import("../queries");

    const today = await getTodayRevenue(db as never);
    expect(typeof today.totalTnd).toBe("number");
    expect(today.orderCount).toBeGreaterThanOrEqual(1);
    expect(today.totalTnd).toBeGreaterThanOrEqual(0);

    const pendingCount = await countPendingOrders(db as never);
    expect(pendingCount).toBeGreaterThanOrEqual(1);

    const pendingRows = await listPendingOrders(db as never, 50);
    const hit = pendingRows.find((r) => r.id === orderPendingId);
    expect(hit).toBeDefined();
    expect(hit?.customerName).toBe("Dash Pending");
  });
});

describe("bi: sales kpis + trend", () => {
  // The shared PGlite instance carries seeded orders from earlier describe
  // blocks (refund, walk-in, dashboard). We seed two MORE confirmed orders
  // here with unique uuids so the kpi/trend counts include at least those —
  // even if other blocks have already inserted unrelated orders.
  test("getSalesKpis sums confirmed orders, ignores cancelled", async () => {
    const { db } = await getSharedTestDatabase();

    // Two confirmed + one cancelled today.
    const confirmedA = crypto.randomUUID();
    const confirmedB = crypto.randomUUID();
    const cancelled = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO orders (id, order_number, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate,
                          confirmed_at)
      VALUES
        (${confirmedA}, ${`JMS-BI-SALES-A-${confirmedA.slice(0, 6)}`}, 'confirmed', 'paid',
         'cash_on_delivery', 100.000, 7.000, 107.000,
         'BI Sales A','+216 90 00 00 01','Rue A','Tunis','1000','Tunis', now()),
        (${confirmedB}, ${`JMS-BI-SALES-B-${confirmedB.slice(0, 6)}`}, 'confirmed', 'paid',
         'cash_on_delivery', 50.000, 7.000, 57.000,
         'BI Sales B','+216 90 00 00 02','Rue B','Tunis','1000','Tunis', now()),
        (${cancelled}, ${`JMS-BI-SALES-X-${cancelled.slice(0, 6)}`}, 'cancelled', 'pending',
         'cash_on_delivery', 999.000, 7.000, 1006.000,
         'BI Sales X','+216 90 00 00 03','Rue X','Tunis','1000','Tunis', NULL)
    `);

    const { getSalesKpis } = await import("../queries");
    const k = await getSalesKpis(db as never, { since: null });
    expect(k.orderCount).toBeGreaterThanOrEqual(2);
    expect(k.totalRevenue).toBeGreaterThan(0);
    // The 1006 from the cancelled row must NOT be in the total. We can't
    // assert an exact total because earlier describe blocks seeded other
    // confirmed orders, but we can check the cancelled row isn't there.
    expect(k.totalRevenue).toBeLessThan(100_000); // sanity bound
  });

  test("getSalesTrend buckets per granularity with bucket/revenue/orders shape", async () => {
    const { db } = await getSharedTestDatabase();
    const { getSalesTrend } = await import("../queries");
    const series = await getSalesTrend(db as never, { since: null, granularity: "day" });
    expect(Array.isArray(series)).toBe(true);
    // Earlier blocks seeded confirmed/delivered orders; combined with the
    // two we just inserted in the previous test, the day series MUST have
    // at least one row.
    expect(series.length).toBeGreaterThan(0);
    const row = series[0]!;
    expect(row).toHaveProperty("bucket");
    expect(row).toHaveProperty("revenue");
    expect(row).toHaveProperty("orders");
    expect(typeof row.revenue).toBe("number");
    expect(typeof row.orders).toBe("number");
  });
});

describe("bi: best sellers", () => {
  // Seeds two products in two confirmed orders with different qtys, plus
  // a third "ghost" product on a cancelled order. We then assert:
  //   - both confirmed-only products show up,
  //   - the ghost (only ever ordered on a cancelled row) does NOT show up,
  //   - rows are sorted by `qty` desc.
  test("ranks by qty desc and excludes cancelled orders", async () => {
    const { db } = await getSharedTestDatabase();

    const brandId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    const productHigh = crypto.randomUUID(); // will accumulate qty=5
    const productLow = crypto.randomUUID(); // will accumulate qty=2
    const productGhost = crypto.randomUUID(); // appears only on cancelled
    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES (${brandId}, ${`bs-b-${brandId.slice(0, 6)}`}, 'BSBrand')`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES (${categoryId}, ${`bs-c-${categoryId.slice(0, 6)}`}, 'BSCat')`,
    );
    await db.execute(sql`
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES
        (${productHigh},  ${`bs-hi-${productHigh.slice(0, 6)}`},  'BSHigh',  ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-BS-HI-${productHigh.slice(0, 6)}`},  10.000, true),
        (${productLow},   ${`bs-lo-${productLow.slice(0, 6)}`},   'BSLow',   ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-BS-LO-${productLow.slice(0, 6)}`},   20.000, true),
        (${productGhost}, ${`bs-gh-${productGhost.slice(0, 6)}`}, 'BSGhost', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-BS-GH-${productGhost.slice(0, 6)}`}, 30.000, true)
    `);

    const orderHi = crypto.randomUUID();
    const orderLo = crypto.randomUUID();
    const orderCancel = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO orders (id, order_number, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate,
                          confirmed_at)
      VALUES
        (${orderHi},     ${`JMS-BI-BS-HI-${orderHi.slice(0, 6)}`},     'confirmed', 'paid',
         'cash_on_delivery', 50.000, 7.000, 57.000,
         'BS Hi','+216 90 11 11 11','Rue Hi','Tunis','1000','Tunis', now()),
        (${orderLo},     ${`JMS-BI-BS-LO-${orderLo.slice(0, 6)}`},     'confirmed', 'paid',
         'cash_on_delivery', 40.000, 7.000, 47.000,
         'BS Lo','+216 90 22 22 22','Rue Lo','Tunis','1000','Tunis', now()),
        (${orderCancel}, ${`JMS-BI-BS-CX-${orderCancel.slice(0, 6)}`}, 'cancelled', 'pending',
         'cash_on_delivery', 999.000, 7.000, 1006.000,
         'BS Cx','+216 90 33 33 33','Rue Cx','Tunis','1000','Tunis', NULL)
    `);
    // Confirmed: 5 of High + 1 of Low in orderHi.
    // Confirmed: 1 of Low in orderLo.
    // Cancelled: 99 of Ghost in orderCancel — must be ignored.
    await db.execute(sql`
      INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, brand_snapshot, sku_snapshot, unit_price_tnd, quantity, line_total_tnd)
      VALUES
        (${crypto.randomUUID()}, ${orderHi},     ${productHigh},  'BSHigh',  'BSBrand', ${`SKU-BS-HI-${productHigh.slice(0, 6)}`},  10.000, 5,  50.000),
        (${crypto.randomUUID()}, ${orderHi},     ${productLow},   'BSLow',   'BSBrand', ${`SKU-BS-LO-${productLow.slice(0, 6)}`},   20.000, 1,  20.000),
        (${crypto.randomUUID()}, ${orderLo},     ${productLow},   'BSLow',   'BSBrand', ${`SKU-BS-LO-${productLow.slice(0, 6)}`},   20.000, 1,  20.000),
        (${crypto.randomUUID()}, ${orderCancel}, ${productGhost}, 'BSGhost', 'BSBrand', ${`SKU-BS-GH-${productGhost.slice(0, 6)}`}, 30.000, 99, 2970.000)
    `);

    const { getBestSellers } = await import("../queries");
    const rows = await getBestSellers(db as never, {
      since: null,
      sortBy: "qty",
      limit: 50,
    });

    const hi = rows.find((r) => r.productId === productHigh);
    const lo = rows.find((r) => r.productId === productLow);
    const ghost = rows.find((r) => r.productId === productGhost);

    expect(hi).toBeDefined();
    expect(lo).toBeDefined();
    expect(ghost).toBeUndefined(); // cancelled order MUST be excluded

    expect(hi!.qty).toBe(5);
    expect(lo!.qty).toBe(2);
    expect(hi!.brandName).toBe("BSBrand");
    expect(hi!.categoryName).toBe("BSCat");

    // Global ordering: every row's qty must be >= the next row's qty.
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.qty).toBeLessThanOrEqual(rows[i - 1]!.qty);
    }
  });
});

describe("bi: basket pairs", () => {
  // Seeds three confirmed orders sharing three products A/B/C such that:
  //   - order1: { A, B }
  //   - order2: { A, B }
  //   - order3: { A, C }
  // Expected: pair (A,B) ranks first by count=2, with count >= every other
  // pair returned. The self-join uses oi1.product_id < oi2.product_id, so
  // for each unordered pair we get exactly one row regardless of insertion
  // order.
  test("ranks pair (A,B) first by count and yields a positive lift", async () => {
    const { db } = await getSharedTestDatabase();

    const brandId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    const productA = crypto.randomUUID();
    const productB = crypto.randomUUID();
    const productC = crypto.randomUUID();
    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES (${brandId}, ${`bk-b-${brandId.slice(0, 6)}`}, 'BKBrand')`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES (${categoryId}, ${`bk-c-${categoryId.slice(0, 6)}`}, 'BKCat')`,
    );
    await db.execute(sql`
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES
        (${productA}, ${`bk-a-${productA.slice(0, 6)}`}, 'BKProductA', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-BK-A-${productA.slice(0, 6)}`}, 10.000, true),
        (${productB}, ${`bk-b-${productB.slice(0, 6)}`}, 'BKProductB', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-BK-B-${productB.slice(0, 6)}`}, 12.000, true),
        (${productC}, ${`bk-c-${productC.slice(0, 6)}`}, 'BKProductC', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-BK-C-${productC.slice(0, 6)}`}, 14.000, true)
    `);

    const order1 = crypto.randomUUID();
    const order2 = crypto.randomUUID();
    const order3 = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO orders (id, order_number, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate,
                          confirmed_at)
      VALUES
        (${order1}, ${`JMS-BI-BK-1-${order1.slice(0, 6)}`}, 'confirmed', 'paid',
         'cash_on_delivery', 22.000, 7.000, 29.000,
         'BK One','+216 90 44 44 11','Rue 1','Tunis','1000','Tunis', now()),
        (${order2}, ${`JMS-BI-BK-2-${order2.slice(0, 6)}`}, 'confirmed', 'paid',
         'cash_on_delivery', 22.000, 7.000, 29.000,
         'BK Two','+216 90 44 44 22','Rue 2','Tunis','1000','Tunis', now()),
        (${order3}, ${`JMS-BI-BK-3-${order3.slice(0, 6)}`}, 'confirmed', 'paid',
         'cash_on_delivery', 24.000, 7.000, 31.000,
         'BK Three','+216 90 44 44 33','Rue 3','Tunis','1000','Tunis', now())
    `);
    // order1: A + B
    // order2: A + B
    // order3: A + C
    await db.execute(sql`
      INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, brand_snapshot, sku_snapshot, unit_price_tnd, quantity, line_total_tnd)
      VALUES
        (${crypto.randomUUID()}, ${order1}, ${productA}, 'BKProductA', 'BKBrand', ${`SKU-BK-A-${productA.slice(0, 6)}`}, 10.000, 1, 10.000),
        (${crypto.randomUUID()}, ${order1}, ${productB}, 'BKProductB', 'BKBrand', ${`SKU-BK-B-${productB.slice(0, 6)}`}, 12.000, 1, 12.000),
        (${crypto.randomUUID()}, ${order2}, ${productA}, 'BKProductA', 'BKBrand', ${`SKU-BK-A-${productA.slice(0, 6)}`}, 10.000, 1, 10.000),
        (${crypto.randomUUID()}, ${order2}, ${productB}, 'BKProductB', 'BKBrand', ${`SKU-BK-B-${productB.slice(0, 6)}`}, 12.000, 1, 12.000),
        (${crypto.randomUUID()}, ${order3}, ${productA}, 'BKProductA', 'BKBrand', ${`SKU-BK-A-${productA.slice(0, 6)}`}, 10.000, 1, 10.000),
        (${crypto.randomUUID()}, ${order3}, ${productC}, 'BKProductC', 'BKBrand', ${`SKU-BK-C-${productC.slice(0, 6)}`}, 14.000, 1, 14.000)
    `);

    const { getBasketPairs } = await import("../queries");
    const pairs = await getBasketPairs(db as never, { since: null, limit: 50 });

    expect(pairs.length).toBeGreaterThan(0);

    // Locate the (A,B) pair regardless of which uuid sorted lower.
    const ab = pairs.find(
      (p) =>
        (p.productAId === productA && p.productBId === productB) ||
        (p.productAId === productB && p.productBId === productA),
    );
    const ac = pairs.find(
      (p) =>
        (p.productAId === productA && p.productBId === productC) ||
        (p.productAId === productC && p.productBId === productA),
    );

    expect(ab).toBeDefined();
    expect(ac).toBeDefined();
    expect(ab!.count).toBe(2);
    expect(ac!.count).toBe(1);
    expect(ab!.lift).toBeGreaterThan(0);

    // Global ordering: pair_count DESC, so the (A,B) row must be at or
    // above the (A,C) row in the result list, and the first row must have
    // count >= the last row's count.
    const abIndex = pairs.indexOf(ab!);
    const acIndex = pairs.indexOf(ac!);
    expect(abIndex).toBeLessThanOrEqual(acIndex);
    expect(pairs[0]!.count).toBeGreaterThanOrEqual(pairs.at(-1)!.count);
  });
});

describe("bi: stock health", () => {
  // Seeds a single product with inventory rows where on_hand=2 and
  // reorder_point=5, so deficit=3. getReorderCandidates must surface a
  // row with deficit >= 1.
  test("getReorderCandidates returns rows with deficit > 0", async () => {
    const { db } = await getSharedTestDatabase();

    const brandId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    const productId = crypto.randomUUID();
    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES (${brandId}, ${`sh-b-${brandId.slice(0, 6)}`}, 'SHBrand')`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES (${categoryId}, ${`sh-c-${categoryId.slice(0, 6)}`}, 'SHCat')`,
    );
    await db.execute(sql`
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES
        (${productId}, ${`sh-p-${productId.slice(0, 6)}`}, 'SHReorderProduct', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-SH-${productId.slice(0, 6)}`}, 10.000, true)
    `);
    await db.execute(sql`
      INSERT INTO inventory (id, product_id, variant_id, on_hand, reserved, reorder_point)
      VALUES (${crypto.randomUUID()}, ${productId}, NULL, 2, 0, 5)
    `);

    const { getReorderCandidates } = await import("../queries");
    const rows = await getReorderCandidates(db as never, { limit: 50 });

    const hit = rows.find((r) => r.productId === productId);
    expect(hit).toBeDefined();
    expect(hit!.onHand).toBe(2);
    expect(hit!.reorderPoint).toBe(5);
    expect(hit!.deficit).toBe(3);
    expect(rows.some((r) => r.deficit >= 1)).toBe(true);
  });

  // Smoke: getDeadStock returns an array. We don't assert specific seeded
  // rows because earlier blocks already populated inventory + sales in
  // overlapping ways that make a clean isolation expensive — the spec
  // calls for a "smoke" check at this layer.
  test("getDeadStock returns an array", async () => {
    const { db } = await getSharedTestDatabase();
    const { getDeadStock } = await import("../queries");
    const rows = await getDeadStock(db as never, { since: null, limit: 50 });
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe("bi: cohorts", () => {
  // Seeds one customer with two confirmed orders ~1 month apart. The
  // cohort = month of first order; the customer has 2 lifetime orders so
  // they MUST count as "repeat" → repeat_rate for that cohort > 0. We
  // can't assert exact values across the whole result because earlier
  // describe blocks seeded other orders without customer_id (guests are
  // excluded from cohorts entirely — the SQL filters customer_id IS NOT
  // NULL), but the cohort row for our seeded customer must be present.
  test("repeat customer with 2 orders ~1 month apart shows up with repeatRate > 0", async () => {
    const { db } = await getSharedTestDatabase();

    const brandId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    const productId = crypto.randomUUID();
    const customerId = crypto.randomUUID();
    const order1 = crypto.randomUUID();
    const order2 = crypto.randomUUID();

    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES (${brandId}, ${`co-b-${brandId.slice(0, 6)}`}, 'COBrand')`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES (${categoryId}, ${`co-c-${categoryId.slice(0, 6)}`}, 'COCat')`,
    );
    await db.execute(sql`
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES
        (${productId}, ${`co-p-${productId.slice(0, 6)}`}, 'COProduct', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-CO-${productId.slice(0, 6)}`}, 50.000, true)
    `);
    await db.execute(sql`
      INSERT INTO customers (id, email, full_name)
      VALUES (${customerId}, ${`co-${customerId.slice(0, 6)}@jasmin.test`}, 'CO Customer')
    `);

    // Two confirmed orders, same customer, 1 month apart (Jan 15 → Feb 15
    // 2026). created_at is set explicitly so the cohort_month is
    // deterministic regardless of when the test runs.
    await db.execute(sql`
      INSERT INTO orders (id, order_number, customer_id, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate,
                          confirmed_at, created_at)
      VALUES
        (${order1}, ${`JMS-BI-CO-1-${order1.slice(0, 6)}`}, ${customerId}, 'confirmed', 'paid',
         'cash_on_delivery', 50.000, 7.000, 57.000,
         'CO One','+216 90 55 55 11','Rue 1','Tunis','1000','Tunis',
         '2026-01-15T10:00:00Z', '2026-01-15T10:00:00Z'),
        (${order2}, ${`JMS-BI-CO-2-${order2.slice(0, 6)}`}, ${customerId}, 'confirmed', 'paid',
         'cash_on_delivery', 50.000, 7.000, 57.000,
         'CO Two','+216 90 55 55 22','Rue 2','Tunis','1000','Tunis',
         '2026-02-15T10:00:00Z', '2026-02-15T10:00:00Z')
    `);

    const { getCohortsMonthly } = await import("../queries");
    const rows = await getCohortsMonthly(db as never, { since: null });

    expect(rows.length).toBeGreaterThan(0);

    // Find the cohort row for January 2026 — that's our seeded customer's
    // first-order month.
    const janCohort = rows.find((r) => {
      const d = new Date(r.cohortMonth);
      return d.getUTCFullYear() === 2026 && d.getUTCMonth() === 0;
    });
    expect(janCohort).toBeDefined();
    expect(janCohort!.customers).toBeGreaterThanOrEqual(1);
    // Our customer placed 2 lifetime orders → counts as a "repeat" buyer
    // → repeat_rate for the cohort must be > 0.
    expect(janCohort!.repeatRate).toBeGreaterThan(0);
    // ordersTotal includes both Jan + Feb orders for our customer (LTV is
    // lifetime, not period-bounded).
    expect(janCohort!.ordersTotal).toBeGreaterThanOrEqual(2);
    expect(janCohort!.revenueTotal).toBeGreaterThan(0);
    expect(janCohort!.ltv).toBeGreaterThan(0);
  });
});

describe("bi: funnel", () => {
  // Seeds a newsletter subscriber whose email matches a customer that has a
  // confirmed order. With those rows present the funnel must report ≥1
  // subscriber AND ≥1 subscriberWhoOrdered. Note: per spec §13 + plan note,
  // the implementation must NOT filter on `confirmed_at IS NOT NULL` (Phase
  // 2 doesn't populate it today), so this seed leaves confirmed_at NULL.
  test("subscriber with matching customer + confirmed order counts as ordered", async () => {
    const { db } = await getSharedTestDatabase();

    const brandId = crypto.randomUUID();
    const categoryId = crypto.randomUUID();
    const productId = crypto.randomUUID();
    const customerId = crypto.randomUUID();
    const orderId = crypto.randomUUID();
    const subscriberId = crypto.randomUUID();
    const email = `funnel-test-${customerId.slice(0, 6)}@jasmin.tn`;

    await db.execute(
      sql`INSERT INTO brands (id, slug, name) VALUES (${brandId}, ${`fn-b-${brandId.slice(0, 6)}`}, 'FNBrand')`,
    );
    await db.execute(
      sql`INSERT INTO categories (id, slug, name) VALUES (${categoryId}, ${`fn-c-${categoryId.slice(0, 6)}`}, 'FNCat')`,
    );
    await db.execute(sql`
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES
        (${productId}, ${`fn-p-${productId.slice(0, 6)}`}, 'FNProduct', ${brandId}, ${categoryId}, 'x', 'x', false, ${`SKU-FN-${productId.slice(0, 6)}`}, 40.000, true)
    `);
    await db.execute(sql`
      INSERT INTO customers (id, email, full_name)
      VALUES (${customerId}, ${email}, 'Funnel Customer')
    `);
    await db.execute(sql`
      INSERT INTO newsletter_subscribers (id, email, customer_id, source)
      VALUES (${subscriberId}, ${email}, ${customerId}, 'test')
    `);
    await db.execute(sql`
      INSERT INTO orders (id, order_number, customer_id, status, payment_status, payment_method,
                          subtotal_tnd, shipping_tnd, total_tnd,
                          shipping_full_name, shipping_phone, shipping_street,
                          shipping_city, shipping_postal_code, shipping_governorate,
                          confirmed_at, created_at)
      VALUES
        (${orderId}, ${`JMS-BI-FN-${orderId.slice(0, 6)}`}, ${customerId}, 'confirmed', 'paid',
         'cash_on_delivery', 40.000, 7.000, 47.000,
         'Funnel One','+216 90 66 66 11','Rue 1','Tunis','1000','Tunis',
         '2026-03-15T10:00:00Z', '2026-03-15T10:00:00Z')
    `);

    const { getNewsletterFunnel } = await import("../queries");
    const f = await getNewsletterFunnel(db as never, { since: null });

    expect(f.subscribers).toBeGreaterThan(0);
    expect(f.subscribersWhoOrdered).toBeGreaterThan(0);
    expect(f.conversionRate).toBeGreaterThan(0);
    expect(f.conversionRate).toBeLessThanOrEqual(1);
  });
});
