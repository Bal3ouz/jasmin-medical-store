import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { getCart } from "@/lib/cart/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AiryContainer, Breadcrumbs, Button, EmptyState } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CommandePage() {
  const cart = await getCart();
  if (cart.lines.length === 0) {
    return (
      <main>
        <AiryContainer className="px-6 py-20 lg:px-12">
          <EmptyState
            title="Votre panier est vide."
            description="Ajoutez des produits avant de passer commande."
            action={
              <Button asChild variant="primary-teal">
                <Link href="/boutique">Découvrir la boutique</Link>
              </Button>
            }
          />
        </AiryContainer>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const isGuest = !data.user;

  return (
    <main>
      <AiryContainer className="px-6 py-12 lg:px-12 lg:py-16">
        <Breadcrumbs
          items={[
            { label: "Accueil", href: "/" },
            { label: "Panier", href: "/panier" },
            { label: "Commande" },
          ]}
        />
        <h1 className="mt-6 font-[var(--font-display)] text-5xl italic text-deep-teal">
          Finaliser votre commande
        </h1>
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <CheckoutForm isGuest={isGuest} />
          <OrderSummary
            lines={cart.lines}
            subtotalTnd={cart.subtotalTnd}
            shippingTnd={cart.shippingTnd}
            totalTnd={cart.totalTnd}
          />
        </div>
      </AiryContainer>
    </main>
  );
}
