export interface FunnelStep {
  label: string;
  value: number;
}

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  if (steps.length === 0) return null;
  const top = steps[0]!.value || 1;
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const pct = (s.value / top) * 100;
        const dropPct = i > 0 ? (s.value / (steps[i - 1]!.value || 1)) * 100 : 100;
        return (
          <li key={s.label} className="rounded-2xl bg-linen p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-warm-taupe">{s.label}</span>
              <span className="font-display text-2xl text-deep-teal">{s.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-pill bg-cream-sand">
              <div className="h-full rounded-pill bg-deep-teal" style={{ width: `${pct}%` }} />
            </div>
            {i > 0 ? (
              <div className="mt-2 text-right text-warm-taupe-soft text-xs">
                {Math.round(dropPct)}% des précédents
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
