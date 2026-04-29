import { PeriodPicker } from "@/components/bi/PeriodPicker";
import { ReportCard } from "@/components/bi/ReportCard";
import { createClient } from "@jasmin/db";
import {
  type DeadStockRow,
  type ReorderRow,
  type TurnoverRow,
  getDeadStock,
  getReorderCandidates,
  getTurnover,
  parsePeriod,
  periodDays,
  periodToInterval,
} from "@jasmin/db/queries";
import { VOICE } from "@jasmin/lib";
import { H1Editorial, LabelEyebrow } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StockHealthPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;
  const period = parsePeriod(sp.period);
  const interval = periodToInterval(period);

  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    return <DegradedHeader period={period} sp={sp} />;
  }
  const db = createClient(url);
  const [reorder, deadStock, turnover] = await Promise.all([
    getReorderCandidates(db, { limit: 20 }),
    getDeadStock(db, { since: interval.since, limit: 20 }),
    getTurnover(db, {
      since: interval.since,
      periodDays: periodDays(interval),
      limit: 20,
    }),
  ]);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biStockHealth}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>

      <ReportCard title={VOICE.biReorderHint}>
        {reorder.length === 0 ? (
          <p className="text-warm-taupe-soft">{VOICE.biEmpty}</p>
        ) : (
          <ReorderTable rows={reorder} />
        )}
      </ReportCard>

      <ReportCard title={VOICE.biDeadStockHint}>
        {deadStock.length === 0 ? (
          <p className="text-warm-taupe-soft">{VOICE.biEmpty}</p>
        ) : (
          <DeadStockTable rows={deadStock} />
        )}
      </ReportCard>

      <ReportCard title={VOICE.biTurnoverLabel} subtitle={VOICE.biDaysOfCoverLabel}>
        {turnover.length === 0 ? (
          <p className="text-warm-taupe-soft">{VOICE.biEmpty}</p>
        ) : (
          <TurnoverTable rows={turnover} />
        )}
      </ReportCard>
    </div>
  );
}

function nameLink(name: string) {
  return `/stock?search=${encodeURIComponent(name)}`;
}

function ReorderTable({ rows }: { rows: ReorderRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-linen border-b text-warm-taupe-soft text-xs uppercase tracking-[0.12em]">
            <th className="py-3 pe-4">Produit</th>
            <th className="py-3 pe-4 text-right">Stock</th>
            <th className="py-3 pe-4 text-right">Seuil</th>
            <th className="py-3 text-right">Manque</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.productId ?? r.variantId ?? `r-${i}`}
              className="border-linen border-b last:border-b-0 hover:bg-linen/50"
            >
              <td className="py-3 pe-4">
                <Link href={nameLink(r.name)} className="text-deep-teal hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="py-3 pe-4 text-right tabular-nums">{r.onHand}</td>
              <td className="py-3 pe-4 text-right tabular-nums">{r.reorderPoint}</td>
              <td className="py-3 text-right font-medium tabular-nums text-deep-teal">
                {r.deficit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeadStockTable({ rows }: { rows: DeadStockRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-linen border-b text-warm-taupe-soft text-xs uppercase tracking-[0.12em]">
            <th className="py-3 pe-4">Produit</th>
            <th className="py-3 pe-4 text-right">Stock</th>
            <th className="py-3 text-right">Dernière vente</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.productId ?? r.variantId ?? `d-${i}`}
              className="border-linen border-b last:border-b-0 hover:bg-linen/50"
            >
              <td className="py-3 pe-4">
                <Link href={nameLink(r.name)} className="text-deep-teal hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="py-3 pe-4 text-right tabular-nums">{r.currentOnHand}</td>
              <td className="py-3 text-right text-warm-taupe">
                {r.lastSaleAt
                  ? r.lastSaleAt.toLocaleDateString("fr-TN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Jamais"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TurnoverTable({ rows }: { rows: TurnoverRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-linen border-b text-warm-taupe-soft text-xs uppercase tracking-[0.12em]">
            <th className="py-3 pe-4">Produit</th>
            <th className="py-3 pe-4 text-right">Vendus</th>
            <th className="py-3 pe-4 text-right">Stock</th>
            <th className="py-3 text-right">{VOICE.biDaysOfCoverLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.productId ?? r.variantId ?? `t-${i}`}
              className="border-linen border-b last:border-b-0 hover:bg-linen/50"
            >
              <td className="py-3 pe-4">
                <Link href={nameLink(r.name)} className="text-deep-teal hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="py-3 pe-4 text-right tabular-nums">{r.sold}</td>
              <td className="py-3 pe-4 text-right tabular-nums">{r.currentOnHand}</td>
              <td className="py-3 text-right tabular-nums">
                {r.daysOfCover === null ? "—" : Math.round(r.daysOfCover)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DegradedHeader({
  period,
  sp,
}: {
  period: ReturnType<typeof parsePeriod>;
  sp: Record<string, string | undefined>;
}) {
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biStockHealth}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>
      <p className="text-warm-taupe-soft text-sm">Base de données non configurée.</p>
    </div>
  );
}
