import { PriceTag } from "@jasmin/ui";

export function CartTotals({
  subtotalTnd,
  shippingTnd,
  totalTnd,
}: {
  subtotalTnd: number;
  shippingTnd: number;
  totalTnd: number;
}) {
  return (
    <dl className="space-y-2 font-[var(--font-body)] text-sm text-warm-taupe">
      <div className="flex items-center justify-between">
        <dt>Sous-total</dt>
        <dd>
          <PriceTag amount={subtotalTnd} />
        </dd>
      </div>
      <div className="flex items-center justify-between">
        <dt>Livraison</dt>
        <dd>
          {shippingTnd === 0 ? (
            <span className="font-medium text-deep-teal">Offerte</span>
          ) : (
            <PriceTag amount={shippingTnd} />
          )}
        </dd>
      </div>
      <div className="flex items-center justify-between border-t border-linen pt-3 text-base font-semibold">
        <dt>Total TTC</dt>
        <dd>
          <PriceTag amount={totalTnd} />
        </dd>
      </div>
    </dl>
  );
}
