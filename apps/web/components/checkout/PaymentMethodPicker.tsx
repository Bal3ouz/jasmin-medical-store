"use client";
import { cn } from "@jasmin/ui";
import { useState } from "react";

const METHODS = [
  {
    value: "cash_on_delivery",
    label: "Paiement à la livraison",
    desc: "Vous payez en main propre.",
    available: true,
  },
  {
    value: "card_konnect",
    label: "Carte bancaire (Konnect)",
    desc: "Bientôt disponible.",
    available: false,
  },
  {
    value: "card_clic_to_pay",
    label: "Click to Pay (SMT)",
    desc: "Bientôt disponible.",
    available: false,
  },
  {
    value: "bank_transfer",
    label: "Virement bancaire",
    desc: "Sur devis pour gros volumes.",
    available: false,
  },
] as const;

export function PaymentMethodPicker() {
  const [value, setValue] = useState<(typeof METHODS)[number]["value"]>("cash_on_delivery");
  return (
    <div role="radiogroup" aria-label="Mode de paiement" className="space-y-3">
      {METHODS.map((m) => {
        const active = m.value === value;
        return (
          <label
            key={m.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all",
              !m.available && "cursor-not-allowed opacity-50",
              active
                ? "border-deep-teal bg-linen/60 shadow-soft"
                : "border-linen hover:border-deep-teal/30",
            )}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={m.value}
              checked={active}
              disabled={!m.available}
              onChange={() => m.available && setValue(m.value)}
              className="mt-1 accent-deep-teal"
            />
            <span>
              <span className="block font-[var(--font-body)] font-medium text-warm-taupe">
                {m.label}
              </span>
              <span className="block font-[var(--font-body)] text-sm text-warm-taupe-soft">
                {m.desc}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
