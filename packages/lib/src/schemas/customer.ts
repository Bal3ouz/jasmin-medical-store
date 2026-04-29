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

/**
 * Phase 3 admin-side customer update.
 *
 * Limits intentionally wider than the storefront `CustomerProfileSchema`
 * (160 vs 120 for fullName, 40 vs 20 for phone) — staff occasionally type
 * formatted variants ("M. Ben Salem (père)") or international numbers
 * with prefixes that exceed the store's own form. Email is **never**
 * updated from this surface; that field is owned by Supabase Auth.
 */
export const AdminCustomerUpdateSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1).max(160),
  phone: z
    .string()
    .max(40)
    .optional()
    .nullable()
    .transform((v) => (v === undefined || v === null || v.trim() === "" ? null : v.trim())),
});
export type AdminCustomerUpdate = z.infer<typeof AdminCustomerUpdateSchema>;
