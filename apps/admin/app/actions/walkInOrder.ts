"use server";

import { getStaffSession } from "@/lib/auth";
import { SHOP_INFO } from "@/lib/shop-info";
import { type Database, createClient } from "@jasmin/db";
import {
  brands,
  customers,
  inventory,
  orderEvents,
  orderItems,
  orders,
  productVariants,
  products,
  stockMovements,
} from "@jasmin/db/schema";
import type { StaffRole } from "@jasmin/lib";
import { generateOrderNumber } from "@jasmin/lib";
import { WalkInOrderSchema } from "@jasmin/lib/schemas";
import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAudit } from "./audit";

/**
 * Lazily build a DB client. Missing `SUPABASE_DB_URL` throws at use-site —
 * the page-side guard renders a friendlier message before we ever reach
 * the action.
 */
function db(): Database {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL not set");
  return createClient(url);
}

/* -------------------------------------------------------------------------- */
/* createWalkInOrderCore                                                      */
/*                                                                            */
/* Receives a `Database` (NOT a tx) — opens its own transaction so the whole  */
/* flow (order_number generation, line snapshots, inventory decrement,        */
/* events, audit) commits atomically. Caller passes role + staffUserId so we  */
/* don't depend on `getStaffSession()` here (keeps the function unit-testable */
/* against the PGlite harness without auth).                                  */
/* -------------------------------------------------------------------------- */

export interface WalkInLineInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface WalkInCoreParams {
  staffUserId: string;
  role: StaffRole;
  customerId?: string | null;
  guestFullName?: string | null;
  guestPhone?: string | null;
  notesInternal?: string | null;
  lines: WalkInLineInput[];
}

const ALLOWED_ROLES: StaffRole[] = ["cashier", "manager", "admin"];

