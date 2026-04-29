"use client";

import {
  type StaffActionState,
  setStaffActiveAction,
  updateStaffRoleAction,
} from "@/app/actions/staff";
import type { StaffUser } from "@jasmin/db/schema";
import { Button } from "@jasmin/ui";
import { useActionState } from "react";

const INITIAL_STATE: StaffActionState = { ok: null };

const ROLE_OPTIONS: { value: StaffUser["role"]; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Caisse" },
  { value: "stock", label: "Stock" },
];

/**
 * Inline role picker — submitting reposts the row through
 * `updateStaffRoleAction`. Wrapped in `useActionState` so the response
 * (success/error) renders inline rather than relying on a redirect.
 */
export function StaffRoleEditor({
  staffId,
  currentRole,
}: {
  staffId: string;
  currentRole: StaffUser["role"];
}) {
  const [state, formAction, pending] = useActionState<StaffActionState, FormData>(
    updateStaffRoleAction,
    INITIAL_STATE,
  );
  const fieldErrors = state.ok === false ? (state.errors?.fieldErrors ?? {}) : {};
  const formErrors = state.ok === false ? (state.errors?.formErrors ?? []) : [];
  const successMessage = state.ok === true ? state.message : null;

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="id" value={staffId} />
      <label htmlFor={`role-${staffId}`} className="text-warm-taupe-soft text-xs">
        Rôle
      </label>
      <div className="flex gap-2">
        <select
          id={`role-${staffId}`}
          name="role"
          defaultValue={currentRole}
          className="flex-1 rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="primary-teal" disabled={pending}>
          {pending ? "…" : "Enregistrer"}
        </Button>
      </div>
      {fieldErrors.role ? (
        <span className="text-rose-600 text-xs">{fieldErrors.role.join(" ")}</span>
      ) : null}
      {formErrors.length > 0 ? (
        <span className="text-rose-600 text-xs">{formErrors.join(" ")}</span>
      ) : null}
      {successMessage ? <span className="text-deep-teal text-xs">{successMessage}</span> : null}
    </form>
  );
}

/**
 * (De)activate a staff member. The "Désactiver" button submits with
 * `isActive=false`; the "Réactiver" variant submits with `isActive=true`.
 * The page hides this form entirely when the viewer is the same staff
 * member — the action enforces the same guard server-side.
 */
export function StaffActiveToggle({
  staffId,
  currentlyActive,
}: {
  staffId: string;
  currentlyActive: boolean;
}) {
  const [state, formAction, pending] = useActionState<StaffActionState, FormData>(
    setStaffActiveAction,
    INITIAL_STATE,
  );
  const formErrors = state.ok === false ? (state.errors?.formErrors ?? []) : [];
  const successMessage = state.ok === true ? state.message : null;

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="id" value={staffId} />
      <input type="hidden" name="isActive" value={currentlyActive ? "false" : "true"} />
      <Button
        type="submit"
        size="sm"
        variant={currentlyActive ? "ghost" : "primary-teal"}
        disabled={pending}
      >
        {pending ? "…" : currentlyActive ? "Désactiver" : "Réactiver"}
      </Button>
      {formErrors.length > 0 ? (
        <span className="text-rose-600 text-xs">{formErrors.join(" ")}</span>
      ) : null}
      {successMessage ? <span className="text-deep-teal text-xs">{successMessage}</span> : null}
    </form>
  );
}
