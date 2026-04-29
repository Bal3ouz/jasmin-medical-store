import { desc, eq, inArray } from "drizzle-orm";
import type { Database } from "../client";
import { type Order, type OrderItem, orderItems, orders } from "../schema";

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

export async function getCustomerOrders(
  db: Database,
  customerId: string,
): Promise<OrderWithItems[]> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));

  const byOrder = new Map<string, OrderItem[]>();
  for (const it of allItems) {
    if (!byOrder.has(it.orderId)) byOrder.set(it.orderId, []);
    byOrder.get(it.orderId)!.push(it);
  }
  return orderRows.map((o) => ({ order: o, items: byOrder.get(o.id) ?? [] }));
}

export async function getOrderByNumber(
  db: Database,
  orderNumber: string,
): Promise<OrderWithItems | null> {
  const orderRow = (await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)))[0];
  if (!orderRow) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderRow.id));
  return { order: orderRow, items };
}
