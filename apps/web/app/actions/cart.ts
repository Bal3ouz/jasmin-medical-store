"use server";
import { ensureSessionCookie, findOrCreateCart } from "@/lib/cart/server";
import { ensureCustomerRow } from "@/lib/customer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@jasmin/db";
import { cartItems } from "@jasmin/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CartActionResult {
  ok: boolean;
  error?: string;
}

function getDb() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL not set");
  return createClient(url);
}

async function authContext(db: ReturnType<typeof getDb>): Promise<{
  customerId: string | null;
  sessionId: string;
}> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) await ensureCustomerRow(db, data.user);
  const customerId = data.user?.id ?? null;
  const sessionId = await ensureSessionCookie();
  return { customerId, sessionId };
}

export async function addToCartAction(formData: FormData): Promise<CartActionResult> {
  const productId = String(formData.get("productId") ?? "");
  const variantIdRaw = formData.get("variantId");
  const variantId = variantIdRaw && String(variantIdRaw).length > 0 ? String(variantIdRaw) : null;
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));
  if (!productId) return { ok: false, error: "Produit invalide." };

  const db = getDb();
  const { customerId, sessionId } = await authContext(db);
  const cartId = await findOrCreateCart(db, customerId, sessionId);

  // Find existing line with same product+variant combo
  const existingRows = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  const existing = existingRows.find(
    (r) => r.productId === productId && (r.variantId ?? null) === variantId,
  );

  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ cartId, productId, variantId, quantity });
  }

  revalidatePath("/panier");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartItemAction(formData: FormData): Promise<CartActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Math.max(0, Number(formData.get("quantity") ?? 1));
  if (!itemId) return { ok: false, error: "Ligne invalide." };
  const db = getDb();

  if (quantity === 0) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId));
  }
  revalidatePath("/panier");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItemAction(formData: FormData): Promise<CartActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return { ok: false, error: "Ligne invalide." };
  const db = getDb();
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  revalidatePath("/panier");
  revalidatePath("/", "layout");
  return { ok: true };
}