export async function createWalkInOrderCore(
  database: Database,
  params: WalkInCoreParams,
): Promise<{ orderNumber: string; orderId: string }> {
  // 1. Role gate — same set the action enforces, but checked inside core
  //    too so any caller that wires this up directly cannot bypass it.
  if (!ALLOWED_ROLES.includes(params.role)) {
    throw new Error("Forbidden");
  }
  if (params.lines.length === 0) {
    throw new Error("Au moins un article requis.");
  }

  return database.transaction(async (tx) => {
    // 2. Validate `customerId` if provided; otherwise require guest fields.
    if (params.customerId) {
      const cust = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, params.customerId));
      if (cust.length === 0) throw new Error("Client introuvable.");
    } else {
      if (!params.guestFullName?.trim() || !params.guestPhone?.trim()) {
        throw new Error("Nom et téléphone du client invité requis.");
      }
    }

    // 3. Allocate the order number from the shared sequence used by the
    //    storefront checkout. PGlite returns array; postgres-js may wrap in
    //    `.rows` — handle both.
    const seqResultRaw = (await tx.execute(sql`SELECT nextval('jms_order_seq') AS seq`)) as
      | { rows: { seq: string | number }[] }
      | { seq: string | number }[];
    const seqRows = Array.isArray(seqResultRaw) ? seqResultRaw : seqResultRaw.rows;
    const seqRow = seqRows[0];
    if (!seqRow) throw new Error("Failed to allocate order_number sequence.");
    const sequence = Number(seqRow.seq);
    const year = new Date().getFullYear();
    const formattedOrderNumber = generateOrderNumber({ year, sequence });

    // 4. For each line: fetch the product + (optional) variant + brand to
    //    snapshot, then lock + check inventory. Compute subtotal as we go.
    type ResolvedLine = {
      productId: string;
      variantId: string | null;
      productName: string;
      variantName: string | null;
      brandName: string;
      sku: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
      inventoryRowId: string;
    };

    let subtotal = 0;
    const resolved: ResolvedLine[] = [];

    for (const line of params.lines) {
      const productRows = await tx
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          price: products.priceTnd,
          brandId: products.brandId,
        })
        .from(products)
        .where(eq(products.id, line.productId));
      const product = productRows[0];
      if (!product) throw new Error(`Produit introuvable (${line.productId}).`);

      const brandRows = await tx
        .select({ name: brands.name })
        .from(brands)
        .where(eq(brands.id, product.brandId));
      const brandName = brandRows[0]?.name ?? "";

      let variantName: string | null = null;
      let unitPrice = Number(product.price ?? 0);
      let sku = product.sku ?? "";

      if (line.variantId) {
        const variantRows = await tx
          .select({
            id: productVariants.id,
            name: productVariants.name,
            sku: productVariants.sku,
            price: productVariants.priceTnd,
          })
          .from(productVariants)
          .where(eq(productVariants.id, line.variantId));
        const variant = variantRows[0];
        if (!variant) throw new Error(`Variante introuvable (${line.variantId}).`);
        variantName = variant.name;
        unitPrice = Number(variant.price);
        sku = variant.sku;
      }

      // Lock the inventory row keyed by variantId XOR productId.
      const invWhere = line.variantId
        ? eq(inventory.variantId, line.variantId)
        : and(eq(inventory.productId, line.productId), isNull(inventory.variantId));
      const lockedInv = await tx.select().from(inventory).where(invWhere).for("update");
      const invRow = lockedInv[0];
      if (!invRow) throw new Error(`Inventaire introuvable pour ${sku}.`);
      if (invRow.onHand < line.quantity) {
        throw new Error(`Stock insuffisant pour ${sku}`);
      }

      const lineTotal = unitPrice * line.quantity;
      subtotal += lineTotal;

      resolved.push({
        productId: product.id,
        variantId: line.variantId ?? null,
        productName: product.name,
        variantName,
        brandName,
        sku,
        unitPrice,
        quantity: line.quantity,
        lineTotal,
        inventoryRowId: invRow.id,
      });
    }

    const shippingFee = 0;
    const total = subtotal;

    // 5. Insert order. Snapshot the shipping address from `SHOP_INFO`
    //    because walk-ins pick up at the shop. Set status='confirmed' +
    //    confirmed_at + payment_method='cash_on_delivery' + payment_status='paid'.
    const inserted = await tx
      .insert(orders)
      .values({
        orderNumber: formattedOrderNumber,
        customerId: params.customerId ?? null,
        guestEmail: params.customerId ? null : "",
        guestPhone: params.customerId ? null : (params.guestPhone ?? null),
        shippingFullName: params.customerId
          ? (params.guestFullName ?? "Client enregistré")
          : (params.guestFullName ?? "Walk-in"),
        shippingPhone: params.guestPhone ?? "",
        shippingStreet: SHOP_INFO.street,
        shippingCity: SHOP_INFO.city,
        shippingPostalCode: SHOP_INFO.postalCode,
        shippingGovernorate: SHOP_INFO.governorate,
        shippingCountry: SHOP_INFO.country,
        subtotalTnd: subtotal.toFixed(3),
        shippingTnd: shippingFee.toFixed(3),
        totalTnd: total.toFixed(3),
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "cash_on_delivery",
        notesInternal: params.notesInternal ?? null,
        confirmedAt: new Date(),
      })
      .returning({ id: orders.id });
    const orderId = inserted[0]!.id;

    // 6. Insert items with the snapshots + 7. write `sale` movements +
    //    decrement inventory keyed by the row we just locked.
    for (const r of resolved) {
      await tx.insert(orderItems).values({
        orderId,
        productId: r.productId,
        variantId: r.variantId,
        productNameSnapshot: r.productName,
        variantNameSnapshot: r.variantName,
        brandSnapshot: r.brandName,
        skuSnapshot: r.sku,
        unitPriceTnd: r.unitPrice.toFixed(3),
        quantity: r.quantity,
        lineTotalTnd: r.lineTotal.toFixed(3),
      });

      await tx.insert(stockMovements).values({
        productId: r.variantId ? null : r.productId,
        variantId: r.variantId,
        type: "sale",
        quantity: -r.quantity,
        referenceType: "order",
        referenceId: orderId,
        notes: `walk-in ${formattedOrderNumber}`,
        performedBy: params.staffUserId,
      });

      await tx
        .update(inventory)
        .set({
          onHand: sql`${inventory.onHand} - ${r.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, r.inventoryRowId));
    }

    // 8. Two events: 'created' (null → pending) followed by 'confirmed'
    //    (pending → confirmed). The pair mirrors the storefront's regular
    //    pending → confirmed lifecycle so the history view reads the same.
    await tx.insert(orderEvents).values({
      orderId,
      eventType: "created",
      fromStatus: null,
      toStatus: "pending",
      performedBy: params.staffUserId,
    });
    await tx.insert(orderEvents).values({
      orderId,
      eventType: "confirmed",
      fromStatus: "pending",
      toStatus: "confirmed",
      performedBy: params.staffUserId,
    });

    // 9. Audit-log row inside the same tx so it rolls back on failure.
    await recordAudit(tx, {
      staffUserId: params.staffUserId,
      action: "order.create_walkin",
      entityType: "order",
      entityId: orderId,
      after: {
        orderNumber: formattedOrderNumber,
        totalTnd: total,
        lines: resolved.length,
      },
    });

    return { orderNumber: formattedOrderNumber, orderId };
  });
}

/* -------------------------------------------------------------------------- */
/* createWalkInOrderAction — server-action wrapper.                          */
/* Bound directly to <form action>; redirects to the new order on success.   */
/* -------------------------------------------------------------------------- */

export async function createWalkInOrderAction(formData: FormData): Promise<void> {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");
  if (!ALLOWED_ROLES.includes(session.role)) throw new Error("Forbidden");

  // Reassemble the dynamic line items from `lines[i].productId`,
  // `lines[i].variantId`, `lines[i].quantity` form fields. The client
  // form serialises one set per line at increasing indices.
  const lines: WalkInLineInput[] = [];
  for (let i = 0; ; i++) {
    const productId = formData.get(`lines[${i}].productId`);
    if (productId == null) break;
    const variantId = formData.get(`lines[${i}].variantId`);
    const quantity = formData.get(`lines[${i}].quantity`);
    lines.push({
      productId: String(productId),
      variantId: variantId ? String(variantId) : null,
      quantity: Number(quantity),
    });
  }

  const customerIdRaw = formData.get("customerId");
  const guestFullName = formData.get("guestFullName");
  const guestPhone = formData.get("guestPhone");
  const notesInternal = formData.get("notesInternal");

  const parsed = WalkInOrderSchema.safeParse({
    customerId: customerIdRaw ? String(customerIdRaw) : null,
    guestFullName: guestFullName ? String(guestFullName) : null,
    guestPhone: guestPhone ? String(guestPhone) : null,
    notesInternal: notesInternal ? String(notesInternal) : null,
    lines,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    throw new Error(
      flat.formErrors[0] ?? Object.values(flat.fieldErrors).flat()[0] ?? "Saisie invalide",
    );
  }

  const { orderNumber } = await createWalkInOrderCore(db(), {
    staffUserId: session.authUserId,
    role: session.role,
    customerId: parsed.data.customerId ?? null,
    guestFullName: parsed.data.guestFullName ?? null,
    guestPhone: parsed.data.guestPhone ?? null,
    notesInternal: parsed.data.notesInternal ?? null,
    lines: parsed.data.lines,
  });

  revalidatePath("/commandes");
  revalidatePath("/stock");
  revalidatePath("/");
  redirect(`/commandes/${orderNumber}`);
}

/* -------------------------------------------------------------------------- */
/* searchProductsForWalkInAction                                              */
/*                                                                            */
/* Top-8 matches over published products (by name / sku) joined to inventory  */
/* so the form can disable lines that are out of stock client-side.           */
/* -------------------------------------------------------------------------- */

export interface WalkInProductHit {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  unitPrice: number;
  onHand: number;
}

export async function searchProductsForWalkInAction(
  formData: FormData,
): Promise<WalkInProductHit[]> {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");
  if (!ALLOWED_ROLES.includes(session.role)) throw new Error("Forbidden");

  const q = String(formData.get("q") ?? "").trim();
  if (q.length < 2) return [];

  const url = process.env.SUPABASE_DB_URL;
  if (!url) return [];
  const database = createClient(url);

  const like = `%${q}%`;

  // Flat (non-variant) products + their inventory. We deliberately exclude
  // variant products here; supporting variants in the form is a follow-up.
  const rows = await database
    .select({
      productId: products.id,
      name: products.name,
      sku: products.sku,
      unitPrice: products.priceTnd,
      onHand: inventory.onHand,
    })
    .from(products)
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(
      and(
        eq(products.isPublished, true),
        eq(products.hasVariants, false),
        or(ilike(products.name, like), ilike(products.sku, like)) ?? sql`true`,
      ),
    )
    .limit(8);

  return rows.map((r) => ({
    productId: r.productId,
    variantId: null,
    name: r.name,
    sku: r.sku ?? "",
    unitPrice: Number(r.unitPrice ?? 0),
    onHand: r.onHand ?? 0,
  }));
}

/* -------------------------------------------------------------------------- */
/* searchCustomersForWalkInAction                                             */
/*                                                                            */
/* Top-8 matches over `customers` for the registered-customer typeahead.      */
/* Matches against email, full_name, or phone (ILIKE).                        */
/* -------------------------------------------------------------------------- */

export interface WalkInCustomerHit {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
}

export async function searchCustomersForWalkInAction(
  formData: FormData,
): Promise<WalkInCustomerHit[]> {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");
  if (!ALLOWED_ROLES.includes(session.role)) throw new Error("Forbidden");

  const q = String(formData.get("q") ?? "").trim();
  if (q.length < 2) return [];

  const url = process.env.SUPABASE_DB_URL;
  if (!url) return [];
  const database = createClient(url);

  const like = `%${q}%`;
  const rows = await database
    .select({
      id: customers.id,
      email: customers.email,
      fullName: customers.fullName,
      phone: customers.phone,
    })
    .from(customers)
    .where(
      or(
        ilike(customers.email, like),
        ilike(customers.fullName, like),
        ilike(customers.phone, like),
      ),
    )
    .limit(8);

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.fullName,
    phone: r.phone,
  }));
}
