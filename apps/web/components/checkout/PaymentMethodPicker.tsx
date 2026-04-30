import { Banknote } from "lucide-react";

/**
 * Cash-on-delivery is the only supported payment method. Renders as a
 * disabled-looking confirmation block so the customer knows what to expect,
 * with a hidden input that submits the canonical value.
 */
export function PaymentMethodPicker() {
  return (
    <div className="rounded-lg border border-deep-teal/20 bg-linen/60 p-5 shadow-soft">
      <input type="hidden" name="paymentMethod" value="cash_on_delivery" />
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-deep-teal/10 text-deep-teal"
        >
          <Banknote className="h-4 w-4" />
        </span>
        <div>
          <div className="font-[var(--font-body)] font-medium text-warm-taupe">
            Paiement à la livraison
          </div>
          <p className="mt-1 font-[var(--font-body)] text-sm leading-[1.5] text-warm-taupe-soft">
            Vous payez en main propre au livreur, en espèces. Aucun montant n&apos;est prélevé en
            ligne.
          </p>
        </div>
      </div>
    </div>
  );
}
