import { type SQL, and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  type Customer,
  type CustomerAddress,
  customerAddresses,
  customers,
  orders,
} from "../schema";

/**
 * Sort tokens accepted by `listCustomersForAdmin`. Whitelisted so a hostile
 * `?sort=` value can't reorder by an unrelated column.
 */
export type AdminCustomerSort = "createdAt" | "-createdAt" | "fullName" | "-fullName";

export interface ListCustomersForAdminParams {
  search?: string;
  cohort?: string; // 'YYYY-MM' — filter by first-order month
  page: number;
  limit: number;
  sort?: AdminCustomerSort;
}

export interface AdminCustomerRow {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: Date;
}

/**
 * Admin-side customer listing.
 *
 * Search runs ILIKE against email, full_name, and phone — staff often paste
 * a partial phone number from a phone call; ILIKE on all three keeps the
 * lookup ergonomic without dragging an FTS column into the customer table.
 */
export async function listCustomersForAdmin(
  db: Database,
  p: ListCustomersForAdminParams,
): Promise<{ rows: AdminCustomerRow[]; total: number }> {
  const conditions: SQL[] = [];
  if (p.search) {
    const like = `%${p.search}%`;
    const term = or(
      ilike(customers.email, like),
      ilike(customers.fullName, like),
      ilike(customers.phone, like),
    );
    if (term) conditions.push(term);
  }

  if (p.cohort) {
    // YYYY-MM format. Filter customers whose first-order month equals the cohort.
    conditions.push(sql`
      date_trunc('month',
        (SELECT MIN(o2.created_at) FROM orders o2
         WHERE o2.customer_id = ${customers.id}
           AND o2.status NOT IN ('cancelled','refunded'))
      ) = ${`${p.cohort}-01`}::date
    `);
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const sortMap = {
    createdAt: asc(customers.createdAt),
    "-createdAt": desc(customers.createdAt),
    fullName: asc(customers.fullName),
    "-fullName": desc(customers.fullName),
  } as const;
  const orderBy = sortMap[p.sort ?? "-createdAt"];

  const offset = (p.page - 1) * p.limit;

  const rows = await db
    .select({
      id: customers.id,
      email: customers.email,
      fullName: customers.fullName,
      phone: customers.phone,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(where)
    .orderBy(orderBy)
    .limit(p.limit)
    .offset(offset);

  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(where);

  return {
    rows,
    total: totalRows[0]?.count ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/* getCustomerForAdmin                                                        */
/* -------------------------------------------------------------------------- */

export interface AdminCustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalTnd: string;
  createdAt: Date;
}

export interface AdminCustomerDetail {
  customer: Customer;
  addresses: CustomerAddress[];
  orders: AdminCustomerOrder[];
}

/**
 * Single-customer view for the admin profile page.
 *
 * Joins the addresses book (read-only here — addresses are managed by the
 * customer in the storefront account area) and the last 20 orders so the
 * staff has the most-recent activity inline without a second click.
 */
export async function getCustomerForAdmin(
  db: Database,
  id: string,
): Promise<AdminCustomerDetail | null> {
  const rows = await db.select().from(customers).where(eq(customers.id, id));
  const customer = rows[0];
  if (!customer) return null;

  const [addresses, last20Orders] = await Promise.all([
    db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, id))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt)),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalTnd: orders.totalTnd,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt))
      .limit(20),
  ]);

  return {
    customer,
    addresses,
    orders: last20Orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status as string,
      paymentStatus: o.paymentStatus as string,
      totalTnd: o.totalTnd,
      createdAt: o.createdAt,
    })),
  };
}
