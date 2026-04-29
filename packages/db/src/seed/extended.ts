/**
 * Demo-grade seed runner.
 *
 * Composes the baseline seed (data/{brands,categories,customers,orders,products,staff})
 * with the optional `*-extended.ts` modules produced by the research subagents.
 *
 * Idempotent — re-runnable. Conflicts upserted by slug/email/orderNumber.
 *
 * Run via: `bun run db:seed:extended` from the repo root.
 *
 * After this completes, run:
 *   bun run db:upload-images       — scrape product photos into Supabase Storage
 *   bun run db:seed:demo-staff     — create the four auth users for demo logins
 */

import { eq } from "drizzle-orm";
import { createClient } from "../client";
import * as schema from "../schema";
import { BRAND_SEED } from "./data/brands";
import { CATEGORY_SEED } from "./data/categories";
import { ADDRESS_SEED, CUSTOMER_SEED } from "./data/customers";
import { ORDER_SEED } from "./data/orders";
import { PRODUCT_SEED, type SeedProduct } from "./data/products";
import { STAFF_SEED } from "./data/staff";

interface BrandSeed {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

interface CategorySeed {
  id: string;
  /** Extended shape: resolved at insert time. */
  parentSlug?: string | null;
  /** Baseline shape: already-resolved FK. */
  parentId?: string | null;
  slug: string;
  name: string;
  description?: string | null;
  heroImageUrl?: string | null;
  displayOrder?: number;
}

interface CustomerSeed {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  marketingConsent?: boolean;
  newsletterSubscribed?: boolean;
}

interface AddressSeed {
  customerEmail: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  governorate: string;
  isDefault?: boolean;
}

interface OrderItemSeed {
  productSlug: string;
  variantSku?: string;
  quantity: number;
}

interface OrderSeed {
  orderNumber: string;
  customerEmail?: string;
  guestEmail?: string;
  guestPhone?: string;
  shipping: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    governorate: string;
  };
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  paymentMethod: "cash_on_delivery" | "card_konnect" | "card_clic_to_pay" | "bank_transfer";
  daysAgo: number;
  items: OrderItemSeed[];
  notesCustomer?: string | null;
  notesInternal?: string | null;
  isWalkIn?: boolean;
}

async function loadModule<T>(rel: string, exportName: string): Promise<T[]> {
  try {
    const mod = (await import(rel)) as Record<string, unknown>;
    const arr = mod[exportName];
    return Array.isArray(arr) ? (arr as T[]) : [];
  } catch {
    return [];
  }
}

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL not set");
  process.exit(1);
}

const db = createClient(url);

