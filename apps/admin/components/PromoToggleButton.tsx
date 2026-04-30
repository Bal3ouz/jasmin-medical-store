"use client";

import { togglePromoAction } from "@/app/actions/products";
import { cn } from "@jasmin/ui";
import { Tag } from "lucide-react";
import { useTransition } from "react";

/** Quick toggle on the product list — flips `is_promo` and revalidates. */
export function PromoToggleButton({ id, isPromo }: { id: string; isPromo: boolean }) {
  const [pending, start] = useTransition();
  const next = !isPromo;
  return (
    <button
      type="button"
      title={isPromo ? "Retirer de la promo" : "Mettre en promo"}
      aria-pressed={isPromo}
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const fd = new FormData();
        fd.set("id", id);
        fd.set("isPromo", String(next));
        start(() => {
          void togglePromoAction(fd);
        });
      }}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors",
        isPromo
          ? "bg-terracotta/30 text-deep-teal hover:bg-terracotta/50"
          : "border border-linen text-warm-taupe-soft hover:border-terracotta/40 hover:text-deep-teal",
        pending && "opacity-50",
      )}
    >
      <Tag className="h-3 w-3" aria-hidden />
      {isPromo ? "En promo" : "Activer"}
    </button>
  );
}
