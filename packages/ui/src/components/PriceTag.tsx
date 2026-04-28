import { formatTND } from "@jasmin/lib";
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export interface PriceTagProps extends HTMLAttributes<HTMLSpanElement> {
  /** TND amount — number (e.g., 32.9) or string from DB numeric (e.g., "32.900"). */
  amount: number | string;
  compareAt?: number | string | null;
}

function asNumber(v: number | string): number {
  return typeof v === "number" ? v : Number(v);
}

export function PriceTag({ amount, compareAt, className, ...rest }: PriceTagProps) {
  const price = asNumber(amount);
  const compare = compareAt != null ? asNumber(compareAt) : null;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)} {...rest}>
      <span className="font-[var(--font-body)] font-medium text-deep-teal">{formatTND(price)}</span>
      {compare && compare > price && (
        <span className="font-[var(--font-body)] text-warm-taupe-soft line-through text-sm">
          {formatTND(compare)}
        </span>
      )}
    </span>
  );
}
