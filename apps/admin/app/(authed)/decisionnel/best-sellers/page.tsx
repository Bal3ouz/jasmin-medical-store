import { PeriodPicker } from "@/components/bi/PeriodPicker";
import { ReportCard } from "@/components/bi/ReportCard";
import { SimpleBarChart } from "@/components/bi/SimpleBarChart";
import { createClient } from "@jasmin/db";
import {
  type BestSellerRow,
  getBestSellers,
  listAllCategories,
  parsePeriod,
  periodToInterval,
} from "@jasmin/db/queries";
import { VOICE, formatTND } from "@jasmin/lib";
import { H1Editorial, LabelEyebrow, cn } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SortBy = "qty" | "revenue";

function parseSortBy(input: string | undefined): SortBy {
  return input === "revenue" ? "revenue" : "qty";
}

export default async function BestSellersPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;
  const period = parsePeriod(sp.period);
  const interval = periodToInterval(period);
  const sortBy = parseSortBy(sp.sortBy);
  const categoryId = sp.categoryId && sp.categoryId.length > 0 ? sp.categoryId : undefined;

  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    return <DegradedHeader />;
  }
  const db = createClient(url);
  const [rows, categories] = await Promise.all([
    getBestSellers(db, { since: interval.since, sortBy, categoryId, limit: 50 }),
    listAllCategories(db),
  ]);

  const top10 = rows.slice(0, 10).map((r) => ({
    name: r.name,
    qty: r.qty,
    revenue: r.revenue,
  }));

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biBestSellers}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>

      <form
        method="get"
        className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream-sand p-4 shadow-soft"
      >
        <input type="hidden" name="period" value={period} />
        {categoryId ? <input type="hidden" name="categoryId" value={categoryId} /> : null}

        <label className="flex items-center gap-2 text-sm text-warm-taupe">
          <span>Catégorie</span>
          <select
            name="categoryId"
            defaultValue={categoryId ?? ""}
            className="rounded-pill border border-linen bg-white px-3 py-1.5 text-sm text-warm-taupe focus:outline-none focus:ring-2 focus:ring-deep-teal"
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-pill bg-warm-taupe px-3 py-1.5 text-cream-sand text-xs uppercase tracking-[0.16em]"
        >
          Filtrer
        </button>

        <div className="ms-auto inline-flex flex-wrap gap-2">
          {(["qty", "revenue"] as const).map((key) => {
            const active = sortBy === key;
            return (
              <button
                key={key}
                type="submit"
                name="sortBy"
                value={key}
                className={cn(
                  "rounded-pill px-4 py-1.5 text-xs uppercase tracking-[0.16em] transition-colors",
                  active
                    ? "bg-deep-teal text-cream-sand"
                    : "bg-linen text-warm-taupe hover:bg-linen/70",
                )}
              >
                {key === "qty" ? VOICE.biSubtitleQty : VOICE.biSubtitleRevenue}
              </button>
            );
          })}
        </div>
      </form>

      <ReportCard
        title={sortBy === "revenue" ? VOICE.biSubtitleRevenue : VOICE.biSubtitleQty}
        subtitle="Top 10"
      >
        {top10.length === 0 ? (
          <p className="text-warm-taupe-soft">{VOICE.biEmpty}</p>
        ) : (
          <SimpleBarChart
            data={top10}
            xKey="name"
            yKey={sortBy === "revenue" ? "revenue" : "qty"}
            formatY={sortBy === "revenue" ? (v: number) => formatTND(v) : undefined}
          />
        )}
      </ReportCard>

      <ReportCard title={VOICE.biBestSellers} subtitle="Top 50">
        {rows.length === 0 ? (
          <p className="text-warm-taupe-soft">{VOICE.biEmpty}</p>
        ) : (
          <BestSellersTable rows={rows} />
        )}
      </ReportCard>
    </div>
  );
}

function BestSellersTable({ rows }: { rows: BestSellerRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-linen border-b text-warm-taupe-soft text-xs uppercase tracking-[0.12em]">
            <th className="py-3 pe-4">Produit</th>
            <th className="py-3 pe-4">Marque</th>
            <th className="py-3 pe-4">Catégorie</th>
            <th className="py-3 pe-4 text-right">{VOICE.biOrdersLabel}</th>
            <th className="py-3 text-right">{VOICE.biRevenueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.productId}
              className="border-linen border-b last:border-b-0 hover:bg-linen/50"
            >
              <td className="py-3 pe-4">
                <Link
                  href={`/catalogue/produits/${r.productId}`}
                  className="text-deep-teal hover:underline"
                >
                  {r.name}
                </Link>
              </td>
              <td className="py-3 pe-4 text-warm-taupe">{r.brandName ?? "—"}</td>
              <td className="py-3 pe-4 text-warm-taupe">{r.categoryName ?? "—"}</td>
              <td className="py-3 pe-4 text-right tabular-nums">{r.qty}</td>
              <td className="py-3 text-right tabular-nums">{formatTND(r.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DegradedHeader() {
  return (
    <div>
      <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
      <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biBestSellers}</H1Editorial>
      <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
    </div>
  );
}
