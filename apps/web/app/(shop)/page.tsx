import { VOICE } from "@jasmin/lib";
import {
  AiryContainer,
  BodyText,
  Button,
  H1Editorial,
  H2Section,
  JasmineSprig,
  LabelEyebrow,
  Logo,
  Marquee,
  Pill,
  PriceTag,
  TealHeroPanel,
} from "@jasmin/ui";

export default function HomePage() {
  return (
    <main>
      <TealHeroPanel>
        <header className="flex items-center justify-between">
          <Logo variant="cream" />
          <nav className="hidden gap-8 text-sm tracking-wide text-cream-sand/90 lg:flex">
            <span>Boutique</span>
            <span>Cosmétique</span>
            <span>Orthopédie</span>
            <span>Matériel médical</span>
            <span>Notre histoire</span>
            <span>Contact</span>
          </nav>
        </header>

        <div className="mt-24 max-w-4xl">
          <LabelEyebrow className="text-jasmine">Bienvenue</LabelEyebrow>
          <H1Editorial className="mt-6 text-cream-sand">{VOICE.heroTagline}</H1Editorial>
          <BodyText className="mt-6 max-w-xl text-cream-sand/80">{VOICE.heroSubtitle}</BodyText>
          <div className="mt-10 flex items-center gap-4">
            <Button variant="jasmine">Découvrir la boutique</Button>
            <Button variant="ghost" className="text-cream-sand hover:bg-cream-sand/10">
              Notre histoire
            </Button>
          </div>
        </div>

        <JasmineSprig className="absolute right-12 bottom-12 h-40 w-40 text-jasmine/40" />
      </TealHeroPanel>

      <AiryContainer className="px-8 py-16 lg:px-24">
        <LabelEyebrow>{VOICE.trustedBrandsLabel}</LabelEyebrow>
        <Marquee className="mt-6">
          {["SVR", "Avène", "La Roche-Posay", "Vichy", "Bioderma", "Nuxe"].map((b) => (
            <span
              key={b}
              className="font-[var(--font-display)] italic text-2xl text-warm-taupe-soft"
            >
              {b}
            </span>
          ))}
        </Marquee>
      </AiryContainer>

      <AiryContainer className="bg-linen px-8 py-16 lg:px-24">
        <H2Section>Aperçu du système de design</H2Section>
        <BodyText className="mt-4 max-w-2xl">
          Cette page est un témoin technique : elle prouve que les jetons, polices et composants se
          chargent correctement.
        </BodyText>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Pill tone="teal">En stock</Pill>
          <Pill tone="jasmine">Coup de cœur</Pill>
          <Pill tone="taupe">Nouveauté</Pill>
          <PriceTag amount={32.9} compareAt={45} />
          <Button>Bouton primaire</Button>
          <Button variant="outline">Bouton secondaire</Button>
        </div>
      </AiryContainer>
    </main>
  );
}
