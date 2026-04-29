import { OrderStateBadge } from "@/components/OrderStateBadge";
import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import {
  countLowStockItems,
  countPendingOrders,
  countPublishedProducts,
  getTodayRevenue,
  listLowStockItems,
  listPendingOrders,
} from "@jasmin/db/queries";
import { VOICE, formatTND } from "@jasmin/lib";
import { BodyText, H1Editorial, LabelEyebrow, Stat } from "@jasmin/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Admin dashboard — landing page once a staff user signs in.
 *
 * Renders four KPI tiles and two queue cards (pending orders, low stock).
 * All six data fetches run in parallel via `Promise.all`.
 *
 * When `SUPABASE_DB_URL` is unset (e.g. local dev before Supabase is
 * provisioned), the page degrades gracefully: it shows the welcome header
 * and a one-line message rather than crashing the whole admin shell.
 */
export default async function DashboardPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");

  const firstName = session.fullName.split(" ")[0];
  const url = process.env.SUPABASE_DB_URL;

  if (!url) {
    return (
      <div className="space-y-12">
        <header>
          <LabelEyebrow>Tableau de bord</LabelEyebrow>
          <H1Editorial className="mt-2 text-deep-teal text-4xl">Bonjour {firstName}.</H1Editorial>
        </header>
        <BodyText className="text-warm-taupe">
          DB indisponible — provisionner Supabase pour voir les KPIs.
        </BodyText>
      </div>
    );
  }

  const db = createClient(url);
  const [today, pending, low, published, pendingList, lowList] = await Promise.all([
    getTodayRevenue(db),
    countPendingOrders(db),
    countLowStockItems(db),
    countPublishedProducts(db),
    listPendingOrders(db),
    listLowStockItems(db),
  ]);

  return (
    <div className="space-y-12">
      <header>
        <LabelEyebrow>Tableau de bord</LabelEyebrow>
        <H1Editorial className="mt-2 text-deep-teal text-4xl">Bonjour {firstName}.</H1Editorial>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Chiffre du jour"
          value={formatTND(today.totalTnd)}
          hint={`${today.orderCount} commande${today.orderCount > 1 ? "s" : ""}`}
        />
        <Stat label="Commandes à traiter" value={String(pending)} />
        <Stat label="Stock bas" value={String(low)} />
        <Stat label="Produits publiés" value={String(published)} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-deep-teal">Commandes à traiter</h2>
            <Link href="/commandes" className="text-sm text-warm-taupe-soft hover:text-deep-teal">
              Voir tout →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-linen">
            {pendingList.length === 0 ? (
              <li className="py-6 text-warm-taupe-soft">{VOICE.emptyOrdersQueue}</li>
            ) : (
              pendingList.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/commandes/${o.orderNumber}`} className="min-w-0 flex-1">
                    <div className="font-medium text-deep-teal">{o.orderNumber}</div>
                    <div className="truncate text-warm-taupe-soft text-xs">
                      {o.customerName} · {o.createdAt.toLocaleString("fr-TN")}
                    </div>
                  </Link>
                  <OrderStateBadge status={o.status} />
                  <div className="font-display text-deep-teal">{Number(o.totalTnd).toFixed(3)}</div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-deep-teal">Stock bas</h2>
            <Link href="/stock" className="text-sm text-warm-taupe-soft hover:text-deep-teal">
              Voir tout →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-linen">
            {lowList.length === 0 ? (
              <li className="py-6 text-warm-taupe-soft">{VOICE.emptyLowStock}</li>
            ) : (
              lowList.map((it) => (
                <Link
                  key={`${it.productId ?? ""}-${it.variantId ?? ""}`}
                  href="/stock"
                  className="flex items-center justify-between py-3 hover:bg-linen/50"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-deep-teal">
                      {it.productName ?? "—"}
                      {it.variantName ? ` · ${it.variantName}` : ""}
                    </div>
                    <div className="truncate text-warm-taupe-soft text-xs">
                      {it.brandName ?? ""}
                    </div>
                  </div>
                  <div className="ml-3 text-warm-taupe text-sm tabular-nums">
                    {it.onHand} / {it.reorderPoint}
                  </div>
                </Link>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
