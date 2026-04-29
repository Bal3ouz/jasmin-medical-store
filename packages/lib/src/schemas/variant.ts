import { z } from "zod";

const tnd = z.coerce.number().nonnegative().multipleOf(0.001);

export const VariantCreateSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  priceTnd: tnd,
  compareAtPriceTnd: tnd.optional().nullable(),
  weightG: z.coerce.number().int().nonnegative().optional().nullable(),
  isDefault: z.boolean().default(false),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
});
export type VariantCreateInput = z.infer<typeof VariantCreateSchema>;

export const VariantUpdateSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(1).max(64).optional(),
  name: z.string().min(1).max(120).optional(),
  priceTnd: tnd.optional(),
  compareAtPriceTnd: tnd.optional().nullable(),
  weightG: z.coerce.number().int().nonnegative().optional().nullable(),
  isDefault: z.boolean().optional(),
  displayOrder: z.coerce.number().int().nonnegative().optional(),
});
export type VariantUpdateInput = z.infer<typeof VariantUpdateSchema>;

export const VariantSetDefaultSchema = z.object({ id: z.string().uuid() });
export type VariantSetDefaultInput = z.infer<typeof VariantSetDefaultSchema>;
