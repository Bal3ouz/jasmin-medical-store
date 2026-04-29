import { StaffActiveToggle, StaffRoleEditor } from "@/components/StaffEditForms";
import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { getStaff } from "@jasmin/db/queries";
import type { StaffUser } from "@jasmin/db/schema";
import { H1Editorial, LabelEyebrow, Pill } from "@jasmin/ui";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<StaffUser["role"], string> = {
  admin: "Administrateur",
  manager: "Manager",
  cashier: "Caisse",
  stock: "Stock",
};

export default async function StaffDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    return (
      <div>
        <LabelEyebrow>Équipe</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Membre</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const staff = await getStaff(createClient(url), id);
  if (!staff) notFound();

  const isSelf = session.authUserId === staff.id;

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="space-y-10 lg:col-span-2">
        <header>
          <Link href="/equipe" className="text-warm-taupe-soft text-xs hover:text-deep-teal">
            ← Retour à l'équipe
          </Link>
          <LabelEyebrow className="mt-2">Membre</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{staff.fullName}</H1Editorial>
          <p className="mt-2 text-warm-taupe-soft text-sm">{staff.email}</p>
          <div className="mt-3 flex items-center gap-3">
            <Pill tone="teal">{ROLE_LABEL[staff.role]}</Pill>
            <Pill tone={staff.isActive ? "jasmine" : "out"}>
              {staff.isActive ? "Actif" : "Inactif"}
            </Pill>
          </div>
          <p className="mt-3 text-warm-taupe-soft text-xs">
            Ajouté le{" "}
            {new Date(staff.createdAt).toLocaleDateString("fr-TN", {
              dateStyle: "medium",
            })}
            {staff.lastLoginAt
              ? ` · Dernière connexion ${new Date(staff.lastLoginAt).toLocaleString("fr-TN", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}`
              : ""}
          </p>
        </header>
      </div>

      <aside className="space-y-6 lg:col-span-1">
        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft">
          <h2 className="font-display text-xl text-deep-teal">Rôle</h2>
          <p className="mt-1 text-warm-taupe-soft text-xs">
            Modifier le rôle propage les nouvelles permissions immédiatement.
          </p>
          <div className="mt-4">
            <StaffRoleEditor staffId={staff.id} currentRole={staff.role} />
          </div>
        </div>

        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft">
          <h2 className="font-display text-xl text-deep-teal">Statut</h2>
          {isSelf ? (
            <p className="mt-2 text-warm-taupe-soft text-xs">
              Vous ne pouvez pas désactiver votre propre compte.
            </p>
          ) : (
            <>
              <p className="mt-1 text-warm-taupe-soft text-xs">
                {staff.isActive
                  ? "Désactiver suspend l'accès au back-office (la session restera active jusqu'au prochain rechargement)."
                  : "Réactiver restaure l'accès complet."}
              </p>
              <div className="mt-4">
                <StaffActiveToggle staffId={staff.id} currentlyActive={staff.isActive} />
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
