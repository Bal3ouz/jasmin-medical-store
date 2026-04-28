import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { stockMovementType } from "./_enums";
import { productVariants } from "./product-variants";
import { products } from "./products";

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    type: stockMovementType("type").notNull(),
    quantity: integer("quantity").notNull(),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    notes: text("notes"),
    performedBy: uuid("performed_by"),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("stock_movements_product_idx").on(t.productId, t.performedAt),
    index("stock_movements_variant_idx").on(t.variantId, t.performedAt),
  ],
);

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
