import { z } from "zod";

const uuid = z.string().uuid();
const tndAmount = z
  .string()
  .regex(/^\d+\.\d{3}$/, "TND amount must be string with 3 decimals (millimes)");

export const ProductInsertSchema = z
  .object({
    slug: z.string().min(1).max(160),
    name: z.string().min(1).max(200),
    brandId: uuid,
    categoryId: uuid,
    shortDescription: z.string().min(1).max(500),
    description: z.string().min(1),
    ingredients: z.string().optional().nullable(),
    usage: z.string().optional().nullable(),
    hasVariants: z.boolean(),
    sku: z.string().min(1).max(64).optional().nullable(),
    priceTnd: tndAmount.optional().nullable(),
    compareAtPriceTnd: tndAmount.optional().nullable(),
    weightG: z.number().int().nonnegative().optional().nullable(),
    isPublished: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    metaTitle: z.string().max(200).optional().nullable(),
    metaDescription: z.string().max(500).optional().nullable(),
  })
  .refine(
    (p) => (p.hasVariants && !p.sku && !p.priceTnd) || (!p.hasVariants && !!p.sku && !!p.priceTnd),
    { message: "When hasVariants=false sku+priceTnd required; when true they must be omitted" },
  );

export type ProductInsert = z.infer<typeof ProductInsertSchema>;
