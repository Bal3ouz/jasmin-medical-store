import { createClient } from "@jasmin/db";
import { listCustomersForAdmin } from "@jasmin/db/queries";
import { Button, DataTable, H1Editorial, LabelEyebrow } from "@jasmin/ui";

export const dynamic = "force-dynamic";

const SORT_VALUES = ["createdAt", "-createdAt", "fullName", "-fullName"] as const;
type Sort = (typeof SORT_VALUES)[number];

function parseSort(input: string | undefined): Sort {
  if (input && (SORT_VALUES as readonly string[]).includes(input)) return input as Sort;
  return "-createdAt";
}

const PAGE_SIZE = 20;

export default async function CustomersPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;
  const url = process.env.SUPABASE_DB_URL;

  if (!url) {
    return (
      <div>
        <LabelEyebrow>Clients</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Carnet d'adresses</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const db = createClient(url);
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const sort = parseSort(sp.sort);

  const { rows, total } = await listCustomersForAdmin(db, {
    search: sp.q,
    page,
    limit: PAGE_SIZE,
    sort,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <LabelEyebrow>Clients</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">Carnet d'adresses</H1Editorial>
        </div>
      </div>

      <form className="mt-8 flex flex-wrap items-end gap-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Rechercher (email, nom, téléphone)"
          className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-warm-taupe text-sm"
        />
        <Button type="submit" variant="ghost">
          Filtrer
        </Button>
      </form>

      <div className="mt-8">
        <DataTable
          columns={[
            {
              key: "fullName",
              header: "Nom",
              sortKey: "fullName",
              cell: (r) => <span className="font-medium text-warm-taupe">{r.fullName ?? "—"}</span>,
            },
            {
              key: "email",
              header: "Email",
              cell: (r) => <span className="text-warm-taupe-soft text-xs">{r.email}</span>,
            },
            {
              key: "phone",
              header: "Téléphone",
              cell: (r) => <span className="text-warm-taupe-soft text-xs">{r.phone ?? "—"}</span>,
            },
            {
              key: "createdAt",
              header: "Inscrit le",
              sortKey: "createdAt",
              cell: (r) => (
                <span className="text-warm-taupe-soft text-xs">
                  {new Date(r.createdAt).toLocaleDateString("fr-TN", {
                    dateStyle: "medium",
                  })}
                </span>
              ),
              className: "text-right",
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          rowHref={(r) => `/clients/${r.id}`}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/clients"
          searchParams={sp}
          emptyState={<span className="text-warm-taupe-soft">Aucun client trouvé.</span>}
        />
      </div>
    </div>
  );
}
