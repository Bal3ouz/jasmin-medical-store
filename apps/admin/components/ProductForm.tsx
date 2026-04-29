"use client";

import {
  type ProductActionState,
  createProductAction,
  updateProductAction,
} from "@/app/actions/products";
import type { Brand, Category, Product } from "@jasmin/db/schema";
import type { StaffRole } from "@jasmin/lib";
import { Button, Input } from "@jasmin/ui";
import { useActionState, useState } from "react";

export interface ProductFormProps {
  mode: "create" | "edit";
  initial?: Product;
  /** All product_categories assignments for this product (edit mode only). */
  initialCategoryIds?: string[];
  brands: Brand[];
  categories: Category[];
  currentRole: StaffRole;
}

const INITIAL_STATE: ProductActionState = { ok: null };

/**
 * Form for creating or editing a product. Wires the appropriate server
 * action through `useActionState` so validation feedback (`fieldErrors`)
 * shows up next to each field without a page round-trip.
 *
 * Pricing-strip rule (spec §12): when `currentRole === 'stock'` we disable
 * the price inputs client-side AND the server action drops them from the
 * payload before write. Disabling them here prevents the form from
 * submitting stale values that would silently get ignored server-side.
 */
export function ProductForm({
  mode,
  initial,
  initialCategoryIds,
  brands,
  categories,
  currentRole,
}: ProductFormProps) {
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(
    action,
    INITIAL_STATE,
  );

  const fieldErrors = state.ok === false ? (state.errors?.fieldErrors ?? {}) : {};
  const formErrors = state.ok === false ? (state.errors?.formErrors ?? []) : [];
  const successMessage = state.ok === true ? state.message : null;

  // Local toggle so dependent UI (sku/price required vs disabled) updates
  // without waiting for a server round-trip.
  const [hasVariants, setHasVariants] = useState(initial?.hasVariants ?? false);

  const pricingDisabled = currentRole === "stock";

  const initialExtraIds = (initialCategoryIds ?? []).filter((id) => id !== initial?.categoryId);

  return (
    <form action={formAction} className="grid gap-6">
      {mode === "edit" && initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      {formErrors.length > 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm"
        >
          {formErrors.join(" ")}
        </div>
      ) : null}
      {successMessage ? (
        <output className="rounded-lg border border-deep-teal/20 bg-deep-teal/5 px-4 py-3 text-deep-teal text-sm">
          {successMessage}
        </output>
      ) : null}

      <Field label="Nom" name="name" error={fieldErrors.name}>
        <Input name="name" defaultValue={initial?.name ?? ""} required maxLength={180} />
      </Field>

      <Field label="Slug (URL)" name="slug" error={fieldErrors.slug}>
        <Input
          name="slug"
          defaultValue={initial?.slug ?? ""}
          required
          pattern="[a-z0-9-]+"
          placeholder="produit-exemple"
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Marque" name="brandId" error={fieldErrors.brandId}>
          <Select name="brandId" defaultValue={initial?.brandId ?? ""} required>
            <option value="">— Sélectionner —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Catégorie principale" name="categoryId" error={fieldErrors.categoryId}>
          <Select name="categoryId" defaultValue={initial?.categoryId ?? ""} required>
            <option value="">— Sélectionner —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Catégories supplémentaires"
        name="additionalCategoryIds"
        error={fieldErrors.additionalCategoryIds}
        hint="Maintenez Cmd/Ctrl pour sélectionner plusieurs catégories."
      >
        <select
          name="additionalCategoryIds"
          multiple
          defaultValue={initialExtraIds}
          className="min-h-[8rem] w-full rounded-md bg-linen px-4 py-2 text-warm-taupe text-sm"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Description courte"
        name="shortDescription"
        error={fieldErrors.shortDescription}
      >
        <textarea
          name="shortDescription"
          defaultValue={initial?.shortDescription ?? ""}
          rows={2}
          maxLength={280}
          className="w-full rounded-md bg-linen px-4 py-3 text-warm-taupe"
        />
      </Field>

      <Field label="Description" name="description" error={fieldErrors.description}>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={6}
          maxLength={8000}
          className="w-full rounded-md bg-linen px-4 py-3 text-warm-taupe"
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Ingrédients" name="ingredients" error={fieldErrors.ingredients}>
          <textarea
            name="ingredients"
            defaultValue={initial?.ingredients ?? ""}
            rows={4}
            className="w-full rounded-md bg-linen px-4 py-3 text-warm-taupe"
          />
        </Field>
        <Field label="Mode d'emploi" name="usage" error={fieldErrors.usage}>
          <textarea
            name="usage"
            defaultValue={initial?.usage ?? ""}
            rows={4}
            className="w-full rounded-md bg-linen px-4 py-3 text-warm-taupe"
          />
        </Field>
      </div>

      <fieldset className="rounded-2xl border border-linen bg-cream-sand p-5">
        <legend className="px-2 text-warm-taupe-soft text-xs uppercase tracking-[0.16em]">
          Variantes & prix
        </legend>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="hasVariants"
            value="true"
            checked={hasVariants}
            onChange={(e) => setHasVariants(e.target.checked)}
          />
          Le produit a des déclinaisons (taille, format, etc.)
        </label>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Field label="SKU" name="sku" error={fieldErrors.sku}>
            <Input
              name="sku"
              defaultValue={initial?.sku ?? ""}
              disabled={hasVariants}
              required={!hasVariants}
              maxLength={64}
            />
          </Field>
          <Field
            label="Prix (TND)"
            name="priceTnd"
            error={fieldErrors.priceTnd}
            hint={pricingDisabled ? "Réservé aux rôles admin/manager." : undefined}
          >
            <Input
              name="priceTnd"
              type="number"
              step="0.001"
              min="0"
              defaultValue={initial?.priceTnd ?? ""}
              disabled={pricingDisabled || hasVariants}
              required={!hasVariants && !pricingDisabled}
            />
          </Field>
          <Field
            label="Prix barré (TND)"
            name="compareAtPriceTnd"
            error={fieldErrors.compareAtPriceTnd}
            hint={pricingDisabled ? "Réservé aux rôles admin/manager." : undefined}
          >
            <Input
              name="compareAtPriceTnd"
              type="number"
              step="0.001"
              min="0"
              defaultValue={initial?.compareAtPriceTnd ?? ""}
              disabled={pricingDisabled || hasVariants}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Poids (g)" name="weightG" error={fieldErrors.weightG}>
            <Input name="weightG" type="number" min="0" defaultValue={initial?.weightG ?? ""} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-linen bg-cream-sand p-5">
        <legend className="px-2 text-warm-taupe-soft text-xs uppercase tracking-[0.16em]">
          SEO & visibilité
        </legend>
        <div className="mt-3 grid gap-5">
          <Field label="Meta titre" name="metaTitle" error={fieldErrors.metaTitle}>
            <Input name="metaTitle" defaultValue={initial?.metaTitle ?? ""} maxLength={160} />
          </Field>
          <Field
            label="Meta description"
            name="metaDescription"
            error={fieldErrors.metaDescription}
          >
            <textarea
              name="metaDescription"
              defaultValue={initial?.metaDescription ?? ""}
              rows={2}
              maxLength={280}
              className="w-full rounded-md bg-linen px-4 py-3 text-warm-taupe"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isFeatured"
              value="true"
              defaultChecked={initial?.isFeatured ?? false}
            />
            Produit mis en avant
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked={initial?.isPublished ?? false}
            />
            Publier maintenant
          </label>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : mode === "create" ? "Créer le produit" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string[];
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={name} className="grid gap-1.5 text-sm">
      <span className="font-medium text-warm-taupe">{label}</span>
      {children}
      {hint ? <span className="text-warm-taupe-soft text-xs">{hint}</span> : null}
      {error && error.length > 0 ? (
        <span className="text-rose-600 text-xs" role="alert">
          {error.join(" ")}
        </span>
      ) : null}
    </label>
  );
}

function Select({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className="h-11 w-full rounded-md bg-linen px-4 text-sm text-warm-taupe ring-1 ring-warm-taupe/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
    >
      {children}
    </select>
  );
}
