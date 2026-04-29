import { AiryContainer, BodyText, H1Editorial, H2Section } from "@jasmin/ui";

export const revalidate = 604800;

export default function ConfidentialitePage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <article className="mx-auto max-w-3xl space-y-6">
          <H1Editorial className="text-4xl text-deep-teal">Politique de confidentialité</H1Editorial>
          <BodyText>
            Vos données personnelles sont collectées par Jasmin Médical Store dans le seul but de
            traiter vos commandes et de vous tenir informé(e) de nos actualités si vous y avez
            consenti.
          </BodyText>
          <H2Section className="text-2xl">Données collectées</H2Section>
          <BodyText>
            Nom, prénom, adresse de livraison, numéro de téléphone, adresse email, historique de
            commandes.
          </BodyText>
          <H2Section className="text-2xl">Vos droits</H2Section>
          <BodyText>
            Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
            Contactez-nous à jasmin.medicalstore@yahoo.com pour exercer ces droits.
          </BodyText>
          <H2Section className="text-2xl">Cookies</H2Section>
          <BodyText>
            Nous utilisons uniquement des cookies fonctionnels nécessaires au panier et à la session
            d'authentification. Aucun cookie publicitaire ou de tracking tiers n'est déposé.
          </BodyText>
        </article>
      </AiryContainer>
    </main>
  );
}
