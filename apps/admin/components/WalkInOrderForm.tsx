"use client";

import {
  type WalkInCustomerHit,
  type WalkInProductHit,
  createWalkInOrderAction,
  searchCustomersForWalkInAction,
  searchProductsForWalkInAction,
} from "@/app/actions/walkInOrder";
import { Button } from "@jasmin/ui";
import { useMemo, useState, useTransition } from "react";

type Mode = "registered" | "guest";

interface Line {
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  unitPrice: number;
  qty: number;
  maxQty: number;
}

/**
 * POS-lite walk-in order form. Renders three sections:
 *
 * 1. **Customer mode** — radio toggle between a registered-customer
 *    typeahead (server-action backed) and free-form guest fields.
 * 2. **Lines** — a client-side array of `{productId, sku, qty, maxQty}`.
 *    "Ajouter un article" opens an inline product search that hits
 *    `searchProductsForWalkInAction`; clicking a hit pushes a line.
 *    Each line's qty input is bounded by `maxQty` (current on-hand) so
 *    the server-side stock check usually passes — but the action still
 *    re-checks against a `FOR UPDATE` lock.
 * 3. **Notes + total + submit** — note textarea, live subtotal, submit
 *    button bound to `createWalkInOrderAction` (which redirects on
 *    success).
 *
 * The submit path serialises lines as `lines[i].productId` /
 * `lines[i].variantId` / `lines[i].quantity` form fields so the action
 * can rebuild the array without JSON parsing.
 */
