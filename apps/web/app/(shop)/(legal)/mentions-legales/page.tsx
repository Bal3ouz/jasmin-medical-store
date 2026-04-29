import { AiryContainer, BodyText, H1Editorial, H2Section } from "@jasmin/ui";

export const revalidate = 604800;

export default function MentionsLegalesPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <article className="mx-auto max-w-3xl space-y-6">
          <H1Editorial className="text-4xl text-deep-teal">Mentions légales</H1Editorial>
          <H2Section className="text-2xl">Éditeur du site</H2Section>
          <BodyText>
            Jasmin Médical Store · 111 Av. Hedi Nouira, 8000 Nabeul, Tunisie · Téléphone +216 72 289 900 ·
            Email jasmin.medicalstore@yahoo.com.
          </BodyText>
          <H2Section className="text-2xl">Hébergement</H2Section>
          <BodyText>
            Site hébergé par DigitalOcean App Platform (Frankfurt, Allemagne) — base de données par
            Supabase Inc.
          </BodyText>
          <H2Section className="text-2xl">Propriété intellectuelle</H2Section>
          <BodyText>
            L'ensemble du contenu (textes, photos, logos) est la propriété exclusive de Jasmin Médical
            Store. Toute reproduction sans autorisation écrite est interdite.
          </BodyText>
        </article>
      </AiryContainer>
    </main>
  );
}
