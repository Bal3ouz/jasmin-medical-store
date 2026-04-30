import { InventoryAdjustForm } from "@/components/InventoryAdjustForm";
import { createClient } from "@jasmin/db";
import { type AdminInventoryRow, listInventoryForAdmin } from "@jasmin/db/queries";
import { Button, H1Editorial, LabelEyebrow, Pill } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SORT_VALUES = ["name", "-name", "onHand", "-onHand"] as const;
type Sort = (typeof SORT_VALUES)[number];

function parseSort(input: string | undefined): Sort {
  if (input && (SORT_VALUES as readonly string[]).includes(input)) return input as Sort;
  return "name";
}

const STATUS_VALUES = ["out", "low"] as const;
type Status = (typeof STATUS_VALUES)[number];
function parseStatus(input: string | undefined): Status | undefined {
  if (input && (STATUS_VALUES as readonly string[]).includes(input)) return input as Status;
  return undefined;
}

const PAGE_SIZE = 20;

function buildUrl(basePath: string, params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
  const q = usp.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export default async function StockPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;
  const url = process.env.SUPABASE_DB_URL;

  if (!url) {
    return (
      <div>
        <LabelEyebrow>Stock</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Inventaire</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const db = createClient(url);
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const sort = parseSort(sp.sort);
  const status = parseStatus(sp.status);

  const { rows, total } = await listInventoryForAdmin(db, {
    search: sp.q,
    status,
    page,
    limit: PAGE_SIZE,
    sort,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <LabelEyebrow>Stock</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">Inventaire</H1Editorial>
        </div>
        <Button asChild variant="ghost">
          <Link href="/stock/mouvements">Voir tous les mouvements →</Link>
        </Button>
      </div>

      <form className="mt-8 flex flex-wrap items-end gap-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Rechercher (nom, SKU)"
          className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-warm-taupe text-sm"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-warm-taupe text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="low">Stock bas</option>
          <option value="out">Rupture</option>
        </select>
        <Button type="submit" variant="ghost">
          Filtrer
        </Button>
      </form>

      <div className="mt-8 rounded-2xl bg-cream-sand p-1 shadow-soft">
        <div
          className="grid items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-warm-taupe-soft"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto" }}
        >
          <SortHeader label="Produit" sortKey="name" current={sort} sp={sp} />
          <span>SKU</span>
          <span>Marque</span>
          <SortHeader label="Stock" sortKey="onHand" current={sort} sp={sp} />
          <span>Seuil</span>
          <span className="text-right">Actions</span>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-16 text-center text-warm-taupe-soft text-sm">
            Aucun article en inventaire.
          </div>
        ) : (
          <div className="divide-y divide-linen">
            {rows.map((r) => (
              <InventoryRow key={r.inventoryId} row={r} />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-linen border-t px-4 py-3 text-xs text-warm-taupe-soft">
          <div>
            {total === 0
              ? "0"
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} sur ${total}`}
          </div>
          <div className="flex gap-3">
            {page > 1 ? (
              <Link href={buildUrl("/stock", { ...sp, page: String(page - 1) })}>← Précédent</Link>
            ) : null}
            {page < totalPages ? (
              <Link href={buildUrl("/stock", { ...sp, page: String(page + 1) })}>Suivant →</Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SortHeader — renders a sortable column header                              */
/* -------------------------------------------------------------------------- */

function SortHeader({
  label,
  sortKey,
  current,
  sp,
}: {
  label: string;
  sortKey: "name" | "onHand";
  current: Sort;
  sp: Record<string, string | undefined>;
}) {
  const next: Sort = current === sortKey ? (`-${sortKey}` as Sort) : sortKey;
  const arrow = current === sortKey ? " ▲" : current === `-${sortKey}` ? " ▼" : "";
  return (
    <Link
      href={buildUrl("/stock", { ...sp, sort: next, page: "1" })}
      className="hover:text-deep-teal"
    >
      {label}
      {arrow}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* InventoryRow — name/SKU/brand + stock + collapsible "Ajuster" form         */
/* -------------------------------------------------------------------------- */

function InventoryRow({ row }: { row: AdminInventoryRow }) {
  const statusBadge =
    row.status === "out" ? (
      <Pill tone="out">Rupture</Pill>
    ) : row.status === "low" ? (
      <Pill tone="jasmine">Bas</Pill>
    ) : (
      <Pill tone="teal">OK</Pill>
    );

  // We render each row as a single `<details>` so the row data lives inside
  // `<summary>` and toggling the disclosure surfaces the inline adjust form
  // beneath it. Sticking to native disclosure means the page stays a server
  // component — the only client island is the `InventoryAdjustForm` itself.
  return (
    <details className="group">
      <summary
        className="grid cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-linen/40"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto" }}
      >
        <div>
          <div className="font-medium text-warm-taupe">{row.productName}</div>
          {row.variantName ? (
            <div className="text-warm-taupe-soft text-xs">{row.variantName}</div>
          ) : null}
        </div>
        <div className="text-warm-taupe-soft">{row.sku ?? "—"}</div>
        <div className="text-warm-taupe-soft">{row.brandName ?? "—"}</div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-warm-taupe">{row.onHand}</span>
          {statusBadge}
        </div>
        <div className="text-warm-taupe-soft">{row.reorderPoint}</div>
        <div className="text-right text-deep-teal text-xs">
          <span className="group-open:hidden">Ajuster ▾</span>
          <span className="hidden group-open:inline">Fermer ▴</span>
        </div>
      </summary>
      <div className="border-linen border-t bg-linen/20 px-4 py-3">
        <InventoryAdjustForm
          productId={row.productId ?? undefined}
          variantId={row.variantId ?? undefined}
          currentOnHand={row.onHand}
        />
      </div>
    </details>
  );
}
