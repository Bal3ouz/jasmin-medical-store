import { AddressBook } from "@/components/account/AddressBook";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@jasmin/db";
import { customerAddresses } from "@jasmin/db/schema";
import { H2Section } from "@jasmin/ui";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const user = data.user;
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return null;
  const db = createClient(dbUrl);
  const addresses = await db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, user.id));

  return (
    <div className="space-y-8">
      <H2Section>Mes adresses</H2Section>
      <AddressBook addresses={addresses} />
    </div>
  );
}
