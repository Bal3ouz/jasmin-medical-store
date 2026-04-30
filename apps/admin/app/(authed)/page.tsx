import { ActivityComposedChart } from "@/components/bi/ActivityComposedChart";
import { StatusDonut, StatusLegend } from "@/components/bi/StatusDonut";
import { OrderStateBadge } from "@/components/OrderStateBadge";
import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import {
  countLowStockItems,
  countPendingOrders,
  countPublishedProducts,
  getDashboardActivity,
  getDashboardStatusBreakdown,
  getTodayRevenue,
  listLowStockItems,
  listPendingOrders,
} from "@jasmin/db/queries";
import { VOICE, formatTND } from "@jasmin/lib";
import { BodyText, H1Editorial, LabelEyebrow, Stat } from "@jasmin/ui";
import {
  AlertTriangle,
  Coins,
  Package,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Admin dashboard — landing page once a staff user signs in.
 *
 * Layout (top → bottom):
 *   1. Welcome header
 *   2. Hero viz strip: 30-day activity combo chart + order-status donut
 *   3. Six colorful KPI tiles (revenue / orders / AOV / stock / etc.)
 *   4. Two queue cards (pending orders, low stock)
 *
 * All data fetches run in parallel via Promise.all. When SUPABASE_DB_URL is
 * unset, degrades gracefully.
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
  const [today, pending, low, published, pendingList, lowList, activity, statusMix] =
    await Promise.all([
      getTodayRevenue(db),
      countPendingOrders(db),
      countLowStockItems(db),
      countPublishedProducts(db),
      listPendingOrders(db),
      listLowStockItems(db),
      getDashboardActivity(db, 30),
      getDashboardStatusBreakdown(db, 30),
    ]);

  const totalRevenue30d = activity.reduce((acc, p) => acc + p.revenue, 0);
  const totalOrders30d = activity.reduce((acc, p) => acc + p.orders, 0);
  const aov = totalOrders30d === 0 ? 0 : totalRevenue30d / totalOrders30d;
  const trend = (() => {
    if (activity.length < 14) return undefined;
    const half = Math.floor(activity.length / 2);
    const earlier = activity.slice(0, half).reduce((a, p) => a + p.revenue, 0);
    const later = activity.slice(half).reduce((a, p) => a + p.revenue, 0);
    if (earlier === 0) return undefined;
    return Math.round(((later - earlier) / earlier) * 100);
  })();

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <LabelEyebrow>Tableau de bord</LabelEyebrow>
          <H1Editorial className="mt-2 text-deep-teal text-4xl italic">
            Bonjour {firstName}.
          </H1Editorial>
          <p className="mt-2 text-sm text-warm-taupe-soft">
            Voici l&apos;essentiel des 30 derniers jours.
          </p>
        </div>
        <Link
          href="/decisionnel"
          className="inline-flex items-center gap-2 rounded-pill bg-deep-teal px-5 py-2.5 text-cream-sand text-sm shadow-soft transition-transform hover:-translate-y-0.5"
        >
          <Sparkles className="h-4 w-4" aria-hidden /> Décisionnel
        </Link>
      </header>

      {/* Hero viz strip */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-warm-taupe-soft">
                Activité
              </div>
              <h2 className="mt-1 font-display text-2xl text-deep-teal italic">
                30 derniers jours
              </h2>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl text-deep-teal tabular-nums">
                {formatTND(totalRevenue30d)}
              </div>
              <div className="text-warm-taupe-soft text-xs">
                {totalOrders30d} commandes · {formatTND(aov)} panier moyen
              </div>
            </div>
          </div>
          <div className="mt-6">
            <ActivityComposedChart data={activity} />
          </div>
        </div>

        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft">
          <div className="text-[11px] uppercase tracking-[0.18em] text-warm-taupe-soft">
            Statut des commandes
          </div>
          <h2 className="mt-1 font-display text-2xl text-deep-teal italic">Répartition</h2>
          <div className="mt-4">
            <StatusDonut slices={statusMix} />
          </div>
          <div className="mt-4 border-linen border-t pt-4">
            <StatusLegend slices={statusMix} />
          </div>
        </div>
      </section>

      {/* Colorful KPI grid */}
      <section className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          tone="deepTeal"
          label="Chiffre du jour"
          value={formatTND(today.totalTnd)}
          hint={`${today.orderCount} commande${today.orderCount > 1 ? "s" : ""}`}
          icon={<Coins className="h-4 w-4 text-cream-sand" aria-hidden />}
        />
        <Stat
          tone="jasmine"
          label="Revenu 30 j"
          value={formatTND(totalRevenue30d)}
          trend={trend === undefined ? undefined : { delta: trend }}
          icon={<Sparkles className="h-4 w-4 text-deep-teal" aria-hidden />}
        />
        <Stat
          tone="teal"
          label="À traiter"
          value={String(pending)}
          hint="commandes ouvertes"
          icon={<ShoppingBag className="h-4 w-4 text-deep-teal" aria-hidden />}
        />
        <Stat
          tone={low > 0 ? "terracotta" : "linen"}
          label="Stock bas"
          value={String(low)}
          hint={low > 0 ? "à réapprovisionner" : "tout est OK"}
          icon={
            <AlertTriangle
              className={`h-4 w-4 ${low > 0 ? "text-terracotta-whisper" : "text-deep-teal"}`}
              aria-hidden
            />
          }
        />
        <Stat
          tone="linen"
          label="Produits publiés"
          value={String(published)}
          hint="actifs en boutique"
          icon={<Package className="h-4 w-4 text-deep-teal" aria-hidden />}
        />
        <Stat
          tone="taupe"
          label="Clients (30 j)"
          value={String(totalOrders30d)}
          hint="commandes encaissées"
          icon={<Users className="h-4 w-4 text-deep-teal" aria-hidden />}
        />
      </section>

      {/* Queue cards */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-deep-teal italic">Commandes à traiter</h2>
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
            <h2 className="font-display text-2xl text-deep-teal italic">Stock bas</h2>
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
