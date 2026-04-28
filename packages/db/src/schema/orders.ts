import { pgTable, uuid, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { orderStatus, paymentStatus, paymentMethod } from "./_enums";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),

    shippingFullName: text("shipping_full_name").notNull(),
    shippingPhone: text("shipping_phone").notNull(),
    shippingStreet: text("shipping_street").notNull(),
    shippingCity: text("shipping_city").notNull(),
    shippingPostalCode: text("shipping_postal_code").notNull(),
    shippingGovernorate: text("shipping_governorate").notNull(),
    shippingCountry: text("shipping_country").notNull().default("TN"),

    subtotalTnd: numeric("subtotal_tnd", { precision: 10, scale: 3 }).notNull(),
    shippingTnd: numeric("shipping_tnd", { precision: 10, scale: 3 }).notNull().default("0"),
    discountTnd: numeric("discount_tnd", { precision: 10, scale: 3 }).notNull().default("0"),
    taxTnd: numeric("tax_tnd", { precision: 10, scale: 3 }).notNull().default("0"),
    totalTnd: numeric("total_tnd", { precision: 10, scale: 3 }).notNull(),

    status: orderStatus("status").notNull().default("pending"),
    paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
    paymentMethod: paymentMethod("payment_method"),

    notesCustomer: text("notes_customer"),
    notesInternal: text("notes_internal"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    index("orders_customer_idx").on(t.customerId, t.createdAt),
    index("orders_status_idx").on(t.status, t.createdAt),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
