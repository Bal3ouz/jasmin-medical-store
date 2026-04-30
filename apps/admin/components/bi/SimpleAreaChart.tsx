"use client";
import { formatTND } from "@jasmin/lib";
import {
  Area,
  AreaChart,
  CartesianGrid,
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

/**
 * `formatY` is a string token rather than a function so the prop survives the
 * server→client boundary. Functions get serialized by Next.js, which refuses
 * non-`use server` callbacks (the trend click in /decisionnel/ventes was
 * crashing with "Functions cannot be passed directly to Client Components").
 */
type FormatY = "tnd" | "int";

function applyFormat(token: FormatY | undefined, v: number): string {
  if (token === "tnd") return formatTND(v);
  if (token === "int") return String(Math.round(v));
  return String(v);
}

export function SimpleAreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  formatY,
  height = 260,
}: {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  formatY?: FormatY;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-linen)" />
        <XAxis dataKey={xKey as string} tick={TICK} axisLine={false} tickLine={false} />
        <YAxis
          tick={TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => applyFormat(formatY, v)}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-cream-sand)",
            border: "none",
            borderRadius: 12,
            boxShadow: "var(--shadow-soft)",
          }}
          formatter={(v: number) => applyFormat(formatY, v)}
        />
        <Area
          dataKey={yKey as string}
          stroke="var(--color-deep-teal)"
          strokeWidth={2}
          fill="var(--color-jasmine)"
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
