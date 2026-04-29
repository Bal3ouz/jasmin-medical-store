import { createClient } from "@jasmin/db";
import { getOrderByNumber } from "@jasmin/db/queries";
import { VOICE } from "@jasmin/lib";
import { AiryContainer, BodyText, Button, JasmineSprig, PriceTag } from "@jasmin/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) notFound();
  const db = createClient(dbUrl);
  const result = await getOrderByNumber(db, orderNumber);
  if (!result) notFound();

  const { order, items } = result;

  return (
    <main>
      <AiryContainer className="px-6 py-20 text-center lg:px-12 lg:py-32">
        <div className="mx-auto max-w-2xl space-y-6">
          <JasmineSprig className="mx-auto h-20 w-20 text-jasmine" />
          <h1 className="font-[var(--font-display)] text-4xl italic text-deep-teal lg:text-5xl">
            {VOICE.orderConfirmed}
          </h1>
          <BodyText>{VOICE.orderConfirmedSub}</BodyText>
          <div className="rounded-lg bg-linen/60 p-6 text-left">
            <p className="font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-warm-taupe-soft">
              Numéro de commande
            </p>
            <p className="mt-1 font-[var(--font-display)] text-2xl italic text-deep-teal">
              {order.orderNumber}
            </p>
            <ul className="mt-6 space-y-3 border-t border-linen pt-4">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-baseline justify-between font-[var(--font-body)] text-sm text-warm-taupe"
                >
                  <span>
                    {it.productNameSnapshot}
                    {it.variantNameSnapshot ? ` (${it.variantNameSnapshot})` : ""} × {it.quantity}
                  </span>
                  <PriceTag amount={it.lineTotalTnd} />
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-linen pt-3 font-[var(--font-body)] text-base font-semibold text-warm-taupe">
              <span>Total TTC</span>
              <PriceTag amount={order.totalTnd} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary-teal">
              <Link href="/boutique">Continuer vos achats</Link>
            </Button>
            {order.customerId && (
              <Button asChild variant="outline">
                <Link href="/compte/commandes">Voir mes commandes</Link>
              </Button>
            )}
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
