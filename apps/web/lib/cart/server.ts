import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@jasmin/db";
import { cartItems, carts } from "@jasmin/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export const CART_COOKIE = "jms_cart_session";

export async function getCartCount(): Promise<number> {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return 0;
  const db = createClient(dbUrl);

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const customerId = userData.user?.id ?? null;

  let cartId: string | null = null;
  if (customerId) {
    const rows = await db.select().from(carts).where(eq(carts.customerId, customerId));
    cartId = rows[0]?.id ?? null;
  } else {
    const sessionId = (await cookies()).get(CART_COOKIE)?.value;
    if (sessionId) {
      const rows = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
      cartId = rows[0]?.id ?? null;
    }
  }

  if (!cartId) return 0;
  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  return items.reduce((acc, it) => acc + it.quantity, 0);
}
