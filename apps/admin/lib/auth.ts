import { createClient } from "@jasmin/db";
import { staffUsers } from "@jasmin/db/schema";
import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "./supabase/server";

export interface StaffSession {
  authUserId: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "cashier" | "stock";
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) throw new Error("SUPABASE_DB_URL not set");
  const db = createClient(dbUrl);

  const rows = await db.select().from(staffUsers).where(eq(staffUsers.id, data.user.id));
  const staff = rows[0];
  if (!staff || !staff.isActive) return null;

  return {
    authUserId: data.user.id,
    email: staff.email,
    fullName: staff.fullName,
    role: staff.role,
  };
}
