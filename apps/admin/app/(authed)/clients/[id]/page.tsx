import { CustomerProfileForm } from "@/components/CustomerProfileForm";
import { OrderStateBadge } from "@/components/OrderStateBadge";
import { RoleGate } from "@/components/RoleGate";
import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { getCustomerForAdmin } from "@jasmin/db/queries";
import type { OrderStatus } from "@jasmin/lib";
import { H1Editorial, LabelEyebrow } from "@jasmin/ui";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = await getStaffSession();
  if (!session) redirect("/login");

  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    return (
      <div>
        <LabelEyebrow>Client</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Profil</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const data = await getCustomerForAdmin(createClient(url), id);
  if (!data) notFound();
  const { customer, addresses, orders } = data;

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="space-y-10 lg:col-span-2">
        <header>
          <LabelEyebrow>Client</LabelEyebrow>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <H1Editorial className="text-4xl text-deep-teal">
              {customer.fullName ?? customer.email}
            </H1Editorial>
            {customer.isGuest ? (
              <span className="rounded-full bg-warm-taupe/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-warm-taupe-soft">
                Invité
              </span>
            ) : (
              <span className="rounded-full bg-jasmine/30 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal">
                Membre
              </span>
            )}
          </div>
          <p className="mt-2 text-warm-taupe-soft text-sm">{customer.email}</p>
          <p className="mt-1 text-warm-taupe-soft text-xs">
            {customer.isGuest ? "Première visite le " : "Inscrit le "}
            {new Date(customer.createdAt).toLocaleDateString("fr-TN", {
              dateStyle: "medium",
            })}
          </p>
        </header>

        <section>
          <h2 className="font-display text-2xl text-deep-teal">Dernières commandes</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-warm-taupe-soft text-sm">Aucune commande.</p>
          ) : (
            <ul className="mt-4 divide-y divide-linen rounded-2xl bg-cream-sand shadow-soft">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <Link
                      href={`/commandes/${o.orderNumber}`}
                      className="font-mono text-deep-teal text-sm hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <div className="text-warm-taupe-soft text-xs">
                      {new Date(o.createdAt).toLocaleString("fr-TN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <OrderStateBadge status={o.status as OrderStatus} />
                    <span className="font-display text-deep-teal">
                      {Number(o.totalTnd).toFixed(3)} TND
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl text-deep-teal">Adresses</h2>
          {addresses.length === 0 ? (
            <p className="mt-4 text-warm-taupe-soft text-sm">Aucune adresse enregistrée.</p>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {addresses.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl bg-cream-sand p-5 shadow-soft text-warm-taupe text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{a.fullName}</span>
                    {a.isDefault ? (
                      <span className="rounded-pill bg-deep-teal/10 px-2 py-0.5 text-deep-teal text-xs">
                        Par défaut
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-warm-taupe-soft text-xs">{a.phone}</div>
                  <div className="mt-2">
                    {a.street}
                    <br />
                    {a.postalCode} {a.city}
                    <br />
                    {a.governorate}, {a.country}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="space-y-6 lg:col-span-1">
        <div className="rounded-2xl bg-cream-sand p-6 shadow-soft">
          <h2 className="font-display text-xl text-deep-teal">Profil</h2>
          <p className="mt-1 text-warm-taupe-soft text-xs">
            Email géré par l'authentification — non modifiable ici.
          </p>
          <div className="mt-5">
            <RoleGate roles={["admin", "manager"]}>
              <CustomerProfileForm
                customerId={customer.id}
                initialFullName={customer.fullName}
                initialPhone={customer.phone}
              />
            </RoleGate>
            {session.role === "cashier" ? (
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-warm-taupe-soft text-xs">Nom</dt>
                  <dd className="text-warm-taupe">{customer.fullName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-warm-taupe-soft text-xs">Téléphone</dt>
                  <dd className="text-warm-taupe">{customer.phone ?? "—"}</dd>
                </div>
              </dl>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
