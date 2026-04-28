import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { brands } from "./brands";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    ingredients: text("ingredients"),
    usage: text("usage"),
    hasVariants: boolean("has_variants").notNull().default(false),
    sku: text("sku").unique(),
    priceTnd: numeric("price_tnd", { precision: 10, scale: 3 }),
    compareAtPriceTnd: numeric("compare_at_price_tnd", { precision: 10, scale: 3 }),
    weightG: integer("weight_g"),
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_brand_idx").on(t.brandId),
    index("products_category_idx").on(t.categoryId),
    index("products_published_idx").on(t.isPublished),
    check(
      "products_variant_or_flat_chk",
      sql`(${t.hasVariants} = true AND ${t.sku} IS NULL AND ${t.priceTnd} IS NULL)
       OR (${t.hasVariants} = false AND ${t.sku} IS NOT NULL AND ${t.priceTnd} IS NOT NULL)`,
    ),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
