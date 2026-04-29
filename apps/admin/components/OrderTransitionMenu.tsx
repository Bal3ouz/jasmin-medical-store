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
 */
export function OrderTransitionMenu(props: {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  role: StaffRole;
}) {
  const next = allowedNextStates(props.status, props.role);
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
