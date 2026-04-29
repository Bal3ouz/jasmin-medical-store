import type { ReactNode } from "react";
import { cn } from "../cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 rounded-lg bg-linen px-8 py-16 text-center",
        className,
      )}
    >
      {illustration && <div className="opacity-70">{illustration}</div>}
      <div className="max-w-md space-y-2">
        <h2 className="font-[var(--font-display)] text-2xl italic text-deep-teal">{title}</h2>
        {description && (
          <p className="font-[var(--font-body)] text-sm leading-[1.6] text-warm-taupe-soft">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
