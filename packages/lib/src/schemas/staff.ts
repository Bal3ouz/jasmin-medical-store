import { z } from "zod";

export const StaffRoleSchema = z.enum(["admin", "manager", "cashier", "stock"]);
export type StaffRole = z.infer<typeof StaffRoleSchema>;

export const StaffInviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  role: StaffRoleSchema,
});
export type StaffInvite = z.infer<typeof StaffInviteSchema>;
