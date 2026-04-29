import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type Database, createClient } from "@jasmin/db";
import {
  brands,
  cartItems,
  carts,
  inventory,
  productImages,
  productVariants,
  products,
} from "@jasmin/db/schema";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

export const CART_COOKIE = "jms_cart_session";

export interface CartLine {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  variantId: string | null;
  variantName: string | null;
  unitPriceTnd: string;
  quantity: number;
  lineTotalTnd: string;
  imageStoragePath: string | null;
  stockOnHand: number;
}

export interface CartView {
  cartId: string | null;
  customerId: string | null;
  sessionId: string | null;
  lines: CartLine[];
  subtotalTnd: number;
  shippingTnd: number;
  totalTnd: number;
  itemCount: number;
}

export async function ensureSessionCookie(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  jar.set(CART_COOKIE, fresh, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return fresh;
}

export async function findOrCreateCart(
  db: Database,
  customerId: string | null,
  sessionId: string,
): Promise<string> {
  if (customerId) {
    const rows = await db.select().from(carts).where(eq(carts.customerId, customerId));
    if (rows[0]) return rows[0].id;
    const inserted = await db.insert(carts).values({ customerId }).returning({ id: carts.id });
    return inserted[0]!.id;
  }
  const rows = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
  if (rows[0]) return rows[0].id;
  const inserted = await db.insert(carts).values({ sessionId }).returning({ id: carts.id });
  return inserted[0]!.id;
}

export async function getCart(): Promise<CartView> {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const empty: CartView = {
    cartId: null,
    customerId: null,
    sessionId: null,
    lines: [],
    subtotalTnd: 0,
    shippingTnd: 0,
    totalTnd: 0,
    itemCount: 0,
  };
  if (!dbUrl) return empty;
  const db = createClient(dbUrl);

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const customerId = userData.user?.id ?? null;
  const sessionId = (await cookies()).get(CART_COOKIE)?.value ?? null;

  let cartId: string | null = null;
  if (customerId) {
    const rows = await db.select().from(carts).where(eq(carts.customerId, customerId));
    cartId = rows[0]?.id ?? null;
  } else if (sessionId) {
    const rows = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
    cartId = rows[0]?.id ?? null;
  }

  if (!cartId) {
    return { ...empty, customerId, sessionId };
  }

  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  const lines: CartLine[] = [];
  let subtotal = 0;

  for (const item of items) {
    const productRow = (await db.select().from(products).where(eq(products.id, item.productId)))[0];
    if (!productRow) continue;
    const brandRow = (await db.select().from(brands).where(eq(brands.id, productRow.brandId)))[0];
    const variantRow = item.variantId
      ? (await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)))[0]
      : null;
    const primaryImage = (
      await db
        .select()
        .from(productImages)
        .where(and(eq(productImages.productId, productRow.id), eq(productImages.isPrimary, true)))
    )[0];
    const inv = item.variantId
      ? (await db.select().from(inventory).where(eq(inventory.variantId, item.variantId)))[0]
      : (await db.select().from(inventory).where(eq(inventory.productId, productRow.id)))[0];

    const unitPrice = Number(variantRow?.priceTnd ?? productRow.priceTnd ?? 0);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    lines.push({
      id: item.id,
      productId: productRow.id,
      productSlug: productRow.slug,
      productName: productRow.name,
      brandName: brandRow?.name ?? "",
      variantId: variantRow?.id ?? null,
      variantName: variantRow?.name ?? null,
      unitPriceTnd: unitPrice.toFixed(3),
      quantity: item.quantity,
      lineTotalTnd: lineTotal.toFixed(3),
      imageStoragePath: primaryImage?.storagePath ?? null,
      stockOnHand: inv?.onHand ?? 0,
    });
  }

  const shipping = subtotal > 200 ? 0 : 7;
  const total = subtotal + shipping;

  return {
    cartId,
    customerId,
    sessionId,
    lines,
    subtotalTnd: subtotal,
    shippingTnd: shipping,
    totalTnd: total,
    itemCount: lines.reduce((acc, l) => acc + l.quantity, 0),
  };
}

export async function getCartCount(): Promise<number> {
  const view = await getCart();
  return view.itemCount;
}
