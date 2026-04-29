import { PeriodPicker } from "@/components/bi/PeriodPicker";
import { ReportCard } from "@/components/bi/ReportCard";
import { createClient } from "@jasmin/db";
import {
  type CohortRow,
  getCohortsMonthly,
  parsePeriod,
  periodToInterval,
} from "@jasmin/db/queries";
import { VOICE, formatTND } from "@jasmin/lib";
import { H1Editorial, LabelEyebrow } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CohortesPage(props: {
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
  const rows = await getCohortsMonthly(db, { since: interval.since });

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biCohorts}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>

      <ReportCard title={VOICE.biCohorts}>
        {rows.length === 0 ? (
          <p className="text-warm-taupe-soft">{VOICE.biEmpty}</p>
        ) : (
          <CohortTable rows={rows} />
        )}
      </ReportCard>
    </div>
  );
}

function CohortTable({ rows }: { rows: CohortRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-linen border-b text-warm-taupe-soft text-xs uppercase tracking-[0.12em]">
            <th className="py-3 pe-4">Cohorte</th>
            <th className="py-3 pe-4 text-right">Clients</th>
            <th className="py-3 pe-4 text-right">Commandes</th>
            <th className="py-3 pe-4 text-right">Revenu</th>
            <th className="py-3 pe-4 text-right">{VOICE.biRepeatRateLabel}</th>
            <th className="py-3 text-right">LTV</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const cohortDate = new Date(r.cohortMonth);
            const yyyymm = cohortDate.toISOString().slice(0, 7);
            const label = cohortDate.toLocaleDateString("fr-TN", {
              month: "short",
              year: "numeric",
            });
            const href = `/clients?cohort=${yyyymm}`;
            const repeatPct = `${Math.round(r.repeatRate * 100)} %`;
            return (
              <tr
                key={r.cohortMonth}
                className="border-linen border-b last:border-b-0 hover:bg-linen/50"
              >
                <td className="py-3 pe-4">
                  <Link href={href} className="text-deep-teal hover:underline">
                    {label}
                  </Link>
                </td>
                <td className="py-3 pe-4 text-right tabular-nums">{r.customers}</td>
                <td className="py-3 pe-4 text-right tabular-nums">{r.ordersTotal}</td>
                <td className="py-3 pe-4 text-right tabular-nums">{formatTND(r.revenueTotal)}</td>
                <td className="py-3 pe-4 text-right tabular-nums">{repeatPct}</td>
                <td className="py-3 text-right tabular-nums">{formatTND(r.ltv)}</td>
              </tr>
            );
          })}
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
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biCohorts}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>
      <p className="text-warm-taupe-soft text-sm">Base de données non configurée.</p>
    </div>
  );
}
