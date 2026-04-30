"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmées",
  preparing: "En préparation",
  shipped: "Expédiées",
  delivered: "Livrées",
  cancelled: "Annulées",
  refunded: "Remboursées",
};

// Brand-tone palette. Active states pull deep / jasmine; settled states stay
// neutral; recovery states soften toward terracotta.
const STATUS_COLOR: Record<string, string> = {
  pending: "var(--color-terracotta-whisper)",
  confirmed: "var(--color-soft-teal)",
  preparing: "var(--color-deep-teal)",
  shipped: "var(--color-jasmine)",
  delivered: "var(--color-jasmine-dark)",
  cancelled: "var(--color-warm-taupe-soft)",
  refunded: "var(--color-warm-taupe)",
};

export interface StatusSlice {
  status: keyof typeof STATUS_LABEL;
  count: number;
}

/**
 * Donut chart showing order-status distribution. The big number in the center
 * is the total — gives the prospect a "command center" feel at a glance.
 */
export function StatusDonut({
  slices,
  height = 240,
}: {
  slices: StatusSlice[];
  height?: number;
}) {
  const data = slices
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABEL[s.status] ?? s.status,
      value: s.count,
      key: s.status,
    }));
  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-warm-taupe-soft">
        Pas encore de commandes sur la période.
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            dataKey="value"
            stroke="var(--color-cream-sand)"
            strokeWidth={3}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={STATUS_COLOR[d.key as keyof typeof STATUS_COLOR]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-cream-sand)",
              border: "none",
              borderRadius: 12,
              boxShadow: "var(--shadow-soft)",
              fontFamily: "var(--font-body)",
              fontSize: 12,
            }}
            formatter={(v: number, name) => [`${v} commande${v > 1 ? "s" : ""}`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.18em] text-warm-taupe-soft">
          Commandes
        </span>
        <span className="font-display text-4xl text-deep-teal italic">{total}</span>
        <span className="text-[10px] tracking-wide text-warm-taupe-soft">30 derniers jours</span>
      </div>
    </div>
  );
}

/** Keyed legend strip — pairs with StatusDonut. Renders a compact list of
 *  {color dot · status label · count}. Stays accessible without a chart. */
export function StatusLegend({ slices }: { slices: StatusSlice[] }) {
  const sorted = [...slices].sort((a, b) => b.count - a.count);
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
      {sorted.map((s) => (
        <li key={s.status} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: STATUS_COLOR[s.status] }}
            aria-hidden
          />
          <span className="flex-1 truncate text-warm-taupe">{STATUS_LABEL[s.status]}</span>
          <span className="font-medium tabular-nums text-deep-teal">{s.count}</span>
        </li>
      ))}
    </ul>
  );
}
