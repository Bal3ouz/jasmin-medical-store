"use client";
import { removeCartItemAction, updateCartItemAction } from "@/app/actions/cart";
import type { CartLine } from "@/lib/cart/server";
import { PriceTag, ProductImageFallback, Stepper, getImageUrl } from "@jasmin/ui";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useTransition } from "react";

export function CartLineItem({ line }: { line: CartLine }) {
  const [pending, start] = useTransition();
  const url = getImageUrl(line.imageStoragePath);

  const update = (qty: number) =>
    start(async () => {
      const fd = new FormData();
      fd.set("itemId", line.id);
      fd.set("quantity", String(qty));
      await updateCartItemAction(fd);
    });

  const remove = () =>
    start(async () => {
      const fd = new FormData();
      fd.set("itemId", line.id);
      await removeCartItemAction(fd);
    });

  return (
    <article className="flex gap-4 border-b border-linen pb-6 last:border-b-0">
      <div className="relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-md bg-linen">
        {url ? (
          <Image src={url} alt={line.productName} fill sizes="96px" className="object-cover" />
        ) : (
          <ProductImageFallback productName={line.productName} brandName={line.brandName} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-deep-teal/80">
              {line.brandName}
            </span>
            <h3 className="font-[var(--font-display)] text-base text-warm-taupe">
              {line.productName}
            </h3>
            {line.variantName && (
              <span className="font-[var(--font-body)] text-xs text-warm-taupe-soft">
                {line.variantName}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Retirer du panier"
            className="text-warm-taupe-soft transition-colors hover:text-deep-teal disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <Stepper value={line.quantity} onChange={update} max={Math.max(line.stockOnHand, 1)} />
          <PriceTag amount={line.lineTotalTnd} />
        </div>
      </div>
    </article>
  );
}
