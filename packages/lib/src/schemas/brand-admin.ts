import { z } from "zod";

const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .min(2)
  .max(80);

export const BrandCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug,
  description: z.string().max(2000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
});
export type BrandCreateInput = z.infer<typeof BrandCreateSchema>;

export const BrandUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  slug: slug.optional(),
  description: z.string().max(2000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
});
export type BrandUpdateInput = z.infer<typeof BrandUpdateSchema>;
