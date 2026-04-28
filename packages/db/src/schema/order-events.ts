import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orderStatus } from "./_enums";
import { orders } from "./orders";

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status"),
    notes: text("notes"),
    performedBy: uuid("performed_by"),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId, t.performedAt)],
);

export type OrderEvent = typeof orderEvents.$inferSelect;
export type NewOrderEvent = typeof orderEvents.$inferInsert;
