import { z } from "zod";

const uuid = z.string().uuid();
const tndAmount = z.string().regex(/^\d+\.\d{3}$/);
const tunisianPhone = z
  .string()
  .regex(/^(\+216)?\s?\d{2}\s?\d{3}\s?\d{3}$/, "Numéro de téléphone invalide");

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: tunisianPhone,
  street: z.string().min(3).max(200),
  city: z.string().min(1).max(80),
  postalCode: z.string().min(4).max(10),
  governorate: z.string().min(1).max(80),
  country: z.string().default("TN"),
});
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

export const OrderItemDraftSchema = z.object({
  productId: uuid,
  variantId: uuid.optional().nullable(),
  quantity: z.number().int().positive(),
});
export type OrderItemDraft = z.infer<typeof OrderItemDraftSchema>;

export const CheckoutSchema = z
  .object({
    customerId: uuid.optional().nullable(),
    guestEmail: z.string().email().optional().nullable(),
    guestPhone: tunisianPhone.optional().nullable(),
    shipping: ShippingAddressSchema,
    items: z.array(OrderItemDraftSchema).min(1),
    paymentMethod: z.literal("cash_on_delivery").default("cash_on_delivery"),
    notesCustomer: z.string().max(500).optional().nullable(),
  })
  .refine((c) => !!c.customerId || (!!c.guestEmail && !!c.guestPhone), {
    message: "Guest checkout requires both email and phone",
  });
export type Checkout = z.infer<typeof CheckoutSchema>;

export const OrderTotalsSchema = z.object({
  subtotalTnd: tndAmount,
  shippingTnd: tndAmount,
  discountTnd: tndAmount,
  taxTnd: tndAmount,
  totalTnd: tndAmount,
});
export type OrderTotals = z.infer<typeof OrderTotalsSchema>;
