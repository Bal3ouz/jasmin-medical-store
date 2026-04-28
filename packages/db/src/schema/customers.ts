import { pgTable, uuid, text, boolean, timestamp, date } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  newsletterSubscribed: boolean("newsletter_subscribed").notNull().default(false),
  defaultShippingAddressId: uuid("default_shipping_address_id"),
  defaultBillingAddressId: uuid("default_billing_address_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
