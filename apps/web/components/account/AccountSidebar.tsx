import { signOutAction } from "@/app/actions/auth";
import Link from "next/link";

const LINKS = [
  { href: "/compte", label: "Tableau de bord" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/compte/adresses", label: "Mes adresses" },
] as const;

export function AccountSidebar({ email }: { email: string }) {
  return (
    <aside className="space-y-6">
      <div className="rounded-lg bg-linen/60 p-5">
        <p className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
          Connecté en tant que
        </p>
        <p className="mt-1 font-[var(--font-body)] text-sm text-warm-taupe">{email}</p>
      </div>
      <nav>
        <ul className="space-y-1 font-[var(--font-body)] text-sm text-warm-taupe">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-md px-4 py-2 transition-colors hover:bg-linen/60 hover:text-deep-teal"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <form action={signOutAction}>
        <button
          type="submit"
          className="font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-warm-taupe-soft transition-colors hover:text-deep-teal"
        >
          Se déconnecter
        </button>
      </form>
    </aside>
  );
}
