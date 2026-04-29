import { AccountSidebar } from "@/components/account/AccountSidebar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AiryContainer } from "@jasmin/ui";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/compte/connexion");

  return (
    <main>
      <AiryContainer className="px-6 py-12 lg:px-12 lg:py-16">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[240px_1fr]">
          <AccountSidebar email={data.user.email ?? ""} />
          <div>{children}</div>
        </div>
      </AiryContainer>
    </main>
  );
}
