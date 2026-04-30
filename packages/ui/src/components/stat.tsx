import type { ReactNode } from "react";
import { cn } from "../cn";

export type StatTone =
  | "linen"
  | "teal"
  | "deepTeal"
  | "jasmine"
  | "terracotta"
  | "taupe";

export interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Optional small icon — e.g. a lucide-react element. Renders top-right. */
  icon?: ReactNode;
  /** Trend hint, e.g. "+12 %" — colored green for positive, terracotta for negative. */
  trend?: { delta: number; suffix?: string };
  /** Background tone. Default `linen`. */
  tone?: StatTone;
  className?: string;
}

const TONE_BG: Record<StatTone, string> = {
  linen: "bg-linen",
  teal: "bg-soft-teal/15",
  deepTeal: "bg-deep-teal text-cream-sand",
  jasmine: "bg-jasmine/40",
  terracotta: "bg-terracotta-whisper/40",
  taupe: "bg-warm-taupe/10",
};

const TONE_LABEL: Record<StatTone, string> = {
  linen: "text-warm-taupe-soft",
  teal: "text-deep-teal/70",
  deepTeal: "text-cream-sand/70",
  jasmine: "text-warm-taupe-soft",
  terracotta: "text-warm-taupe-soft",
  taupe: "text-warm-taupe-soft",
};

const TONE_VALUE: Record<StatTone, string> = {
  linen: "text-deep-teal",
  teal: "text-deep-teal",
  deepTeal: "text-cream-sand",
  jasmine: "text-deep-teal",
  terracotta: "text-warm-taupe",
  taupe: "text-deep-teal",
};

export function Stat({
  label,
  value,
  hint,
  icon,
  trend,
  tone = "linen",
  className,
}: StatProps) {
  const trendLabel =
    trend === undefined
      ? null
      : `${trend.delta > 0 ? "+" : ""}${Math.round(trend.delta)} ${trend.suffix ?? "%"}`;
  const trendColor =
    trend === undefined
      ? ""
      : trend.delta > 0
        ? "text-jasmine-dark"
        : trend.delta < 0
          ? "text-terracotta-whisper"
          : "text-warm-taupe-soft";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl px-6 py-7 shadow-soft transition-transform hover:-translate-y-0.5",
        TONE_BG[tone],
        className,
      )}
    >
      {icon ? (
        <span
          className={cn(
            "absolute top-5 right-5 inline-flex h-9 w-9 items-center justify-center rounded-full",
            tone === "deepTeal" ? "bg-cream-sand/15" : "bg-cream-sand/70",
          )}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}

      <div className={cn("text-[11px] uppercase tracking-[0.18em]", TONE_LABEL[tone])}>
        {label}
      </div>
      <div className={cn("mt-3 font-display text-4xl tabular-nums", TONE_VALUE[tone])}>
        {value}
      </div>
      <div className="mt-2 flex items-baseline gap-2 text-sm">
        {hint ? <span className={TONE_LABEL[tone]}>{hint}</span> : null}
        {trendLabel ? <span className={cn("font-medium", trendColor)}>{trendLabel}</span> : null}
      </div>
    </div>
  );
}
