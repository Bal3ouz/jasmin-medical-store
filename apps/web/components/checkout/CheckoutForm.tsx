"use client";
import { type CheckoutResult, createOrderAction } from "@/app/actions/checkout";
import { VOICE } from "@jasmin/lib";
import { BodyText, Button, Input } from "@jasmin/ui";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { ShippingAddressForm } from "./ShippingAddressForm";

export function CheckoutForm({ isGuest }: { isGuest: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [createAccount, setCreateAccount] = useState(false);

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
      {isGuest && (
        <aside className="flex flex-wrap items-start gap-4 rounded-2xl border border-jasmine/40 bg-jasmine/15 p-5">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jasmine/40 text-deep-teal">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-[var(--font-display)] text-deep-teal text-lg italic">
              Créez votre espace en 30 secondes
            </h3>
            <p className="mt-1 font-[var(--font-body)] text-sm leading-[1.5] text-warm-taupe">
              Suivez vos commandes, retrouvez votre carnet d&apos;adresses et gagnez des
              échantillons offerts dès la prochaine livraison.
            </p>
            <p className="mt-3 text-warm-taupe-soft text-xs">
              Déjà inscrit ?{" "}
              <Link
                href="/compte/connexion?next=/commande"
                className="font-medium text-deep-teal underline underline-offset-2 hover:text-deep-teal-dark"
              >
                Connectez-vous
              </Link>{" "}
              pour aller plus vite.
            </p>
          </div>
        </aside>
      )}

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

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-linen bg-linen/40 p-4 transition-colors hover:border-deep-teal/30">
            <input
              type="checkbox"
              name="createAccount"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="mt-1 accent-deep-teal"
            />
            <span>
              <span className="block font-[var(--font-body)] font-medium text-warm-taupe">
                Créer mon compte avec ces informations
              </span>
              <span className="mt-1 block font-[var(--font-body)] text-sm text-warm-taupe-soft">
                Un email vous sera envoyé pour définir votre mot de passe.
              </span>
            </span>
          </label>
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
