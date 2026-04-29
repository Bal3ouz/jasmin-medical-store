"use client";
import { Line, LineChart, ResponsiveContainer } from "recharts";

export function Sparkline<T extends Record<string, unknown>>({
  data,
  yKey,
  height = 40,
}: {
  data: T[];
  yKey: keyof T;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          dataKey={yKey as string}
          stroke="var(--color-deep-teal)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
