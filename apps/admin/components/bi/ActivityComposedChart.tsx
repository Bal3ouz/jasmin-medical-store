"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TICK = {
  fontSize: 11,
  fill: "var(--color-warm-taupe-soft)",
  fontFamily: "var(--font-label)",
};

export interface ActivityPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}

/**
 * Hero combo chart for the admin home: revenue area (left axis, jasmine fill +
 * deep-teal stroke) layered with order-count bars (right axis, soft-teal).
 * Tooltip formats revenue as TND with millimes.
 */
export function ActivityComposedChart({
  data,
  height = 280,
}: {
  data: ActivityPoint[];
  height?: number;
}) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("fr-TN", { day: "2-digit", month: "short" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={formatted} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-jasmine)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--color-jasmine)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-linen)" vertical={false} />
        <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
        <YAxis
          yAxisId="left"
          tick={TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${Math.round(v)}`}
          width={48}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}`}
          width={28}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-cream-sand)",
            border: "none",
            borderRadius: 12,
            boxShadow: "var(--shadow-soft)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
          }}
          formatter={(v: number, key) =>
            key === "revenue" ? [`${v.toFixed(3)} TND`, "Revenu"] : [`${v}`, "Commandes"]
          }
          labelStyle={{ color: "var(--color-deep-teal)", fontWeight: 600 }}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-deep-teal)"
          strokeWidth={2.5}
          fill="url(#revFill)"
        />
        <Bar
          yAxisId="right"
          dataKey="orders"
          fill="var(--color-soft-teal)"
          fillOpacity={0.85}
          radius={[4, 4, 0, 0]}
          maxBarSize={14}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
