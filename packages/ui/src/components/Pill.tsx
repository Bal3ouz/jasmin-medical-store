import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

const pillStyles = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-[var(--font-label)] font-medium tracking-wider uppercase",
  {
    variants: {
      tone: {
        teal: "bg-deep-teal/10 text-deep-teal",
        jasmine: "bg-jasmine/30 text-warm-taupe",
        taupe: "bg-linen text-warm-taupe",
        out: "bg-warm-taupe/10 text-warm-taupe-soft",
      },
    },
    defaultVariants: { tone: "teal" },
  },
);

export interface PillProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof pillStyles> {}

export function Pill({ tone, className, ...rest }: PillProps) {
  return <span className={cn(pillStyles({ tone }), className)} {...rest} />;
}
