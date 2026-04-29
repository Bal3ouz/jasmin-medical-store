import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@jasmin/db";
import { getCustomerOrders } from "@jasmin/db/queries";
import { customers } from "@jasmin/db/schema";
import { BodyText, Button, H2Section } from "@jasmin/ui";
import { eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const user = data.user;

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return null;
  const db = createClient(dbUrl);
  const customerRow = (await db.select().from(customers).where(eq(customers.id, user.id)))[0];
  const orders = await getCustomerOrders(db, user.id);

  return (
    <div className="space-y-12">
      <header>
        <H2Section>Bonjour {customerRow?.fullName?.split(" ")[0] ?? ""}.</H2Section>
        <BodyText className="mt-2">Voici un aperçu de votre activité chez Jasmin.</BodyText>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Tile label="Commandes" value={orders.length.toString()} />
        <Tile
          label="Dernière commande"
          value={
            orders[0]
              ? new Date(orders[0].order.createdAt).toLocaleDateString("fr-TN", {
                  day: "2-digit",
                  month: "long",
                })
              : "—"
          }
        />
        <Tile
          label="Newsletter"
          value={customerRow?.newsletterSubscribed ? "Inscrit" : "Non inscrit"}
        />
      </section>

      <section>
        <H2Section className="text-2xl">Commandes récentes</H2Section>
        <div className="mt-4 flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link href="/compte/commandes">Voir tout</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-linen/60 p-5">
      <p className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
        {label}
      </p>
      <p className="mt-2 font-[var(--font-display)] text-2xl italic text-deep-teal">{value}</p>
    </div>
  );
}