async function seed() {
  // ── Compose baseline + extended ──────────────────────────────────────────
  const extendedBrands = await loadModule<BrandSeed>("./data/brands-extended", "EXTENDED_BRAND_SEED");
  const extendedCategories = await loadModule<CategorySeed>(
    "./data/categories-extended",
    "EXTENDED_CATEGORY_SEED",
  );
  const extendedProducts = await loadModule<SeedProduct>(
    "./data/products-extended",
    "EXTENDED_PRODUCT_SEED",
  );
  const extendedCustomers = await loadModule<CustomerSeed>(
    "./data/customers-extended",
    "EXTENDED_CUSTOMER_SEED",
  );
  const extendedAddresses = await loadModule<AddressSeed>(
    "./data/customers-extended",
    "EXTENDED_ADDRESS_SEED",
  );
  const extendedOrders = await loadModule<OrderSeed>(
    "./data/orders-extended",
    "EXTENDED_ORDER_SEED",
  );

  const allBrands = [...(BRAND_SEED as BrandSeed[]), ...extendedBrands];
  const allCategories: CategorySeed[] = [
    ...(CATEGORY_SEED as unknown as CategorySeed[]),
    ...extendedCategories,
  ];
  const allProducts = [...PRODUCT_SEED, ...extendedProducts];
  const allCustomers: CustomerSeed[] = [
    ...(CUSTOMER_SEED as unknown as CustomerSeed[]),
    ...extendedCustomers,
  ];
  const allAddresses: AddressSeed[] = [
    ...(ADDRESS_SEED as unknown as AddressSeed[]),
    ...extendedAddresses,
  ];
  const allOrders: OrderSeed[] = [
    ...(ORDER_SEED as unknown as OrderSeed[]),
    ...extendedOrders,
  ];

  console.log(
    `→ composing seed: ${allBrands.length} brands, ${allCategories.length} categories, ${allProducts.length} products, ${allCustomers.length} customers, ${allOrders.length} orders`,
  );

  // ── Brands ───────────────────────────────────────────────────────────────
  console.log("→ brands");
  for (const b of allBrands) {
    await db
      .insert(schema.brands)
      .values(b)
      .onConflictDoUpdate({ target: schema.brands.slug, set: b });
  }

  // ── Categories ───────────────────────────────────────────────────────────
  // Two-pass insert so child rows see their parents.
  // Each entry may carry either a pre-resolved `parentId` (baseline shape)
  // or a `parentSlug` (extended shape that we resolve at insert time).
  console.log("→ categories");
  const isRoot = (c: CategorySeed) => !c.parentSlug && !c.parentId;
  const roots = allCategories.filter(isRoot);
  const children = allCategories.filter((c) => !isRoot(c));

  for (const c of roots) {
    const row = {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? null,
      heroImageUrl: c.heroImageUrl ?? null,
      displayOrder: c.displayOrder ?? 0,
      parentId: null as string | null,
    };
    await db
      .insert(schema.categories)
      .values(row)
      .onConflictDoUpdate({ target: schema.categories.slug, set: row });
  }

  for (const c of children) {
    let parentId: string | null = c.parentId ?? null;
    if (!parentId && c.parentSlug) {
      const parent = (
        await db.select().from(schema.categories).where(eq(schema.categories.slug, c.parentSlug))
      )[0];
      if (!parent) {
        console.warn(`  skip category ${c.slug}: parent ${c.parentSlug} missing`);
        continue;
      }
      parentId = parent.id;
    }
    const row = {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? null,
      heroImageUrl: c.heroImageUrl ?? null,
      displayOrder: c.displayOrder ?? 0,
      parentId,
    };
    await db
      .insert(schema.categories)
      .values(row)
      .onConflictDoUpdate({ target: schema.categories.slug, set: row });
  }

  // ── Products + variants + inventory ──────────────────────────────────────
  console.log("→ products + variants + inventory");
  for (const p of allProducts) {
    const brand = (
      await db.select().from(schema.brands).where(eq(schema.brands.slug, p.brandSlug))
    )[0];
    const category = (
      await db.select().from(schema.categories).where(eq(schema.categories.slug, p.categorySlug))
    )[0];
    if (!brand || !category) {
      console.warn(`  skip product ${p.slug}: missing brand=${p.brandSlug} or category=${p.categorySlug}`);
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
  }

  // ── Customers + addresses ────────────────────────────────────────────────
  console.log("→ customers + addresses");
  for (const c of allCustomers) {
    await db
      .insert(schema.customers)
      .values({
        id: c.id,
        email: c.email,
        fullName: c.fullName,
        phone: c.phone ?? null,
        dateOfBirth: c.dateOfBirth ?? null,
        marketingConsent: c.marketingConsent ?? false,
        newsletterSubscribed: c.newsletterSubscribed ?? false,
      })
      .onConflictDoUpdate({
        target: schema.customers.email,
        set: {
          fullName: c.fullName,
          phone: c.phone ?? null,
          marketingConsent: c.marketingConsent ?? false,
          newsletterSubscribed: c.newsletterSubscribed ?? false,
        },
      });
  }
  for (const a of allAddresses) {
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
        isDefault: a.isDefault ?? false,
      })
      .onConflictDoNothing();
  }

  // ── Staff (seeded for FK references; auth.users created separately) ──────
  console.log("→ staff");
  for (const s of STAFF_SEED) {
    await db
      .insert(schema.staffUsers)
      .values(s)
      .onConflictDoUpdate({ target: schema.staffUsers.email, set: s });
  }

  // ── Orders + items + events + sale movements ─────────────────────────────
  console.log("→ orders + items + events + sale stock movements");
  for (const o of allOrders) {
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
      if (!product) {
        console.warn(`  skip order ${o.orderNumber} line: product ${it.productSlug} not found`);
        continue;
      }
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

    if (itemRows.length === 0) {
      console.warn(`  skip order ${o.orderNumber}: no resolvable line items`);
      continue;
    }

    const isWalkIn = o.isWalkIn === true;
    const shippingFee = isWalkIn ? 0 : subtotal > 200 ? 0 : 7;
    const total = subtotal + shippingFee;
    const createdAt = new Date(Date.now() - o.daysAgo * 86_400_000);

    let paymentStatus: "pending" | "paid" | "refunded" | "failed" = "pending";
    if (o.status === "delivered") paymentStatus = "paid";
    else if (o.status === "cancelled") paymentStatus = "failed";
    else if (o.status === "refunded") paymentStatus = "refunded";
    else if (isWalkIn) paymentStatus = "paid";

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
        paymentStatus,
        paymentMethod: o.paymentMethod,
        notesCustomer: o.notesCustomer ?? null,
        notesInternal: o.notesInternal ?? null,
        createdAt,
        updatedAt: createdAt,
        confirmedAt: ["confirmed", "preparing", "shipped", "delivered", "refunded"].includes(o.status)
          ? createdAt
          : null,
        shippedAt: ["shipped", "delivered", "refunded"].includes(o.status)
          ? new Date(createdAt.getTime() + 86_400_000)
          : null,
        deliveredAt:
          ["delivered", "refunded"].includes(o.status)
            ? new Date(createdAt.getTime() + 2 * 86_400_000)
            : null,
        cancelledAt: o.status === "cancelled" ? new Date(createdAt.getTime() + 3600_000) : null,
      })
      .onConflictDoUpdate({
        target: schema.orders.orderNumber,
        set: {
          totalTnd: total.toFixed(3),
          status: o.status,
          paymentStatus,
          notesInternal: o.notesInternal ?? null,
        },
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

  console.log("✓ extended seed complete");
  process.exit(0);
}

void seed();
