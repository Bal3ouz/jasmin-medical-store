import { AuditLogTable } from "@/components/AuditLogTable";
import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { listAuditLog, listStaff } from "@jasmin/db/queries";
import { Button, H1Editorial, Input, LabelEyebrow } from "@jasmin/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const ENTITY_OPTIONS = [
  { value: "", label: "Toutes" },
  { value: "product", label: "Produit" },
  { value: "variant", label: "Déclinaison" },
  { value: "brand", label: "Marque" },
  { value: "category", label: "Catégorie" },
  { value: "product_image", label: "Image produit" },
  { value: "inventory", label: "Stock" },
  { value: "order", label: "Commande" },
  { value: "customer", label: "Client" },
  { value: "staff", label: "Équipe" },
  { value: "cart", label: "Panier" },
  { value: "newsletter", label: "Newsletter" },
];

function buildUrl(basePath: string, params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
  const q = usp.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export default async function AuditPage(props: {
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
        <LabelEyebrow>Audit</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Journal d'audit</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const db = createClient(url);

  // Staff dropdown: full team, ordered by name. Inactive members stay
  // selectable so historical events authored by departed staff are still
  // filterable.
  const [staffList, { rows, nextCursor }] = await Promise.all([
    listStaff(db),
    listAuditLog(db, {
      entityType: sp.entityType ?? null,
      action: sp.action ?? null,
      staffUserId: sp.staffUserId ?? null,
      dateFrom: sp.dateFrom ?? null,
      dateTo: sp.dateTo ?? null,
      cursor: sp.cursor ?? null,
      limit: PAGE_SIZE,
    }),
  ]);

  // Build the next-page link by carrying every active filter forward and
  // swapping `cursor` for the row at the end of the current page.
  const nextHref = nextCursor
    ? buildUrl("/audit", {
        entityType: sp.entityType,
        action: sp.action,
        staffUserId: sp.staffUserId,
        dateFrom: sp.dateFrom,
        dateTo: sp.dateTo,
        cursor: nextCursor,
      })
    : null;

  return (
    <div>
      <header>
        <LabelEyebrow>Audit</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Journal d'audit</H1Editorial>
        <p className="mt-2 text-warm-taupe-soft text-sm">
          Trace immuable des actions internes : produits, commandes, clients, stock, équipe.
        </p>
      </header>

      <form
        className="mt-8 grid gap-4 rounded-2xl bg-cream-sand p-6 shadow-soft md:grid-cols-5"
        method="GET"
      >
        <label htmlFor="audit-entityType" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Entité</span>
          <select
            id="audit-entityType"
            name="entityType"
            defaultValue={sp.entityType ?? ""}
            className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
          >
            {ENTITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="audit-action" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Action</span>
          <Input
            id="audit-action"
            name="action"
            defaultValue={sp.action ?? ""}
            placeholder="ex: order.refund"
            maxLength={80}
          />
        </label>

        <label htmlFor="audit-staff" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Acteur</span>
          <select
            id="audit-staff"
            name="staffUserId"
            defaultValue={sp.staffUserId ?? ""}
            className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
          >
            <option value="">Toute l'équipe</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} {s.isActive ? "" : "(inactif)"}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="audit-dateFrom" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Du</span>
          <Input
            id="audit-dateFrom"
            name="dateFrom"
            type="datetime-local"
            defaultValue={sp.dateFrom ?? ""}
          />
        </label>

        <label htmlFor="audit-dateTo" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Au</span>
          <Input
            id="audit-dateTo"
            name="dateTo"
            type="datetime-local"
            defaultValue={sp.dateTo ?? ""}
          />
        </label>

        <div className="flex items-end gap-3 md:col-span-5">
          <Button type="submit" variant="primary-teal">
            Filtrer
          </Button>
          <Link href="/audit" className="text-warm-taupe-soft text-xs hover:text-deep-teal">
            Réinitialiser
          </Link>
        </div>
      </form>

      <div className="mt-8">
        <AuditLogTable rows={rows} />
      </div>

      {nextHref ? (
        <div className="mt-6 flex justify-end">
          <Link
            href={nextHref}
            className="rounded-pill bg-deep-teal px-4 py-2 text-cream-sand text-sm hover:bg-deep-teal/90"
          >
            Page suivante →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
