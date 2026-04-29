"use client";
import type { CartView } from "@/lib/cart/server";
import { Button } from "@jasmin/ui";
import * as Dialog from "@radix-ui/react-dialog";
import { ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CartLineItem } from "./CartLineItem";
import { CartTotals } from "./CartTotals";
import { EmptyCart } from "./EmptyCart";

export function CartDrawer({
  cart,
  variant = "default",
}: {
  cart: CartView;
  variant?: "default" | "cream";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={`Panier (${cart.itemCount})`}
        className={
          variant === "cream"
            ? "relative inline-flex h-10 w-10 items-center justify-center rounded-pill text-cream-sand transition-colors hover:bg-cream-sand/10"
            : "relative inline-flex h-10 w-10 items-center justify-center rounded-pill text-warm-taupe transition-colors hover:bg-linen/40"
        }
      >
        <ShoppingBag className="h-5 w-5" />
        {cart.itemCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-pill bg-jasmine px-1.5 text-[10px] font-semibold text-warm-taupe">
            {cart.itemCount}
          </span>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-warm-taupe/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream-sand shadow-card">
          <header className="flex items-center justify-between border-b border-linen px-6 py-5">
            <Dialog.Title className="font-[var(--font-display)] text-xl italic text-deep-teal">
              Votre panier
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fermer"
              className="grid h-9 w-9 place-items-center rounded-pill text-warm-taupe hover:bg-linen"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {cart.lines.length === 0 ? (
              <EmptyCart />
            ) : (
              <div className="flex flex-col gap-6">
                {cart.lines.map((line) => (
                  <CartLineItem key={line.id} line={line} />
                ))}
              </div>
            )}
          </div>
          {cart.lines.length > 0 && (
            <footer className="border-t border-linen px-6 py-5">
              <CartTotals
                subtotalTnd={cart.subtotalTnd}
                shippingTnd={cart.shippingTnd}
                totalTnd={cart.totalTnd}
              />
              <Button asChild variant="primary-teal" size="lg" className="mt-5 w-full">
                <Link href="/commande" onClick={() => setOpen(false)}>
                  Passer commande
                </Link>
              </Button>
              <Link
                href="/panier"
                onClick={() => setOpen(false)}
                className="mt-3 block text-center font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-warm-taupe-soft transition-colors hover:text-deep-teal"
              >
                Voir le panier complet
              </Link>
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
