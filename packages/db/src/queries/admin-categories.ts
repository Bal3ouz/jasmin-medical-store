import { asc, sql } from "drizzle-orm";
import type { Database } from "../client";
import { categories } from "../schema";

/**
 * Admin-side: flat list of every category.
 *
 * Sort: roots first (`parent_id NULLS FIRST`), then siblings by `display_order`,
 * then a stable tiebreak by name. The tree page rebuilds the hierarchy by
 * grouping rows on `parentId`, so the order here directly drives both the
 * vertical layout and the up/down reorder buttons.
 */
export async function listAllCategories(db: Database) {
  return db
    .select()
    .from(categories)
    .orderBy(
      sql`${categories.parentId} ASC NULLS FIRST`,
      asc(categories.displayOrder),
      asc(categories.name),
    );
}
