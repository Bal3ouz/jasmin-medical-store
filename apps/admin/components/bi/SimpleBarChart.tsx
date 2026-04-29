"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TICK = {
  fontSize: 11,
  fill: "var(--color-warm-taupe-soft)",
  fontFamily: "var(--font-label)",
};

export function SimpleBarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  formatY,
  height = 260,
}: {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  formatY?: (v: number) => string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-linen)" />
        <XAxis dataKey={xKey as string} tick={TICK} axisLine={false} tickLine={false} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={formatY} />
        <Tooltip
          contentStyle={{
            background: "var(--color-cream-sand)",
            border: "none",
            borderRadius: 12,
            boxShadow: "var(--shadow-soft)",
          }}
          formatter={(v: number) => (formatY ? formatY(v) : String(v))}
        />
        <Bar dataKey={yKey as string} fill="var(--color-deep-teal)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
