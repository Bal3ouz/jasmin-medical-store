import { NewsletterSignup } from "@/components/marketing/NewsletterSignup";
import { JasmineSprig, Logo } from "@jasmin/ui";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-linen bg-linen/40 px-6 pb-10 pt-16 lg:px-12">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo size="md" />
          <p className="max-w-xs font-[var(--font-body)] text-sm leading-[1.6] text-warm-taupe-soft">
            Parapharmacie & matériel médical sélectionné avec amour à Nabeul. Ouvert du lundi au
            samedi.
          </p>
          <JasmineSprig className="h-12 w-12 text-jasmine/60" />
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
      <div className="mx-auto mt-12 flex max-w-[1400px] flex-col items-start justify-between gap-2 border-t border-linen pt-6 text-xs text-warm-taupe-soft sm:flex-row sm:items-center">
        <span>
          © {new Date().getFullYear()} Jasmin Médical Store · 111 Av. Hedi Nouira, 8000 Nabeul
        </span>
        <span>+216 72 289 900 · jasmin.medicalstore@yahoo.com</span>
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
      <h3 className="font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-deep-teal">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 font-[var(--font-body)] text-sm text-warm-taupe">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="transition-colors hover:text-deep-teal">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
