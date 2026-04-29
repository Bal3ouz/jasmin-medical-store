/**
 * Demo staff bootstrap.
 *
 * Creates four Supabase auth users (one per role) with known passwords
 * and ensures the matching staff_users rows exist.
 *
 *   admin@jasmin.tn   / Demo1234!  (admin)
 *   manager@jasmin.tn / Demo1234!  (manager)
 *   cashier@jasmin.tn / Demo1234!  (cashier)
 *   stock@jasmin.tn   / Demo1234!  (stock)
 *
 * Run via: `bun run db:seed:demo-staff`
 *
 * The customer-creation trigger (`on_auth_user_created`) already skips
 * customers row insertion when `raw_user_meta_data.is_staff = 'true'`,
 * so these never appear in the customers table.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { createClient } from "../client";
import * as schema from "../schema";

interface DemoStaff {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "manager" | "cashier" | "stock";
}

const DEMO_STAFF: DemoStaff[] = [
  { email: "admin@jasmin.tn",   password: "Demo1234!", fullName: "Sami Admin",     role: "admin"   },
  { email: "manager@jasmin.tn", password: "Demo1234!", fullName: "Leila Manager",  role: "manager" },
  { email: "cashier@jasmin.tn", password: "Demo1234!", fullName: "Karim Caisse",   role: "cashier" },
  { email: "stock@jasmin.tn",   password: "Demo1234!", fullName: "Hassen Stock",   role: "stock"   },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DB_URL) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL");
  process.exit(1);
}

const supabase = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const db = createClient(DB_URL);

async function ensureUser(s: DemoStaff): Promise<string> {
  // List existing users (admin API), find by email — Supabase has no direct getUserByEmail in Admin API.
  const { data: page } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = page.users.find((u) => u.email?.toLowerCase() === s.email.toLowerCase());
  if (existing) {
    // Idempotent: ensure metadata + password reset to demo password.
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: s.password,
      email_confirm: true,
      user_metadata: { is_staff: true, full_name: s.fullName, role: s.role },
    });
    if (error) console.warn(`  ⚠ ${s.email}: updateUser failed —`, error.message);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: s.email,
    password: s.password,
    email_confirm: true,
    user_metadata: { is_staff: true, full_name: s.fullName, role: s.role },
  });
  if (error || !data.user) throw new Error(`createUser ${s.email} failed: ${error?.message}`);
  return data.user.id;
}

async function ensureStaffRow(authUserId: string, s: DemoStaff) {
  const existing = await db
    .select()
    .from(schema.staffUsers)
    .where(eq(schema.staffUsers.id, authUserId));
  if (existing.length > 0) {
    await db
      .update(schema.staffUsers)
      .set({
        email: s.email,
        fullName: s.fullName,
        role: s.role,
        isActive: true,
      })
      .where(eq(schema.staffUsers.id, authUserId));
    return;
  }
  // Cleanup any stale row keyed by email but with a different id (e.g. seed placeholder).
  await db.delete(schema.staffUsers).where(eq(schema.staffUsers.email, s.email));
  await db.insert(schema.staffUsers).values({
    id: authUserId,
    email: s.email,
    fullName: s.fullName,
    role: s.role,
    isActive: true,
  });
}

async function main() {
  console.log("→ ensuring 4 demo staff auth users + staff_users rows");
  for (const s of DEMO_STAFF) {
    const id = await ensureUser(s);
    await ensureStaffRow(id, s);
    console.log(`  ✓ ${s.role.padEnd(8)} ${s.email}  (auth.uid=${id.slice(0, 8)}…)`);
  }
  console.log("✓ demo staff ready. Login at http://localhost:3001/login with Demo1234!");
  process.exit(0);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
