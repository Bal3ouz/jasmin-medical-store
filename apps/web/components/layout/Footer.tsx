import { NewsletterSignup } from "@/components/marketing/NewsletterSignup";
import { JasmineSprig, Logo } from "@jasmin/ui";
import { Lock } from "lucide-react";
import Link from "next/link";

// Read at request time (server component) — `NEXT_PUBLIC_*` vars are inlined
// at build time, which would bake "localhost" into the production bundle.
function staffUrl() {
  return (
    process.env.ADMIN_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    "http://localhost:3001/login"
  );
}

export function Footer() {
  const STAFF_URL = staffUrl();
  return (
    <footer className="bg-deep-teal px-6 pb-10 pt-16 text-cream-sand lg:px-12">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo size="md" />
          <p className="max-w-xs font-[var(--font-body)] text-cream-sand/70 text-sm leading-[1.6]">
            Parapharmacie & matériel médical sélectionné avec amour à Nabeul. Ouvert du lundi au
            samedi.
          </p>
          <JasmineSprig className="h-12 w-12 text-jasmine/70" />
        </div>
        <FooterColumn
          title="Boutique"
          links={[
            { href: "/boutique/cosmetique", label: "Cosmétique" },
            { href: "/boutique/orthopedie", label: "Orthopédie" },
            { href: "/boutique/materiel-medical", label: "Matériel médical" },
            { href: "/boutique/parapharmacie", label: "Parapharmacie" },
          ]}
        />
        <FooterColumn
          title="Maison"
          links={[
            { href: "/notre-histoire", label: "Notre histoire" },
            { href: "/contact", label: "Contact" },
            { href: "/cgv", label: "CGV" },
            { href: "/mentions-legales", label: "Mentions légales" },
            { href: "/confidentialite", label: "Confidentialité" },
          ]}
        />
        <div>
          <NewsletterSignup source="footer" />
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-[1400px] flex-col items-start justify-between gap-3 border-t border-cream-sand/15 pt-6 text-cream-sand/60 text-xs sm:flex-row sm:items-center">
        <span>
          © {new Date().getFullYear()} Jasmin Médical Store · 111 Av. Hedi Nouira, 8000 Nabeul
        </span>
        <div className="flex items-center gap-4">
          <span>+216 72 289 900 · jasmin.medicalstore@yahoo.com</span>
          <a
            href={STAFF_URL}
            className="inline-flex items-center gap-1.5 text-cream-sand/45 transition-colors hover:text-jasmine"
            aria-label="Espace équipe"
            title="Connexion réservée à l'équipe Jasmin"
          >
            <Lock className="h-3 w-3" aria-hidden />
            <span className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em]">
              Espace équipe
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="font-[var(--font-label)] text-jasmine text-xs uppercase tracking-[0.24em]">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 font-[var(--font-body)] text-cream-sand/85 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="transition-colors hover:text-jasmine">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
