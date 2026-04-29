"use client";

import { type InventoryActionState, adjustInventoryAction } from "@/app/actions/inventory";
import { Button, Input } from "@jasmin/ui";
import { useActionState } from "react";

const INITIAL_STATE: InventoryActionState = { ok: null };

export interface InventoryAdjustFormProps {
  /** Either `productId` or `variantId` is set, never both — mirrors the
   *  inventory schema's product XOR variant invariant. */
  productId?: string | null;
  variantId?: string | null;
  currentOnHand: number;
}

/**
 * Inline "Ajuster" form rendered inside a `<details>` row expansion on the
 * stock list. Submits a signed `delta` plus a `reason` string; the server
 * action handles the row-locking + ledger write + audit.
 *
 * On success the form clears (via `key` reset) and the surrounding server
 * component re-renders due to the `revalidatePath('/stock')` call.
 */
export function InventoryAdjustForm({
  productId,
  variantId,
  currentOnHand,
}: InventoryAdjustFormProps) {
  const [state, formAction, pending] = useActionState<InventoryActionState, FormData>(
    adjustInventoryAction,
    INITIAL_STATE,
  );

  const fieldErrors = state.ok === false ? (state.errors?.fieldErrors ?? {}) : {};
  const formErrors = state.ok === false ? (state.errors?.formErrors ?? []) : [];
  const successMessage = state.ok === true ? state.message : null;

  // Re-key after success so the textarea/number inputs reset to defaults.
  const resetKey = successMessage ? `ok-${currentOnHand}` : "form";
  // Stable id prefix so each instance's labels point at this row's inputs
  // (the page renders one form per inventory row).
  const idPrefix = `inv-adjust-${variantId ?? productId ?? currentOnHand}`;

  return (
    <form
      key={resetKey}
      action={formAction}
      className="grid gap-3 rounded-xl bg-linen/40 p-4 md:grid-cols-[120px_1fr_auto] md:items-start"
    >
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      {variantId ? <input type="hidden" name="variantId" value={variantId} /> : null}

      <label htmlFor={`${idPrefix}-delta`} className="grid gap-1 text-xs">
        <span className="text-warm-taupe-soft">Delta</span>
        <Input
          id={`${idPrefix}-delta`}
          name="delta"
          type="number"
          step="1"
          required
          placeholder="±"
          className="h-9 text-sm"
        />
        {fieldErrors.delta ? (
          <span className="text-rose-600">{fieldErrors.delta.join(" ")}</span>
        ) : null}
      </label>

      <label htmlFor={`${idPrefix}-reason`} className="grid gap-1 text-xs">
        <span className="text-warm-taupe-soft">Motif</span>
        <textarea
          id={`${idPrefix}-reason`}
          name="reason"
          required
          minLength={2}
          maxLength={280}
          rows={2}
          className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
          placeholder="Réception fournisseur, casse, inventaire physique…"
        />
        {fieldErrors.reason ? (
          <span className="text-rose-600">{fieldErrors.reason.join(" ")}</span>
        ) : null}
      </label>

      <div className="flex flex-col items-end gap-1">
        <Button type="submit" size="sm" variant="primary-teal" disabled={pending}>
          {pending ? "Ajustement…" : "Appliquer"}
        </Button>
        <span className="text-warm-taupe-soft text-xs">Stock actuel: {currentOnHand}</span>
      </div>

      {formErrors.length > 0 ? (
        <p className="md:col-span-3 text-rose-600 text-xs" role="alert">
          {formErrors.join(" ")}
        </p>
      ) : null}
      {successMessage ? (
        <p className="md:col-span-3 text-deep-teal text-xs">{successMessage}</p>
      ) : null}
    </form>
  );
}
