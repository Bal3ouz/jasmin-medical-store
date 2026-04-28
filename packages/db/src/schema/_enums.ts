import { pgEnum } from "drizzle-orm/pg-core";

export const staffRole = pgEnum("staff_role", ["admin", "manager", "cashier", "stock"]);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "refunded", "failed"]);

export const paymentMethod = pgEnum("payment_method", [
  "cash_on_delivery",
  "card_konnect",
  "card_clic_to_pay",
  "bank_transfer",
]);

export const stockMovementType = pgEnum("stock_movement_type", [
  "purchase",
  "sale",
  "adjustment",
  "return",
  "transfer",
]);
