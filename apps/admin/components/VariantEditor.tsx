"use client";

import {
  type VariantActionState,
  addVariantAction,
  deleteVariantAction,
  setDefaultVariantAction,
  updateVariantAction,
} from "@/app/actions/variants";
import type { ProductVariant } from "@jasmin/db/schema";
import { Button, Input } from "@jasmin/ui";
import { useActionState, useState } from "react";

export interface VariantEditorProps {
  productId: string;
  variants: ProductVariant[];
}

const INITIAL_STATE: VariantActionState = { ok: null };

/**
 * Inline-edit table for product variants. Each row is its own form so the
 * user can save individual variants without affecting siblings; the "add"
 * row at the bottom posts to `addVariantAction`.
 *
 * The `setDefault` and `delete` buttons are separate forms (with their own
 * hidden id fields) since they need different handlers from the row-level
 * `update` form. This keeps every action a clean POST → server-action flow
 * without resorting to client-side state mutation for the optimistic UI.
 */
export function VariantEditor({ productId, variants }: VariantEditorProps) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-linen bg-cream-sand">
        <table className="w-full text-sm">
          <thead className="bg-linen/60 text-warm-taupe-soft text-xs uppercase tracking-[0.16em]">
            <tr>
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-left">Nom</th>
              <th className="px-3 py-2 text-left">Prix</th>
              <th className="px-3 py-2 text-left">Prix barré</th>
              <th className="px-3 py-2 text-left">Poids (g)</th>
              <th className="px-3 py-2 text-left">Ordre</th>
              <th className="px-3 py-2 text-left">Défaut</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-warm-taupe-soft text-xs">
                  Aucune déclinaison pour l'instant.
                </td>
              </tr>
            ) : (
              variants.map((v) => <VariantRow key={v.id} variant={v} />)
            )}
          </tbody>
        </table>
      </div>

      <AddVariantRow productId={productId} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Row — update + setDefault + delete                                         */
/* -------------------------------------------------------------------------- */

function VariantRow({ variant }: { variant: ProductVariant }) {
  const [state, formAction, pending] = useActionState<VariantActionState, FormData>(
    updateVariantAction,
    INITIAL_STATE,
  );

  const fieldErrors = state.ok === false ? (state.errors?.fieldErrors ?? {}) : {};
  const formErrors = state.ok === false ? (state.errors?.formErrors ?? []) : [];
  const successMessage = state.ok === true ? state.message : null;

  return (
    <tr className="border-linen border-t align-top">
      <td className="px-3 py-3">
        <form id={`variant-${variant.id}`} action={formAction} className="contents">
          <input type="hidden" name="id" value={variant.id} />
          <Input
            name="sku"
            defaultValue={variant.sku}
            required
            maxLength={64}
            className="h-9 text-sm"
          />
          {fieldErrors.sku ? (
            <span className="text-rose-600 text-xs">{fieldErrors.sku.join(" ")}</span>
          ) : null}
        </form>
      </td>
      <td className="px-3 py-3">
        <Input
          form={`variant-${variant.id}`}
          name="name"
          defaultValue={variant.name}
          required
          maxLength={120}
          className="h-9 text-sm"
        />
      </td>
      <td className="px-3 py-3">
        <Input
          form={`variant-${variant.id}`}
          name="priceTnd"
          type="number"
          step="0.001"
          min="0"
          defaultValue={variant.priceTnd}
          required
          className="h-9 w-24 text-sm"
        />
      </td>
      <td className="px-3 py-3">
        <Input
          form={`variant-${variant.id}`}
          name="compareAtPriceTnd"
          type="number"
          step="0.001"
          min="0"
          defaultValue={variant.compareAtPriceTnd ?? ""}
          className="h-9 w-24 text-sm"
        />
      </td>
      <td className="px-3 py-3">
        <Input
          form={`variant-${variant.id}`}
          name="weightG"
          type="number"
          min="0"
          defaultValue={variant.weightG ?? ""}
          className="h-9 w-20 text-sm"
        />
      </td>
      <td className="px-3 py-3">
        <Input
          form={`variant-${variant.id}`}
          name="displayOrder"
          type="number"
          min="0"
          defaultValue={variant.displayOrder}
          className="h-9 w-16 text-sm"
        />
      </td>
      <td className="px-3 py-3">
        <label className="flex items-center gap-1 text-xs">
          <input
            form={`variant-${variant.id}`}
            type="checkbox"
            name="isDefault"
            value="true"
            defaultChecked={variant.isDefault}
          />
          {variant.isDefault ? "Oui" : "Non"}
        </label>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col items-end gap-1">
          <Button
            form={`variant-${variant.id}`}
            type="submit"
            size="sm"
            variant="primary-teal"
            disabled={pending}
          >
            {pending ? "…" : "Enregistrer"}
          </Button>
          <SetDefaultButton variantId={variant.id} disabled={variant.isDefault} />
          <DeleteVariantButton variantId={variant.id} sku={variant.sku} />
          {formErrors.length > 0 ? (
            <span className="text-rose-600 text-xs" role="alert">
              {formErrors.join(" ")}
            </span>
          ) : null}
          {successMessage ? <span className="text-deep-teal text-xs">{successMessage}</span> : null}
        </div>
      </td>
    </tr>
  );
}

