import type { CartLine } from "@/lib/cart/server";
import { PriceTag, ProductImageFallback, getImageUrl } from "@jasmin/ui";
import Image from "next/image";

export function OrderSummary({
  lines,
  subtotalTnd,
  shippingTnd,
  totalTnd,
}: {
  lines: CartLine[];
  subtotalTnd: number;
  shippingTnd: number;
  totalTnd: number;
}) {
  return (
    <div className="rounded-lg bg-linen/60 p-6">
      <h2 className="font-[var(--font-display)] text-xl italic text-deep-teal">Récapitulatif</h2>
      <ul className="mt-6 space-y-4">
        {lines.map((line) => {
          const url = getImageUrl(line.imageStoragePath);
          return (
            <li key={line.id} className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-cream-sand">
                {url ? (
                  <Image
                    src={url}
                    alt={line.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <ProductImageFallback productName={line.productName} brandName={line.brandName} />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-[var(--font-display)] text-sm text-warm-taupe">
                  {line.productName}
                </span>
                <span className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.2em] text-warm-taupe-soft">
                  {line.variantName ? `${line.variantName} · ` : ""}× {line.quantity}
                </span>
              </div>
              <PriceTag amount={line.lineTotalTnd} />
            </li>
          );
        })}
      </ul>
      <dl className="mt-6 space-y-2 border-t border-linen pt-4 font-[var(--font-body)] text-sm text-warm-taupe">
        <Row label="Sous-total" value={<PriceTag amount={subtotalTnd} />} />
        <Row
          label="Livraison"
          value={
            shippingTnd === 0 ? (
              <span className="font-medium text-deep-teal">Offerte</span>
            ) : (
              <PriceTag amount={shippingTnd} />
            )
          }
        />
        <Row label="Total TTC" value={<PriceTag amount={totalTnd} />} bold />
      </dl>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div
      className={
        bold
          ? "flex items-center justify-between border-t border-linen pt-3 text-base font-semibold"
          : "flex items-center justify-between"
      }
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
