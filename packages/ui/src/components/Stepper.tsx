"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "../cn";

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
  className,
  ariaLabel = "Quantité",
}: StepperProps) {
  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-11 items-center gap-3 rounded-pill bg-linen px-2 text-warm-taupe",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Diminuer"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-8 w-8 place-items-center rounded-pill text-deep-teal transition-colors hover:bg-cream-sand disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-6 text-center font-[var(--font-body)] text-base tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Augmenter"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-8 w-8 place-items-center rounded-pill text-deep-teal transition-colors hover:bg-cream-sand disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </fieldset>
  );
}
