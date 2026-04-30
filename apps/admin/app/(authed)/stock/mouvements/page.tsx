import { createClient } from "@jasmin/db";
import {
  type AdminStockMovementRow,
  type StockMovementType,
  listStockMovements,
} from "@jasmin/db/queries";
import { Button, DataTable, H1Editorial, LabelEyebrow, Pill } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const TYPE_VALUES = ["purchase", "sale", "adjustment", "return", "transfer"] as const;
function parseType(input: string | undefined): StockMovementType | undefined {
  if (input && (TYPE_VALUES as readonly string[]).includes(input)) {
    return input as StockMovementType;
  }
  return undefined;
}

/**
 * `<input type="date">` arrives as `YYYY-MM-DD` strings. We convert each
 * boundary to a JS Date — `dateFrom` to start-of-day local, `dateTo` to
 * end-of-day local — so the BETWEEN clause is inclusive on both ends.
 */
function parseDate(input: string | undefined, end: boolean): Date | undefined {
  if (!input) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!m) return undefined;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return undefined;
  if (end) date.setHours(23, 59, 59, 999);
  return date;
}

const TYPE_LABELS: Record<StockMovementType, string> = {
  purchase: "Achat",
  sale: "Vente",
  adjustment: "Ajustement",
  return: "Retour",
  transfer: "Transfert",
};

// `Pill` only ships four tones (teal/jasmine/taupe/out per Track 2). We map
// movement types onto that palette for visual differentiation without
// inventing new tones.
const TYPE_TONES: Record<StockMovementType, "teal" | "jasmine" | "taupe" | "out"> = {
  purchase: "teal",
  sale: "jasmine",
  adjustment: "taupe",
  return: "taupe",
  transfer: "out",
};

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function StockMouvementsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;
  const url = process.env.SUPABASE_DB_URL;

  if (!url) {
    return (
      <div>
        <LabelEyebrow>Stock</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Mouvements</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const db = createClient(url);
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const { rows, total } = await listStockMovements(db, {
    type: parseType(sp.type),
    dateFrom: parseDate(sp.from, false),
    dateTo: parseDate(sp.to, true),
    page,
    limit: PAGE_SIZE,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <LabelEyebrow>Stock</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">Mouvements</H1Editorial>
        </div>
        <Button asChild variant="ghost">
          <Link href="/stock">← Retour à l'inventaire</Link>
        </Button>
      </div>

      <form className="mt-8 flex flex-wrap items-end gap-3">
        <label htmlFor="filter-type" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Type</span>
          <select
            id="filter-type"
            name="type"
            defaultValue={sp.type ?? ""}
            className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-warm-taupe text-sm"
          >
            <option value="">Tous</option>
            {TYPE_VALUES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="filter-from" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Du</span>
          <input
            id="filter-from"
            type="date"
            name="from"
            defaultValue={sp.from ?? ""}
            className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-warm-taupe text-sm"
          />
        </label>
        <label htmlFor="filter-to" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Au</span>
          <input
            id="filter-to"
            type="date"
            name="to"
            defaultValue={sp.to ?? ""}
            className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-warm-taupe text-sm"
          />
        </label>
        <Button type="submit" variant="ghost">
          Filtrer
        </Button>
      </form>

      <div className="mt-8">
        <DataTable<AdminStockMovementRow>
          columns={[
            {
              key: "performedAt",
              header: "Date",
              cell: (r) => (
                <span className="text-warm-taupe-soft">{DATE_FORMAT.format(r.performedAt)}</span>
              ),
            },
            {
              key: "type",
              header: "Type",
              cell: (r) => <Pill tone={TYPE_TONES[r.type]}>{TYPE_LABELS[r.type]}</Pill>,
            },
            {
              key: "product",
              header: "Produit",
              cell: (r) => (
                <div>
                  <div className="font-medium text-warm-taupe">{r.productName ?? "—"}</div>
                  {r.variantName ? (
                    <div className="text-warm-taupe-soft text-xs">{r.variantName}</div>
                  ) : null}
                  {r.sku ? <div className="text-warm-taupe-soft text-xs">{r.sku}</div> : null}
                </div>
              ),
            },
            {
              key: "quantity",
              header: "Qté",
              cell: (r) => (
                <span
                  className={
                    r.quantity > 0
                      ? "font-medium text-emerald-700"
                      : r.quantity < 0
                        ? "font-medium text-rose-700"
                        : "text-warm-taupe-soft"
                  }
                >
                  {r.quantity > 0 ? "+" : ""}
                  {r.quantity}
                </span>
              ),
            },
            {
              key: "performedBy",
              header: "Effectué par",
              cell: (r) => <span className="text-warm-taupe-soft">{r.performedByName ?? "—"}</span>,
            },
            {
              key: "notes",
              header: "Notes",
              cell: (r) => <span className="text-warm-taupe-soft text-xs">{r.notes ?? "—"}</span>,
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/stock/mouvements"
          searchParams={sp}
          emptyState={<span className="text-warm-taupe-soft">Aucun mouvement enregistré.</span>}
        />
      </div>
    </div>
  );
}
