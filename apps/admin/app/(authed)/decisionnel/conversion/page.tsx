import { Funnel } from "@/components/bi/Funnel";
import { PeriodPicker } from "@/components/bi/PeriodPicker";
import { ReportCard } from "@/components/bi/ReportCard";
import { createClient } from "@jasmin/db";
import { getNewsletterFunnel, parsePeriod, periodToInterval } from "@jasmin/db/queries";
import { VOICE } from "@jasmin/lib";
import { H1Editorial, LabelEyebrow, Stat } from "@jasmin/ui";

export const dynamic = "force-dynamic";

export default async function ConversionPage(props: {
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
  const funnel = await getNewsletterFunnel(db, { since: interval.since });

  const conversionPct = `${Math.round(funnel.conversionRate * 100)} %`;
  const isEmpty = funnel.subscribers === 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biFunnel}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>

      <ReportCard title={VOICE.biFunnel}>
        {isEmpty ? (
          <p className="text-warm-taupe-soft">{VOICE.biEmpty}</p>
        ) : (
          <div className="space-y-6">
            <Stat label={VOICE.biConversionRateLabel} value={conversionPct} />
            <Funnel
              steps={[
                { label: "Abonnés newsletter", value: funnel.subscribers },
                { label: "Ont commandé", value: funnel.subscribersWhoOrdered },
              ]}
            />
          </div>
        )}
      </ReportCard>

      <p className="text-warm-taupe-soft text-sm">
        Comparaison entre les abonnés à la newsletter et ceux qui ont passé une commande sur la
        période sélectionnée. Un abonnement compte dès l'inscription.
      </p>
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
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biFunnel}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>
      <p className="text-warm-taupe-soft text-sm">Base de données non configurée.</p>
    </div>
  );
}
