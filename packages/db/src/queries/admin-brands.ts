import { asc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { brands } from "../schema";

/**
 * Admin-side: list every brand in the catalogue (no published/active filter).
 *
 * Sorted alphabetically by name to match the storefront's catalogue ordering
 * and the brand-picker UX in the products editor.
 */
export async function listAllBrands(db: Database) {
  return db.select().from(brands).orderBy(asc(brands.name));
}

/**
 * Admin-side: fetch a single brand by id, or `null` when it does not exist.
 *
 * Returns the full row so the actions can compute audit diffs (`before`/`after`).
 */
export async function getBrand(db: Database, id: string) {
  const rows = await db.select().from(brands).where(eq(brands.id, id));
  return rows[0] ?? null;
}
