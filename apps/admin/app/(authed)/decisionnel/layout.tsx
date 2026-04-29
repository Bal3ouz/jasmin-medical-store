import { getStaffSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DecisionnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (!["admin", "manager"].includes(session.role)) redirect("/");
  return <>{children}</>;
}
