import { z } from "zod";
import { StaffRoleSchema } from "./staff";

/**
 * Phase 3 staff-admin Zod schemas.
 *
 * Note: `StaffInviteSchema` already lives in `./staff` (Phase 2). This file
 * adds the role-update and active-toggle schemas used by the back-office
 * `/equipe` actions; the invite flow keeps using the canonical Phase-2 one.
 */
export const StaffUpdateRoleSchema = z.object({
  id: z.string().uuid(),
  role: StaffRoleSchema,
});
export type StaffUpdateRoleInput = z.infer<typeof StaffUpdateRoleSchema>;

export const StaffSetActiveSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});
export type StaffSetActiveInput = z.infer<typeof StaffSetActiveSchema>;
