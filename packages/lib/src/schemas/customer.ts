import { z } from "zod";

export const CustomerProfileSchema = z.object({
  fullName: z.string().min(1).max(120).nullable().optional(),
  phone: z.string().min(8).max(20).nullable().optional(),
  dateOfBirth: z.string().date().nullable().optional(),
  marketingConsent: z.boolean().default(false),
  newsletterSubscribed: z.boolean().default(false),
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

export const NewsletterSubscribeSchema = z.object({
  email: z.string().email(),
  source: z.enum(["footer", "popup", "checkout", "landing_hero"]).optional(),
});
export type NewsletterSubscribe = z.infer<typeof NewsletterSubscribeSchema>;
