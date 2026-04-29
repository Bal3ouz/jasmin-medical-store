import { type SQL, and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  type Customer,
  type Order,
  type OrderEvent,
  type OrderItem,
  customers,
  orderEvents,
  orderItems,
  orders,
} from "../schema";

/* -------------------------------------------------------------------------- */
/* listOrdersForAdmin                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Sort tokens accepted by `listOrdersForAdmin`. Whitelisted (we never pass a
 * raw search-param into the query) so the page can forward arbitrary query
 * strings without risking arbitrary column ordering.
 */
export type AdminOrderSort =
  | "createdAt"
  | "-createdAt"
  | "totalTnd"
  | "-totalTnd"
  | "orderNumber"
  | "-orderNumber";

/**
 * Order status values mirror the `order_status` enum. We re-declare here as a
 * string union because the queries module can't depend on `@jasmin/lib` (db
 * is the lower-level package in the dependency graph) and Drizzle's enum type
 * isn't trivially exportable from `_enums.ts` as a TS literal union.
 */
export type AdminOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface ListOrdersForAdminParams {
  status?: AdminOrderStatus;
  search?: string;
  page: number;
  limit: number;
  sort?: AdminOrderSort;
}

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: AdminOrderStatus;
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  totalTnd: string;
  shippingFullName: string;
  customerEmail: string | null;
  customerFullName: string | null;
  guestEmail: string | null;
  createdAt: Date;
}

/**
 * Admin-side orders listing.
 *
 * Status filter is exact match. Search runs ILIKE against `order_number`,
 * customer email, and `shipping_full_name` so staff can paste either the
 * order code (e.g. `JMS-2026-0001`) or a partial customer identifier.
 *
 * Sort whitelist is explicit so an attacker can't coerce ordering by an
 * unrelated column via `?sort=...`.
 */
export async function listOrdersForAdmin(
  db: Database,
  p: ListOrdersForAdminParams,
): Promise<{ rows: AdminOrderRow[]; total: number }> {
  const conditions: SQL[] = [];
  if (p.status) {
    // The Drizzle `eq` against `orders.status` (a pgEnum column) wants the
    // literal string. Cast through unknown to satisfy the column's typed
    // value without leaking the union into this signature.
    conditions.push(eq(orders.status, p.status as Order["status"]));
  }
  if (p.search) {
    const like = `%${p.search}%`;
    const term = or(
      ilike(orders.orderNumber, like),
      ilike(orders.shippingFullName, like),
      ilike(customers.email, like),
      ilike(orders.guestEmail, like),
    );
    if (term) conditions.push(term);
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const sortMap = {
    createdAt: asc(orders.createdAt),
    "-createdAt": desc(orders.createdAt),
    totalTnd: asc(orders.totalTnd),
    "-totalTnd": desc(orders.totalTnd),
    orderNumber: asc(orders.orderNumber),
    "-orderNumber": desc(orders.orderNumber),
  } as const;
  const orderBy = sortMap[p.sort ?? "-createdAt"];

  const offset = (p.page - 1) * p.limit;

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalTnd: orders.totalTnd,
      shippingFullName: orders.shippingFullName,
      customerEmail: customers.email,
      customerFullName: customers.fullName,
      guestEmail: orders.guestEmail,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .where(where)
    .orderBy(orderBy)
    .limit(p.limit)
    .offset(offset);

  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .where(where);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      status: r.status as AdminOrderStatus,
      paymentStatus: r.paymentStatus as AdminOrderRow["paymentStatus"],
      totalTnd: r.totalTnd,
      shippingFullName: r.shippingFullName,
      customerEmail: r.customerEmail,
      customerFullName: r.customerFullName,
      guestEmail: r.guestEmail,
      createdAt: r.createdAt,
    })),
    total: totalRows[0]?.count ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/* getOrderForAdmin                                                           */
/* -------------------------------------------------------------------------- */

export interface AdminOrderDetail {
  order: Order;
  items: OrderItem[];
  events: OrderEvent[];
  customer: Customer | null;
}

/**
 * Full order detail keyed by `order_number`. Joins the customer profile when
 * the order is attached to a registered customer. Address snapshot fields
 * already live on the order itself, so we don't need to fetch the customer's
 * default address.
 *
 * Events are returned newest-first so the UI can render the timeline without
 * an extra sort pass.
 */
export async function getOrderForAdmin(
  db: Database,
  orderNumber: string,
): Promise<AdminOrderDetail | null> {
  const orderRow = (await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)))[0];
  if (!orderRow) return null;

  const [items, events, customerRow] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderRow.id)),
    db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, orderRow.id))
      .orderBy(desc(orderEvents.performedAt)),
    orderRow.customerId
      ? db.select().from(customers).where(eq(customers.id, orderRow.customerId))
      : Promise.resolve([] as Customer[]),
  ]);

  return {
    order: orderRow,
    items,
    events,
    customer: customerRow[0] ?? null,
  };
}
