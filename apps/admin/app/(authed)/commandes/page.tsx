import { OrderStateBadge } from "@/components/OrderStateBadge";
import { createClient } from "@jasmin/db";
import { type AdminOrderRow, listOrdersForAdmin } from "@jasmin/db/queries";
import type { OrderStatus } from "@jasmin/lib";
import { Button, DataTable, H1Editorial, LabelEyebrow, Pill } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SORT_VALUES = [
  "createdAt",
  "-createdAt",
  "totalTnd",
  "-totalTnd",
  "orderNumber",
  "-orderNumber",
] as const;
type Sort = (typeof SORT_VALUES)[number];

function parseSort(input: string | undefined): Sort {
  if (input && (SORT_VALUES as readonly string[]).includes(input)) return input as Sort;
  return "-createdAt";
}

const STATUS_VALUES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

function parseStatus(input: string | undefined): OrderStatus | undefined {
  if (input && (STATUS_VALUES as readonly string[]).includes(input)) {
    return input as OrderStatus;
  }
  return undefined;
}

const STATUS_CHIPS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "confirmed", label: "Confirmées" },
  { key: "preparing", label: "En préparation" },
  { key: "shipped", label: "Expédiées" },
  { key: "delivered", label: "Livrées" },
  { key: "cancelled", label: "Annulées" },
  { key: "refunded", label: "Remboursées" },
];

const PAYMENT_STATUS_LABEL: Record<AdminOrderRow["paymentStatus"], string> = {
  pending: "En attente",
  paid: "Payée",
  refunded: "Remboursée",
  failed: "Échouée",
};

const PAYMENT_STATUS_TONE: Record<
  AdminOrderRow["paymentStatus"],
  "teal" | "jasmine" | "taupe" | "out"
> = {
  pending: "taupe",
  paid: "teal",
  refunded: "out",
  failed: "out",
};

const PAGE_SIZE = 20;

function buildUrl(basePath: string, params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
  const q = usp.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export default async function OrdersPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;
  const url = process.env.SUPABASE_DB_URL;

  if (!url) {
    return (
      <div>
        <LabelEyebrow>Commandes</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">File d'attente</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const db = createClient(url);
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const sort = parseSort(sp.sort);
  const status = parseStatus(sp.status);

  const { rows, total } = await listOrdersForAdmin(db, {
    search: sp.q,
    status,
    page,
    limit: PAGE_SIZE,
    sort,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <LabelEyebrow>Commandes</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">File d'attente</H1Editorial>
        </div>
      </div>

      {/* Status chip strip — links toggle ?status=<key>; "Toutes" clears it. */}
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        {STATUS_CHIPS.map((chip) => {
          const active =
            chip.key === "all" ? status === undefined : status === (chip.key as OrderStatus);
          const href = buildUrl("/commandes", {
            ...sp,
            status: chip.key === "all" ? undefined : chip.key,
            page: "1",
          });
          return (
            <Link
              key={chip.key}
              href={href}
              className={
                active
                  ? "rounded-pill bg-deep-teal px-4 py-1.5 text-cream-sand text-xs uppercase tracking-[0.16em]"
                  : "rounded-pill bg-linen px-4 py-1.5 text-warm-taupe text-xs uppercase tracking-[0.16em] hover:bg-linen/70"
              }
            >
              {chip.label}
            </Link>
          );
        })}
      </nav>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Rechercher (numéro, client, email)"
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
              key: "orderNumber",
              header: "N°",
              sortKey: "orderNumber",
              cell: (r) => (
                <span className="font-mono text-deep-teal text-sm">{r.orderNumber}</span>
              ),
            },
            {
              key: "createdAt",
              header: "Date",
              sortKey: "createdAt",
              cell: (r) => (
                <span className="text-warm-taupe-soft text-xs">
                  {new Date(r.createdAt).toLocaleString("fr-TN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              ),
            },
            {
              key: "customer",
              header: "Client",
              cell: (r) => (
                <div>
                  <div className="font-medium text-warm-taupe">
                    {r.customerFullName ?? r.shippingFullName}
                  </div>
                  <div className="text-warm-taupe-soft text-xs">
                    {r.customerEmail ?? r.guestEmail ?? "Invité"}
                  </div>
                </div>
              ),
            },
            {
              key: "status",
              header: "Statut",
              cell: (r) => <OrderStateBadge status={r.status} />,
            },
            {
              key: "paymentStatus",
              header: "Paiement",
              cell: (r) => (
                <Pill tone={PAYMENT_STATUS_TONE[r.paymentStatus]}>
                  {PAYMENT_STATUS_LABEL[r.paymentStatus]}
                </Pill>
              ),
            },
            {
              key: "total",
              header: "Total",
              sortKey: "totalTnd",
              cell: (r) => (
                <span className="font-display text-deep-teal">
                  {Number(r.totalTnd).toFixed(3)} TND
                </span>
              ),
              className: "text-right",
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          rowHref={(r) => `/commandes/${r.orderNumber}`}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/commandes"
          searchParams={sp}
          emptyState={<span className="text-warm-taupe-soft">Aucune commande.</span>}
        />
      </div>
    </div>
  );
}
