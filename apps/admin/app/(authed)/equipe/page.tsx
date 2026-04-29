import { StaffInviteForm } from "@/components/StaffInviteForm";
import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { listStaff } from "@jasmin/db/queries";
import type { StaffUser } from "@jasmin/db/schema";
import { DataTable, H1Editorial, LabelEyebrow, Pill } from "@jasmin/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<StaffUser["role"], string> = {
  admin: "Administrateur",
  manager: "Manager",
  cashier: "Caisse",
  stock: "Stock",
};

export default async function StaffPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const sp = await props.searchParams;
  const url = process.env.SUPABASE_DB_URL;

  if (!url) {
    return (
      <div>
        <LabelEyebrow>Équipe</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Membres</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const db = createClient(url);
  const rows = await listStaff(db);

  return (
    <div>
      <header>
        <LabelEyebrow>Équipe</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Membres</H1Editorial>
        <p className="mt-2 text-warm-taupe-soft text-sm">
          Invitez un collègue par email — il recevra un lien magique pour activer son accès.
        </p>
      </header>

      <div className="mt-8">
        <StaffInviteForm />
      </div>

      <div className="mt-12">
        <DataTable
          columns={[
            {
              key: "fullName",
              header: "Nom",
              cell: (r) => <span className="font-medium text-warm-taupe">{r.fullName}</span>,
            },
            {
              key: "email",
              header: "Email",
              cell: (r) => <span className="text-warm-taupe-soft text-xs">{r.email}</span>,
            },
            {
              key: "role",
              header: "Rôle",
              cell: (r) => <Pill tone="teal">{ROLE_LABEL[r.role]}</Pill>,
            },
            {
              key: "status",
              header: "Statut",
              cell: (r) => (
                <Pill tone={r.isActive ? "jasmine" : "out"}>
                  {r.isActive ? "Actif" : "Inactif"}
                </Pill>
              ),
            },
            {
              key: "details",
              header: "",
              cell: (r) => (
                <Link
                  href={`/equipe/${r.id}`}
                  className="rounded-pill bg-deep-teal/10 px-3 py-1 text-deep-teal text-xs hover:bg-deep-teal/20"
                >
                  Détails
                </Link>
              ),
              className: "text-right",
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          page={1}
          pageSize={Math.max(rows.length, 1)}
          total={rows.length}
          basePath="/equipe"
          searchParams={sp}
          emptyState={<span className="text-warm-taupe-soft">Aucun membre.</span>}
        />
      </div>
    </div>
  );
}
