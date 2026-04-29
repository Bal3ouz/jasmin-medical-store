import type { Period } from "@jasmin/db/queries";
import { VOICE } from "@jasmin/lib";
import { cn } from "@jasmin/ui";

const PRESETS: { key: Period; label: string }[] = [
  { key: "7d", label: VOICE.biPeriod7d },
  { key: "30d", label: VOICE.biPeriod30d },
  { key: "90d", label: VOICE.biPeriod90d },
  { key: "12m", label: VOICE.biPeriod12m },
  { key: "all", label: VOICE.biPeriodAll },
];

export function PeriodPicker({
  current,
  searchParams,
}: {
  current: Period;
  searchParams: Record<string, string | undefined>;
}) {
  const carry = Object.entries(searchParams).filter(([k]) => k !== "period");
  return (
    <form method="get" className="inline-flex flex-wrap gap-2">
      {carry.map(([k, v]) =>
        v === undefined ? null : <input key={k} type="hidden" name={k} value={v} />,
      )}
      {PRESETS.map((p) => {
        const active = p.key === current;
        return (
          <button
            key={p.key}
            type="submit"
            name="period"
            value={p.key}
            className={cn(
              "rounded-pill px-4 py-1.5 text-xs uppercase tracking-[0.16em] transition-colors",
              active
                ? "bg-deep-teal text-cream-sand"
                : "bg-linen text-warm-taupe hover:bg-linen/70",
            )}
          >
            {p.label}
          </button>
        );
      })}
    </form>
  );
}
