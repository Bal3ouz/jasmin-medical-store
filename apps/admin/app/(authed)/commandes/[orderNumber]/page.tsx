import { addInternalNoteAction } from "@/app/actions/orders";
import { OrderStateBadge } from "@/components/OrderStateBadge";
import { OrderTransitionMenu } from "@/components/OrderTransitionMenu";
import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { getOrderForAdmin } from "@jasmin/db/queries";
import { H1Editorial, LabelEyebrow } from "@jasmin/ui";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage(props: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await props.params;
  const session = await getStaffSession();
  if (!session) return null;

  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    return (
      <div>
        <LabelEyebrow>Commande</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">{orderNumber}</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const data = await getOrderForAdmin(createClient(url), orderNumber);
  if (!data) notFound();
  const { order, items, events, customer } = data;

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="space-y-10 lg:col-span-2">
        <header>
          <LabelEyebrow>Commande</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{order.orderNumber}</H1Editorial>
          <div className="mt-3 flex items-center gap-3">
            <OrderStateBadge status={order.status} />
            <span className="text-warm-taupe-soft text-sm">
              {order.createdAt.toLocaleString("fr-TN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </header>

        <section>
          <h2 className="font-display text-2xl text-deep-teal">Articles</h2>
          {items.length === 0 ? (
            <p className="mt-4 text-warm-taupe-soft text-sm">Aucun article.</p>
          ) : (
            <ul className="mt-4 divide-y divide-linen rounded-2xl bg-cream-sand shadow-soft">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between px-6 py-4">
                  <div>
                    <div className="font-medium text-warm-taupe">{it.productNameSnapshot}</div>
                    <div className="text-warm-taupe-soft text-xs">
                      {it.brandSnapshot} — {it.skuSnapshot}
                      {it.variantNameSnapshot ? ` · ${it.variantNameSnapshot}` : ""} × {it.quantity}
                    </div>
                  </div>
                  <div className="font-display text-deep-teal">
                    {Number(it.lineTotalTnd).toFixed(3)} TND
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-right text-warm-taupe-soft text-sm">
            Sous-total {Number(order.subtotalTnd).toFixed(3)} · Livraison{" "}
            {Number(order.shippingTnd).toFixed(3)}
            {Number(order.discountTnd) > 0
              ? ` · Remise -${Number(order.discountTnd).toFixed(3)}`
              : ""}
          </div>
          <div className="mt-1 text-right font-display text-2xl text-deep-teal">
            {Number(order.totalTnd).toFixed(3)} TND
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-deep-teal">Notes internes</h2>
          <form action={addInternalNoteAction} className="mt-4 flex gap-2">
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="orderNumber" value={order.orderNumber} />
            <input
              name="note"
              placeholder="Ajouter une note"
              required
              maxLength={500}
              className="flex-1 rounded-lg border border-linen bg-cream-sand px-3 py-2 text-sm text-warm-taupe"
            />
            <button
              type="submit"
              className="rounded-pill bg-deep-teal px-4 py-2 text-cream-sand text-sm"
            >
              Ajouter
            </button>
          </form>
          {order.notesCustomer ? (
            <div className="mt-4 rounded-xl bg-jasmine/20 px-4 py-3 text-sm">
              <div className="font-medium text-warm-taupe">Note du client</div>
              <p className="mt-1 text-warm-taupe">{order.notesCustomer}</p>
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="font-display text-2xl text-deep-teal">Historique</h2>
          {events.length === 0 ? (
            <p className="mt-4 text-warm-taupe-soft text-sm">Aucun événement enregistré.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {events.map((e) => (
                <li key={e.id} className="rounded-xl bg-linen px-4 py-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-warm-taupe">{e.eventType}</span>
                    <span className="text-warm-taupe-soft text-xs">
                      {e.performedAt.toLocaleString("fr-TN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  {e.fromStatus && e.toStatus ? (
                    <div className="text-warm-taupe-soft text-xs">
                      {e.fromStatus} → {e.toStatus}
                    </div>
                  ) : null}
                  {e.notes ? <div className="mt-1 text-warm-taupe">{e.notes}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="space-y-6">
        <div className="rounded-2xl bg-linen p-6">
          <div className="text-warm-taupe-soft text-xs uppercase tracking-[0.16em]">Actions</div>
          <div className="mt-3">
            <OrderTransitionMenu
              orderId={order.id}
              orderNumber={order.orderNumber}
              status={order.status}
              role={session.role}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft">
          <div className="text-warm-taupe-soft text-xs uppercase tracking-[0.16em]">Client</div>
          <div className="mt-3 font-medium text-warm-taupe">
            {customer?.fullName ?? order.shippingFullName}
          </div>
          <div className="text-warm-taupe-soft text-sm">
            {customer?.email ?? order.guestEmail ?? "—"}
          </div>
          <div className="text-warm-taupe-soft text-sm">{order.shippingPhone}</div>
          <div className="mt-3 text-sm text-warm-taupe">
            {order.shippingStreet}
            <br />
            {order.shippingPostalCode} {order.shippingCity}, {order.shippingGovernorate}
          </div>
        </div>

        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft">
          <div className="text-warm-taupe-soft text-xs uppercase tracking-[0.16em]">Paiement</div>
          <div className="mt-3 text-sm text-warm-taupe">Méthode : {order.paymentMethod ?? "—"}</div>
          <div className="text-sm text-warm-taupe">Statut : {order.paymentStatus}</div>
        </div>
      </aside>
    </div>
  );
}
