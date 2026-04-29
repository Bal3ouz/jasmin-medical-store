import { AdminShell } from "@/components/AdminShell";
import { getStaffSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AuthedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  return <AdminShell session={session}>{children}</AdminShell>;
}
