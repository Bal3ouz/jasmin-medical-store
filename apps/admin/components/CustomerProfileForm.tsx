"use client";

import { type CustomerActionState, updateCustomerProfileAction } from "@/app/actions/customers";
import { Button, Input } from "@jasmin/ui";
import { useActionState } from "react";

const INITIAL_STATE: CustomerActionState = { ok: null };

export interface CustomerProfileFormProps {
  customerId: string;
  initialFullName: string | null;
  initialPhone: string | null;
}

/**
 * Inline edit form on the customer detail page.
 *
 * Email is intentionally not shown as editable: that field is owned by
 * Supabase Auth and updating it from this surface would let the auth row
 * and the customers row drift apart silently.
 */
export function CustomerProfileForm({
  customerId,
  initialFullName,
  initialPhone,
}: CustomerProfileFormProps) {
  const [state, formAction, pending] = useActionState<CustomerActionState, FormData>(
    updateCustomerProfileAction,
    INITIAL_STATE,
  );

  const fieldErrors = state.ok === false ? (state.errors?.fieldErrors ?? {}) : {};
  const formErrors = state.ok === false ? (state.errors?.formErrors ?? []) : [];
  const successMessage = state.ok === true ? state.message : null;

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={customerId} />

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

      <label htmlFor="customer-fullName" className="grid gap-1 text-xs">
        <span className="text-warm-taupe-soft">Nom complet</span>
        <Input
          id="customer-fullName"
          name="fullName"
          defaultValue={initialFullName ?? ""}
          required
          maxLength={160}
        />
        {fieldErrors.fullName ? (
          <span className="text-rose-600">{fieldErrors.fullName.join(" ")}</span>
        ) : null}
      </label>

      <label htmlFor="customer-phone" className="grid gap-1 text-xs">
        <span className="text-warm-taupe-soft">Téléphone</span>
        <Input
          id="customer-phone"
          name="phone"
          defaultValue={initialPhone ?? ""}
          maxLength={40}
          placeholder="+216 ..."
        />
        {fieldErrors.phone ? (
          <span className="text-rose-600">{fieldErrors.phone.join(" ")}</span>
        ) : null}
      </label>

      <div>
        <Button type="submit" variant="primary-teal" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
