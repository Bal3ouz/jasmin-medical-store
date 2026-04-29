import { OrderHistoryTable } from "@/components/account/OrderHistoryTable";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@jasmin/db";
import { getCustomerOrders } from "@jasmin/db/queries";
import { H2Section } from "@jasmin/ui";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const user = data.user;
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return null;
  const db = createClient(dbUrl);
  const orders = await getCustomerOrders(db, user.id);

  return (
    <div className="space-y-8">
      <H2Section>Mes commandes</H2Section>
      <OrderHistoryTable orders={orders} />
    </div>
  );
}
