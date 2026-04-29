"use client";

import { type StaffActionState, inviteStaffAction } from "@/app/actions/staff";
import { Button, Input } from "@jasmin/ui";
import { useActionState } from "react";

const INITIAL_STATE: StaffActionState = { ok: null };

const ROLE_OPTIONS: { value: "admin" | "manager" | "cashier" | "stock"; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Caisse" },
  { value: "stock", label: "Stock" },
  { value: "admin", label: "Administrateur" },
];

/**
 * Admin-only invite form. Posts to `inviteStaffAction` which sends a
 * Supabase magic-link email and creates the corresponding `staff_users`
 * row. The resetKey trick clears the inputs after a successful invite so
 * the next colleague can be added without retyping.
 */
export function StaffInviteForm() {
  const [state, formAction, pending] = useActionState<StaffActionState, FormData>(
    inviteStaffAction,
    INITIAL_STATE,
  );

  const fieldErrors = state.ok === false ? (state.errors?.fieldErrors ?? {}) : {};
  const formErrors = state.ok === false ? (state.errors?.formErrors ?? []) : [];
  const successMessage = state.ok === true ? state.message : null;

  const resetKey = successMessage ? `ok-${successMessage}` : "form";

  return (
    <form
      key={resetKey}
      action={formAction}
      className="grid gap-4 rounded-2xl bg-cream-sand p-6 shadow-soft md:grid-cols-[1fr_1fr_180px_auto] md:items-end"
    >
      {formErrors.length > 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm md:col-span-4"
        >
          {formErrors.join(" ")}
        </div>
      ) : null}
      {successMessage ? (
        <output className="rounded-lg border border-deep-teal/20 bg-deep-teal/5 px-4 py-3 text-deep-teal text-sm md:col-span-4">
          {successMessage}
        </output>
      ) : null}

      <label htmlFor="staff-invite-email" className="grid gap-1 text-xs">
        <span className="text-warm-taupe-soft">Email professionnel</span>
        <Input
          id="staff-invite-email"
          name="email"
          type="email"
          required
          placeholder="prenom@jasmin.tn"
        />
        {fieldErrors.email ? (
          <span className="text-rose-600">{fieldErrors.email.join(" ")}</span>
        ) : null}
      </label>

      <label htmlFor="staff-invite-fullName" className="grid gap-1 text-xs">
        <span className="text-warm-taupe-soft">Nom complet</span>
        <Input id="staff-invite-fullName" name="fullName" required minLength={1} maxLength={120} />
        {fieldErrors.fullName ? (
          <span className="text-rose-600">{fieldErrors.fullName.join(" ")}</span>
        ) : null}
      </label>

      <label htmlFor="staff-invite-role" className="grid gap-1 text-xs">
        <span className="text-warm-taupe-soft">Rôle</span>
        <select
          id="staff-invite-role"
          name="role"
          required
          defaultValue="cashier"
          className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {fieldErrors.role ? (
          <span className="text-rose-600">{fieldErrors.role.join(" ")}</span>
        ) : null}
      </label>

      <Button type="submit" variant="primary-teal" disabled={pending}>
        {pending ? "Envoi…" : "Inviter"}
      </Button>
    </form>
  );
}
