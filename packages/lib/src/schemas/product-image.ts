import { z } from "zod";

export const ProductImageUploadSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  altText: z.string().max(160).optional().nullable(),
  isPrimary: z.boolean().default(false),
  // file is validated separately in the action (size + mime)
});
export type ProductImageUploadInput = z.infer<typeof ProductImageUploadSchema>;

export const ProductImageReorderSchema = z.object({
  productId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
});
export type ProductImageReorderInput = z.infer<typeof ProductImageReorderSchema>;
