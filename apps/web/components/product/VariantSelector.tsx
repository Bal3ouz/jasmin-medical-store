"use client";
import type { ProductVariant } from "@jasmin/db";
import { cn } from "@jasmin/ui";

export function VariantSelector({
  variants,
  value,
  onChange,
}: {
  variants: ProductVariant[];
  value: string;
  onChange: (variantId: string) => void;
}) {
  if (variants.length === 0) return null;
  return (
    <div role="radiogroup" aria-label="Format" className="flex flex-wrap gap-2">
      {variants.map((v) => {
        const active = v.id === value;
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v.id)}
            className={cn(
              "rounded-pill px-5 py-2 font-[var(--font-label)] text-sm transition-colors",
              active ? "bg-deep-teal text-cream-sand" : "bg-linen text-deep-teal hover:bg-linen/70",
            )}
          >
            {v.name}
          </button>
        );
      })}
    </div>
  );
}
