import { asc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { type StaffUser, staffUsers } from "../schema";

/**
 * Admin-side staff listing.
 *
 * Sorted by full name so the manage-team page is alphabetical without an
 * extra client-side pass. The page is admin-only — there's no search box,
 * pagination, or filter apparatus here on purpose: the staff list is
 * single-digit at the scale Jasmin operates.
 */
export async function listStaff(db: Database): Promise<StaffUser[]> {
  return db.select().from(staffUsers).orderBy(asc(staffUsers.fullName));
}

/**
 * Single-staff lookup by primary key. Returns `null` for not-found so
 * pages can use `notFound()` without a try/catch.
 */
export async function getStaff(db: Database, id: string): Promise<StaffUser | null> {
  const rows = await db.select().from(staffUsers).where(eq(staffUsers.id, id));
  return rows[0] ?? null;
}
