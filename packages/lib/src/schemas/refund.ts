import { z } from "zod";

export const RefundOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().max(500).optional().nullable(),
});
export type RefundOrderInput = z.infer<typeof RefundOrderSchema>;
