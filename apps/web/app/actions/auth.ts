"use server";
import { ensureSessionCookie } from "@/lib/cart/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@jasmin/db";
import { cartItems, carts } from "@jasmin/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function signUpAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  if (!email || !password) return { ok: false, error: "Email et mot de passe requis." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { ok: false, error: error.message };
  redirect("/compte");
}

export async function signInAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: error?.message ?? "Connexion échouée." };

  // Merge guest cart into customer cart.
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (dbUrl) {
    const db = createClient(dbUrl);
    const sessionId = await ensureSessionCookie();
    const guestCart = (await db.select().from(carts).where(eq(carts.sessionId, sessionId)))[0];
    if (guestCart) {
      const existingCustomerCart = (
        await db.select().from(carts).where(eq(carts.customerId, data.user.id))
      )[0];
      const customerCartId =
        existingCustomerCart?.id ??
        (
          await db.insert(carts).values({ customerId: data.user.id }).returning({ id: carts.id })
        )[0]!.id;

      const guestItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, guestCart.id));
      for (const item of guestItems) {
        await db.insert(cartItems).values({
          cartId: customerCartId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
      await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
      await db.delete(carts).where(eq(carts.id, guestCart.id));
    }
  }

  redirect("/compte");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "");
  if (!email) return { ok: false, error: "Email requis." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/auth/v1/verify?type=recovery`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function resetPasswordAction(formData: FormData): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { ok: false, error: "Mot de passe trop court (8 minimum)." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  redirect("/compte");
}
