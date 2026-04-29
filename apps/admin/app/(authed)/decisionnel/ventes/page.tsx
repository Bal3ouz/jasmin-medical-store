import { PeriodPicker } from "@/components/bi/PeriodPicker";
import { ReportCard } from "@/components/bi/ReportCard";
import { SimpleAreaChart } from "@/components/bi/SimpleAreaChart";
import { SimpleBarChart } from "@/components/bi/SimpleBarChart";
import { createClient } from "@jasmin/db";
import { getSalesKpis, getSalesTrend, parsePeriod, periodToInterval } from "@jasmin/db/queries";
import { VOICE, formatTND } from "@jasmin/lib";
import { H1Editorial, LabelEyebrow, Stat } from "@jasmin/ui";

export const dynamic = "force-dynamic";

export default async function VentesPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;
  const period = parsePeriod(sp.period);
  const interval = periodToInterval(period);

  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    return <DegradedHeader />;
  }
  const db = createClient(url);
  const [kpis, trend] = await Promise.all([
    getSalesKpis(db, { since: interval.since }),
    getSalesTrend(db, { since: interval.since, granularity: interval.granularity }),
  ]);

  const trendChart = trend.map((t) => ({
    date: t.bucket.toLocaleDateString("fr-TN", { day: "2-digit", month: "short" }),
    revenue: t.revenue,
    orders: t.orders,
  }));

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biSalesTrend}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>

      <section className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Stat label={VOICE.biRevenueLabel} value={formatTND(kpis.totalRevenue)} />
        <Stat label={VOICE.biOrdersLabel} value={String(kpis.orderCount)} />
        <Stat label={VOICE.biAovLabel} value={formatTND(kpis.aov)} />
        <Stat label={VOICE.biNewCustomersLabel} value={String(kpis.customerCount)} />
      </section>

      <ReportCard title={VOICE.biRevenueLabel}>
        {trendChart.length === 0 ? (
          <p>{VOICE.biEmpty}</p>
        ) : (
          <SimpleAreaChart
            data={trendChart}
            xKey="date"
            yKey="revenue"
            formatY={(v) => formatTND(v)}
          />
        )}
      </ReportCard>

      <ReportCard title={VOICE.biOrdersLabel}>
        {trendChart.length === 0 ? (
          <p>{VOICE.biEmpty}</p>
        ) : (
          <SimpleBarChart data={trendChart} xKey="date" yKey="orders" />
        )}
      </ReportCard>
    </div>
  );
}

function DegradedHeader() {
  return (
    <div>
      <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
      <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biSalesTrend}</H1Editorial>
      <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
    </div>
  );
}
