import type { OrderStatus } from "@jasmin/lib";
import { Pill } from "@jasmin/ui";

/**
 * Tone mapping is constrained by `Pill`'s own four-tone palette
 * (`teal | jasmine | taupe | out`). We squeeze the seven order statuses
 * into those buckets so the visual hierarchy stays readable:
 *
 * - `taupe`  — neutral, no action yet (`pending`)
 * - `teal`   — actively progressing (`confirmed`, `preparing`)
 * - `jasmine`— customer-visible milestones (`shipped`, `delivered`)
 * - `out`    — terminal/negative outcomes (`cancelled`, `refunded`)
 */
const TONE: Record<OrderStatus, "teal" | "jasmine" | "taupe" | "out"> = {
  pending: "taupe",
  confirmed: "teal",
  preparing: "teal",
  shipped: "jasmine",
  delivered: "jasmine",
  cancelled: "out",
  refunded: "out",
};

const LABEL: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "Préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export function OrderStateBadge({ status }: { status: OrderStatus }) {
  return <Pill tone={TONE[status]}>{LABEL[status]}</Pill>;
}

export const ORDER_STATUS_LABEL = LABEL;
