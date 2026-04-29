import type { StaffSession } from "@/lib/auth";
import { Logo, Pill } from "@jasmin/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "./SignOutButton";

const ROLE_LABEL: Record<StaffSession["role"], string> = {
  admin: "Administrateur",
  manager: "Manager",
  cashier: "Caisse",
  stock: "Stock",
};

interface NavItem {
  href: string;
  label: string;
  visibleTo: StaffSession["role"][];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Tableau de bord",
    visibleTo: ["admin", "manager", "cashier", "stock"],
  },
  {
    href: "/catalogue/produits",
    label: "Catalogue",
    visibleTo: ["admin", "manager", "cashier", "stock"],
  },
  { href: "/stock", label: "Stock", visibleTo: ["admin", "manager", "stock"] },
  {
    href: "/commandes",
    label: "Commandes",
    visibleTo: ["admin", "manager", "cashier"],
  },
  {
    href: "/clients",
    label: "Clients",
    visibleTo: ["admin", "manager", "cashier"],
  },
  { href: "/equipe", label: "Équipe", visibleTo: ["admin"] },
  { href: "/audit", label: "Audit", visibleTo: ["admin"] },
  { href: "/decisionnel", label: "Décisionnel", visibleTo: ["admin", "manager"] },
  {
    href: "/compte",
    label: "Mon compte",
    visibleTo: ["admin", "manager", "cashier", "stock"],
  },
];

export function AdminShell({
  session,
  children,
}: {
  session: StaffSession;
  children: ReactNode;
}) {
  const visible = NAV_ITEMS.filter((i) => i.visibleTo.includes(session.role));
  return (
    <div className="min-h-screen bg-cream-sand">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-linen border-r bg-cream-sand/60 px-6 py-8 lg:flex">
        <Logo />
        <nav className="mt-12 flex flex-col gap-1 text-sm">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-warm-taupe hover:bg-linen hover:text-deep-teal"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:ml-64">
        <header className="flex items-center justify-end gap-4 border-linen border-b px-8 py-4">
          <span className="text-sm text-warm-taupe-soft">{session.fullName}</span>
          <Pill tone="teal">{ROLE_LABEL[session.role]}</Pill>
          <SignOutButton />
        </header>
        <div className="px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
