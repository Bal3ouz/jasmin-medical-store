"use client";

import { refundOrderAction } from "@/app/actions/refund";
import { Button } from "@jasmin/ui";
import { useState } from "react";

/**
 * Inline confirm-and-reason dialog for the order detail page. Replaces the
 * raw `Rembourser` button in `OrderTransitionMenu` (which is hidden when
 * the dialog is mounted) so admins get a single explicit step to capture
 * the refund reason before the action commits.
 *
 * The transition menu auto-routes `refunded` through `refundOrderCore` via
 * the runtime-built dynamic import in `transitionOrderCore`; mounting this
 * component just gives the user a friendlier surface for that branch.
 */
export function RefundDialog({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Rembourser
      </Button>
    );
  }

  return (
    <div className="rounded-2xl bg-cream-sand p-4 shadow-soft">
      <p className="text-sm text-warm-taupe">
        Le remboursement remettra les articles en stock et marquera la commande comme remboursée.
        Confirmer ?
      </p>
      <form action={refundOrderAction} className="mt-3 flex flex-col gap-2">
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="orderNumber" value={orderNumber} />
        <input
          name="reason"
          placeholder="Motif (optionnel)"
          maxLength={500}
          className="w-full rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="primary-teal">
            Confirmer le remboursement
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
