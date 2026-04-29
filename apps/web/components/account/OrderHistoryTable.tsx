import type { OrderWithItems } from "@jasmin/db/queries";
import { Button, EmptyState, Pill, PriceTag } from "@jasmin/ui";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export function OrderHistoryTable({ orders }: { orders: OrderWithItems[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="Aucune commande pour l'instant."
        description="Découvrez nos produits et passez votre première commande."
        action={
          <Button asChild variant="primary-teal">
            <Link href="/boutique">Découvrir la boutique</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(({ order, items }) => (
        <article
          key={order.id}
          className="rounded-lg border border-linen bg-cream-sand p-5 shadow-soft"
        >
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
                Commande
              </p>
              <p className="font-[var(--font-display)] text-xl italic text-deep-teal">
                {order.orderNumber}
              </p>
            </div>
            <Pill tone="teal">{STATUS_LABEL[order.status] ?? order.status}</Pill>
          </header>
          <ul className="mt-4 space-y-1 border-t border-linen pt-3 font-[var(--font-body)] text-sm text-warm-taupe">
            {items.slice(0, 3).map((it) => (
              <li key={it.id} className="flex items-baseline justify-between">
                <span>
                  {it.productNameSnapshot}
                  {it.variantNameSnapshot ? ` (${it.variantNameSnapshot})` : ""} × {it.quantity}
                </span>
                <PriceTag amount={it.lineTotalTnd} />
              </li>
            ))}
            {items.length > 3 && (
              <li className="text-xs text-warm-taupe-soft">
                + {items.length - 3} article(s) de plus
              </li>
            )}
          </ul>
          <footer className="mt-4 flex items-center justify-between border-t border-linen pt-3 text-sm">
            <span className="text-warm-taupe-soft">
              {new Date(order.createdAt).toLocaleDateString("fr-TN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="font-semibold text-warm-taupe">
              <PriceTag amount={order.totalTnd} />
            </span>
          </footer>
        </article>
      ))}
    </div>
  );
}
