"use client";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cn } from "../cn";

export interface MiniCartProps {
  count?: number;
  variant?: "default" | "cream";
}

export function MiniCart({ count = 0, variant = "default" }: MiniCartProps) {
  return (
    <Link
      href="/panier"
      aria-label={`Panier (${count})`}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-pill transition-colors hover:bg-linen/40",
        variant === "cream" ? "text-cream-sand" : "text-warm-taupe",
      )}
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-pill bg-jasmine px-1.5 text-[10px] font-semibold text-warm-taupe">
          {count}
        </span>
      )}
    </Link>
  );
}
