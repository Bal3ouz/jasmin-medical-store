import { getStaffSession } from "@/lib/auth";
import type { StaffRole } from "@jasmin/lib";
import type { ReactNode } from "react";

export async function RoleGate({
  roles,
  children,
}: {
  roles: StaffRole[];
  children: ReactNode;
}) {
  const session = await getStaffSession();
  if (!session || !roles.includes(session.role)) return null;
  return <>{children}</>;
}
