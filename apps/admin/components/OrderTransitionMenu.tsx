"use client";

import { transitionOrderAction } from "@/app/actions/orders";
import { type OrderStatus, type StaffRole, allowedNextStates } from "@jasmin/lib";
import { Button } from "@jasmin/ui";

const LABEL: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmer",
  preparing: "Préparer",
  shipped: "Expédier",
  delivered: "Marquer livrée",
  cancelled: "Annuler",
  refunded: "Rembourser",
};

/**
 * Renders one button per allowed next state for the current order, derived
 * from the role-aware state-machine in `@jasmin/lib`. Each button posts to
 * `transitionOrderAction` via its own `<form>` so we don't need a JS bundle
 * for state — Next.js promotes the form action to a server function.
 *
 * `hideRefund` lets the parent (the order detail page) suppress the
 * `refunded` entry when it mounts the dedicated `RefundDialog` instead —
 * keeps the action panel from showing two paths to the same operation.
 */
export function OrderTransitionMenu(props: {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  role: StaffRole;
  hideRefund?: boolean;
}) {
  const all = allowedNextStates(props.status, props.role);
  const next = props.hideRefund ? all.filter((s) => s !== "refunded") : all;
  if (next.length === 0) {
    return <p className="text-warm-taupe-soft text-xs">Aucune transition disponible.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((to) => (
        <form key={to} action={transitionOrderAction}>
          <input type="hidden" name="orderId" value={props.orderId} />
          <input type="hidden" name="orderNumber" value={props.orderNumber} />
          <input type="hidden" name="toStatus" value={to} />
          <Button
            type="submit"
            size="sm"
            variant={to === "cancelled" || to === "refunded" ? "ghost" : "primary-teal"}
          >
            {LABEL[to]}
          </Button>
        </form>
      ))}
    </div>
  );
}
