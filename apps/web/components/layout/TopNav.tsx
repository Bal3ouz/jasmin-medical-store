import { Logo } from "@jasmin/ui";
import { Search, User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { MobileMenu } from "./MobileMenu";

const NAV = [
  { href: "/boutique", label: "Boutique" },
  { href: "/boutique/cosmetique", label: "Cosmétique" },
  { href: "/boutique/orthopedie", label: "Orthopédie" },
  { href: "/boutique/materiel-medical", label: "Matériel médical" },
  { href: "/notre-histoire", label: "Notre histoire" },
  { href: "/contact", label: "Contact" },
] as const;

export interface TopNavProps {
  variant?: "cream" | "default";
  CartDrawerSlot: ReactNode;
}

export function TopNav({ variant = "default", CartDrawerSlot }: TopNavProps) {
  const isOnTeal = variant === "cream";
  return (
    <header
      className={
        isOnTeal
          ? "absolute inset-x-0 top-0 z-30 px-6 py-6 lg:px-12"
          : "sticky top-0 z-30 border-b border-linen bg-cream-sand/90 px-6 py-4 backdrop-blur lg:px-12"
      }
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6">
        <Link href="/" aria-label="Accueil" className="shrink-0">
          <Logo variant={isOnTeal ? "cream" : "default"} size="md" />
        </Link>
        <nav
          aria-label="Navigation principale"
          className={`hidden items-center gap-7 font-[var(--font-label)] text-sm tracking-wide lg:flex ${isOnTeal ? "text-cream-sand/90" : "text-warm-taupe"}`}
        >
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-jasmine">
              {item.label}
            </Link>
          ))}
        </nav>
        <div
          className={`flex items-center gap-2 ${isOnTeal ? "text-cream-sand" : "text-warm-taupe"}`}
        >
          <button
            type="button"
            aria-label="Rechercher"
            className="hidden h-10 w-10 items-center justify-center rounded-pill transition-colors hover:bg-linen/40 lg:inline-flex"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/compte"
            aria-label="Mon compte"
            className="hidden h-10 w-10 items-center justify-center rounded-pill transition-colors hover:bg-linen/40 lg:inline-flex"
          >
            <User className="h-5 w-5" />
          </Link>
          {CartDrawerSlot}
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
