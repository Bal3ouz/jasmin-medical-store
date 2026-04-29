import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { AiryContainer, BodyText, H1Editorial, LabelEyebrow } from "@jasmin/ui";

export const revalidate = 86400;

export default function ContactPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2">
          <div>
            <LabelEyebrow>Contact</LabelEyebrow>
            <H1Editorial className="mt-6 text-deep-teal text-5xl">Venez nous rendre visite.</H1Editorial>
            <BodyText className="mt-6 max-w-xl">
              Notre équipe vous accueille du lundi au samedi pour répondre à vos questions et vous
              accompagner dans votre routine bien-être.
            </BodyText>
            <ul className="mt-10 space-y-5 font-[var(--font-body)] text-sm text-warm-taupe">
              <Info icon={<MapPin className="h-5 w-5" />} title="Adresse">
                111 Av. Hedi Nouira, 8000 Nabeul (en face Clinique El Amen)
              </Info>
              <Info icon={<Phone className="h-5 w-5" />} title="Téléphone">
                <a href="tel:+21672289900" className="underline-offset-4 hover:underline">+216 72 289 900</a>
              </Info>
              <Info icon={<Mail className="h-5 w-5" />} title="Email">
                <a href="mailto:jasmin.medicalstore@yahoo.com" className="underline-offset-4 hover:underline">
                  jasmin.medicalstore@yahoo.com
                </a>
              </Info>
              <Info icon={<Clock className="h-5 w-5" />} title="Horaires">
                Lundi — Samedi · 8h30 — 20h
              </Info>
            </ul>
          </div>
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-linen">
            <iframe
              title="Plan d'accès Jasmin Médical Store"
              src="https://www.google.com/maps?q=111+Av.+Hedi+Nouira,+Nabeul&output=embed"
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}

function Info({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-1 text-deep-teal">{icon}</span>
      <span>
        <span className="block font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">{title}</span>
        <span className="mt-1 block">{children}</span>
      </span>
    </li>
  );
}
