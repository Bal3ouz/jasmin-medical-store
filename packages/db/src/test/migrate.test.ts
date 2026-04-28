import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { createTestDatabase, migrateTestDatabase } from "./pglite-harness";

describe("schema migrations", () => {
  test("apply cleanly on a fresh pglite database and create the enum types", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);

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
