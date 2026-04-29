import { z } from "zod";

const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .min(2)
  .max(80);

export const CategoryCreateSchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
  slug,
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  heroImageUrl: z.string().url().optional().nullable(),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
});
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().optional().nullable(),
  slug: slug.optional(),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  heroImageUrl: z.string().url().optional().nullable(),
  displayOrder: z.coerce.number().int().nonnegative().optional(),
});
export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>;

export const CategoryReorderSchema = z.object({
  parentId: z.string().uuid().nullable(),
  orderedIds: z.array(z.string().uuid()).min(1),
});
export type CategoryReorderInput = z.infer<typeof CategoryReorderSchema>;
