import { type Database } from "@jasmin/db";
import { customers } from "@jasmin/db/schema";

/**
 * Supabase auth.users and our customers table are separate; if a row is
 * missing for the current auth user (e.g. seed reset wiped customers but the
 * cookie still carries an auth session), every downstream FK lookup (carts,
 * orders) breaks. Call this from every action that inserts with a customer_id
 * derived from the Supabase session. ON CONFLICT DO NOTHING handles both PK
 * (id) and unique (email) collisions.
 */
export async function ensureCustomerRow(
  db: Database,
  user: { id: string; email?: string | null; user_metadata?: { full_name?: string | null } | null },
): Promise<void> {
  const email = user.email ?? `${user.id}@auth.local`;
  const fullName = user.user_metadata?.full_name ?? null;
  await db.insert(customers).values({ id: user.id, email, fullName }).onConflictDoNothing();
}
