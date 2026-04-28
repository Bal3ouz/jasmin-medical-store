import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("carts_customer_unique").on(t.customerId),
    unique("carts_session_unique").on(t.sessionId),
  ],
);

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
