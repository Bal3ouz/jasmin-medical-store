"use client";
import { formatTND } from "@jasmin/lib";
import {
  CartesianGrid,
  Line,
  LineChart,
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

type FormatY = "tnd" | "int";

function applyFormat(token: FormatY | undefined, v: number): string {
  if (token === "tnd") return formatTND(v);
  if (token === "int") return String(Math.round(v));
  return String(v);
}

export function SimpleLineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  formatY,
  height = 260,
}: {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  /** String token (not a function) so the prop is RSC-serialisable. */
  formatY?: FormatY;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
        <Line
          dataKey={yKey as string}
          stroke="var(--color-deep-teal)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
