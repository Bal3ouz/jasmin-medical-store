import type { ReactNode } from "react";
import { cn } from "../cn";

export interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** seconds for one full loop */
  duration?: number;
}

export function Marquee({ children, className, duration = 32 }: MarqueeProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="flex w-max animate-[jasmin-marquee_var(--mq-d)_linear_infinite] gap-16"
        style={{ ["--mq-d" as never]: `${duration}s` }}
      >
        <div className="flex shrink-0 items-center gap-16">{children}</div>
        <div className="flex shrink-0 items-center gap-16" aria-hidden>{children}</div>
      </div>
      <style>{`@keyframes jasmin-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
