import { boolean, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { productVariants } from "./product-variants";
import { products } from "./products";

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull(),
    altText: text("alt_text"),
    displayOrder: integer("display_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
