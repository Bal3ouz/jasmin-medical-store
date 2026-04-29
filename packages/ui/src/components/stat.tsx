import type { ReactNode } from "react";
import { cn } from "../cn";

export interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}

export function Stat({ label, value, hint, className }: StatProps) {
  return (
    <div className={cn("rounded-2xl bg-linen px-6 py-7 shadow-soft", className)}>
      <div className="text-[11px] uppercase tracking-[0.18em] text-warm-taupe-soft">{label}</div>
      <div className="mt-3 font-display text-deep-teal text-4xl">{value}</div>
      {hint ? <div className="mt-2 text-sm text-warm-taupe-soft">{hint}</div> : null}
    </div>
  );
}
