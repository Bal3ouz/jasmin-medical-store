import { z } from "zod";

export const InventoryAdjustSchema = z
  .object({
    productId: z.string().uuid().optional().nullable(),
    variantId: z.string().uuid().optional().nullable(),
    delta: z.coerce
      .number()
      .int()
      .refine((n) => n !== 0, "Delta non nul"),
    reason: z.string().min(2).max(280),
  })
  .refine((v) => Boolean(v.productId) !== Boolean(v.variantId), "Cible: productId XOR variantId");
export type InventoryAdjustInput = z.infer<typeof InventoryAdjustSchema>;
