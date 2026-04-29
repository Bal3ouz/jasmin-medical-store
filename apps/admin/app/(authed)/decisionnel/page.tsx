import { PeriodPicker } from "@/components/bi/PeriodPicker";
import { ReportCard } from "@/components/bi/ReportCard";
import { Sparkline } from "@/components/bi/Sparkline";
import { createClient } from "@jasmin/db";
import {
  type BasketPair,
  type BestSellerRow,
  type CohortRow,
  type DeadStockRow,
  type NewsletterFunnel,
  type Period,
  type ReorderRow,
  type SalesKpis,
  getBasketPairs,
  getBestSellers,
  getCohortsMonthly,
  getDeadStock,
  getNewsletterFunnel,
  getReorderCandidates,
  getSalesKpis,
  getSalesTrend,
  parsePeriod,
  periodToInterval,
} from "@jasmin/db/queries";
import { VOICE, formatTND } from "@jasmin/lib";
import { H1Editorial, LabelEyebrow, Stat } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DecisionnelOverviewPage(props: {
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

  const [kpis, trend, bestSellers, pairs, reorder, dead, cohorts, funnel] = await Promise.all([
    getSalesKpis(db, { since: interval.since }),
    getSalesTrend(db, { since: interval.since, granularity: interval.granularity }),
    getBestSellers(db, { since: interval.since, sortBy: "qty", limit: 3 }),
    getBasketPairs(db, { since: interval.since, limit: 3 }),
    getReorderCandidates(db, { limit: 3 }),
    getDeadStock(db, { since: interval.since, limit: 3 }),
    getCohortsMonthly(db, { since: interval.since }),
    getNewsletterFunnel(db, { since: interval.since }),
  ]);

  const trendChartData = trend.map((t) => ({ revenue: t.revenue }));
  const latestCohort: CohortRow | undefined = cohorts[0];
  const repeatPct = `${Math.round((latestCohort?.repeatRate ?? 0) * 100)} %`;
  const conversionPct = `${Math.round(funnel.conversionRate * 100)} %`;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">Décisionnel</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>

      <KpiGrid kpis={kpis} repeatPct={repeatPct} conversionPct={conversionPct} />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SalesTrendCard period={period} trendChartData={trendChartData} />
        <BestSellersCard period={period} rows={bestSellers} />
        <BasketCard period={period} pairs={pairs} />
        <StockHealthCard period={period} reorder={reorder} dead={dead} />
        <CohortsCard period={period} latest={latestCohort} />
        <FunnelCard period={period} funnel={funnel} />
      </section>
    </div>
  );
}

function KpiGrid({
  kpis,
  repeatPct,
  conversionPct,
}: {
  kpis: SalesKpis;
  repeatPct: string;
  conversionPct: string;
}) {
  return (
    <section className="grid grid-cols-2 gap-6 lg:grid-cols-6">
      <Stat label={VOICE.biRevenueLabel} value={formatTND(kpis.totalRevenue)} />
      <Stat label={VOICE.biOrdersLabel} value={String(kpis.orderCount)} />
      <Stat label={VOICE.biAovLabel} value={formatTND(kpis.aov)} />
      <Stat label={VOICE.biNewCustomersLabel} value={String(kpis.customerCount)} />
      <Stat label={VOICE.biRepeatRateLabel} value={repeatPct} />
      <Stat label={VOICE.biConversionRateLabel} value={conversionPct} />
    </section>
  );
}

function DrillLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm text-warm-taupe-soft hover:text-deep-teal">
      Voir le détail →
    </Link>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-warm-taupe-soft">{label}</span>
      <span className="font-display text-2xl text-deep-teal tabular-nums">{value}</span>
    </div>
  );
}

function EmptyBody() {
  return <p className="text-sm text-warm-taupe-soft">{VOICE.biEmpty}</p>;
}

function SalesTrendCard({
  period,
  trendChartData,
}: {
  period: Period;
  trendChartData: { revenue: number }[];
}) {
  return (
    <ReportCard
      title={VOICE.biSalesTrend}
      action={<DrillLink href={`/decisionnel/ventes?period=${period}`} />}
    >
      {trendChartData.length === 0 ? (
        <EmptyBody />
      ) : (
        <Sparkline data={trendChartData} yKey="revenue" />
      )}
    </ReportCard>
  );
}

