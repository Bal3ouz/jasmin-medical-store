import { eq } from "drizzle-orm";
import { createClient } from "../client";
import * as schema from "../schema";
import { BRAND_SEED } from "./data/brands";
import { CATEGORY_SEED } from "./data/categories";
import { ADDRESS_SEED, CUSTOMER_SEED } from "./data/customers";
import { ORDER_SEED } from "./data/orders";
import { PRODUCT_SEED } from "./data/products";
import { STAFF_SEED } from "./data/staff";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL not set");
  process.exit(1);
}

const db = createClient(url);

async function seed() {
  console.log("→ brands");
  for (const b of BRAND_SEED) {
    await db
      .insert(schema.brands)
      .values(b)
      .onConflictDoUpdate({ target: schema.brands.slug, set: b });
  }

  console.log("→ categories");
  for (const c of CATEGORY_SEED) {
    await db
      .insert(schema.categories)
      .values(c)
      .onConflictDoUpdate({ target: schema.categories.slug, set: c });
  }

  console.log("→ products + variants + inventory");
  for (const p of PRODUCT_SEED) {
    const brand = (
      await db.select().from(schema.brands).where(eq(schema.brands.slug, p.brandSlug))
    )[0];
    const category = (
      await db.select().from(schema.categories).where(eq(schema.categories.slug, p.categorySlug))
    )[0];
    if (!brand || !category) {
      console.warn(`  skip ${p.slug}: missing brand or category`);
      continue;
    }

    const productRow = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brandId: brand.id,
      categoryId: category.id,
      shortDescription: p.shortDescription,
      description: p.description,
      ingredients: p.ingredients ?? null,
      usage: p.usage ?? null,
      hasVariants: p.hasVariants,
      sku: p.hasVariants ? null : (p.sku ?? null),
      priceTnd: p.hasVariants ? null : (p.priceTnd ?? null),
      isPublished: true,
      isFeatured: false,
    };
    await db
      .insert(schema.products)
      .values(productRow)
      .onConflictDoUpdate({ target: schema.products.slug, set: productRow });

    if (p.hasVariants && p.variants) {
      for (const v of p.variants) {
        await db
          .insert(schema.productVariants)
          .values({
            productId: p.id,
            sku: v.sku,
            name: v.name,
            priceTnd: v.priceTnd,
            isDefault: v.isDefault ?? false,
          })
          .onConflictDoUpdate({
            target: schema.productVariants.sku,
            set: { name: v.name, priceTnd: v.priceTnd, isDefault: v.isDefault ?? false },
          });
      }
    }

    if (p.hasVariants && p.variants) {
      for (const v of p.variants) {
        const variant = (
          await db
            .select()
            .from(schema.productVariants)
            .where(eq(schema.productVariants.sku, v.sku))
        )[0];
        if (variant) {
          await db
            .insert(schema.inventory)
            .values({ variantId: variant.id, onHand: p.initialStock, reorderPoint: p.reorderPoint })
            .onConflictDoUpdate({
              target: schema.inventory.variantId,
              set: { onHand: p.initialStock, reorderPoint: p.reorderPoint },
            });
        }
      }
    } else {
      await db
        .insert(schema.inventory)
        .values({ productId: p.id, onHand: p.initialStock, reorderPoint: p.reorderPoint })
        .onConflictDoUpdate({
          target: schema.inventory.productId,
          set: { onHand: p.initialStock, reorderPoint: p.reorderPoint },
        });
    }

    if (!p.hasVariants) {
      await db.insert(schema.stockMovements).values({
        productId: p.id,
        type: "purchase",
        quantity: p.initialStock,
        notes: "Seed: initial stock",
      });
    }
  }

  console.log("→ customers + addresses");
  for (const c of CUSTOMER_SEED) {
    await db
      .insert(schema.customers)
      .values(c)
      .onConflictDoUpdate({ target: schema.customers.email, set: c });
  }
  for (const a of ADDRESS_SEED) {
    const cust = (
      await db.select().from(schema.customers).where(eq(schema.customers.email, a.customerEmail))
    )[0];
    if (!cust) continue;
    await db
      .insert(schema.customerAddresses)
      .values({
        customerId: cust.id,
        fullName: a.fullName,
        phone: a.phone,
        street: a.street,
        city: a.city,
        postalCode: a.postalCode,
        governorate: a.governorate,
        isDefault: a.isDefault,
      })
      .onConflictDoNothing();
  }

  console.log("→ staff");
  for (const s of STAFF_SEED) {
    await db
      .insert(schema.staffUsers)
      .values(s)
      .onConflictDoUpdate({ target: schema.staffUsers.email, set: s });
  }

  console.log("→ orders + items + events + sale stock movements");
  for (const o of ORDER_SEED) {
    const cust = o.customerEmail
      ? (
          await db
            .select()
            .from(schema.customers)
            .where(eq(schema.customers.email, o.customerEmail))
        )[0]
      : undefined;

    let subtotal = 0;
    const itemRows: (typeof schema.orderItems.$inferInsert)[] = [];
    for (const it of o.items) {
      const product = (
        await db.select().from(schema.products).where(eq(schema.products.slug, it.productSlug))
      )[0];
      if (!product) continue;
      const variant = it.variantSku
        ? (
            await db
              .select()
              .from(schema.productVariants)
              .where(eq(schema.productVariants.sku, it.variantSku))
          )[0]
        : undefined;
      const brand = (
        await db.select().from(schema.brands).where(eq(schema.brands.id, product.brandId))
      )[0];
      const unitPrice = Number(variant?.priceTnd ?? product.priceTnd ?? 0);
      const lineTotal = unitPrice * it.quantity;
      subtotal += lineTotal;

      itemRows.push({
        orderId: "00000000-0000-0000-0000-000000000000",
        productId: product.id,
        variantId: variant?.id,
        productNameSnapshot: product.name,
        variantNameSnapshot: variant?.name,
        brandSnapshot: brand?.name ?? "",
        skuSnapshot: variant?.sku ?? product.sku ?? "",
        unitPriceTnd: unitPrice.toFixed(3),
        quantity: it.quantity,
        lineTotalTnd: lineTotal.toFixed(3),
      });
    }

    const shippingFee = subtotal > 200 ? 0 : 7;
    const total = subtotal + shippingFee;
    const createdAt = new Date(Date.now() - o.daysAgo * 86_400_000);

    const inserted = await db
      .insert(schema.orders)
      .values({
        orderNumber: o.orderNumber,
        customerId: cust?.id,
        guestEmail: o.guestEmail,
        guestPhone: o.guestPhone,
        shippingFullName: o.shipping.fullName,
        shippingPhone: o.shipping.phone,
        shippingStreet: o.shipping.street,
        shippingCity: o.shipping.city,
        shippingPostalCode: o.shipping.postalCode,
        shippingGovernorate: o.shipping.governorate,
        subtotalTnd: subtotal.toFixed(3),
        shippingTnd: shippingFee.toFixed(3),
        totalTnd: total.toFixed(3),
        status: o.status,
        paymentStatus:
          o.status === "delivered" ? "paid" : o.status === "cancelled" ? "failed" : "pending",
        paymentMethod: o.paymentMethod,
        createdAt,
        updatedAt: createdAt,
        confirmedAt: ["confirmed", "preparing", "shipped", "delivered"].includes(o.status)
          ? createdAt
          : null,
        shippedAt: ["shipped", "delivered"].includes(o.status)
          ? new Date(createdAt.getTime() + 86_400_000)
          : null,
        deliveredAt:
          o.status === "delivered" ? new Date(createdAt.getTime() + 2 * 86_400_000) : null,
        cancelledAt: o.status === "cancelled" ? new Date(createdAt.getTime() + 3600_000) : null,
      })
      .onConflictDoUpdate({
        target: schema.orders.orderNumber,
        set: { totalTnd: total.toFixed(3), status: o.status },
      })
      .returning({ id: schema.orders.id });

    const orderId = inserted[0]!.id;

    await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
    for (const row of itemRows) {
      await db.insert(schema.orderItems).values({ ...row, orderId });
    }

    await db.delete(schema.orderEvents).where(eq(schema.orderEvents.orderId, orderId));
    await db.insert(schema.orderEvents).values({
      orderId,
      eventType: "created",
      toStatus: "pending",
      performedAt: createdAt,
    });
    if (o.status !== "pending") {
      await db.insert(schema.orderEvents).values({
        orderId,
        eventType: o.status,
        fromStatus: "pending",
        toStatus: o.status,
        performedAt: new Date(createdAt.getTime() + 3600_000),
      });
    }

    if (["confirmed", "preparing", "shipped", "delivered"].includes(o.status)) {
      for (const it of o.items) {
        const product = (
          await db.select().from(schema.products).where(eq(schema.products.slug, it.productSlug))
        )[0];
        if (!product) continue;
        const variant = it.variantSku
          ? (
              await db
                .select()
                .from(schema.productVariants)
                .where(eq(schema.productVariants.sku, it.variantSku))
            )[0]
          : undefined;
        await db.insert(schema.stockMovements).values({
          productId: variant ? null : product.id,
          variantId: variant?.id,
          type: "sale",
          quantity: -it.quantity,
          referenceType: "order",
          referenceId: orderId,
          performedAt: createdAt,
        });
      }
    }
  }

  console.log("✓ seed complete");
  process.exit(0);
}

void seed();