export function WalkInOrderForm() {
  const [mode, setMode] = useState<Mode>("guest");

  // ── Registered customer state ──────────────────────────────────────────
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerHits, setCustomerHits] = useState<WalkInCustomerHit[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<WalkInCustomerHit | null>(null);
  const [customerSearchPending, startCustomerSearch] = useTransition();

  async function runCustomerSearch() {
    const fd = new FormData();
    fd.set("q", customerQuery);
    const hits = await searchCustomersForWalkInAction(fd);
    setCustomerHits(hits);
  }

  // ── Guest fields ───────────────────────────────────────────────────────
  const [guestFullName, setGuestFullName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // ── Lines + product search ─────────────────────────────────────────────
  const [lines, setLines] = useState<Line[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productHits, setProductHits] = useState<WalkInProductHit[]>([]);
  const [productSearchPending, startProductSearch] = useTransition();

  async function runProductSearch() {
    const fd = new FormData();
    fd.set("q", productQuery);
    const hits = await searchProductsForWalkInAction(fd);
    setProductHits(hits);
  }

  function addLine(hit: WalkInProductHit) {
    if (hit.onHand <= 0) return;
    // De-dupe by productId+variantId — bump qty if line already exists.
    const existing = lines.findIndex(
      (l) => l.productId === hit.productId && l.variantId === hit.variantId,
    );
    if (existing >= 0) {
      const next = [...lines];
      next[existing] = {
        ...next[existing]!,
        qty: Math.min(next[existing]!.qty + 1, hit.onHand),
      };
      setLines(next);
    } else {
      setLines([
        ...lines,
        {
          productId: hit.productId,
          variantId: hit.variantId,
          sku: hit.sku,
          name: hit.name,
          unitPrice: hit.unitPrice,
          qty: 1,
          maxQty: hit.onHand,
        },
      ]);
    }
    setShowPicker(false);
    setProductQuery("");
    setProductHits([]);
  }

  function updateQty(idx: number, qty: number) {
    const next = [...lines];
    const max = next[idx]!.maxQty;
    next[idx] = { ...next[idx]!, qty: Math.max(1, Math.min(qty, max)) };
    setLines(next);
  }

  function removeLine(idx: number) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState("");
  const [submitPending, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0), [lines]);

  const canSubmit =
    lines.length > 0 &&
    (mode === "registered"
      ? Boolean(selectedCustomer)
      : guestFullName.trim().length > 0 && guestPhone.trim().length > 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Sélectionnez un client et au moins un article.");
      return;
    }
    const fd = new FormData();
    if (mode === "registered" && selectedCustomer) {
      fd.set("customerId", selectedCustomer.id);
    } else {
      fd.set("guestFullName", guestFullName);
      fd.set("guestPhone", guestPhone);
    }
    if (notes.trim()) fd.set("notesInternal", notes.trim());
    lines.forEach((l, i) => {
      fd.set(`lines[${i}].productId`, l.productId);
      if (l.variantId) fd.set(`lines[${i}].variantId`, l.variantId);
      fd.set(`lines[${i}].quantity`, String(l.qty));
    });

    startSubmit(async () => {
      try {
        // The server action redirects on success — the await never resolves
        // normally in the happy path, so the catch only runs on validation
        // / role / DB errors thrown before redirect.
        await createWalkInOrderAction(fd);
      } catch (err) {
        setError((err as Error).message ?? "Erreur lors de la création.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Customer section */}
      <section>
        <h2 className="font-display text-2xl text-deep-teal">Client</h2>
        <div className="mt-4 flex gap-4 text-sm text-warm-taupe">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="registered"
              checked={mode === "registered"}
              onChange={() => setMode("registered")}
            />
            Client enregistré
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="guest"
              checked={mode === "guest"}
              onChange={() => setMode("guest")}
            />
            Client invité
          </label>
        </div>

        {mode === "registered" ? (
          <div className="mt-4 space-y-3">
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-xl bg-cream-sand p-3 shadow-soft">
                <div>
                  <div className="font-medium text-warm-taupe">
                    {selectedCustomer.fullName ?? selectedCustomer.email}
                  </div>
                  <div className="text-warm-taupe-soft text-xs">
                    {selectedCustomer.email}
                    {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ""}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Changer
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Email, nom ou téléphone"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  className="flex-1 rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={customerSearchPending || customerQuery.trim().length < 2}
                  onClick={() => startCustomerSearch(() => void runCustomerSearch())}
                >
                  Rechercher
                </Button>
              </div>
            )}

            {!selectedCustomer && customerHits.length > 0 ? (
              <ul className="divide-y divide-linen rounded-xl bg-cream-sand">
                {customerHits.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerHits([]);
                        setCustomerQuery("");
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-linen"
                    >
                      <div>
                        <div className="font-medium text-warm-taupe">{c.fullName ?? c.email}</div>
                        <div className="text-warm-taupe-soft text-xs">
                          {c.email}
                          {c.phone ? ` · ${c.phone}` : ""}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nom complet"
              required
              value={guestFullName}
              onChange={(e) => setGuestFullName(e.target.value)}
              className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              required
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
            />
          </div>
        )}
      </section>

      {/* Lines section */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-deep-teal">Articles</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowPicker((s) => !s)}
          >
            Ajouter un article
          </Button>
        </div>

        {showPicker ? (
          <div className="mt-4 rounded-2xl border border-linen bg-cream-sand p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nom ou SKU"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="flex-1 rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={productSearchPending || productQuery.trim().length < 2}
                onClick={() => startProductSearch(() => void runProductSearch())}
              >
                Rechercher
              </Button>
            </div>
            {productHits.length > 0 ? (
              <ul className="mt-3 divide-y divide-linen rounded-xl bg-linen/30">
                {productHits.map((h) => (
                  <li key={`${h.productId}:${h.variantId ?? ""}`}>
                    <button
                      type="button"
                      disabled={h.onHand <= 0}
                      onClick={() => addLine(h)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-linen disabled:opacity-50"
                    >
                      <div>
                        <div className="font-medium text-warm-taupe">{h.name}</div>
                        <div className="text-warm-taupe-soft text-xs">
                          {h.sku} · {h.unitPrice.toFixed(3)} TND ·{" "}
                          {h.onHand <= 0 ? "Rupture" : `${h.onHand} en stock`}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {lines.length === 0 ? (
          <p className="mt-4 text-warm-taupe-soft text-sm">Aucun article ajouté.</p>
        ) : (
          <ul className="mt-4 divide-y divide-linen rounded-2xl bg-cream-sand shadow-soft">
            {lines.map((l, i) => (
              <li
                key={`${l.productId}:${l.variantId ?? ""}`}
                className="flex items-center gap-4 px-6 py-4"
              >
                <div className="flex-1">
                  <div className="font-medium text-warm-taupe">{l.name}</div>
                  <div className="text-warm-taupe-soft text-xs">
                    {l.sku} · {l.unitPrice.toFixed(3)} TND · max {l.maxQty}
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={l.maxQty}
                  value={l.qty}
                  onChange={(e) => updateQty(i, Number(e.target.value))}
                  className="w-20 rounded-lg border border-linen bg-cream-sand px-3 py-2 text-right text-sm text-warm-taupe"
                />
                <div className="w-24 text-right font-display text-deep-teal">
                  {(l.unitPrice * l.qty).toFixed(3)}
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeLine(i)}>
                  Retirer
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notes + total + submit */}
      <section>
        <h2 className="font-display text-2xl text-deep-teal">Notes internes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Optionnel"
          className="mt-3 w-full rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
        />
      </section>

      <section className="flex flex-col gap-4 border-linen border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-warm-taupe-soft text-sm">Total</div>
          <div className="font-display text-3xl text-deep-teal">{subtotal.toFixed(3)} TND</div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {error ? (
            <p role="alert" className="text-rose-700 text-sm">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primary-teal" disabled={submitPending || !canSubmit}>
            {submitPending ? "Création…" : "Créer la commande (Espèces)"}
          </Button>
        </div>
      </section>
    </form>
  );
}