function BestSellersCard({ period, rows }: { period: Period; rows: BestSellerRow[] }) {
  return (
    <ReportCard
      title={VOICE.biBestSellers}
      subtitle={VOICE.biSubtitleQty}
      action={<DrillLink href={`/decisionnel/best-sellers?period=${period}`} />}
    >
      {rows.length === 0 ? (
        <EmptyBody />
      ) : (
        <ol className="space-y-3">
          {rows.map((r) => (
            <li key={r.productId} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-warm-taupe">{r.name}</span>
              <span className="font-display text-deep-teal text-lg tabular-nums">{r.qty}</span>
            </li>
          ))}
        </ol>
      )}
    </ReportCard>
  );
}

function BasketCard({ period, pairs }: { period: Period; pairs: BasketPair[] }) {
  return (
    <ReportCard
      title={VOICE.biBasket}
      action={<DrillLink href={`/decisionnel/panier?period=${period}`} />}
    >
      {pairs.length === 0 ? (
        <EmptyBody />
      ) : (
        <ul className="space-y-3 text-sm">
          {pairs.map((p) => (
            <li key={`${p.productAId}-${p.productBId}`} className="text-warm-taupe">
              <span className="block truncate">
                {p.productAName} + {p.productBName}
              </span>
              <span className="text-warm-taupe-soft text-xs">
                {p.count}× ×{p.lift.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  );
}

function StockHealthCard({
  period,
  reorder,
  dead,
}: {
  period: Period;
  reorder: ReorderRow[];
  dead: DeadStockRow[];
}) {
  return (
    <ReportCard
      title={VOICE.biStockHealth}
      action={<DrillLink href={`/decisionnel/stock?period=${period}`} />}
    >
      <div className="space-y-3">
        <MetricRow label={VOICE.biReorderHint} value={reorder.length} />
        <MetricRow label={VOICE.biDeadStockHint} value={dead.length} />
      </div>
    </ReportCard>
  );
}

function CohortsCard({ period, latest }: { period: Period; latest: CohortRow | undefined }) {
  const action = <DrillLink href={`/decisionnel/cohortes?period=${period}`} />;
  if (!latest) {
    return (
      <ReportCard title={VOICE.biCohorts} action={action}>
        <EmptyBody />
      </ReportCard>
    );
  }
  const cohortDate = new Date(latest.cohortMonth);
  const label = cohortDate.toLocaleDateString("fr-TN", {
    month: "short",
    year: "numeric",
  });
  const repeatPct = `${Math.round(latest.repeatRate * 100)} %`;
  return (
    <ReportCard title={VOICE.biCohorts} subtitle={label} action={action}>
      <div className="space-y-3">
        <MetricRow label={VOICE.biNewCustomersLabel} value={latest.customers} />
        <MetricRow label={VOICE.biRepeatRateLabel} value={repeatPct} />
      </div>
    </ReportCard>
  );
}

function FunnelCard({ period, funnel }: { period: Period; funnel: NewsletterFunnel }) {
  const action = <DrillLink href={`/decisionnel/conversion?period=${period}`} />;
  if (funnel.subscribers === 0) {
    return (
      <ReportCard title={VOICE.biFunnel} action={action}>
        <EmptyBody />
      </ReportCard>
    );
  }
  const conversionPct = `${Math.round(funnel.conversionRate * 100)} %`;
  return (
    <ReportCard title={VOICE.biFunnel} action={action}>
      <div className="space-y-3">
        <MetricRow
          label="Abonnés / Ont commandé"
          value={`${funnel.subscribers} / ${funnel.subscribersWhoOrdered}`}
        />
        <MetricRow label={VOICE.biConversionRateLabel} value={conversionPct} />
      </div>
    </ReportCard>
  );
}

function DegradedHeader({
  period,
  sp,
}: {
  period: Period;
  sp: Record<string, string | undefined>;
}) {
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">Décisionnel</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>
      <p className="text-warm-taupe-soft text-sm">Base de données non configurée.</p>
    </div>
  );
}
