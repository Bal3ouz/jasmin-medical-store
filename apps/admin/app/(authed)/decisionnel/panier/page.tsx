import { PeriodPicker } from "@/components/bi/PeriodPicker";
import { ReportCard } from "@/components/bi/ReportCard";
import { createClient } from "@jasmin/db";
import { type BasketPair, getBasketPairs, parsePeriod, periodToInterval } from "@jasmin/db/queries";
import { VOICE } from "@jasmin/lib";
import { H1Editorial, LabelEyebrow, Pill } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

function liftTone(lift: number): "jasmine" | "teal" | "taupe" {
  if (lift > 1.5) return "jasmine";
  if (lift > 1.0) return "teal";
  return "taupe";
}

export default async function PanierPage(props: {
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
  const pairs = await getBasketPairs(db, { since: interval.since, limit: 20 });

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>{VOICE.biTitle}</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biBasket}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>

      {pairs.length === 0 ? (
        <ReportCard title={VOICE.biBasket}>
          <p className="text-warm-taupe-soft">{VOICE.biEmpty}</p>
        </ReportCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {pairs.map((pair) => (
            <PairCard key={`${pair.productAId}-${pair.productBId}`} pair={pair} />
          ))}
        </div>
      )}
    </div>
  );
}

function PairCard({ pair }: { pair: BasketPair }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-cream-sand p-6 shadow-soft">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <Link
          href={`/catalogue/produits/${pair.productAId}`}
          className="font-display text-deep-teal text-xl italic hover:underline"
        >
          {pair.productAName}
        </Link>
        <span aria-hidden className="text-warm-taupe-soft text-xl">
          +
        </span>
        <Link
          href={`/catalogue/produits/${pair.productBId}`}
          className="font-display text-deep-teal text-xl italic hover:underline"
        >
          {pair.productBName}
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="taupe">
          {VOICE.biSeenTogetherLabel}: {pair.count}
        </Pill>
        <Pill tone={liftTone(pair.lift)}>
          {VOICE.biLiftLabel}: ×{pair.lift.toFixed(2)}
        </Pill>
      </div>
    </article>
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
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{VOICE.biBasket}</H1Editorial>
        </div>
        <PeriodPicker current={period} searchParams={sp} />
      </header>
      <p className="text-warm-taupe-soft text-sm">Base de données non configurée.</p>
    </div>
  );
}
