import { index, integer, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { productVariants } from "./product-variants";
import { products } from "./products";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "restrict" }),

    productNameSnapshot: text("product_name_snapshot").notNull(),
    variantNameSnapshot: text("variant_name_snapshot"),
    brandSnapshot: text("brand_snapshot").notNull(),
    skuSnapshot: text("sku_snapshot").notNull(),

    unitPriceTnd: numeric("unit_price_tnd", { precision: 10, scale: 3 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalTnd: numeric("line_total_tnd", { precision: 10, scale: 3 }).notNull(),
  },
  (t) => [
    index("order_items_product_idx").on(t.productId),
    index("order_items_variant_idx").on(t.variantId),
  ],
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
