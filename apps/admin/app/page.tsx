import { getStaffSession } from "@/lib/auth";
import {
  AiryContainer,
  BodyText,
  H1Editorial,
  H2Section,
  LabelEyebrow,
  Logo,
  Pill,
} from "@jasmin/ui";
import { redirect } from "next/navigation";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  manager: "Manager",
  cashier: "Caisse",
  stock: "Stock",
};

export default async function DashboardPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");

  return (
    <main>
      <AiryContainer className="px-8 py-12 lg:px-24">
        <header className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="text-sm text-warm-taupe-soft">{session.fullName}</span>
            <Pill tone="teal">{ROLE_LABEL[session.role]}</Pill>
          </div>
        </header>

        <div className="mt-16 max-w-3xl">
          <LabelEyebrow>Tableau de bord</LabelEyebrow>
          <H1Editorial className="mt-4 text-deep-teal text-5xl">Bienvenue, {session.fullName.split(" ")[0]}.</H1Editorial>
          <BodyText className="mt-4">
            L'espace équipe Jasmin Médical Store est en cours d'aménagement.
            Les modules Catalogue, Commandes, Stock et Décisionnel arrivent dans les prochaines phases.
          </BodyText>
        </div>

        <section className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <H2Section>Phase 1 — Foundation ✓</H2Section>
          <BodyText>
            La base technique est en place : monorepo, base de données, système de design,
            authentification, déploiement. Les phases suivantes apportent le contenu fonctionnel.
          </BodyText>
        </section>
      </AiryContainer>
    </main>
  );
}
