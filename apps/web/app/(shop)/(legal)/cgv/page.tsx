import { AiryContainer, BodyText, H1Editorial, H2Section } from "@jasmin/ui";

export const revalidate = 604800;

export default function CgvPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <article className="mx-auto max-w-3xl space-y-6">
          <H1Editorial className="text-4xl text-deep-teal">Conditions générales de vente</H1Editorial>
          <H2Section className="text-2xl">1. Objet</H2Section>
          <BodyText>
            Les présentes CGV régissent les ventes effectuées sur jasmin-medical-store.com par Jasmin
            Médical Store auprès de ses clients particuliers.
          </BodyText>
          <H2Section className="text-2xl">2. Prix et paiement</H2Section>
          <BodyText>
            Les prix sont en dinars tunisiens (TND), TTC. Le paiement s'effectue à la livraison (cash on
            delivery) sauf indication contraire au moment de la commande.
          </BodyText>
          <H2Section className="text-2xl">3. Livraison</H2Section>
          <BodyText>
            Livraison sous 48 à 72 heures ouvrées sur l'ensemble du territoire tunisien. Frais de
            livraison de 7 TND offerts à partir de 200 TND d'achats.
          </BodyText>
          <H2Section className="text-2xl">4. Rétractation et retours</H2Section>
          <BodyText>
            Conformément à la législation tunisienne, vous disposez d'un délai de 7 jours pour
            retourner un produit non utilisé dans son emballage d'origine.
          </BodyText>
          <H2Section className="text-2xl">5. Service client</H2Section>
          <BodyText>Pour toute question : jasmin.medicalstore@yahoo.com · +216 72 289 900.</BodyText>
        </article>
      </AiryContainer>
    </main>
  );
}