function SetDefaultButton({ variantId, disabled }: { variantId: string; disabled: boolean }) {
  const [, formAction, pending] = useActionState<VariantActionState, FormData>(
    setDefaultVariantAction,
    INITIAL_STATE,
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={variantId} />
      <Button type="submit" size="sm" variant="ghost" disabled={disabled || pending}>
        {pending ? "…" : "Définir par défaut"}
      </Button>
    </form>
  );
}

function DeleteVariantButton({ variantId, sku }: { variantId: string; sku: string }) {
  const [, formAction, pending] = useActionState<VariantActionState, FormData>(
    deleteVariantAction,
    INITIAL_STATE,
  );
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer la déclinaison ${sku} ?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={variantId} />
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="text-rose-700 hover:bg-rose-50"
        disabled={pending}
      >
        {pending ? "…" : "Supprimer"}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Add-row at the bottom of the table                                         */
/* -------------------------------------------------------------------------- */

function AddVariantRow({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState<VariantActionState, FormData>(
    addVariantAction,
    INITIAL_STATE,
  );
  // Reset the form fields after a successful submit by re-keying on the
  // returned variantId. New default values for the next add fall back to
  // empty strings so the form is ready for another insertion.
  const [resetKey, setResetKey] = useState(0);
  if (state.ok === true && state.variantId) {
    // useActionState already re-renders; bump key once per success.
    queueMicrotask(() => setResetKey((k) => k + 1));
  }

  const fieldErrors = state.ok === false ? (state.errors?.fieldErrors ?? {}) : {};
  const formErrors = state.ok === false ? (state.errors?.formErrors ?? []) : [];

  return (
    <form
      key={resetKey}
      action={formAction}
      className="rounded-2xl border border-linen bg-cream-sand p-4"
    >
      <input type="hidden" name="productId" value={productId} />
      <div className="grid items-end gap-3 md:grid-cols-7">
        <label htmlFor="add-variant-sku" className="grid gap-1 text-xs md:col-span-1">
          <span className="text-warm-taupe-soft">SKU</span>
          <Input id="add-variant-sku" name="sku" required maxLength={64} className="h-9 text-sm" />
          {fieldErrors.sku ? (
            <span className="text-rose-600">{fieldErrors.sku.join(" ")}</span>
          ) : null}
        </label>
        <label htmlFor="add-variant-name" className="grid gap-1 text-xs md:col-span-2">
          <span className="text-warm-taupe-soft">Nom</span>
          <Input
            id="add-variant-name"
            name="name"
            required
            maxLength={120}
            className="h-9 text-sm"
          />
        </label>
        <label htmlFor="add-variant-price" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Prix (TND)</span>
          <Input
            id="add-variant-price"
            name="priceTnd"
            type="number"
            step="0.001"
            min="0"
            required
            className="h-9 text-sm"
          />
        </label>
        <label htmlFor="add-variant-compare-price" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Prix barré</span>
          <Input
            id="add-variant-compare-price"
            name="compareAtPriceTnd"
            type="number"
            step="0.001"
            min="0"
            className="h-9 text-sm"
          />
        </label>
        <label htmlFor="add-variant-weight" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Poids (g)</span>
          <Input
            id="add-variant-weight"
            name="weightG"
            type="number"
            min="0"
            className="h-9 text-sm"
          />
        </label>
        <label htmlFor="add-variant-order" className="grid gap-1 text-xs">
          <span className="text-warm-taupe-soft">Ordre</span>
          <Input
            id="add-variant-order"
            name="displayOrder"
            type="number"
            min="0"
            defaultValue="0"
            className="h-9 text-sm"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" name="isDefault" value="true" />
          Définir comme déclinaison par défaut
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter une déclinaison"}
        </Button>
      </div>
      {formErrors.length > 0 ? (
        <p className="mt-3 text-rose-600 text-xs" role="alert">
          {formErrors.join(" ")}
        </p>
      ) : null}
    </form>
  );
}
