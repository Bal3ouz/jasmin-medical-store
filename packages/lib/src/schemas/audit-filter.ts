import { z } from "zod";

export const AuditFilterSchema = z.object({
  entityType: z.string().max(40).optional().nullable(),
  action: z.string().max(80).optional().nullable(),
  staffUserId: z.string().uuid().optional().nullable(),
  dateFrom: z.string().datetime().optional().nullable(),
  dateTo: z.string().datetime().optional().nullable(),
  cursor: z.string().optional().nullable(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type AuditFilterInput = z.infer<typeof AuditFilterSchema>;
