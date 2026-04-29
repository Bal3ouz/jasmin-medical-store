export type Period = "7d" | "30d" | "90d" | "12m" | "all";
export type Granularity = "day" | "week" | "month";

export interface PeriodInterval {
  period: Period;
  since: Date | null;
  until: Date;
  granularity: Granularity;
}

const PERIODS: ReadonlySet<Period> = new Set(["7d", "30d", "90d", "12m", "all"]);

export function parsePeriod(input: string | undefined): Period {
  return input && PERIODS.has(input as Period) ? (input as Period) : "30d";
}

function subDays(d: Date, n: number) {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() - n);
  return out;
}
function subMonths(d: Date, n: number) {
  const out = new Date(d);
  out.setUTCMonth(out.getUTCMonth() - n);
  return out;
}

export function periodToInterval(period: Period, now: Date = new Date()): PeriodInterval {
  switch (period) {
    case "7d":
      return { period, since: subDays(now, 7), until: now, granularity: "day" };
    case "30d":
      return { period, since: subDays(now, 30), until: now, granularity: "day" };
    case "90d":
      return { period, since: subDays(now, 90), until: now, granularity: "week" };
    case "12m":
      return { period, since: subMonths(now, 12), until: now, granularity: "month" };
    case "all":
      return { period, since: null, until: now, granularity: "month" };
  }
}

export function periodDays(i: PeriodInterval): number {
  if (i.since === null) return 365 * 5;
  return Math.max(1, Math.round((i.until.getTime() - i.since.getTime()) / 86_400_000));
}
