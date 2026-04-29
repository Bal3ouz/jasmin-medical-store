import { z } from "zod";

export const OrderTransitionSchema = z.object({
  orderId: z.string().uuid(),
  toStatus: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  note: z.string().max(500).optional().nullable(),
});
export type OrderTransitionInput = z.infer<typeof OrderTransitionSchema>;
