import { z } from "zod";

export const WalkInOrderSchema = z
  .object({
    customerId: z.string().uuid().optional().nullable(),
    guestFullName: z.string().max(160).optional().nullable(),
    guestPhone: z.string().max(40).optional().nullable(),
    notesInternal: z.string().max(2000).optional().nullable(),
    lines: z
      .array(
        z.object({
          productId: z.string().uuid(),
          variantId: z.string().uuid().optional().nullable(),
          quantity: z.coerce.number().int().positive(),
        }),
      )
      .min(1),
  })
  .refine(
    (v) => Boolean(v.customerId) !== (Boolean(v.guestFullName) && Boolean(v.guestPhone)),
    "Soit un client enregistré, soit nom + téléphone d'un invité.",
  );
export type WalkInOrderInput = z.infer<typeof WalkInOrderSchema>;
