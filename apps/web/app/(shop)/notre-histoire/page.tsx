import { VOICE } from "@jasmin/lib";
import {
  AiryContainer,
  BodyText,
  H1Editorial,
  H2Section,
  JasmineSprig,
  LabelEyebrow,
} from "@jasmin/ui";

export const revalidate = 86400;

export default function NotreHistoirePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-cream-sand px-6 pb-20 pt-32 lg:px-12 lg:pt-40">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2">
          <div>
            <LabelEyebrow>Notre histoire</LabelEyebrow>
            <H1Editorial className="mt-6 text-deep-teal">{VOICE.notreHistoireHero}</H1Editorial>
            <BodyText className="mt-6 max-w-xl">
              Depuis 2010, à Nabeul, nous sélectionnons avec amour les meilleures parapharmacies
              pour prendre soin de vous, simplement, naturellement.
            </BodyText>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-linen">
            <JasmineSprig className="absolute inset-0 m-auto h-1/2 w-1/2 text-jasmine/40" />
          </div>
        </div>
      </section>

      <AiryContainer className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2">
          <div>
            <H2Section>L'origine</H2Section>
            <BodyText className="mt-6">
              Au cœur de Nabeul, face à la Clinique El Amen, Jasmin Médical Store est né d'une
              conviction simple : prendre soin de soi est un rituel. Chaque produit, chaque conseil,
              chaque sourire derrière le comptoir reflète cette idée.
            </BodyText>
            <BodyText className="mt-4">
              De la cosmétique aux matériels médicaux, en passant par l'orthopédie, nous choisissons
              des marques qui respectent la peau, le corps et la planète. Notre équipe vous
              accompagne avec une expertise dermo-cosmétique reconnue.
            </BodyText>
          </div>
          <div className="space-y-6">
            <blockquote className="rounded-lg bg-linen/60 p-8">
              <p className="font-[var(--font-display)] text-2xl italic leading-[1.4] text-deep-teal">
                « Une parapharmacie qui ressemble à la Méditerranée : douce, généreuse, attentive. »
              </p>
              <footer className="mt-4 font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
                — Notre philosophie
              </footer>
            </blockquote>
          </div>
        </div>
      </AiryContainer>

      <AiryContainer className="bg-linen px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-[1200px]">
          <H2Section className="text-center">Nos engagements</H2Section>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "Sélection rigoureuse",
                body: "Seules les marques en lesquelles nous croyons trouvent leur place dans nos rayons.",
              },
              {
                title: "Conseils personnalisés",
                body: "Notre équipe vous écoute et vous oriente avec une expertise reconnue.",
              },
              {
                title: "Au cœur de Nabeul",
                body: "Une boutique ancrée dans la ville et ouverte sur la Méditerranée.",
              },
            ].map((c) => (
              <article key={c.title} className="rounded-lg bg-cream-sand p-6 shadow-soft">
                <JasmineSprig className="h-10 w-10 text-jasmine" />
                <h3 className="mt-4 font-[var(--font-display)] text-xl italic text-deep-teal">
                  {c.title}
                </h3>
                <BodyText className="mt-3">{c.body}</BodyText>
              </article>
            ))}
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
