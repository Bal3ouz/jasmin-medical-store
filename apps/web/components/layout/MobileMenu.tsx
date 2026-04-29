"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface MobileMenuProps {
  items: ReadonlyArray<{ href: string; label: string }>;
}

export function MobileMenu({ items }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Ouvrir le menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-pill transition-colors hover:bg-linen/40 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-warm-taupe/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col bg-cream-sand p-8 shadow-card">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-[var(--font-display)] text-xl italic text-deep-teal">
              Menu
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fermer"
              className="grid h-10 w-10 place-items-center rounded-pill text-warm-taupe hover:bg-linen"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <nav className="mt-10 flex flex-col gap-4 font-[var(--font-display)] text-2xl text-warm-taupe">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="transition-colors hover:text-deep-teal"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
