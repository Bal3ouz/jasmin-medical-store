"use server";
import { ensureSessionCookie } from "@/lib/cart/server";
import { ensureCustomerRow } from "@/lib/customer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@jasmin/db";
import {
  brands,
  cartItems,
  carts,
  customerAddresses,
  customers,
  inventory,
  orderEvents,
  orderItems,
  orders,
  productVariants,
  products,
  stockMovements,
} from "@jasmin/db/schema";
import { generateOrderNumber } from "@jasmin/lib";
import { CheckoutSchema } from "@jasmin/lib/schemas";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface CheckoutResult {
  ok: boolean;
  orderNumber?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createOrderAction(formData: FormData): Promise<CheckoutResult> {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return { ok: false, error: "Service indisponible." };
  const db = createClient(dbUrl);

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) await ensureCustomerRow(db, userData.user);
  const customerId = userData.user?.id ?? null;
  const sessionId = await ensureSessionCookie();

  const cartRow = customerId
    ? (await db.select().from(carts).where(eq(carts.customerId, customerId)))[0]
    : (await db.select().from(carts).where(eq(carts.sessionId, sessionId)))[0];

  if (!cartRow) return { ok: false, error: "Votre panier est vide." };

  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartRow.id));
  if (items.length === 0) return { ok: false, error: "Votre panier est vide." };

  const parsed = CheckoutSchema.safeParse({
    customerId,
    guestEmail: formData.get("guestEmail") || undefined,
    guestPhone: formData.get("guestPhone") || undefined,
    shipping: {
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      street: formData.get("street"),
      city: formData.get("city"),
      postalCode: formData.get("postalCode"),
      governorate: formData.get("governorate"),
      country: formData.get("country") ?? "TN",
    },
    items: items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId,
      quantity: it.quantity,
    })),
    paymentMethod: formData.get("paymentMethod") ?? "cash_on_delivery",
    notesCustomer: formData.get("notesCustomer") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, error: "Vérifiez les informations.", fieldErrors };
  }

  const checkout = parsed.data;

  let orderNumber: string;
  try {
    orderNumber = await db.transaction(async (tx) => {
      let subtotal = 0;
      const itemRows: (typeof orderItems.$inferInsert)[] = [];

      for (const it of checkout.items) {
        const product = (await tx.select().from(products).where(eq(products.id, it.productId)))[0];
        if (!product) throw new Error(`Produit introuvable: ${it.productId}`);
        const variant = it.variantId
          ? (await tx.select().from(productVariants).where(eq(productVariants.id, it.variantId)))[0]
          : undefined;
        const brand = (await tx.select().from(brands).where(eq(brands.id, product.brandId)))[0];

        const inv = it.variantId
          ? (await tx.select().from(inventory).where(eq(inventory.variantId, it.variantId)))[0]
          : (await tx.select().from(inventory).where(eq(inventory.productId, product.id)))[0];
        if (!inv || inv.onHand < it.quantity) {
          throw new Error(`Stock insuffisant pour ${product.name}`);
        }

        const unitPrice = Number(variant?.priceTnd ?? product.priceTnd ?? 0);
        const lineTotal = unitPrice * it.quantity;
        subtotal += lineTotal;

        itemRows.push({
          orderId: "00000000-0000-0000-0000-000000000000",
          productId: product.id,
          variantId: variant?.id ?? null,
          productNameSnapshot: product.name,
          variantNameSnapshot: variant?.name ?? null,
          brandSnapshot: brand?.name ?? "",
          skuSnapshot: variant?.sku ?? product.sku ?? "",
          unitPriceTnd: unitPrice.toFixed(3),
          quantity: it.quantity,
          lineTotalTnd: lineTotal.toFixed(3),
        });
      }

      const shippingFee = subtotal > 200 ? 0 : 7;
      const total = subtotal + shippingFee;

      // Self-heal the sequence so seeded orders (which assign their own
      // numbers without bumping the sequence) don't collide with new ones.
      // Pulls the largest tail integer out of every existing order_number
      // and lifts the sequence to that value if needed.
      await tx.execute(sql`
        SELECT setval(
          'jms_order_seq',
          GREATEST(
            COALESCE(
              (SELECT MAX((regexp_match(order_number, '(\\d+)$'))[1]::int) FROM orders),
              0
            ),
            (SELECT last_value FROM jms_order_seq)
          )
        )
      `);

      const seqResult = await tx.execute<{ seq: string | number }>(
        sql`SELECT nextval('jms_order_seq') AS seq`,
      );
      const seqRow = seqResult[0] as { seq: string | number };
      const sequence = Number(seqRow.seq);
      const year = new Date().getFullYear();
      const formattedOrderNumber = generateOrderNumber({ year, sequence });

      // Guest checkout: idempotently create a `customers` row tagged
      // is_guest=true so the admin sees the shopper alongside members.
      let effectiveCustomerId: string | null = checkout.customerId ?? null;
      if (!effectiveCustomerId && checkout.guestEmail) {
        const newId = crypto.randomUUID();
        await tx
          .insert(customers)
          .values({
            id: newId,
            email: checkout.guestEmail,
            fullName: checkout.shipping.fullName,
            phone: checkout.guestPhone ?? checkout.shipping.phone,
            isGuest: true,
          })
          .onConflictDoNothing();
        const existing = await tx
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.email, checkout.guestEmail));
        effectiveCustomerId = existing[0]?.id ?? null;
      }

      // Persist shipping address into the customer's address book so the
      // admin sees it under their profile. Skips silently if a matching
      // address already exists (same street + postal code).
      if (effectiveCustomerId) {
        const existingAddrs = await tx
          .select({
            id: customerAddresses.id,
            street: customerAddresses.street,
            postalCode: customerAddresses.postalCode,
          })
          .from(customerAddresses)
          .where(eq(customerAddresses.customerId, effectiveCustomerId));
        const dup = existingAddrs.find(
          (a) =>
            a.street === checkout.shipping.street &&
            a.postalCode === checkout.shipping.postalCode,
        );
        if (!dup) {
          await tx.insert(customerAddresses).values({
            customerId: effectiveCustomerId,
            fullName: checkout.shipping.fullName,
            phone: checkout.shipping.phone,
            street: checkout.shipping.street,
            city: checkout.shipping.city,
            postalCode: checkout.shipping.postalCode,
            governorate: checkout.shipping.governorate,
            country: checkout.shipping.country,
            isDefault: existingAddrs.length === 0,
          });
        }
      }

      const insertedOrder = await tx
        .insert(orders)
        .values({
          orderNumber: formattedOrderNumber,
          customerId: effectiveCustomerId,
          guestEmail: checkout.guestEmail ?? null,
          guestPhone: checkout.guestPhone ?? null,
          shippingFullName: checkout.shipping.fullName,
          shippingPhone: checkout.shipping.phone,
          shippingStreet: checkout.shipping.street,
          shippingCity: checkout.shipping.city,
          shippingPostalCode: checkout.shipping.postalCode,
          shippingGovernorate: checkout.shipping.governorate,
          subtotalTnd: subtotal.toFixed(3),
          shippingTnd: shippingFee.toFixed(3),
          totalTnd: total.toFixed(3),
          status: "pending",
          paymentStatus: "pending",
          paymentMethod: checkout.paymentMethod,
          notesCustomer: checkout.notesCustomer ?? null,
        })
        .returning({ id: orders.id });
      const orderId = insertedOrder[0]!.id;

      for (const row of itemRows) {
        await tx.insert(orderItems).values({ ...row, orderId });
      }

      await tx.insert(orderEvents).values({
        orderId,
        eventType: "created",
        toStatus: "pending",
      });

      for (const it of checkout.items) {
        await tx.insert(stockMovements).values({
          productId: it.variantId ? null : it.productId,
          variantId: it.variantId ?? null,
          type: "sale",
          quantity: -it.quantity,
          referenceType: "order",
          referenceId: orderId,
        });
        if (it.variantId) {
          await tx
            .update(inventory)
            .set({ onHand: sql`${inventory.onHand} - ${it.quantity}` })
            .where(eq(inventory.variantId, it.variantId));
        } else {
          await tx
            .update(inventory)
            .set({ onHand: sql`${inventory.onHand} - ${it.quantity}` })
            .where(eq(inventory.productId, it.productId));
        }
      }

      await tx.delete(cartItems).where(eq(cartItems.cartId, cartRow.id));

      return formattedOrderNumber;
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur de commande." };
  }

  revalidatePath("/", "layout");
  redirect(`/commande/confirmation/${orderNumber}`);
}
