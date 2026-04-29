import { z } from "zod";

const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/, "slug invalide")
  .min(2)
  .max(120);

const tnd = z.coerce.number().nonnegative().multipleOf(0.001);

export const ProductCreateSchema = z
  .object({
    name: z.string().min(2).max(180),
    slug,
    brandId: z.string().uuid(),
    categoryId: z.string().uuid(),
    shortDescription: z.string().max(280).optional().nullable(),
    description: z.string().max(8000).optional().nullable(),
    ingredients: z.string().max(4000).optional().nullable(),
    usage: z.string().max(4000).optional().nullable(),
    hasVariants: z.boolean().default(false),
    sku: z.string().max(64).optional().nullable(),
    priceTnd: tnd.optional().nullable(),
    compareAtPriceTnd: tnd.optional().nullable(),
    weightG: z.coerce.number().int().nonnegative().optional().nullable(),
    isPublished: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    metaTitle: z.string().max(160).optional().nullable(),
    metaDescription: z.string().max(280).optional().nullable(),
    additionalCategoryIds: z.array(z.string().uuid()).optional().default([]),
  })
  .superRefine((v, ctx) => {
    if (!v.hasVariants) {
      if (!v.sku)
        ctx.addIssue({
          code: "custom",
          path: ["sku"],
          message: "SKU requis pour produit sans déclinaison",
        });
      if (v.priceTnd === null || v.priceTnd === undefined)
        ctx.addIssue({ code: "custom", path: ["priceTnd"], message: "Prix requis" });
    }
  });

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;

export const ProductUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(180).optional(),
  slug: slug.optional(),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  shortDescription: z.string().max(280).optional().nullable(),
  description: z.string().max(8000).optional().nullable(),
  ingredients: z.string().max(4000).optional().nullable(),
  usage: z.string().max(4000).optional().nullable(),
  hasVariants: z.boolean().optional(),
  sku: z.string().max(64).optional().nullable(),
  priceTnd: tnd.optional().nullable(),
  compareAtPriceTnd: tnd.optional().nullable(),
  weightG: z.coerce.number().int().nonnegative().optional().nullable(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(160).optional().nullable(),
  metaDescription: z.string().max(280).optional().nullable(),
  additionalCategoryIds: z.array(z.string().uuid()).optional(),
});
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;

export const ProductPublishSchema = z.object({
  id: z.string().uuid(),
  isPublished: z.boolean(),
});
export type ProductPublishInput = z.infer<typeof ProductPublishSchema>;

export const ProductDuplicateSchema = z.object({ id: z.string().uuid() });
export type ProductDuplicateInput = z.infer<typeof ProductDuplicateSchema>;
