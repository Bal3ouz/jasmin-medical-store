"use client";
import { type CheckoutResult, createOrderAction } from "@/app/actions/checkout";
import { VOICE } from "@jasmin/lib";
import { BodyText, Button, Input } from "@jasmin/ui";
import { useState, useTransition } from "react";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { ShippingAddressForm } from "./ShippingAddressForm";

export function CheckoutForm({ isGuest }: { isGuest: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CheckoutResult | null>(null);

  return (
    <form
      action={(fd) => {
        setResult(null);
        startTransition(async () => {
          const r = await createOrderAction(fd);
          if (!r.ok) setResult(r);
        });
      }}
      className="space-y-10"
    >
      <section>
        <h2 className="font-[var(--font-display)] text-2xl italic text-deep-teal">
          Adresse de livraison
        </h2>
        <BodyText className="mt-2 text-warm-taupe-soft">
          Nous livrons partout en Tunisie sous 48 à 72 heures.
        </BodyText>
        <div className="mt-6">
          <ShippingAddressForm />
        </div>
      </section>

      {isGuest && (
        <section>
          <h2 className="font-[var(--font-display)] text-2xl italic text-deep-teal">
            Vos coordonnées
          </h2>
          <BodyText className="mt-2 text-warm-taupe-soft">
            Pour vous tenir au courant de votre commande.
          </BodyText>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
                Email
              </span>
              <Input name="guestEmail" type="email" required />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
                Téléphone
              </span>
              <Input name="guestPhone" type="tel" required placeholder="+216 …" />
            </label>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-[var(--font-display)] text-2xl italic text-deep-teal">
          Mode de paiement
        </h2>
        <BodyText className="mt-2 text-warm-taupe-soft">{VOICE.codNotice}</BodyText>
        <div className="mt-6">
          <PaymentMethodPicker />
        </div>
      </section>

      <section>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
            Instructions à la livraison (optionnel)
          </span>
          <textarea
            name="notesCustomer"
            rows={3}
            className="w-full rounded-md bg-linen px-4 py-3 font-[var(--font-body)] text-base text-warm-taupe placeholder:text-warm-taupe-soft focus:outline-none focus:ring-2 focus:ring-deep-teal/40"
            placeholder="Sonnez deux fois, laissez chez la concierge…"
          />
        </label>
      </section>

      {result && !result.ok && (
        <p role="alert" className="rounded-md bg-warm-taupe/10 px-4 py-3 text-sm text-warm-taupe">
          {result.error ?? "Une erreur est survenue."}
        </p>
      )}

      <div>
        <Button
          type="submit"
          variant="primary-teal"
          size="lg"
          disabled={pending}
          className="w-full"
        >
          {pending ? "Validation…" : "Confirmer la commande"}
        </Button>
        <p className="mt-3 text-center font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
          Aucun paiement n'est prélevé en ligne — vous payez à la réception.
        </p>
      </div>
    </form>
  );
}
