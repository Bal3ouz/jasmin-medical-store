import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartTotals } from "@/components/cart/CartTotals";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { getCart } from "@/lib/cart/server";
import { AiryContainer, Breadcrumbs, Button } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PanierPage() {
  const cart = await getCart();
  return (
    <main>
      <AiryContainer className="px-6 py-12 lg:px-12 lg:py-16">
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Panier" }]} />
        <h1 className="mt-6 font-[var(--font-display)] text-5xl italic text-deep-teal">
          Votre panier
        </h1>

        {cart.lines.length === 0 ? (
          <div className="mt-12">
            <EmptyCart />
          </div>
        ) : (
          <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <section className="space-y-6">
              {cart.lines.map((line) => (
                <CartLineItem key={line.id} line={line} />
              ))}
            </section>
            <aside className="rounded-lg bg-linen/60 p-6">
              <h2 className="font-[var(--font-display)] text-xl italic text-deep-teal">
                Récapitulatif
              </h2>
              <div className="mt-6">
                <CartTotals
                  subtotalTnd={cart.subtotalTnd}
                  shippingTnd={cart.shippingTnd}
                  totalTnd={cart.totalTnd}
                />
              </div>
              <Button asChild variant="primary-teal" size="lg" className="mt-6 w-full">
                <Link href="/commande">Passer commande</Link>
              </Button>
            </aside>
          </div>
        )}
      </AiryContainer>
    </main>
  );
}
