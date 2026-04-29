# Phase 2 — Landing + Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public storefront on top of the Foundation: landing (Motion-animated teal hero) → category browse → product detail → cart drawer + page → guest+auth checkout (COD) → confirmation → customer auth + account/order history → newsletter + brand-story + legal pages. All in French. Visual direction matches the locked stitch mockups (variant-C teal hero, airy cosmétique listing).

**Architecture:** All routes live under `apps/web/app/(shop)/…` with French URLs. Server Components fetch via Drizzle helpers in `packages/db/src/queries/`; mutations go through server actions in `apps/web/app/actions/` validated by Zod schemas from `@jasmin/lib`. Cart persists by session_id cookie (guests) or customer_id (auth). Checkout assigns order numbers via Postgres sequence `jms_order_seq` and runs in a transaction. Auth via Supabase Auth + trigger that upserts `customers` row.

**Tech Stack:** Next.js 15 App Router, Drizzle, `@supabase/ssr`, `@supabase/supabase-js`, Tailwind v4 + radix primitives, Zod + react-hook-form, Motion (formerly framer-motion), Playwright.

**Spec reference:** `docs/superpowers/specs/2026-04-29-phase2-landing-shop-design.md`

**Working directory:** `/Users/ghaith.belaazi/dev/jasmin-medical-store`. Branch: `foundation` (we'll keep adding to it; rename to `phase-2` is optional cosmetic).

**Execution model:** Pragmatic — full spec + quality review on consequential tasks (3, 5, 7, 8, 9), single-shot for layout/content/seo tasks. Each task = one commit.

---

## Task 1 — Cross-cutting prep (voice, primitives, helpers, sequence)

Touches several packages so subsequent tasks have everything they need.

**Files:**
- Modify: `packages/lib/src/voice.ts` (append Phase-2 keys)
- Create: `packages/db/src/queries/index.ts` (empty barrel — populated in Task 3)
- Create: `packages/ui/src/components/Stepper.tsx`
- Create: `packages/ui/src/components/Breadcrumbs.tsx`
- Create: `packages/ui/src/components/EmptyState.tsx`
- Create: `packages/ui/src/components/Skeleton.tsx`
- Create: `packages/ui/src/components/ProductImageFallback.tsx`
- Create: `packages/ui/src/image-url.ts`
- Modify: `packages/ui/src/index.ts` (re-exports)
- Modify: `packages/db/sql/rls.sql` (append sequence + trigger)

- [ ] **Step 1: Append voice constants**

Edit `packages/lib/src/voice.ts` — keep existing keys, add inside the `VOICE` object before the closing `} as const;`:

```ts
  emptyCartTitle: "Votre panier est calme pour l'instant.",
  emptyCartCta: "Découvrir la boutique",
  checkoutTitle: "Finaliser votre commande",
  codNotice: "Vous payez à la livraison, en main propre, en toute sérénité.",
  orderConfirmed: "Merci ! Votre commande est entre nos mains.",
  orderConfirmedSub: "Nous préparons votre colis avec soin. Un appel de confirmation suit dans la journée.",
  loginTitle: "Bon retour parmi nous.",
  signupTitle: "Créez votre compte Jasmin.",
  notreHistoireHero: "Le soin, comme un rituel.",
  filtersLabel: "Filtres",
  applyFiltersCta: "Appliquer",
  clearFiltersCta: "Tout effacer",
  addToWishlistCta: "Ajouter aux favoris",
  outOfStockBadge: "Bientôt de retour",
  inStockBadge: "En stock — livraison sous 48h",
  shippingFree: "Livraison gratuite",
  shippingFlat: "Livraison 7,000 TND",
  shippingFreeAbove: "Livraison gratuite dès 200,000 TND",
```

- [ ] **Step 2: Create `packages/ui/src/image-url.ts`**

```ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUCKET = "product-images";

/**
 * Build a public URL for a product image stored in Supabase Storage.
 * Returns null if the input is null/empty so the caller renders the fallback.
 */
export function getImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}
```

- [ ] **Step 3: Create `packages/ui/src/components/ProductImageFallback.tsx`**

```tsx
import { cn } from "../cn";
import { JasmineSprig } from "./JasmineSprig";

export interface ProductImageFallbackProps {
  productName: string;
  brandName?: string;
  className?: string;
}

export function ProductImageFallback({
  productName,
  brandName,
  className,
}: ProductImageFallbackProps) {
  return (
    <div
      role="img"
      aria-label={`${brandName ? brandName + " — " : ""}${productName}`}
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-cream-sand",
        className,
      )}
    >
      <JasmineSprig className="absolute inset-0 m-auto h-1/2 w-1/2 text-jasmine opacity-30" />
      <div className="relative z-10 flex flex-col items-center gap-1 px-6 text-center">
        {brandName && (
          <span className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.32em] text-deep-teal/70">
            {brandName}
          </span>
        )}
        <span className="font-[var(--font-display)] text-base italic text-warm-taupe">
          {productName}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/Stepper.tsx`**

```tsx
"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "../cn";

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
  className,
  ariaLabel = "Quantité",
}: StepperProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-11 items-center gap-3 rounded-pill bg-linen px-2 text-warm-taupe",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Diminuer"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-8 w-8 place-items-center rounded-pill text-deep-teal transition-colors hover:bg-cream-sand disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-6 text-center font-[var(--font-body)] text-base tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Augmenter"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-8 w-8 place-items-center rounded-pill text-deep-teal transition-colors hover:bg-cream-sand disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Create `packages/ui/src/components/Breadcrumbs.tsx`**

```tsx
import Link from "next/link";
import { Fragment } from "react";
import { cn } from "../cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn(
        "font-[var(--font-label)] text-xs uppercase tracking-[0.18em] text-warm-taupe-soft",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li>
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-deep-teal transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className="text-deep-teal">
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && <li aria-hidden className="text-warm-taupe-soft/50">/</li>}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 6: Create `packages/ui/src/components/EmptyState.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "../cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 rounded-lg bg-linen px-8 py-16 text-center",
        className,
      )}
    >
      {illustration && <div className="opacity-70">{illustration}</div>}
      <div className="max-w-md space-y-2">
        <h2 className="font-[var(--font-display)] text-2xl italic text-deep-teal">{title}</h2>
        {description && (
          <p className="font-[var(--font-body)] text-sm leading-[1.6] text-warm-taupe-soft">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
```

- [ ] **Step 7: Create `packages/ui/src/components/Skeleton.tsx`**

```tsx
import { cn } from "../cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-linen/80", className)}
    />
  );
}
```

- [ ] **Step 8: Update `packages/ui/src/index.ts` — append**

```ts
export { Stepper, type StepperProps } from "./components/Stepper";
export { Breadcrumbs, type BreadcrumbItem } from "./components/Breadcrumbs";
export { EmptyState, type EmptyStateProps } from "./components/EmptyState";
export { Skeleton } from "./components/Skeleton";
export { ProductImageFallback, type ProductImageFallbackProps } from "./components/ProductImageFallback";
export { getImageUrl } from "./image-url";
```

- [ ] **Step 9: Add `lucide-react` already a UI dep — verify**

It's already in `packages/ui/package.json`. Run `bun install` if Stepper imports fail.

- [ ] **Step 10: Append sequence + trigger to `packages/db/sql/rls.sql`**

At the very bottom of the file:

```sql

-- ============================================================
-- Phase 2 additions: order-number sequence + customer auth trigger
-- ============================================================

-- Sequence used by checkout to assign order numbers (JMS-YYYY-NNNNNN).
CREATE SEQUENCE IF NOT EXISTS jms_order_seq START 1;

-- Auth-user-created trigger: upsert a row in `customers` whenever a Supabase
-- auth user signs up via the storefront. raw_user_meta_data carries
-- { full_name } from supabase.auth.signUp options.data.
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO customers (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, customers.full_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION on_auth_user_created();
```

- [ ] **Step 11: Create `packages/db/src/queries/index.ts`**

```ts
// Catalog query helpers used by apps/web server components.
// Populated in Task 3.
export {};
```

- [ ] **Step 11b: Stub `apps/web/app/actions/cart.ts`**

This file gets fully implemented in Task 7, but Task 5's `ProductDetailLayout` imports `addToCartAction` from this path. We create a minimal stub now so Task 5 compiles cleanly.

```ts
"use server";

export interface CartActionResult {
  ok: boolean;
  error?: string;
}

export async function addToCartAction(_formData: FormData): Promise<CartActionResult> {
  return { ok: false, error: "Cart non encore implémenté." };
}

export async function updateCartItemAction(_formData: FormData): Promise<CartActionResult> {
  return { ok: false, error: "Cart non encore implémenté." };
}

export async function removeCartItemAction(_formData: FormData): Promise<CartActionResult> {
  return { ok: false, error: "Cart non encore implémenté." };
}
```

- [ ] **Step 12: Verify nothing broke**

```bash
cd /Users/ghaith.belaazi/dev/jasmin-medical-store
bun install
bun run typecheck
bun test
bun run lint
```

All four must be clean.

- [ ] **Step 13: Commit**

```bash
git add packages/lib packages/ui packages/db
git commit -m "feat(phase2): cross-cutting prep — voice, primitives, image fallback, order sequence + auth trigger"
```

---

## Task 2 — Web app shell: `(shop)` layout, TopNav, Footer, NewsletterSignup, MobileMenu

The existing `apps/web/app/page.tsx` is a tech-demo placeholder — we replace it (in Task 6) and wrap routes with a shared `(shop)` layout that hosts `TopNav`, the `CartDrawer` mount point, and the `Footer`. This task delivers the chrome.

**Files:**
- Create: `apps/web/app/(shop)/layout.tsx`
- Create: `apps/web/components/layout/TopNav.tsx`
- Create: `apps/web/components/layout/Footer.tsx`
- Create: `apps/web/components/layout/MobileMenu.tsx`
- Create: `apps/web/components/marketing/NewsletterSignup.tsx`
- Create: `apps/web/app/actions/newsletter.ts`
- Move: `apps/web/app/page.tsx` → `apps/web/app/(shop)/page.tsx` (kept temporarily; Task 6 rewrites it)

- [ ] **Step 1: Move existing home into the route group**

```bash
cd /Users/ghaith.belaazi/dev/jasmin-medical-store
mkdir -p apps/web/app/\(shop\)
git mv apps/web/app/page.tsx 'apps/web/app/(shop)/page.tsx'
```

- [ ] **Step 2: Create `apps/web/components/layout/TopNav.tsx`**

```tsx
import Link from "next/link";
import { Logo, MiniCart } from "@jasmin/ui";
import { Search, User } from "lucide-react";
import { MobileMenu } from "./MobileMenu";

const NAV = [
  { href: "/boutique", label: "Boutique" },
  { href: "/boutique/cosmetique", label: "Cosmétique" },
  { href: "/boutique/orthopedie", label: "Orthopédie" },
  { href: "/boutique/materiel-medical", label: "Matériel médical" },
  { href: "/notre-histoire", label: "Notre histoire" },
  { href: "/contact", label: "Contact" },
] as const;

export interface TopNavProps {
  variant?: "cream" | "default";
  cartCount?: number;
}

export function TopNav({ variant = "default", cartCount = 0 }: TopNavProps) {
  const isOnTeal = variant === "cream";
  return (
    <header
      className={
        isOnTeal
          ? "absolute inset-x-0 top-0 z-30 px-6 py-6 lg:px-12"
          : "sticky top-0 z-30 border-b border-linen bg-cream-sand/90 px-6 py-4 backdrop-blur lg:px-12"
      }
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6">
        <Link href="/" aria-label="Accueil" className="shrink-0">
          <Logo variant={isOnTeal ? "cream" : "default"} size="md" />
        </Link>
        <nav
          aria-label="Navigation principale"
          className={
            "hidden items-center gap-7 font-[var(--font-label)] text-sm tracking-wide lg:flex " +
            (isOnTeal ? "text-cream-sand/90" : "text-warm-taupe")
          }
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-jasmine"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div
          className={
            "flex items-center gap-2 " + (isOnTeal ? "text-cream-sand" : "text-warm-taupe")
          }
        >
          <button
            type="button"
            aria-label="Rechercher"
            className="hidden h-10 w-10 items-center justify-center rounded-pill transition-colors hover:bg-linen/40 lg:inline-flex"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/compte"
            aria-label="Mon compte"
            className="hidden h-10 w-10 items-center justify-center rounded-pill transition-colors hover:bg-linen/40 lg:inline-flex"
          >
            <User className="h-5 w-5" />
          </Link>
          <MiniCart count={cartCount} variant={isOnTeal ? "cream" : "default"} />
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create a stub `MiniCart` in `packages/ui` (Task 7 wires the real cart)**

Add `packages/ui/src/components/MiniCart.tsx`:

```tsx
"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "../cn";

export interface MiniCartProps {
  count?: number;
  variant?: "default" | "cream";
}

export function MiniCart({ count = 0, variant = "default" }: MiniCartProps) {
  return (
    <Link
      href="/panier"
      aria-label={`Panier (${count})`}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-pill transition-colors hover:bg-linen/40",
        variant === "cream" ? "text-cream-sand" : "text-warm-taupe",
      )}
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-pill bg-jasmine px-1.5 text-[10px] font-semibold text-warm-taupe">
          {count}
        </span>
      )}
    </Link>
  );
}
```

Append to `packages/ui/src/index.ts`:

```ts
export { MiniCart, type MiniCartProps } from "./components/MiniCart";
```

- [ ] **Step 4: Create `apps/web/components/layout/MobileMenu.tsx`**

```tsx
"use client";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-warm-taupe/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col bg-cream-sand p-8 shadow-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
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
```

- [ ] **Step 5: Create `apps/web/components/marketing/NewsletterSignup.tsx`**

```tsx
"use client";
import { useActionState } from "react";
import { Button, Input, BodyText, LabelEyebrow } from "@jasmin/ui";
import { VOICE } from "@jasmin/lib";
import { subscribeNewsletterAction, type NewsletterState } from "@/app/actions/newsletter";

export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletterAction,
    { ok: null },
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <LabelEyebrow>Newsletter</LabelEyebrow>
      <BodyText className="max-w-md text-warm-taupe-soft">{VOICE.newsletterPitch}</BodyText>
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          name="email"
          type="email"
          required
          placeholder="votre@email.com"
          aria-label="Adresse email"
          className="sm:max-w-sm"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Inscription…" : VOICE.newsletterCta}
        </Button>
      </div>
      {state.ok === true && (
        <p role="status" className="text-sm text-deep-teal">
          Merci, à très vite !
        </p>
      )}
      {state.ok === false && state.error && (
        <p role="alert" className="text-sm text-warm-taupe">
          {state.error}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 6: Create `apps/web/app/actions/newsletter.ts`**

```ts
"use server";
import { createClient } from "@jasmin/db";
import { newsletterSubscribers } from "@jasmin/db/schema";
import { NewsletterSubscribeSchema } from "@jasmin/lib/schemas";

export type NewsletterState =
  | { ok: null }
  | { ok: true }
  | { ok: false; error: string };

export async function subscribeNewsletterAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = NewsletterSubscribeSchema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Adresse email invalide." };
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return { ok: false, error: "Service indisponible — réessayez plus tard." };
  const db = createClient(dbUrl);

  await db
    .insert(newsletterSubscribers)
    .values({ email: parsed.data.email, source: parsed.data.source ?? null })
    .onConflictDoNothing();

  return { ok: true };
}
```

- [ ] **Step 7: Create `apps/web/components/layout/Footer.tsx`**

```tsx
import Link from "next/link";
import { JasmineSprig, Logo } from "@jasmin/ui";
import { NewsletterSignup } from "@/components/marketing/NewsletterSignup";

export function Footer() {
  return (
    <footer className="border-t border-linen bg-linen/40 px-6 pb-10 pt-16 lg:px-12">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo size="md" />
          <p className="max-w-xs font-[var(--font-body)] text-sm leading-[1.6] text-warm-taupe-soft">
            Parapharmacie & matériel médical sélectionné avec amour à Nabeul. Ouvert du lundi au samedi.
          </p>
          <JasmineSprig className="h-12 w-12 text-jasmine/60" />
        </div>
        <FooterColumn
          title="Boutique"
          links={[
            { href: "/boutique/cosmetique", label: "Cosmétique" },
            { href: "/boutique/orthopedie", label: "Orthopédie" },
            { href: "/boutique/materiel-medical", label: "Matériel médical" },
            { href: "/boutique/parapharmacie", label: "Parapharmacie" },
          ]}
        />
        <FooterColumn
          title="Maison"
          links={[
            { href: "/notre-histoire", label: "Notre histoire" },
            { href: "/contact", label: "Contact" },
            { href: "/cgv", label: "CGV" },
            { href: "/mentions-legales", label: "Mentions légales" },
            { href: "/confidentialite", label: "Confidentialité" },
          ]}
        />
        <div>
          <NewsletterSignup source="footer" />
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-[1400px] flex-col items-start justify-between gap-2 border-t border-linen pt-6 text-xs text-warm-taupe-soft sm:flex-row sm:items-center">
        <span>
          © {new Date().getFullYear()} Jasmin Médical Store · 111 Av. Hedi Nouira, 8000 Nabeul
        </span>
        <span>+216 72 289 900 · jasmin.medicalstore@yahoo.com</span>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-deep-teal">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 font-[var(--font-body)] text-sm text-warm-taupe">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="transition-colors hover:text-deep-teal">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 8: Create `apps/web/app/(shop)/layout.tsx`**

```tsx
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { getCartCount } from "@/lib/cart/server";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const cartCount = await getCartCount();
  return (
    <>
      <TopNav cartCount={cartCount} />
      {children}
      <Footer />
    </>
  );
}
```

- [ ] **Step 9: Create the cart-count helper stub**

`apps/web/lib/cart/server.ts`:

```ts
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { createClient } from "@jasmin/db";
import { carts, cartItems } from "@jasmin/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const CART_COOKIE = "jms_cart_session";

export async function getCartCount(): Promise<number> {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return 0;
  const db = createClient(dbUrl);

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const customerId = userData.user?.id ?? null;

  let cartId: string | null = null;
  if (customerId) {
    const rows = await db.select().from(carts).where(eq(carts.customerId, customerId));
    cartId = rows[0]?.id ?? null;
  } else {
    const sessionId = (await cookies()).get(CART_COOKIE)?.value;
    if (sessionId) {
      const rows = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
      cartId = rows[0]?.id ?? null;
    }
  }

  if (!cartId) return 0;
  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  return items.reduce((acc, it) => acc + it.quantity, 0);
}
```

- [ ] **Step 10: Add `drizzle-orm` to `apps/web/package.json` dependencies**

The `getCartCount` import requires `drizzle-orm` for `eq`. Edit `apps/web/package.json` and add `"drizzle-orm": "0.36.4"` in dependencies. Then `bun install`.

- [ ] **Step 11: Verify**

```bash
bun install
cd apps/web && bun run typecheck
cd ../.. && bun run lint
```

Both clean. The `(shop)/page.tsx` still has the old smoke-page content — Task 6 rewrites it.

- [ ] **Step 12: Commit**

```bash
git add apps/web packages/ui bun.lock
git commit -m "feat(web): shared (shop) layout, TopNav, Footer, MobileMenu, NewsletterSignup"
```

---

## Task 3 — Catalog query helpers + tests

These pure functions are the only reads the storefront uses for catalog data. Each is exhaustively tested in `packages/db/src/test/schema.test.ts` (the singleton-pglite test file from Phase 1).

**Files:**
- Create: `packages/db/src/queries/catalog.ts`
- Create: `packages/db/src/queries/orders.ts`
- Modify: `packages/db/src/queries/index.ts`
- Modify: `packages/db/src/test/schema.test.ts` (append describe block)

- [ ] **Step 1: Create `packages/db/src/queries/catalog.ts`**

```ts
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  brands,
  categories,
  inventory,
  productImages,
  productVariants,
  products,
  type Brand,
  type Category,
  type Product,
  type ProductImage,
  type ProductVariant,
} from "../schema";

export interface ListedProduct {
  product: Product;
  brand: Brand;
  category: Category;
  primaryImage: ProductImage | null;
  defaultVariant: ProductVariant | null;
  /** 'in_stock' | 'low' | 'out' — derived from inventory.on_hand vs reorder_point. */
  stockStatus: "in_stock" | "low" | "out";
}

export interface ListPublishedProductsOptions {
  categorySlug?: string;
  brandSlug?: string;
  limit?: number;
  offset?: number;
  sort?: "newest" | "price-asc" | "price-desc";
}

export async function listCategories(db: Database) {
  return db.select().from(categories).orderBy(asc(categories.displayOrder), asc(categories.name));
}

export async function getCategoryBySlug(db: Database, slug: string) {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug));
  return rows[0] ?? null;
}

export async function listBrands(db: Database) {
  return db.select().from(brands).orderBy(asc(brands.name));
}

export async function listPublishedProducts(
  db: Database,
  opts: ListPublishedProductsOptions = {},
): Promise<ListedProduct[]> {
  const conds = [eq(products.isPublished, true)];

  if (opts.categorySlug) {
    const cat = await getCategoryBySlug(db, opts.categorySlug);
    if (!cat) return [];
    conds.push(eq(products.categoryId, cat.id));
  }
  if (opts.brandSlug) {
    const brandRows = await db.select().from(brands).where(eq(brands.slug, opts.brandSlug));
    const brand = brandRows[0];
    if (!brand) return [];
    conds.push(eq(products.brandId, brand.id));
  }

  const orderBy =
    opts.sort === "price-asc"
      ? asc(products.priceTnd)
      : opts.sort === "price-desc"
        ? desc(products.priceTnd)
        : desc(products.createdAt);

  const productRows = await db
    .select()
    .from(products)
    .where(and(...conds))
    .orderBy(orderBy)
    .limit(opts.limit ?? 60)
    .offset(opts.offset ?? 0);

  if (productRows.length === 0) return [];

  const productIds = productRows.map((p) => p.id);
  const brandIds = Array.from(new Set(productRows.map((p) => p.brandId)));
  const categoryIds = Array.from(new Set(productRows.map((p) => p.categoryId)));

  const [brandRows, categoryRows, imageRows, variantRows, inventoryRows] = await Promise.all([
    db.select().from(brands).where(inArray(brands.id, brandIds)),
    db.select().from(categories).where(inArray(categories.id, categoryIds)),
    db
      .select()
      .from(productImages)
      .where(and(inArray(productImages.productId, productIds), eq(productImages.isPrimary, true))),
    db.select().from(productVariants).where(inArray(productVariants.productId, productIds)),
    db.select().from(inventory).where(
      sql`${inventory.productId} IN ${productIds} OR ${inventory.variantId} IN (
        SELECT id FROM ${productVariants} WHERE ${productVariants.productId} IN ${productIds}
      )`,
    ),
  ]);

  const byBrand = new Map(brandRows.map((b) => [b.id, b]));
  const byCategory = new Map(categoryRows.map((c) => [c.id, c]));
  const primaryImageByProduct = new Map(imageRows.map((i) => [i.productId, i]));
  const variantsByProduct = new Map<string, typeof variantRows>();
  for (const v of variantRows) {
    if (!variantsByProduct.has(v.productId)) variantsByProduct.set(v.productId, []);
    variantsByProduct.get(v.productId)?.push(v);
  }
  const inventoryByKey = new Map<string, (typeof inventoryRows)[number]>();
  for (const inv of inventoryRows) {
    const key = inv.productId ?? inv.variantId;
    if (key) inventoryByKey.set(key, inv);
  }

  return productRows.map((p) => {
    const variants = variantsByProduct.get(p.id) ?? [];
    const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null;
    const inv = p.hasVariants
      ? inventoryByKey.get(defaultVariant?.id ?? "")
      : inventoryByKey.get(p.id);
    const onHand = inv?.onHand ?? 0;
    const reorder = inv?.reorderPoint ?? 5;
    const stockStatus: ListedProduct["stockStatus"] =
      onHand <= 0 ? "out" : onHand <= reorder ? "low" : "in_stock";
    return {
      product: p,
      brand: byBrand.get(p.brandId)!,
      category: byCategory.get(p.categoryId)!,
      primaryImage: primaryImageByProduct.get(p.id) ?? null,
      defaultVariant,
      stockStatus,
    };
  });
}

export interface ProductDetail extends ListedProduct {
  variants: ProductVariant[];
  images: ProductImage[];
}

export async function getProductBySlug(db: Database, slug: string): Promise<ProductDetail | null> {
  const productRow = (await db.select().from(products).where(eq(products.slug, slug)))[0];
  if (!productRow) return null;

  const [brand, category, images, variants, inventoryRows] = await Promise.all([
    db.select().from(brands).where(eq(brands.id, productRow.brandId)).then((r) => r[0]!),
    db.select().from(categories).where(eq(categories.id, productRow.categoryId)).then((r) => r[0]!),
    db.select().from(productImages).where(eq(productImages.productId, productRow.id)).orderBy(asc(productImages.displayOrder)),
    db.select().from(productVariants).where(eq(productVariants.productId, productRow.id)).orderBy(asc(productVariants.displayOrder)),
    db.select().from(inventory).where(
      sql`${inventory.productId} = ${productRow.id} OR ${inventory.variantId} IN (
        SELECT id FROM ${productVariants} WHERE ${productVariants.productId} = ${productRow.id}
      )`,
    ),
  ]);

  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null;
  const primaryImage = images.find((i) => i.isPrimary) ?? images[0] ?? null;

  const inv = productRow.hasVariants
    ? inventoryRows.find((i) => i.variantId === defaultVariant?.id)
    : inventoryRows.find((i) => i.productId === productRow.id);
  const onHand = inv?.onHand ?? 0;
  const reorder = inv?.reorderPoint ?? 5;
  const stockStatus: ListedProduct["stockStatus"] =
    onHand <= 0 ? "out" : onHand <= reorder ? "low" : "in_stock";

  return {
    product: productRow,
    brand,
    category,
    primaryImage,
    defaultVariant,
    stockStatus,
    variants,
    images,
  };
}

export async function getRelatedProducts(
  db: Database,
  productId: string,
  limit = 4,
): Promise<ListedProduct[]> {
  const productRow = (await db.select().from(products).where(eq(products.id, productId)))[0];
  if (!productRow) return [];
  const all = await listPublishedProducts(db, {
    // can't pass categorySlug because we don't have it; do an extra query
    limit: limit + 1,
  });
  return all
    .filter((p) => p.product.id !== productId && p.category.id === productRow.categoryId)
    .slice(0, limit);
}
```

- [ ] **Step 2: Create `packages/db/src/queries/orders.ts`**

```ts
import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { orders, orderItems, type Order, type OrderItem } from "../schema";

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

export async function getCustomerOrders(db: Database, customerId: string): Promise<OrderWithItems[]> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderIds[0]!));
  // Drizzle's inArray would be cleaner here — refactor when needed
  const allItems: OrderItem[] = [];
  for (const id of orderIds) {
    const rows = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    allItems.push(...rows);
  }

  const byOrder = new Map<string, OrderItem[]>();
  for (const it of allItems) {
    if (!byOrder.has(it.orderId)) byOrder.set(it.orderId, []);
    byOrder.get(it.orderId)!.push(it);
  }
  return orderRows.map((o) => ({ order: o, items: byOrder.get(o.id) ?? [] }));
}

export async function getOrderByNumber(
  db: Database,
  orderNumber: string,
): Promise<OrderWithItems | null> {
  const orderRow = (await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)))[0];
  if (!orderRow) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderRow.id));
  return { order: orderRow, items };
}
```

- [ ] **Step 3: Update `packages/db/src/queries/index.ts`**

```ts
export * from "./catalog";
export * from "./orders";
```

- [ ] **Step 4: Append a describe block to `packages/db/src/test/schema.test.ts`**

At the end of the file (after the existing describes):

```ts
import {
  getProductBySlug,
  listCategories,
  listPublishedProducts,
} from "../queries/catalog";

describe("query helpers", () => {
  test("listCategories returns root + subcategories", async () => {
    // Seed two categories
    await db.execute(sql`
      INSERT INTO categories (id, slug, name, parent_id, display_order)
      VALUES
        ('q0000000-0000-4000-8000-000000000001','q-cosmetique','Q Cosmétique', NULL, 1),
        ('q0000000-0000-4000-8000-000000000002','q-visage','Q Visage', 'q0000000-0000-4000-8000-000000000001', 1)
      ON CONFLICT DO NOTHING`);
    const cats = await listCategories(db as never);
    expect(cats.find((c) => c.slug === "q-cosmetique")).toBeDefined();
    expect(cats.find((c) => c.slug === "q-visage")).toBeDefined();
  });

  test("listPublishedProducts filters by categorySlug and excludes unpublished", async () => {
    await db.execute(sql`
      INSERT INTO brands (id, slug, name) VALUES ('q1000000-0000-4000-8000-000000000001','qb','QB') ON CONFLICT DO NOTHING;
      INSERT INTO categories (id, slug, name) VALUES ('q1000000-0000-4000-8000-000000000002','q-cat','QCat') ON CONFLICT DO NOTHING;
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd, is_published)
      VALUES
        ('q1000000-0000-4000-8000-000000000010','q-published-1','Q Published 1','q1000000-0000-4000-8000-000000000001','q1000000-0000-4000-8000-000000000002','x','x',false,'Q-PUB-1', 10.000, true),
        ('q1000000-0000-4000-8000-000000000011','q-draft-1','Q Draft 1','q1000000-0000-4000-8000-000000000001','q1000000-0000-4000-8000-000000000002','x','x',false,'Q-DRF-1', 10.000, false)
      ON CONFLICT DO NOTHING;
      INSERT INTO inventory (product_id, on_hand, reorder_point) VALUES
        ('q1000000-0000-4000-8000-000000000010', 10, 3),
        ('q1000000-0000-4000-8000-000000000011', 10, 3)
      ON CONFLICT DO NOTHING`);

    const list = await listPublishedProducts(db as never, { categorySlug: "q-cat" });
    const slugs = list.map((p) => p.product.slug);
    expect(slugs).toContain("q-published-1");
    expect(slugs).not.toContain("q-draft-1");
  });

  test("getProductBySlug returns full detail or null", async () => {
    const detail = await getProductBySlug(db as never, "q-published-1");
    expect(detail).not.toBeNull();
    expect(detail?.brand.slug).toBe("qb");
    expect(detail?.stockStatus).toBe("in_stock");

    const missing = await getProductBySlug(db as never, "does-not-exist");
    expect(missing).toBeNull();
  });
});
```

- [ ] **Step 5: Run tests + typecheck**

```bash
cd packages/db && bun test && bun run typecheck
```

Expect 12 pass, 0 fail (9 existing + 3 new). Typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add packages/db
git commit -m "feat(db): catalog + orders query helpers with pglite tests"
```

---

## Task 4 — `/boutique` and `/boutique/[category]` + ProductCard + ProductGrid + filters

**Files:**
- Create: `packages/ui/src/components/ProductCard.tsx`
- Create: `apps/web/components/shop/ProductGrid.tsx`
- Create: `apps/web/components/shop/CategoryHeader.tsx`
- Create: `apps/web/components/shop/FilterToolbar.tsx`
- Create: `apps/web/components/shop/FilterSidebar.tsx`
- Create: `apps/web/app/(shop)/boutique/page.tsx`
- Create: `apps/web/app/(shop)/boutique/[category]/page.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `packages/ui/src/components/ProductCard.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { cn } from "../cn";
import { ProductImageFallback } from "./ProductImageFallback";
import { PriceTag } from "./PriceTag";
import { Pill } from "./Pill";

export interface ProductCardData {
  slug: string;
  name: string;
  brandName: string;
  priceTnd: number | string | null;
  compareAtPriceTnd?: number | string | null;
  imageUrl: string | null;
  imageAlt?: string | null;
  stockStatus: "in_stock" | "low" | "out";
  hasVariants: boolean;
  variantCountLabel?: string;
}

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const href = `/produit/${product.slug}`;
  return (
    <article
      className={cn(
        "group flex flex-col gap-4 rounded-lg p-3 transition-all duration-300 hover:bg-linen/60",
        className,
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-linen">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <ProductImageFallback productName={product.name} brandName={product.brandName} />
          )}
          {product.stockStatus === "out" && (
            <Pill tone="out" className="absolute left-3 top-3">
              Bientôt de retour
            </Pill>
          )}
          {product.stockStatus === "low" && (
            <Pill tone="jasmine" className="absolute left-3 top-3">
              Plus que quelques pièces
            </Pill>
          )}
        </div>
      </Link>
      <div className="flex flex-col gap-1.5 px-1">
        <span className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-deep-teal/80">
          {product.brandName}
        </span>
        <Link href={href} className="block">
          <h3 className="font-[var(--font-display)] text-base text-warm-taupe transition-colors group-hover:text-deep-teal lg:text-lg">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          {product.priceTnd != null ? (
            <PriceTag amount={product.priceTnd} compareAt={product.compareAtPriceTnd ?? null} />
          ) : (
            <span className="font-[var(--font-body)] text-sm text-warm-taupe-soft">
              {product.variantCountLabel ?? "Plusieurs formats"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
```

Append to `packages/ui/src/index.ts`:

```ts
export { ProductCard, type ProductCardData } from "./components/ProductCard";
```

- [ ] **Step 2: Create `apps/web/components/shop/ProductGrid.tsx`**

```tsx
import { ProductCard, type ProductCardData, EmptyState, getImageUrl } from "@jasmin/ui";
import type { ListedProduct } from "@jasmin/db/queries";

export function ProductGrid({ products }: { products: ListedProduct[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Aucun produit pour le moment."
        description="Ajustez vos filtres ou revenez très bientôt — notre sélection s'enrichit chaque semaine."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const data: ProductCardData = {
          slug: p.product.slug,
          name: p.product.name,
          brandName: p.brand.name,
          priceTnd: p.product.hasVariants ? p.defaultVariant?.priceTnd ?? null : p.product.priceTnd,
          compareAtPriceTnd: p.product.compareAtPriceTnd,
          imageUrl: getImageUrl(p.primaryImage?.storagePath),
          imageAlt: p.primaryImage?.altText,
          stockStatus: p.stockStatus,
          hasVariants: p.product.hasVariants,
          variantCountLabel:
            p.product.hasVariants && p.defaultVariant?.priceTnd
              ? `À partir de ${p.defaultVariant.priceTnd} TND`
              : undefined,
        };
        return <ProductCard key={p.product.id} product={data} />;
      })}
    </div>
  );
}
```

Note: `@jasmin/db/queries` subpath — add to `packages/db/package.json` exports:

```json
"./queries": "./src/queries/index.ts",
```

- [ ] **Step 3: Create `apps/web/components/shop/CategoryHeader.tsx`**

```tsx
import { LabelEyebrow, BodyText } from "@jasmin/ui";

export function CategoryHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="space-y-4">
      <LabelEyebrow>{eyebrow}</LabelEyebrow>
      <h1 className="font-[var(--font-display)] text-5xl italic text-deep-teal lg:text-6xl">
        {title}
      </h1>
      {description && <BodyText className="max-w-2xl">{description}</BodyText>}
    </header>
  );
}
```

- [ ] **Step 4: Create `apps/web/components/shop/FilterToolbar.tsx` + `FilterSidebar.tsx`**

`FilterToolbar.tsx`:

```tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";

const SORTS = [
  { value: "newest", label: "Nouveautés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
] as const;

export function FilterToolbar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "newest";

  return (
    <div className="flex items-center justify-between gap-4 border-b border-linen pb-4">
      <span className="font-[var(--font-body)] text-sm text-warm-taupe-soft">
        {resultCount} {resultCount > 1 ? "produits" : "produit"}
      </span>
      <label className="flex items-center gap-3 font-[var(--font-label)] text-xs uppercase tracking-[0.18em] text-warm-taupe-soft">
        Trier
        <select
          value={current}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            next.set("sort", e.target.value);
            router.replace(`?${next.toString()}`, { scroll: false });
          }}
          className="rounded-pill bg-linen px-4 py-2 font-[var(--font-body)] text-sm tracking-normal text-warm-taupe focus:outline-none focus:ring-2 focus:ring-deep-teal/30"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
```

`FilterSidebar.tsx` (server component — purely visual for Phase 2; clicking a brand link navigates to the brand-filtered URL):

```tsx
import Link from "next/link";
import type { Brand } from "@jasmin/db";
import { LabelEyebrow } from "@jasmin/ui";

export function FilterSidebar({
  brands,
  activeCategorySlug,
  activeBrandSlug,
}: {
  brands: Brand[];
  activeCategorySlug?: string;
  activeBrandSlug?: string;
}) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        <LabelEyebrow>Filtrer</LabelEyebrow>
        <section>
          <h3 className="font-[var(--font-display)] text-lg text-deep-teal">Marques</h3>
          <ul className="mt-3 space-y-2 font-[var(--font-body)] text-sm text-warm-taupe">
            {brands.map((b) => {
              const active = b.slug === activeBrandSlug;
              const href = activeCategorySlug
                ? `/boutique/${activeCategorySlug}?brand=${b.slug}`
                : `/boutique?brand=${b.slug}`;
              return (
                <li key={b.id}>
                  <Link
                    href={href}
                    className={
                      active
                        ? "text-deep-teal underline underline-offset-4"
                        : "transition-colors hover:text-deep-teal"
                    }
                  >
                    {b.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Create `apps/web/app/(shop)/boutique/page.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@jasmin/db";
import { listCategories, listPublishedProducts } from "@jasmin/db/queries";
import { Breadcrumbs, AiryContainer } from "@jasmin/ui";
import { CategoryHeader } from "@/components/shop/CategoryHeader";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const revalidate = 60;

export default async function BoutiquePage() {
  const dbUrl = process.env.SUPABASE_DB_URL!;
  const db = createClient(dbUrl);
  const [categories, featured] = await Promise.all([
    listCategories(db),
    listPublishedProducts(db, { sort: "newest", limit: 12 }),
  ]);

  const rootCategories = categories.filter((c) => c.parentId === null);

  return (
    <main>
      <AiryContainer className="px-6 pb-16 pt-12 lg:px-12 lg:pt-16">
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Boutique" }]} />
        <div className="mt-6">
          <CategoryHeader
            eyebrow="Boutique"
            title="Toute la sélection"
            description="Explorez nos rayons et découvrez les marques qui prennent soin de vous au quotidien."
          />
        </div>

        <section className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rootCategories.map((c) => (
            <Link
              key={c.id}
              href={`/boutique/${c.slug}`}
              className="group flex flex-col gap-3 rounded-lg bg-linen/60 p-6 transition-colors hover:bg-linen"
            >
              <h3 className="font-[var(--font-display)] text-xl italic text-deep-teal">{c.name}</h3>
              <p className="font-[var(--font-body)] text-sm text-warm-taupe-soft">
                {c.description}
              </p>
              <span className="mt-2 font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-deep-teal transition-colors group-hover:text-deep-teal-dark">
                Découvrir →
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="font-[var(--font-display)] text-3xl italic text-deep-teal">
            Sélection du moment
          </h2>
          <div className="mt-8">
            <ProductGrid products={featured} />
          </div>
        </section>
      </AiryContainer>
    </main>
  );
}
```

- [ ] **Step 6: Create `apps/web/app/(shop)/boutique/[category]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@jasmin/db";
import {
  getCategoryBySlug,
  listBrands,
  listPublishedProducts,
} from "@jasmin/db/queries";
import { AiryContainer, Breadcrumbs } from "@jasmin/ui";
import { CategoryHeader } from "@/components/shop/CategoryHeader";
import { FilterToolbar } from "@/components/shop/FilterToolbar";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ brand?: string; sort?: string }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: categorySlug } = await params;
  const { brand: brandSlug, sort } = await searchParams;

  const dbUrl = process.env.SUPABASE_DB_URL!;
  const db = createClient(dbUrl);

  const cat = await getCategoryBySlug(db, categorySlug);
  if (!cat) notFound();

  const [products, brands] = await Promise.all([
    listPublishedProducts(db, {
      categorySlug,
      brandSlug,
      sort: (sort as "newest" | "price-asc" | "price-desc" | undefined) ?? "newest",
    }),
    listBrands(db),
  ]);

  return (
    <main>
      <AiryContainer className="px-6 pb-20 pt-12 lg:px-12 lg:pt-16">
        <Breadcrumbs
          items={[
            { label: "Accueil", href: "/" },
            { label: "Boutique", href: "/boutique" },
            { label: cat.name },
          ]}
        />
        <div className="mt-6">
          <CategoryHeader
            eyebrow={cat.parentId ? "Catégorie" : "Rayon"}
            title={cat.name}
            description={cat.description ?? undefined}
          />
        </div>

        <div className="mt-10 flex gap-12">
          <FilterSidebar
            brands={brands}
            activeCategorySlug={categorySlug}
            activeBrandSlug={brandSlug}
          />
          <div className="flex-1">
            <FilterToolbar resultCount={products.length} />
            <div className="mt-8">
              <ProductGrid products={products} />
            </div>
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
```

- [ ] **Step 7: Verify**

```bash
bun install
cd apps/web && bun run typecheck
cd ../.. && bun run lint && bun run test
```

All clean.

- [ ] **Step 8: Commit**

```bash
git add apps/web packages/ui packages/db
git commit -m "feat(web): /boutique catalog index + category page with filter sidebar"
```

---

## Task 5 — Product detail page (`/produit/[slug]`)

**Files:**
- Create: `apps/web/components/product/ProductDetailLayout.tsx`
- Create: `apps/web/components/product/ProductGallery.tsx`
- Create: `apps/web/components/product/VariantSelector.tsx`
- Create: `apps/web/components/product/ProductTabsAccordion.tsx`
- Create: `apps/web/components/product/RelatedProducts.tsx`
- Create: `apps/web/app/(shop)/produit/[slug]/page.tsx`

- [ ] **Step 1: `apps/web/components/product/ProductGallery.tsx`**

```tsx
"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@jasmin/ui";
import { ProductImageFallback, getImageUrl } from "@jasmin/ui";
import type { ProductImage } from "@jasmin/db";

export function ProductGallery({
  images,
  productName,
  brandName,
}: {
  images: ProductImage[];
  productName: string;
  brandName: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full">
        <ProductImageFallback productName={productName} brandName={brandName} className="h-full" />
      </div>
    );
  }

  const active = images[activeIdx]!;
  const activeUrl = getImageUrl(active.storagePath);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-linen">
        {activeUrl && (
          <Image
            src={activeUrl}
            alt={active.altText ?? productName}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="object-cover"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => {
            const url = getImageUrl(img.storagePath);
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md bg-linen transition-all",
                  idx === activeIdx
                    ? "ring-2 ring-deep-teal ring-offset-2 ring-offset-cream-sand"
                    : "opacity-70 hover:opacity-100",
                )}
                aria-label={`Image ${idx + 1} de ${images.length}`}
              >
                {url && (
                  <Image
                    src={url}
                    alt={img.altText ?? `${productName} ${idx + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `apps/web/components/product/VariantSelector.tsx`**

```tsx
"use client";
import type { ProductVariant } from "@jasmin/db";
import { cn } from "@jasmin/ui";

export function VariantSelector({
  variants,
  value,
  onChange,
}: {
  variants: ProductVariant[];
  value: string;
  onChange: (variantId: string) => void;
}) {
  if (variants.length === 0) return null;
  return (
    <div role="radiogroup" aria-label="Format" className="flex flex-wrap gap-2">
      {variants.map((v) => {
        const active = v.id === value;
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v.id)}
            className={cn(
              "rounded-pill px-5 py-2 font-[var(--font-label)] text-sm transition-colors",
              active
                ? "bg-deep-teal text-cream-sand"
                : "bg-linen text-deep-teal hover:bg-linen/70",
            )}
          >
            {v.name}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: `apps/web/components/product/ProductTabsAccordion.tsx`**

```tsx
import { BodyText, H3Card } from "@jasmin/ui";

export function ProductTabsAccordion({
  description,
  ingredients,
  usage,
}: {
  description: string;
  ingredients?: string | null;
  usage?: string | null;
}) {
  return (
    <div className="space-y-8 border-t border-linen pt-12">
      <Section title="Description">
        <BodyText className="whitespace-pre-line">{description}</BodyText>
      </Section>
      {ingredients && (
        <Section title="Composition">
          <pre className="whitespace-pre-wrap rounded-md bg-linen/60 p-4 font-mono text-xs leading-[1.7] text-warm-taupe-soft">
            {ingredients}
          </pre>
        </Section>
      )}
      {usage && (
        <Section title="Mode d'emploi">
          <BodyText className="whitespace-pre-line">{usage}</BodyText>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <H3Card className="font-semibold">{title}</H3Card>
      <div className="mt-3">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: `apps/web/components/product/RelatedProducts.tsx`**

```tsx
import type { ListedProduct } from "@jasmin/db/queries";
import { ProductCard, getImageUrl, type ProductCardData } from "@jasmin/ui";

export function RelatedProducts({ products }: { products: ListedProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mt-20">
      <h2 className="font-[var(--font-display)] text-3xl italic text-deep-teal lg:text-4xl">
        Vous aimerez aussi
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {products.map((p) => {
          const data: ProductCardData = {
            slug: p.product.slug,
            name: p.product.name,
            brandName: p.brand.name,
            priceTnd: p.product.hasVariants ? p.defaultVariant?.priceTnd ?? null : p.product.priceTnd,
            compareAtPriceTnd: p.product.compareAtPriceTnd,
            imageUrl: getImageUrl(p.primaryImage?.storagePath),
            imageAlt: p.primaryImage?.altText,
            stockStatus: p.stockStatus,
            hasVariants: p.product.hasVariants,
          };
          return <ProductCard key={p.product.id} product={data} />;
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: `apps/web/components/product/ProductDetailLayout.tsx`** — the main client island for variant selection + add-to-cart

```tsx
"use client";
import { useState, useTransition } from "react";
import { Button, PriceTag, Pill, Stepper, LabelEyebrow, BodyText } from "@jasmin/ui";
import type { ProductDetail } from "@jasmin/db/queries";
import { addToCartAction } from "@/app/actions/cart";
import { ProductGallery } from "./ProductGallery";
import { VariantSelector } from "./VariantSelector";
import { ArrowRight, Heart } from "lucide-react";

export function ProductDetailLayout({ detail }: { detail: ProductDetail }) {
  const { product, brand, variants, images, defaultVariant, stockStatus } = detail;
  const [variantId, setVariantId] = useState(defaultVariant?.id ?? "");
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeVariant = variants.find((v) => v.id === variantId) ?? defaultVariant;
  const displayPrice = product.hasVariants ? activeVariant?.priceTnd : product.priceTnd;
  const compareAt = product.compareAtPriceTnd;

  const handleAdd = () => {
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("productId", product.id);
      if (product.hasVariants && activeVariant) fd.set("variantId", activeVariant.id);
      fd.set("quantity", String(qty));
      const result = await addToCartAction(fd);
      setFeedback(result.ok ? "Ajouté au panier" : (result.error ?? "Erreur"));
    });
  };

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
      <ProductGallery images={images} productName={product.name} brandName={brand.name} />

      <div className="flex flex-col gap-6">
        <LabelEyebrow>{brand.name}</LabelEyebrow>
        <h1 className="font-[var(--font-display)] text-4xl italic text-deep-teal lg:text-5xl">
          {product.name}
        </h1>
        <BodyText className="text-warm-taupe-soft">{product.shortDescription}</BodyText>

        {product.hasVariants && variants.length > 0 && (
          <div className="space-y-2">
            <span className="font-[var(--font-label)] text-xs uppercase tracking-[0.18em] text-warm-taupe-soft">
              Format
            </span>
            <VariantSelector variants={variants} value={variantId} onChange={setVariantId} />
          </div>
        )}

        <div className="flex flex-wrap items-baseline gap-3">
          {displayPrice != null && (
            <span className="font-[var(--font-display)] text-3xl text-deep-teal">
              <PriceTag amount={displayPrice} compareAt={compareAt ?? null} />
            </span>
          )}
        </div>

        {stockStatus === "in_stock" && (
          <Pill tone="jasmine" className="self-start">
            En stock — livraison sous 48h
          </Pill>
        )}
        {stockStatus === "low" && (
          <Pill tone="jasmine" className="self-start">
            Plus que quelques pièces
          </Pill>
        )}
        {stockStatus === "out" && (
          <Pill tone="out" className="self-start">
            Bientôt de retour
          </Pill>
        )}

        <div className="flex items-center gap-4">
          <Stepper value={qty} onChange={setQty} />
          <Button
            variant="primary-teal"
            size="lg"
            disabled={pending || stockStatus === "out"}
            onClick={handleAdd}
            className="flex-1"
          >
            {pending ? "Ajout…" : "Ajouter au panier"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="md" className="self-start">
          <Heart className="h-4 w-4" />
          Ajouter aux favoris
        </Button>

        {feedback && (
          <p
            role="status"
            className={
              feedback === "Ajouté au panier"
                ? "text-sm text-deep-teal"
                : "text-sm text-warm-taupe"
            }
          >
            {feedback}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 border-t border-linen pt-4 font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
          <span>Paiement à la livraison</span>
          <span aria-hidden>·</span>
          <span className="opacity-60">Carte bancaire (bientôt)</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `apps/web/app/(shop)/produit/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@jasmin/db";
import { getProductBySlug, getRelatedProducts } from "@jasmin/db/queries";
import { AiryContainer, Breadcrumbs } from "@jasmin/ui";
import { ProductDetailLayout } from "@/components/product/ProductDetailLayout";
import { ProductTabsAccordion } from "@/components/product/ProductTabsAccordion";
import { RelatedProducts } from "@/components/product/RelatedProducts";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbUrl = process.env.SUPABASE_DB_URL!;
  const db = createClient(dbUrl);
  const detail = await getProductBySlug(db, slug);
  if (!detail) notFound();

  const related = await getRelatedProducts(db, detail.product.id, 4);

  return (
    <main>
      <AiryContainer className="px-6 pb-20 pt-12 lg:px-12 lg:pt-16">
        <Breadcrumbs
          items={[
            { label: "Accueil", href: "/" },
            { label: "Boutique", href: "/boutique" },
            { label: detail.category.name, href: `/boutique/${detail.category.slug}` },
            { label: detail.product.name },
          ]}
        />
        <div className="mt-8">
          <ProductDetailLayout detail={detail} />
        </div>

        <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
          <ProductTabsAccordion
            description={detail.product.description}
            ingredients={detail.product.ingredients}
            usage={detail.product.usage}
          />
        </div>

        <RelatedProducts products={related} />
      </AiryContainer>
    </main>
  );
}
```

- [ ] **Step 7: Verify + commit**

```bash
cd apps/web && bun run typecheck && cd ../.. && bun run lint
git add apps/web
git commit -m "feat(web): product detail page (/produit/[slug]) with gallery + variants + tabs + related"
```

---

## Task 6 — Landing page (Motion-animated teal hero) + brand marquee + category showcase

**Files:**
- Modify: `apps/web/package.json` (add `motion`)
- Create: `apps/web/components/landing/LandingHeroAnimated.tsx`
- Create: `apps/web/components/landing/BrandMarqueeStrip.tsx`
- Create: `apps/web/components/landing/CategoryShowcase.tsx`
- Create: `apps/web/components/landing/EditorialQuote.tsx`
- Rewrite: `apps/web/app/(shop)/page.tsx`

- [ ] **Step 1: Add Motion**

Edit `apps/web/package.json` dependencies:

```json
"motion": "11.15.0",
```

Then `bun install`.

- [ ] **Step 2: `apps/web/components/landing/LandingHeroAnimated.tsx`**

```tsx
"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Button, JasmineSprig, LabelEyebrow } from "@jasmin/ui";
import { VOICE } from "@jasmin/lib";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const HEADLINE_WORDS = VOICE.heroTagline.split(" ");

export function LandingHeroAnimated() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.85, 0.4]);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[88vh] items-end overflow-hidden bg-deep-teal pb-20 pt-32 text-cream-sand lg:pb-28 lg:pt-40"
    >
      <motion.div
        aria-hidden
        style={{ y }}
        className="pointer-events-none absolute right-0 top-0 h-full w-3/5 opacity-60"
      >
        <div className="absolute -right-10 top-10 h-[420px] w-[420px] rotate-12 text-jasmine/40">
          <JasmineSprig className="h-full w-full" />
        </div>
        <div className="absolute -right-32 bottom-12 h-[640px] w-[640px] -rotate-6 text-cream-sand/10">
          <JasmineSprig className="h-full w-full" />
        </div>
      </motion.div>

      <motion.div style={{ opacity }} className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-12">
        <LabelEyebrow className="text-jasmine">Bienvenue</LabelEyebrow>
        <h1 className="mt-6 max-w-4xl font-[var(--font-display)] text-[3.5rem] leading-[0.98] italic text-cream-sand sm:text-7xl lg:text-[7.5rem]">
          {HEADLINE_WORDS.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.6, ease: "easeOut" }}
              className="mr-3 inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <p className="mt-6 max-w-xl font-[var(--font-body)] text-base leading-[1.7] text-cream-sand/80 lg:text-lg">
          {VOICE.heroSubtitle}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild variant="jasmine" size="lg">
            <Link href="/boutique">
              Découvrir la boutique <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="text-cream-sand hover:bg-cream-sand/10">
            <Link href="/notre-histoire">Notre histoire</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={reduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute inset-x-0 bottom-6 mx-auto flex justify-center text-cream-sand/70"
      >
        <motion.span
          animate={reduced ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="font-[var(--font-label)] text-xs uppercase tracking-[0.32em]"
        >
          ↓ Découvrir
        </motion.span>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 3: `apps/web/components/landing/BrandMarqueeStrip.tsx`**

```tsx
import { Marquee, AiryContainer, LabelEyebrow } from "@jasmin/ui";
import { VOICE } from "@jasmin/lib";

const BRANDS = ["SVR", "Avène", "La Roche-Posay", "Vichy", "Bioderma", "Nuxe"] as const;

export function BrandMarqueeStrip() {
  return (
    <AiryContainer className="px-6 py-14 lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <LabelEyebrow>{VOICE.trustedBrandsLabel}</LabelEyebrow>
        <Marquee className="mt-6">
          {BRANDS.map((b) => (
            <span
              key={b}
              className="font-[var(--font-display)] text-2xl italic text-warm-taupe-soft lg:text-3xl"
            >
              {b}
            </span>
          ))}
        </Marquee>
      </div>
    </AiryContainer>
  );
}
```

- [ ] **Step 4: `apps/web/components/landing/CategoryShowcase.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@jasmin/db";
import { listCategories } from "@jasmin/db/queries";
import { AiryContainer, H2Section, BodyText } from "@jasmin/ui";

export async function CategoryShowcase() {
  const dbUrl = process.env.SUPABASE_DB_URL!;
  const db = createClient(dbUrl);
  const categories = await listCategories(db);
  const roots = categories.filter((c) => c.parentId === null);

  return (
    <AiryContainer className="px-6 py-20 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        <H2Section>Nos univers</H2Section>
        <BodyText className="mt-3 max-w-2xl">
          Quatre rayons, une même attention au détail — sélectionnés avec soin, livrés avec sourire.
        </BodyText>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {roots.map((c) => (
            <Link
              key={c.id}
              href={`/boutique/${c.slug}`}
              className="group flex flex-col justify-between rounded-lg bg-linen/60 p-8 transition-all duration-300 hover:bg-linen hover:shadow-soft"
            >
              <h3 className="font-[var(--font-display)] text-2xl italic text-deep-teal">{c.name}</h3>
              <p className="mt-3 font-[var(--font-body)] text-sm leading-[1.6] text-warm-taupe-soft">
                {c.description}
              </p>
              <span className="mt-8 font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-deep-teal transition-colors group-hover:text-deep-teal-dark">
                Explorer →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AiryContainer>
  );
}
```

- [ ] **Step 5: `apps/web/components/landing/EditorialQuote.tsx`**

```tsx
import { AiryContainer } from "@jasmin/ui";

export function EditorialQuote() {
  return (
    <AiryContainer className="bg-linen px-6 py-24 lg:px-12 lg:py-32">
      <blockquote className="mx-auto max-w-3xl text-center">
        <p className="font-[var(--font-display)] text-3xl italic leading-[1.3] text-deep-teal lg:text-5xl">
          « Une parapharmacie qui ressemble à la Méditerranée : douce, généreuse, attentive. »
        </p>
        <footer className="mt-8 font-[var(--font-label)] text-xs uppercase tracking-[0.32em] text-warm-taupe-soft">
          — Notre philosophie
        </footer>
      </blockquote>
    </AiryContainer>
  );
}
```

- [ ] **Step 6: Rewrite `apps/web/app/(shop)/page.tsx`**

```tsx
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TealHeroPanel } from "@jasmin/ui";
import { BrandMarqueeStrip } from "@/components/landing/BrandMarqueeStrip";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { EditorialQuote } from "@/components/landing/EditorialQuote";

const LandingHeroAnimated = dynamic(
  () => import("@/components/landing/LandingHeroAnimated").then((m) => m.LandingHeroAnimated),
  {
    ssr: true,
    loading: () => <TealHeroPanel className="min-h-[88vh]" aria-hidden />,
  },
);

export const revalidate = 60;

export default function HomePage() {
  return (
    <main>
      <LandingHeroAnimated />
      <BrandMarqueeStrip />
      <Suspense fallback={null}>
        <CategoryShowcase />
      </Suspense>
      <EditorialQuote />
    </main>
  );
}
```

- [ ] **Step 7: Verify + commit**

```bash
cd apps/web && bun run typecheck && cd ../.. && bun run lint
git add apps/web bun.lock
git commit -m "feat(web): Motion-animated landing hero, brand marquee, category showcase, editorial quote"
```

---

## Task 7 — Cart actions + CartDrawer + `/panier` page

**Files:**
- Create: `apps/web/app/actions/cart.ts`
- Create: `apps/web/lib/cart/server.ts` (already partially in Task 2 — extend)
- Create: `apps/web/components/cart/CartDrawer.tsx`
- Create: `apps/web/components/cart/CartLineItem.tsx`
- Create: `apps/web/components/cart/CartTotals.tsx`
- Create: `apps/web/components/cart/EmptyCart.tsx`
- Create: `apps/web/app/(shop)/panier/page.tsx`
- Modify: `apps/web/app/(shop)/layout.tsx` (mount CartDrawer)
- Modify: `apps/web/components/layout/TopNav.tsx` (open drawer instead of routing)

- [ ] **Step 1: Extend `apps/web/lib/cart/server.ts`**

Replace the existing file with the full version:

```ts
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { createClient, type Database } from "@jasmin/db";
import {
  brands,
  carts,
  cartItems,
  inventory,
  productImages,
  products,
  productVariants,
} from "@jasmin/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const CART_COOKIE = "jms_cart_session";

export interface CartLine {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  variantId: string | null;
  variantName: string | null;
  unitPriceTnd: string;
  quantity: number;
  lineTotalTnd: string;
  imageStoragePath: string | null;
  stockOnHand: number;
}

export interface CartView {
  cartId: string | null;
  customerId: string | null;
  sessionId: string | null;
  lines: CartLine[];
  subtotalTnd: number;
  shippingTnd: number;
  totalTnd: number;
  itemCount: number;
}

async function ensureSessionCookie(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  jar.set(CART_COOKIE, fresh, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return fresh;
}

async function findOrCreateCart(
  db: Database,
  customerId: string | null,
  sessionId: string,
): Promise<string> {
  if (customerId) {
    const rows = await db.select().from(carts).where(eq(carts.customerId, customerId));
    if (rows[0]) return rows[0].id;
    const inserted = await db
      .insert(carts)
      .values({ customerId })
      .returning({ id: carts.id });
    return inserted[0]!.id;
  }
  const rows = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
  if (rows[0]) return rows[0].id;
  const inserted = await db.insert(carts).values({ sessionId }).returning({ id: carts.id });
  return inserted[0]!.id;
}

export async function getCart(): Promise<CartView> {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const empty: CartView = {
    cartId: null,
    customerId: null,
    sessionId: null,
    lines: [],
    subtotalTnd: 0,
    shippingTnd: 0,
    totalTnd: 0,
    itemCount: 0,
  };
  if (!dbUrl) return empty;
  const db = createClient(dbUrl);

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const customerId = userData.user?.id ?? null;
  const sessionId = (await cookies()).get(CART_COOKIE)?.value ?? null;

  let cartId: string | null = null;
  if (customerId) {
    const rows = await db.select().from(carts).where(eq(carts.customerId, customerId));
    cartId = rows[0]?.id ?? null;
  } else if (sessionId) {
    const rows = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
    cartId = rows[0]?.id ?? null;
  }

  if (!cartId) {
    return { ...empty, customerId, sessionId };
  }

  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  const lines: CartLine[] = [];
  let subtotal = 0;

  for (const item of items) {
    const productRow = (
      await db.select().from(products).where(eq(products.id, item.productId))
    )[0];
    if (!productRow) continue;
    const brandRow = (await db.select().from(brands).where(eq(brands.id, productRow.brandId)))[0];
    const variantRow = item.variantId
      ? (
          await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId))
        )[0]
      : null;
    const primaryImage = (
      await db
        .select()
        .from(productImages)
        .where(and(eq(productImages.productId, productRow.id), eq(productImages.isPrimary, true)))
    )[0];
    const inv = item.variantId
      ? (await db.select().from(inventory).where(eq(inventory.variantId, item.variantId)))[0]
      : (await db.select().from(inventory).where(eq(inventory.productId, productRow.id)))[0];

    const unitPrice = Number(variantRow?.priceTnd ?? productRow.priceTnd ?? 0);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    lines.push({
      id: item.id,
      productId: productRow.id,
      productSlug: productRow.slug,
      productName: productRow.name,
      brandName: brandRow?.name ?? "",
      variantId: variantRow?.id ?? null,
      variantName: variantRow?.name ?? null,
      unitPriceTnd: unitPrice.toFixed(3),
      quantity: item.quantity,
      lineTotalTnd: lineTotal.toFixed(3),
      imageStoragePath: primaryImage?.storagePath ?? null,
      stockOnHand: inv?.onHand ?? 0,
    });
  }

  const shipping = subtotal > 200 ? 0 : 7;
  const total = subtotal + shipping;

  return {
    cartId,
    customerId,
    sessionId,
    lines,
    subtotalTnd: subtotal,
    shippingTnd: shipping,
    totalTnd: total,
    itemCount: lines.reduce((acc, l) => acc + l.quantity, 0),
  };
}

export async function getCartCount(): Promise<number> {
  const view = await getCart();
  return view.itemCount;
}

export { ensureSessionCookie, findOrCreateCart };
```

- [ ] **Step 2: `apps/web/app/actions/cart.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { createClient } from "@jasmin/db";
import { cartItems } from "@jasmin/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureSessionCookie, findOrCreateCart } from "@/lib/cart/server";

export interface CartActionResult {
  ok: boolean;
  error?: string;
}

function getDb() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL not set");
  return createClient(url);
}

async function authContext(): Promise<{ customerId: string | null; sessionId: string }> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const customerId = data.user?.id ?? null;
  const sessionId = await ensureSessionCookie();
  return { customerId, sessionId };
}

export async function addToCartAction(formData: FormData): Promise<CartActionResult> {
  const productId = String(formData.get("productId") ?? "");
  const variantIdRaw = formData.get("variantId");
  const variantId = variantIdRaw && String(variantIdRaw).length > 0 ? String(variantIdRaw) : null;
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));
  if (!productId) return { ok: false, error: "Produit invalide." };

  const db = getDb();
  const { customerId, sessionId } = await authContext();
  const cartId = await findOrCreateCart(db, customerId, sessionId);

  const existing = (
    await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId),
          variantId ? eq(cartItems.variantId, variantId) : eq(cartItems.variantId, ""),
        ),
      )
  )[0];

  if (existing && (existing.variantId ?? null) === (variantId ?? null)) {
    await db
      .update(cartItems)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ cartId, productId, variantId, quantity });
  }

  revalidatePath("/panier");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartItemAction(formData: FormData): Promise<CartActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Math.max(0, Number(formData.get("quantity") ?? 1));
  if (!itemId) return { ok: false, error: "Ligne invalide." };
  const db = getDb();

  if (quantity === 0) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId));
  }
  revalidatePath("/panier");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItemAction(formData: FormData): Promise<CartActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return { ok: false, error: "Ligne invalide." };
  const db = getDb();
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  revalidatePath("/panier");
  revalidatePath("/", "layout");
  return { ok: true };
}
```

- [ ] **Step 3: `apps/web/components/cart/CartLineItem.tsx`**

```tsx
"use client";
import Image from "next/image";
import { Stepper, ProductImageFallback, getImageUrl, PriceTag } from "@jasmin/ui";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import type { CartLine } from "@/lib/cart/server";
import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/actions/cart";

export function CartLineItem({ line }: { line: CartLine }) {
  const [pending, start] = useTransition();
  const url = getImageUrl(line.imageStoragePath);

  const update = (qty: number) =>
    start(async () => {
      const fd = new FormData();
      fd.set("itemId", line.id);
      fd.set("quantity", String(qty));
      await updateCartItemAction(fd);
    });

  const remove = () =>
    start(async () => {
      const fd = new FormData();
      fd.set("itemId", line.id);
      await removeCartItemAction(fd);
    });

  return (
    <article className="flex gap-4 border-b border-linen pb-6 last:border-b-0">
      <div className="relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-md bg-linen">
        {url ? (
          <Image
            src={url}
            alt={line.productName}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <ProductImageFallback productName={line.productName} brandName={line.brandName} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-deep-teal/80">
              {line.brandName}
            </span>
            <h3 className="font-[var(--font-display)] text-base text-warm-taupe">
              {line.productName}
            </h3>
            {line.variantName && (
              <span className="font-[var(--font-body)] text-xs text-warm-taupe-soft">
                {line.variantName}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Retirer du panier"
            className="text-warm-taupe-soft transition-colors hover:text-deep-teal disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <Stepper value={line.quantity} onChange={update} max={Math.max(line.stockOnHand, 1)} />
          <PriceTag amount={line.lineTotalTnd} />
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: `apps/web/components/cart/CartTotals.tsx`**

```tsx
import { PriceTag } from "@jasmin/ui";

export function CartTotals({
  subtotalTnd,
  shippingTnd,
  totalTnd,
}: {
  subtotalTnd: number;
  shippingTnd: number;
  totalTnd: number;
}) {
  return (
    <dl className="space-y-2 font-[var(--font-body)] text-sm text-warm-taupe">
      <div className="flex items-center justify-between">
        <dt>Sous-total</dt>
        <dd><PriceTag amount={subtotalTnd} /></dd>
      </div>
      <div className="flex items-center justify-between">
        <dt>Livraison</dt>
        <dd>
          {shippingTnd === 0 ? (
            <span className="font-medium text-deep-teal">Offerte</span>
          ) : (
            <PriceTag amount={shippingTnd} />
          )}
        </dd>
      </div>
      <div className="flex items-center justify-between border-t border-linen pt-3 text-base font-semibold">
        <dt>Total TTC</dt>
        <dd><PriceTag amount={totalTnd} /></dd>
      </div>
    </dl>
  );
}
```

- [ ] **Step 5: `apps/web/components/cart/EmptyCart.tsx`**

```tsx
import Link from "next/link";
import { EmptyState, JasmineSprig, Button } from "@jasmin/ui";
import { VOICE } from "@jasmin/lib";

export function EmptyCart() {
  return (
    <EmptyState
      title={VOICE.emptyCartTitle}
      description="Découvrez notre sélection de cosmétiques, orthopédie et matériel médical."
      illustration={<JasmineSprig className="h-16 w-16 text-jasmine" />}
      action={
        <Button asChild variant="primary-teal">
          <Link href="/boutique">{VOICE.emptyCartCta}</Link>
        </Button>
      }
    />
  );
}
```

- [ ] **Step 6: `apps/web/components/cart/CartDrawer.tsx`**

```tsx
"use client";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { Button } from "@jasmin/ui";
import type { CartView } from "@/lib/cart/server";
import { CartLineItem } from "./CartLineItem";
import { CartTotals } from "./CartTotals";
import { EmptyCart } from "./EmptyCart";
import { useState } from "react";

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
```

- [ ] **Step 7: Wire `CartDrawer` into the layout — replace `MiniCart` usage in `TopNav`**

Edit `apps/web/components/layout/TopNav.tsx`. Remove the `MiniCart` import and replace with `CartDrawer`. The simplest path: pass the cart data into `TopNav` via a prop (since TopNav is a server component, it can fetch). But TopNav also lives in the layout which fetches once. Cleaner: `(shop)/layout.tsx` fetches `getCart()` once and passes it to both `TopNav` (cart count) and `CartDrawer` (full cart).

Replace `apps/web/app/(shop)/layout.tsx` with:

```tsx
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getCart } from "@/lib/cart/server";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const cart = await getCart();
  return (
    <>
      <TopNav cartCount={cart.itemCount} CartDrawerSlot={<CartDrawer cart={cart} />} />
      {children}
      <Footer />
    </>
  );
}
```

Update `TopNav.tsx` to accept the slot:

```tsx
import Link from "next/link";
import { Logo } from "@jasmin/ui";
import { Search, User } from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import type { ReactNode } from "react";

const NAV = [
  { href: "/boutique", label: "Boutique" },
  { href: "/boutique/cosmetique", label: "Cosmétique" },
  { href: "/boutique/orthopedie", label: "Orthopédie" },
  { href: "/boutique/materiel-medical", label: "Matériel médical" },
  { href: "/notre-histoire", label: "Notre histoire" },
  { href: "/contact", label: "Contact" },
] as const;

export interface TopNavProps {
  variant?: "cream" | "default";
  cartCount?: number;
  CartDrawerSlot: ReactNode;
}

export function TopNav({ variant = "default", CartDrawerSlot }: TopNavProps) {
  const isOnTeal = variant === "cream";
  return (
    <header
      className={
        isOnTeal
          ? "absolute inset-x-0 top-0 z-30 px-6 py-6 lg:px-12"
          : "sticky top-0 z-30 border-b border-linen bg-cream-sand/90 px-6 py-4 backdrop-blur lg:px-12"
      }
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6">
        <Link href="/" aria-label="Accueil" className="shrink-0">
          <Logo variant={isOnTeal ? "cream" : "default"} size="md" />
        </Link>
        <nav
          aria-label="Navigation principale"
          className={
            "hidden items-center gap-7 font-[var(--font-label)] text-sm tracking-wide lg:flex " +
            (isOnTeal ? "text-cream-sand/90" : "text-warm-taupe")
          }
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-jasmine"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={"flex items-center gap-2 " + (isOnTeal ? "text-cream-sand" : "text-warm-taupe")}>
          <button
            type="button"
            aria-label="Rechercher"
            className="hidden h-10 w-10 items-center justify-center rounded-pill transition-colors hover:bg-linen/40 lg:inline-flex"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/compte"
            aria-label="Mon compte"
            className="hidden h-10 w-10 items-center justify-center rounded-pill transition-colors hover:bg-linen/40 lg:inline-flex"
          >
            <User className="h-5 w-5" />
          </Link>
          {CartDrawerSlot}
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 8: `apps/web/app/(shop)/panier/page.tsx`**

```tsx
import { AiryContainer, Breadcrumbs } from "@jasmin/ui";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartTotals } from "@/components/cart/CartTotals";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { getCart } from "@/lib/cart/server";
import Link from "next/link";
import { Button } from "@jasmin/ui";

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
```

- [ ] **Step 9: Verify + commit**

```bash
cd apps/web && bun run typecheck && cd ../.. && bun run lint
git add apps/web
git commit -m "feat(web): cart actions + drawer + /panier page"
```

---

## Task 8 — Checkout: createOrder action + `/commande` + confirmation page

**Files:**
- Create: `apps/web/app/actions/checkout.ts`
- Create: `apps/web/components/checkout/CheckoutForm.tsx`
- Create: `apps/web/components/checkout/ShippingAddressForm.tsx`
- Create: `apps/web/components/checkout/PaymentMethodPicker.tsx`
- Create: `apps/web/components/checkout/OrderSummary.tsx`
- Create: `apps/web/app/(shop)/commande/page.tsx`
- Create: `apps/web/app/(shop)/commande/confirmation/[orderNumber]/page.tsx`

- [ ] **Step 1: `apps/web/app/actions/checkout.ts`**

```ts
"use server";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@jasmin/db";
import {
  brands,
  cartItems,
  carts,
  inventory,
  orders,
  orderEvents,
  orderItems,
  productVariants,
  products,
  stockMovements,
} from "@jasmin/db/schema";
import { CheckoutSchema, generateOrderNumber } from "@jasmin/lib";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureSessionCookie } from "@/lib/cart/server";
import { revalidatePath } from "next/cache";

export interface CheckoutResult {
  ok: boolean;
  orderNumber?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createOrderAction(formData: FormData): Promise<CheckoutResult> {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return { ok: false, error: "Service indisponible." };
  const db = createClient(dbUrl);

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const customerId = userData.user?.id ?? null;
  const sessionId = await ensureSessionCookie();

  const cartRow = customerId
    ? (await db.select().from(carts).where(eq(carts.customerId, customerId)))[0]
    : (await db.select().from(carts).where(eq(carts.sessionId, sessionId)))[0];

  if (!cartRow) return { ok: false, error: "Votre panier est vide." };

  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartRow.id));
  if (items.length === 0) return { ok: false, error: "Votre panier est vide." };

  const parsed = CheckoutSchema.safeParse({
    customerId,
    guestEmail: formData.get("guestEmail") || undefined,
    guestPhone: formData.get("guestPhone") || undefined,
    shipping: {
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      street: formData.get("street"),
      city: formData.get("city"),
      postalCode: formData.get("postalCode"),
      governorate: formData.get("governorate"),
      country: formData.get("country") ?? "TN",
    },
    items: items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId,
      quantity: it.quantity,
    })),
    paymentMethod: formData.get("paymentMethod") ?? "cash_on_delivery",
    notesCustomer: formData.get("notesCustomer") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, error: "Vérifiez les informations.", fieldErrors };
  }

  const checkout = parsed.data;

  // Recompute price + stock authoritatively, in a transaction.
  const orderNumber = await db.transaction(async (tx) => {
    let subtotal = 0;
    const itemRows: typeof orderItems.$inferInsert[] = [];

    for (const it of checkout.items) {
      const product = (await tx.select().from(products).where(eq(products.id, it.productId)))[0];
      if (!product) throw new Error(`Produit introuvable: ${it.productId}`);
      const variant = it.variantId
        ? (await tx.select().from(productVariants).where(eq(productVariants.id, it.variantId)))[0]
        : undefined;
      const brand = (await tx.select().from(brands).where(eq(brands.id, product.brandId)))[0];

      const inv = it.variantId
        ? (await tx.select().from(inventory).where(eq(inventory.variantId, it.variantId)))[0]
        : (await tx.select().from(inventory).where(eq(inventory.productId, product.id)))[0];
      if (!inv || inv.onHand < it.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      const unitPrice = Number(variant?.priceTnd ?? product.priceTnd ?? 0);
      const lineTotal = unitPrice * it.quantity;
      subtotal += lineTotal;

      itemRows.push({
        orderId: "00000000-0000-0000-0000-000000000000",
        productId: product.id,
        variantId: variant?.id ?? null,
        productNameSnapshot: product.name,
        variantNameSnapshot: variant?.name ?? null,
        brandSnapshot: brand?.name ?? "",
        skuSnapshot: variant?.sku ?? product.sku ?? "",
        unitPriceTnd: unitPrice.toFixed(3),
        quantity: it.quantity,
        lineTotalTnd: lineTotal.toFixed(3),
      });
    }

    const shippingFee = subtotal > 200 ? 0 : 7;
    const total = subtotal + shippingFee;

    const seqRow = (await tx.execute(sql`SELECT nextval('jms_order_seq') AS seq`)).rows[0] as {
      seq: string | number;
    };
    const sequence = Number(seqRow.seq);
    const year = new Date().getFullYear();
    const orderNumber = generateOrderNumber({ year, sequence });

    const insertedOrder = await tx
      .insert(orders)
      .values({
        orderNumber,
        customerId: checkout.customerId ?? null,
        guestEmail: checkout.guestEmail ?? null,
        guestPhone: checkout.guestPhone ?? null,
        shippingFullName: checkout.shipping.fullName,
        shippingPhone: checkout.shipping.phone,
        shippingStreet: checkout.shipping.street,
        shippingCity: checkout.shipping.city,
        shippingPostalCode: checkout.shipping.postalCode,
        shippingGovernorate: checkout.shipping.governorate,
        subtotalTnd: subtotal.toFixed(3),
        shippingTnd: shippingFee.toFixed(3),
        totalTnd: total.toFixed(3),
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: checkout.paymentMethod,
        notesCustomer: checkout.notesCustomer ?? null,
      })
      .returning({ id: orders.id });
    const orderId = insertedOrder[0]!.id;

    for (const row of itemRows) {
      await tx.insert(orderItems).values({ ...row, orderId });
    }

    await tx.insert(orderEvents).values({
      orderId,
      eventType: "created",
      toStatus: "pending",
    });

    for (const it of checkout.items) {
      await tx.insert(stockMovements).values({
        productId: it.variantId ? null : it.productId,
        variantId: it.variantId ?? null,
        type: "sale",
        quantity: -it.quantity,
        referenceType: "order",
        referenceId: orderId,
      });
      if (it.variantId) {
        await tx
          .update(inventory)
          .set({ onHand: sql`${inventory.onHand} - ${it.quantity}` })
          .where(eq(inventory.variantId, it.variantId));
      } else {
        await tx
          .update(inventory)
          .set({ onHand: sql`${inventory.onHand} - ${it.quantity}` })
          .where(eq(inventory.productId, it.productId));
      }
    }

    await tx.delete(cartItems).where(eq(cartItems.cartId, cartRow.id));

    return orderNumber;
  });

  revalidatePath("/", "layout");
  redirect(`/commande/confirmation/${orderNumber}`);
}
```

- [ ] **Step 2: `apps/web/components/checkout/ShippingAddressForm.tsx`**

```tsx
import { Input } from "@jasmin/ui";

const GOVERNORATES = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
] as const;

export function ShippingAddressForm({ defaults }: { defaults?: Partial<Record<string, string>> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Nom complet" name="fullName" defaultValue={defaults?.fullName} />
      <Field label="Téléphone" name="phone" type="tel" placeholder="+216 …" defaultValue={defaults?.phone} />
      <div className="sm:col-span-2">
        <Field label="Adresse" name="street" defaultValue={defaults?.street} />
      </div>
      <Field label="Ville" name="city" defaultValue={defaults?.city} />
      <Field label="Code postal" name="postalCode" defaultValue={defaults?.postalCode} />
      <div className="sm:col-span-2">
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
            Gouvernorat
          </span>
          <select
            name="governorate"
            required
            defaultValue={defaults?.governorate ?? "Nabeul"}
            className="h-11 w-full rounded-md bg-linen px-4 font-[var(--font-body)] text-base text-warm-taupe focus:outline-none focus:ring-2 focus:ring-deep-teal/40"
          >
            {GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
      <input type="hidden" name="country" value="TN" />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
        {label}
      </span>
      <Input name={name} type={type} required defaultValue={defaultValue} placeholder={placeholder} />
    </label>
  );
}
```

- [ ] **Step 3: `apps/web/components/checkout/PaymentMethodPicker.tsx`**

```tsx
"use client";
import { cn } from "@jasmin/ui";
import { useState } from "react";

const METHODS = [
  { value: "cash_on_delivery", label: "Paiement à la livraison", desc: "Vous payez en main propre.", available: true },
  { value: "card_konnect", label: "Carte bancaire (Konnect)", desc: "Bientôt disponible.", available: false },
  { value: "card_clic_to_pay", label: "Click to Pay (SMT)", desc: "Bientôt disponible.", available: false },
  { value: "bank_transfer", label: "Virement bancaire", desc: "Sur devis pour gros volumes.", available: false },
] as const;

export function PaymentMethodPicker() {
  const [value, setValue] = useState<(typeof METHODS)[number]["value"]>("cash_on_delivery");
  return (
    <div role="radiogroup" aria-label="Mode de paiement" className="space-y-3">
      {METHODS.map((m) => {
        const active = m.value === value;
        return (
          <label
            key={m.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all",
              !m.available && "cursor-not-allowed opacity-50",
              active ? "border-deep-teal bg-linen/60 shadow-soft" : "border-linen hover:border-deep-teal/30",
            )}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={m.value}
              checked={active}
              disabled={!m.available}
              onChange={() => m.available && setValue(m.value)}
              className="mt-1 accent-deep-teal"
            />
            <span>
              <span className="block font-[var(--font-body)] font-medium text-warm-taupe">
                {m.label}
              </span>
              <span className="block font-[var(--font-body)] text-sm text-warm-taupe-soft">
                {m.desc}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: `apps/web/components/checkout/OrderSummary.tsx`**

```tsx
import { ProductImageFallback, getImageUrl, PriceTag } from "@jasmin/ui";
import Image from "next/image";
import type { CartLine } from "@/lib/cart/server";

export function OrderSummary({
  lines,
  subtotalTnd,
  shippingTnd,
  totalTnd,
}: {
  lines: CartLine[];
  subtotalTnd: number;
  shippingTnd: number;
  totalTnd: number;
}) {
  return (
    <div className="rounded-lg bg-linen/60 p-6">
      <h2 className="font-[var(--font-display)] text-xl italic text-deep-teal">Récapitulatif</h2>
      <ul className="mt-6 space-y-4">
        {lines.map((line) => {
          const url = getImageUrl(line.imageStoragePath);
          return (
            <li key={line.id} className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-cream-sand">
                {url ? (
                  <Image src={url} alt={line.productName} fill sizes="64px" className="object-cover" />
                ) : (
                  <ProductImageFallback productName={line.productName} brandName={line.brandName} />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-[var(--font-display)] text-sm text-warm-taupe">
                  {line.productName}
                </span>
                <span className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.2em] text-warm-taupe-soft">
                  {line.variantName ? `${line.variantName} · ` : ""}× {line.quantity}
                </span>
              </div>
              <PriceTag amount={line.lineTotalTnd} />
            </li>
          );
        })}
      </ul>
      <dl className="mt-6 space-y-2 border-t border-linen pt-4 font-[var(--font-body)] text-sm text-warm-taupe">
        <Row label="Sous-total" value={<PriceTag amount={subtotalTnd} />} />
        <Row
          label="Livraison"
          value={
            shippingTnd === 0 ? (
              <span className="font-medium text-deep-teal">Offerte</span>
            ) : (
              <PriceTag amount={shippingTnd} />
            )
          }
        />
        <Row label="Total TTC" value={<PriceTag amount={totalTnd} />} bold />
      </dl>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div
      className={
        bold
          ? "flex items-center justify-between border-t border-linen pt-3 text-base font-semibold"
          : "flex items-center justify-between"
      }
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
```

- [ ] **Step 5: `apps/web/components/checkout/CheckoutForm.tsx`**

```tsx
"use client";
import { useTransition, useState } from "react";
import { Button, BodyText, Input } from "@jasmin/ui";
import { VOICE } from "@jasmin/lib";
import { ShippingAddressForm } from "./ShippingAddressForm";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { createOrderAction, type CheckoutResult } from "@/app/actions/checkout";

export function CheckoutForm({ isGuest }: { isGuest: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CheckoutResult | null>(null);

  return (
    <form
      action={(fd) => {
        setResult(null);
        startTransition(async () => {
          const r = await createOrderAction(fd);
          if (!r.ok) setResult(r);
        });
      }}
      className="space-y-10"
    >
      <section>
        <h2 className="font-[var(--font-display)] text-2xl italic text-deep-teal">
          Adresse de livraison
        </h2>
        <BodyText className="mt-2 text-warm-taupe-soft">
          Nous livrons partout en Tunisie sous 48 à 72 heures.
        </BodyText>
        <div className="mt-6">
          <ShippingAddressForm />
        </div>
      </section>

      {isGuest && (
        <section>
          <h2 className="font-[var(--font-display)] text-2xl italic text-deep-teal">
            Vos coordonnées
          </h2>
          <BodyText className="mt-2 text-warm-taupe-soft">
            Pour vous tenir au courant de votre commande.
          </BodyText>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
                Email
              </span>
              <Input name="guestEmail" type="email" required />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
                Téléphone
              </span>
              <Input name="guestPhone" type="tel" required placeholder="+216 …" />
            </label>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-[var(--font-display)] text-2xl italic text-deep-teal">
          Mode de paiement
        </h2>
        <BodyText className="mt-2 text-warm-taupe-soft">{VOICE.codNotice}</BodyText>
        <div className="mt-6">
          <PaymentMethodPicker />
        </div>
      </section>

      <section>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
            Instructions à la livraison (optionnel)
          </span>
          <textarea
            name="notesCustomer"
            rows={3}
            className="w-full rounded-md bg-linen px-4 py-3 font-[var(--font-body)] text-base text-warm-taupe placeholder:text-warm-taupe-soft focus:outline-none focus:ring-2 focus:ring-deep-teal/40"
            placeholder="Sonnez deux fois, laissez chez la concierge…"
          />
        </label>
      </section>

      {result && !result.ok && (
        <p role="alert" className="rounded-md bg-warm-taupe/10 px-4 py-3 text-sm text-warm-taupe">
          {result.error ?? "Une erreur est survenue."}
        </p>
      )}

      <div>
        <Button type="submit" variant="primary-teal" size="lg" disabled={pending} className="w-full">
          {pending ? "Validation…" : "Confirmer la commande"}
        </Button>
        <p className="mt-3 text-center font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
          Aucun paiement n'est prélevé en ligne — vous payez à la réception.
        </p>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: `apps/web/app/(shop)/commande/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { AiryContainer, Breadcrumbs, EmptyState, Button } from "@jasmin/ui";
import Link from "next/link";
import { getCart } from "@/lib/cart/server";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
```

- [ ] **Step 7: `apps/web/app/(shop)/commande/confirmation/[orderNumber]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@jasmin/db";
import { getOrderByNumber } from "@jasmin/db/queries";
import { AiryContainer, Button, JasmineSprig, BodyText, PriceTag } from "@jasmin/ui";
import { VOICE } from "@jasmin/lib";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const dbUrl = process.env.SUPABASE_DB_URL!;
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
                <li key={it.id} className="flex items-baseline justify-between font-[var(--font-body)] text-sm text-warm-taupe">
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
```

- [ ] **Step 8: Verify + commit**

```bash
cd apps/web && bun run typecheck && cd ../.. && bun run lint
git add apps/web
git commit -m "feat(web): checkout action + form + /commande + confirmation page (COD)"
```

---

## Task 9 — Auth: signup/signin/signout/reset actions + login + signup + forgot + reset pages

**Files:**
- Create: `apps/web/app/actions/auth.ts`
- Create: `apps/web/app/(shop)/compte/connexion/page.tsx`
- Create: `apps/web/app/(shop)/compte/inscription/page.tsx`
- Create: `apps/web/app/(shop)/compte/mot-de-passe-oublie/page.tsx`
- Create: `apps/web/app/(shop)/compte/reinitialiser/page.tsx`
- Create: `apps/web/components/auth/LoginForm.tsx`
- Create: `apps/web/components/auth/SignupForm.tsx`
- Create: `apps/web/components/auth/ForgotPasswordForm.tsx`
- Create: `apps/web/components/auth/ResetPasswordForm.tsx`

- [ ] **Step 1: `apps/web/app/actions/auth.ts`**

```ts
"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@jasmin/db";
import { carts, cartItems } from "@jasmin/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureSessionCookie } from "@/lib/cart/server";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function signUpAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  if (!email || !password) return { ok: false, error: "Email et mot de passe requis." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { ok: false, error: error.message };
  redirect("/compte");
}

export async function signInAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: error?.message ?? "Connexion échouée." };

  // Merge guest cart into customer cart.
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (dbUrl) {
    const db = createClient(dbUrl);
    const sessionId = await ensureSessionCookie();
    const guestCart = (await db.select().from(carts).where(eq(carts.sessionId, sessionId)))[0];
    if (guestCart) {
      const customerCart =
        (await db.select().from(carts).where(eq(carts.customerId, data.user.id)))[0] ??
        (
          await db
            .insert(carts)
            .values({ customerId: data.user.id })
            .returning({ id: carts.id })
        )[0]!;

      const guestItems = await db.select().from(cartItems).where(eq(cartItems.cartId, guestCart.id));
      for (const item of guestItems) {
        await db.insert(cartItems).values({ ...item, id: undefined, cartId: customerCart.id });
      }
      await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
      await db.delete(carts).where(eq(carts.id, guestCart.id));
    }
  }

  redirect("/compte");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "");
  if (!email) return { ok: false, error: "Email requis." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/auth/v1/verify?type=recovery`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function resetPasswordAction(formData: FormData): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { ok: false, error: "Mot de passe trop court (8 minimum)." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  redirect("/compte");
}
```

- [ ] **Step 2: Create the four form components**

`apps/web/components/auth/SignupForm.tsx`:

```tsx
"use client";
import { useTransition, useState } from "react";
import { Button, Input, BodyText } from "@jasmin/ui";
import { signUpAction, type AuthResult } from "@/app/actions/auth";
import Link from "next/link";

export function SignupForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await signUpAction(fd);
          if (!r.ok) setResult(r);
        })
      }
      className="space-y-4"
    >
      <Field label="Nom complet" name="fullName" />
      <Field label="Email" name="email" type="email" />
      <Field label="Mot de passe (8 caractères min)" name="password" type="password" minLength={8} />
      {result && !result.ok && (
        <p role="alert" className="text-sm text-warm-taupe">
          {result.error}
        </p>
      )}
      <Button type="submit" variant="primary-teal" disabled={pending} className="w-full">
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
      <BodyText className="text-center text-xs text-warm-taupe-soft">
        Déjà un compte ?{" "}
        <Link href="/compte/connexion" className="text-deep-teal underline underline-offset-2">
          Se connecter
        </Link>
      </BodyText>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
        {label}
      </span>
      <Input name={name} type={type} required minLength={minLength} />
    </label>
  );
}
```

`apps/web/components/auth/LoginForm.tsx`:

```tsx
"use client";
import { useTransition, useState } from "react";
import { Button, Input, BodyText } from "@jasmin/ui";
import { signInAction, type AuthResult } from "@/app/actions/auth";
import Link from "next/link";

export function LoginForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await signInAction(fd);
          if (!r.ok) setResult(r);
        })
      }
      className="space-y-4"
    >
      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
          Email
        </span>
        <Input name="email" type="email" required />
      </label>
      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
          Mot de passe
        </span>
        <Input name="password" type="password" required />
      </label>
      {result && !result.ok && (
        <p role="alert" className="text-sm text-warm-taupe">
          {result.error}
        </p>
      )}
      <Button type="submit" variant="primary-teal" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/compte/mot-de-passe-oublie"
          className="text-warm-taupe-soft underline underline-offset-2 hover:text-deep-teal"
        >
          Mot de passe oublié ?
        </Link>
        <Link
          href="/compte/inscription"
          className="text-deep-teal underline underline-offset-2"
        >
          Créer un compte
        </Link>
      </div>
      <BodyText className="text-center text-xs text-warm-taupe-soft">
        Pas envie de créer un compte ? Vous pouvez commander en tant qu'invité.
      </BodyText>
    </form>
  );
}
```

`apps/web/components/auth/ForgotPasswordForm.tsx`:

```tsx
"use client";
import { useTransition, useState } from "react";
import { Button, Input } from "@jasmin/ui";
import { requestPasswordResetAction, type AuthResult } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  return (
    <form
      action={(fd) =>
        start(async () => {
          setResult(await requestPasswordResetAction(fd));
        })
      }
      className="space-y-4"
    >
      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
          Email
        </span>
        <Input name="email" type="email" required />
      </label>
      {result?.ok === true && (
        <p role="status" className="text-sm text-deep-teal">
          Un email vous a été envoyé. Vérifiez votre boîte de réception.
        </p>
      )}
      {result?.ok === false && (
        <p role="alert" className="text-sm text-warm-taupe">
          {result.error}
        </p>
      )}
      <Button type="submit" variant="primary-teal" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
    </form>
  );
}
```

`apps/web/components/auth/ResetPasswordForm.tsx`:

```tsx
"use client";
import { useTransition, useState } from "react";
import { Button, Input } from "@jasmin/ui";
import { resetPasswordAction, type AuthResult } from "@/app/actions/auth";

export function ResetPasswordForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await resetPasswordAction(fd);
          if (!r.ok) setResult(r);
        })
      }
      className="space-y-4"
    >
      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
          Nouveau mot de passe
        </span>
        <Input name="password" type="password" required minLength={8} />
      </label>
      {result && !result.ok && (
        <p role="alert" className="text-sm text-warm-taupe">
          {result.error}
        </p>
      )}
      <Button type="submit" variant="primary-teal" disabled={pending} className="w-full">
        {pending ? "Mise à jour…" : "Mettre à jour"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create the four pages**

`apps/web/app/(shop)/compte/connexion/page.tsx`:

```tsx
import { AiryContainer, H1Editorial, BodyText } from "@jasmin/ui";
import { LoginForm } from "@/components/auth/LoginForm";
import { VOICE } from "@jasmin/lib";

export const dynamic = "force-dynamic";

export default function ConnexionPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-md">
          <H1Editorial className="text-4xl text-deep-teal">{VOICE.loginTitle}</H1Editorial>
          <BodyText className="mt-4">Connectez-vous pour suivre vos commandes.</BodyText>
          <div className="mt-10">
            <LoginForm />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
```

`apps/web/app/(shop)/compte/inscription/page.tsx`:

```tsx
import { AiryContainer, H1Editorial, BodyText } from "@jasmin/ui";
import { SignupForm } from "@/components/auth/SignupForm";
import { VOICE } from "@jasmin/lib";

export const dynamic = "force-dynamic";

export default function InscriptionPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-md">
          <H1Editorial className="text-4xl text-deep-teal">{VOICE.signupTitle}</H1Editorial>
          <BodyText className="mt-4">
            Créez votre compte pour suivre vos commandes et bénéficier de promotions exclusives.
          </BodyText>
          <div className="mt-10">
            <SignupForm />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
```

`apps/web/app/(shop)/compte/mot-de-passe-oublie/page.tsx`:

```tsx
import { AiryContainer, H1Editorial, BodyText } from "@jasmin/ui";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-md">
          <H1Editorial className="text-4xl text-deep-teal">Mot de passe oublié</H1Editorial>
          <BodyText className="mt-4">
            Entrez votre adresse email — nous vous envoyons un lien pour le réinitialiser.
          </BodyText>
          <div className="mt-10">
            <ForgotPasswordForm />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
```

`apps/web/app/(shop)/compte/reinitialiser/page.tsx`:

```tsx
import { AiryContainer, H1Editorial, BodyText } from "@jasmin/ui";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-md">
          <H1Editorial className="text-4xl text-deep-teal">Nouveau mot de passe</H1Editorial>
          <BodyText className="mt-4">Choisissez un mot de passe d'au moins 8 caractères.</BodyText>
          <div className="mt-10">
            <ResetPasswordForm />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
```

- [ ] **Step 4: Verify + commit**

```bash
cd apps/web && bun run typecheck && cd ../.. && bun run lint
git add apps/web
git commit -m "feat(web): auth flow — signup/signin/forgot/reset + cart merge on login"
```

---

## Task 10 — Account dashboard: `/compte`, `/compte/commandes`, `/compte/adresses`

**Files:**
- Create: `apps/web/app/(shop)/compte/(dashboard)/layout.tsx` — protected wrapper
- Create: `apps/web/app/(shop)/compte/(dashboard)/page.tsx`
- Create: `apps/web/app/(shop)/compte/(dashboard)/commandes/page.tsx`
- Create: `apps/web/app/(shop)/compte/(dashboard)/adresses/page.tsx`
- Create: `apps/web/components/account/AccountSidebar.tsx`
- Create: `apps/web/components/account/OrderHistoryTable.tsx`
- Create: `apps/web/components/account/AddressBook.tsx`

- [ ] **Step 1: `apps/web/app/(shop)/compte/(dashboard)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AiryContainer } from "@jasmin/ui";
import { AccountSidebar } from "@/components/account/AccountSidebar";

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
```

- [ ] **Step 2: `apps/web/components/account/AccountSidebar.tsx`**

```tsx
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

const LINKS = [
  { href: "/compte", label: "Tableau de bord" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/compte/adresses", label: "Mes adresses" },
] as const;

export function AccountSidebar({ email }: { email: string }) {
  return (
    <aside className="space-y-6">
      <div className="rounded-lg bg-linen/60 p-5">
        <p className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
          Connecté en tant que
        </p>
        <p className="mt-1 font-[var(--font-body)] text-sm text-warm-taupe">{email}</p>
      </div>
      <nav>
        <ul className="space-y-1 font-[var(--font-body)] text-sm text-warm-taupe">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-md px-4 py-2 transition-colors hover:bg-linen/60 hover:text-deep-teal"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <form action={signOutAction}>
        <button
          type="submit"
          className="font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-warm-taupe-soft transition-colors hover:text-deep-teal"
        >
          Se déconnecter
        </button>
      </form>
    </aside>
  );
}
```

- [ ] **Step 3: `apps/web/components/account/OrderHistoryTable.tsx`**

```tsx
import Link from "next/link";
import type { OrderWithItems } from "@jasmin/db/queries";
import { PriceTag, Pill, EmptyState, Button } from "@jasmin/ui";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export function OrderHistoryTable({ orders }: { orders: OrderWithItems[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="Aucune commande pour l'instant."
        description="Découvrez nos produits et passez votre première commande."
        action={
          <Button asChild variant="primary-teal">
            <Link href="/boutique">Découvrir la boutique</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(({ order, items }) => (
        <article
          key={order.id}
          className="rounded-lg border border-linen bg-cream-sand p-5 shadow-soft"
        >
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
                Commande
              </p>
              <p className="font-[var(--font-display)] text-xl italic text-deep-teal">
                {order.orderNumber}
              </p>
            </div>
            <Pill tone="teal">{STATUS_LABEL[order.status] ?? order.status}</Pill>
          </header>
          <ul className="mt-4 space-y-1 border-t border-linen pt-3 font-[var(--font-body)] text-sm text-warm-taupe">
            {items.slice(0, 3).map((it) => (
              <li key={it.id} className="flex items-baseline justify-between">
                <span>
                  {it.productNameSnapshot}
                  {it.variantNameSnapshot ? ` (${it.variantNameSnapshot})` : ""} × {it.quantity}
                </span>
                <PriceTag amount={it.lineTotalTnd} />
              </li>
            ))}
            {items.length > 3 && (
              <li className="text-xs text-warm-taupe-soft">+ {items.length - 3} article(s) de plus</li>
            )}
          </ul>
          <footer className="mt-4 flex items-center justify-between border-t border-linen pt-3 text-sm">
            <span className="text-warm-taupe-soft">
              {new Date(order.createdAt).toLocaleDateString("fr-TN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="font-semibold text-warm-taupe">
              <PriceTag amount={order.totalTnd} />
            </span>
          </footer>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: `apps/web/components/account/AddressBook.tsx`**

```tsx
import { EmptyState } from "@jasmin/ui";
import type { CustomerAddress } from "@jasmin/db";

export function AddressBook({ addresses }: { addresses: CustomerAddress[] }) {
  if (addresses.length === 0) {
    return (
      <EmptyState
        title="Aucune adresse enregistrée."
        description="Vos adresses apparaîtront ici après votre première commande."
      />
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {addresses.map((a) => (
        <article key={a.id} className="rounded-lg border border-linen p-5">
          <p className="font-[var(--font-display)] text-lg italic text-deep-teal">{a.fullName}</p>
          <p className="mt-1 font-[var(--font-body)] text-sm text-warm-taupe">{a.phone}</p>
          <address className="mt-3 not-italic font-[var(--font-body)] text-sm text-warm-taupe">
            {a.street}
            <br />
            {a.postalCode} {a.city}
            <br />
            {a.governorate}, Tunisie
          </address>
          {a.isDefault && (
            <p className="mt-3 font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-deep-teal">
              Par défaut
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: `apps/web/app/(shop)/compte/(dashboard)/page.tsx`**

```tsx
import Link from "next/link";
import { eq } from "drizzle-orm";
import { createClient } from "@jasmin/db";
import { customers } from "@jasmin/db/schema";
import { getCustomerOrders } from "@jasmin/db/queries";
import { Button, BodyText, H2Section } from "@jasmin/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user!;

  const dbUrl = process.env.SUPABASE_DB_URL!;
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
        <Tile label="Newsletter" value={customerRow?.newsletterSubscribed ? "Inscrit" : "Non inscrit"} />
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
```

- [ ] **Step 6: `apps/web/app/(shop)/compte/(dashboard)/commandes/page.tsx`**

```tsx
import { createClient } from "@jasmin/db";
import { getCustomerOrders } from "@jasmin/db/queries";
import { H2Section } from "@jasmin/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OrderHistoryTable } from "@/components/account/OrderHistoryTable";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user!;
  const db = createClient(process.env.SUPABASE_DB_URL!);
  const orders = await getCustomerOrders(db, user.id);

  return (
    <div className="space-y-8">
      <H2Section>Mes commandes</H2Section>
      <OrderHistoryTable orders={orders} />
    </div>
  );
}
```

- [ ] **Step 7: `apps/web/app/(shop)/compte/(dashboard)/adresses/page.tsx`**

```tsx
import { eq } from "drizzle-orm";
import { createClient } from "@jasmin/db";
import { customerAddresses } from "@jasmin/db/schema";
import { H2Section } from "@jasmin/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AddressBook } from "@/components/account/AddressBook";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user!;
  const db = createClient(process.env.SUPABASE_DB_URL!);
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
```

- [ ] **Step 8: Verify + commit**

```bash
cd apps/web && bun run typecheck && cd ../.. && bun run lint
git add apps/web
git commit -m "feat(web): account dashboard, orders history, addresses book"
```

---

## Task 11 — Content pages: `/notre-histoire`, `/contact`, legal trio

**Files:**
- Create: `apps/web/app/(shop)/notre-histoire/page.tsx`
- Create: `apps/web/app/(shop)/contact/page.tsx`
- Create: `apps/web/app/(shop)/(legal)/mentions-legales/page.tsx`
- Create: `apps/web/app/(shop)/(legal)/cgv/page.tsx`
- Create: `apps/web/app/(shop)/(legal)/confidentialite/page.tsx`

- [ ] **Step 1: `apps/web/app/(shop)/notre-histoire/page.tsx`**

```tsx
import {
  AiryContainer,
  H1Editorial,
  H2Section,
  BodyText,
  JasmineSprig,
  LabelEyebrow,
} from "@jasmin/ui";
import { VOICE } from "@jasmin/lib";

export const revalidate = 86400;

export default function NotreHistoirePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-cream-sand px-6 pb-20 pt-32 lg:px-12 lg:pt-40">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2">
          <div>
            <LabelEyebrow>Notre histoire</LabelEyebrow>
            <H1Editorial className="mt-6 text-deep-teal">{VOICE.notreHistoireHero}</H1Editorial>
            <BodyText className="mt-6 max-w-xl">
              Depuis 2010, à Nabeul, nous sélectionnons avec amour les meilleures parapharmacies
              pour prendre soin de vous, simplement, naturellement.
            </BodyText>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-linen">
            <JasmineSprig className="absolute inset-0 m-auto h-1/2 w-1/2 text-jasmine/40" />
          </div>
        </div>
      </section>

      <AiryContainer className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2">
          <div>
            <H2Section>L'origine</H2Section>
            <BodyText className="mt-6">
              Au cœur de Nabeul, face à la Clinique El Amen, Jasmin Médical Store est né d'une
              conviction simple : prendre soin de soi est un rituel. Chaque produit, chaque conseil,
              chaque sourire derrière le comptoir reflète cette idée.
            </BodyText>
            <BodyText className="mt-4">
              De la cosmétique aux matériels médicaux, en passant par l'orthopédie, nous choisissons
              des marques qui respectent la peau, le corps et la planète. Notre équipe vous accompagne
              avec une expertise dermo-cosmétique reconnue.
            </BodyText>
          </div>
          <div className="space-y-6">
            <blockquote className="rounded-lg bg-linen/60 p-8">
              <p className="font-[var(--font-display)] text-2xl italic leading-[1.4] text-deep-teal">
                « Une parapharmacie qui ressemble à la Méditerranée : douce, généreuse, attentive. »
              </p>
              <footer className="mt-4 font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
                — Notre philosophie
              </footer>
            </blockquote>
          </div>
        </div>
      </AiryContainer>

      <AiryContainer className="bg-linen px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-[1200px]">
          <H2Section className="text-center">Nos engagements</H2Section>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "Sélection rigoureuse",
                body: "Seules les marques en lesquelles nous croyons trouvent leur place dans nos rayons.",
              },
              {
                title: "Conseils personnalisés",
                body: "Notre équipe vous écoute et vous oriente avec une expertise reconnue.",
              },
              {
                title: "Au cœur de Nabeul",
                body: "Une boutique ancrée dans la ville et ouverte sur la Méditerranée.",
              },
            ].map((c) => (
              <article key={c.title} className="rounded-lg bg-cream-sand p-6 shadow-soft">
                <JasmineSprig className="h-10 w-10 text-jasmine" />
                <h3 className="mt-4 font-[var(--font-display)] text-xl italic text-deep-teal">
                  {c.title}
                </h3>
                <BodyText className="mt-3">{c.body}</BodyText>
              </article>
            ))}
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
```

- [ ] **Step 2: `apps/web/app/(shop)/contact/page.tsx`**

```tsx
import {
  AiryContainer,
  H1Editorial,
  BodyText,
  LabelEyebrow,
} from "@jasmin/ui";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

export const revalidate = 86400;

export default function ContactPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2">
          <div>
            <LabelEyebrow>Contact</LabelEyebrow>
            <H1Editorial className="mt-6 text-deep-teal text-5xl">Venez nous rendre visite.</H1Editorial>
            <BodyText className="mt-6 max-w-xl">
              Notre équipe vous accueille du lundi au samedi pour répondre à vos questions et vous
              accompagner dans votre routine bien-être.
            </BodyText>
            <ul className="mt-10 space-y-5 font-[var(--font-body)] text-sm text-warm-taupe">
              <Info icon={<MapPin className="h-5 w-5" />} title="Adresse">
                111 Av. Hedi Nouira, 8000 Nabeul (en face Clinique El Amen)
              </Info>
              <Info icon={<Phone className="h-5 w-5" />} title="Téléphone">
                <a href="tel:+21672289900" className="underline-offset-4 hover:underline">
                  +216 72 289 900
                </a>
              </Info>
              <Info icon={<Mail className="h-5 w-5" />} title="Email">
                <a
                  href="mailto:jasmin.medicalstore@yahoo.com"
                  className="underline-offset-4 hover:underline"
                >
                  jasmin.medicalstore@yahoo.com
                </a>
              </Info>
              <Info icon={<Clock className="h-5 w-5" />} title="Horaires">
                Lundi — Samedi · 8h30 — 20h
              </Info>
            </ul>
          </div>
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-linen">
            <iframe
              title="Plan d'accès Jasmin Médical Store"
              src="https://www.google.com/maps?q=111+Av.+Hedi+Nouira,+Nabeul&output=embed"
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}

function Info({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-1 text-deep-teal">{icon}</span>
      <span>
        <span className="block font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
          {title}
        </span>
        <span className="mt-1 block">{children}</span>
      </span>
    </li>
  );
}
```

- [ ] **Step 3: Legal pages**

`apps/web/app/(shop)/(legal)/mentions-legales/page.tsx`:

```tsx
import { AiryContainer, H1Editorial, BodyText, H2Section } from "@jasmin/ui";

export const revalidate = 604800;

export default function MentionsLegalesPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <article className="mx-auto max-w-3xl space-y-6">
          <H1Editorial className="text-4xl text-deep-teal">Mentions légales</H1Editorial>
          <H2Section className="text-2xl">Éditeur du site</H2Section>
          <BodyText>
            Jasmin Médical Store · 111 Av. Hedi Nouira, 8000 Nabeul, Tunisie · Téléphone +216 72 289 900 ·
            Email jasmin.medicalstore@yahoo.com.
          </BodyText>
          <H2Section className="text-2xl">Hébergement</H2Section>
          <BodyText>
            Site hébergé par DigitalOcean App Platform (Frankfurt, Allemagne) — base de données par
            Supabase Inc.
          </BodyText>
          <H2Section className="text-2xl">Propriété intellectuelle</H2Section>
          <BodyText>
            L'ensemble du contenu (textes, photos, logos) est la propriété exclusive de Jasmin Médical
            Store. Toute reproduction sans autorisation écrite est interdite.
          </BodyText>
        </article>
      </AiryContainer>
    </main>
  );
}
```

`apps/web/app/(shop)/(legal)/cgv/page.tsx`:

```tsx
import { AiryContainer, H1Editorial, BodyText, H2Section } from "@jasmin/ui";

export const revalidate = 604800;

export default function CgvPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <article className="mx-auto max-w-3xl space-y-6">
          <H1Editorial className="text-4xl text-deep-teal">Conditions générales de vente</H1Editorial>
          <H2Section className="text-2xl">1. Objet</H2Section>
          <BodyText>
            Les présentes CGV régissent les ventes effectuées sur jasmin-medical-store.com par Jasmin
            Médical Store auprès de ses clients particuliers.
          </BodyText>
          <H2Section className="text-2xl">2. Prix et paiement</H2Section>
          <BodyText>
            Les prix sont en dinars tunisiens (TND), TTC. Le paiement s'effectue à la livraison (cash on
            delivery) sauf indication contraire au moment de la commande.
          </BodyText>
          <H2Section className="text-2xl">3. Livraison</H2Section>
          <BodyText>
            Livraison sous 48 à 72 heures ouvrées sur l'ensemble du territoire tunisien. Frais de
            livraison de 7 TND offerts à partir de 200 TND d'achats.
          </BodyText>
          <H2Section className="text-2xl">4. Rétractation et retours</H2Section>
          <BodyText>
            Conformément à la législation tunisienne, vous disposez d'un délai de 7 jours pour
            retourner un produit non utilisé dans son emballage d'origine.
          </BodyText>
          <H2Section className="text-2xl">5. Service client</H2Section>
          <BodyText>
            Pour toute question : jasmin.medicalstore@yahoo.com · +216 72 289 900.
          </BodyText>
        </article>
      </AiryContainer>
    </main>
  );
}
```

`apps/web/app/(shop)/(legal)/confidentialite/page.tsx`:

```tsx
import { AiryContainer, H1Editorial, BodyText, H2Section } from "@jasmin/ui";

export const revalidate = 604800;

export default function ConfidentialitePage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <article className="mx-auto max-w-3xl space-y-6">
          <H1Editorial className="text-4xl text-deep-teal">Politique de confidentialité</H1Editorial>
          <BodyText>
            Vos données personnelles sont collectées par Jasmin Médical Store dans le seul but de
            traiter vos commandes et de vous tenir informé(e) de nos actualités si vous y avez
            consenti.
          </BodyText>
          <H2Section className="text-2xl">Données collectées</H2Section>
          <BodyText>
            Nom, prénom, adresse de livraison, numéro de téléphone, adresse email, historique de
            commandes.
          </BodyText>
          <H2Section className="text-2xl">Vos droits</H2Section>
          <BodyText>
            Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
            Contactez-nous à jasmin.medicalstore@yahoo.com pour exercer ces droits.
          </BodyText>
          <H2Section className="text-2xl">Cookies</H2Section>
          <BodyText>
            Nous utilisons uniquement des cookies fonctionnels nécessaires au panier et à la session
            d'authentification. Aucun cookie publicitaire ou de tracking tiers n'est déposé.
          </BodyText>
        </article>
      </AiryContainer>
    </main>
  );
}
```

- [ ] **Step 4: Verify + commit**

```bash
cd apps/web && bun run typecheck && cd ../.. && bun run lint
git add apps/web
git commit -m "feat(web): notre-histoire, contact, mentions-legales, CGV, confidentialite pages"
```

---

## Task 12 — SEO: per-route generateMetadata + sitemap.ts + robots.ts

**Files:**
- Modify: `apps/web/app/layout.tsx` (root metadata, viewport)
- Modify: `apps/web/app/(shop)/produit/[slug]/page.tsx` (add generateMetadata)
- Modify: `apps/web/app/(shop)/boutique/[category]/page.tsx` (add generateMetadata + generateStaticParams)
- Create: `apps/web/app/sitemap.ts`
- Create: `apps/web/app/robots.ts`

- [ ] **Step 1: Update `apps/web/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jasmin-medical-store.com"),
  title: {
    default: "Jasmin Médical Store — Parapharmacie & matériel médical",
    template: "%s — Jasmin Médical Store",
  },
  description:
    "Parapharmacie & matériel médical sélectionné avec amour à Nabeul. Cosmétique, orthopédie, diabète, tension — pour votre bien-être au quotidien.",
  openGraph: {
    type: "website",
    locale: "fr_TN",
    siteName: "Jasmin Médical Store",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#1F6F6D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Append `generateMetadata` to `apps/web/app/(shop)/produit/[slug]/page.tsx`**

Add at the top of the file (before `export default`):

```tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return { title: "Produit" };
  const db = createClient(dbUrl);
  const detail = await getProductBySlug(db, slug);
  if (!detail) return { title: "Produit introuvable" };
  return {
    title: `${detail.product.name} — ${detail.brand.name}`,
    description: detail.product.shortDescription,
    openGraph: {
      title: detail.product.name,
      description: detail.product.shortDescription,
    },
  };
}
```

- [ ] **Step 3: Append metadata + static params to `apps/web/app/(shop)/boutique/[category]/page.tsx`**

```tsx
import type { Metadata } from "next";

export async function generateStaticParams() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return [];
  const db = createClient(dbUrl);
  const all = await listCategories(db);
  return all.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return { title: "Boutique" };
  const db = createClient(dbUrl);
  const cat = await getCategoryBySlug(db, category);
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: cat.name,
    description: cat.description ?? `Découvrez notre sélection ${cat.name.toLowerCase()}.`,
  };
}
```

- [ ] **Step 4: `apps/web/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { createClient } from "@jasmin/db";
import { listCategories, listPublishedProducts } from "@jasmin/db/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jasmin-medical-store.com";
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return [{ url: base, lastModified: new Date() }];

  const db = createClient(dbUrl);
  const [categories, products] = await Promise.all([
    listCategories(db),
    listPublishedProducts(db, { limit: 1000 }),
  ]);

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/boutique`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/notre-histoire`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.4 },
    ...categories.map((c) => ({
      url: `${base}/boutique/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/produit/${p.product.slug}`,
      lastModified: new Date(p.product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
```

- [ ] **Step 5: `apps/web/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jasmin-medical-store.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/compte", "/panier", "/commande"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
```

- [ ] **Step 6: Verify + commit**

```bash
cd apps/web && bun run typecheck && cd ../.. && bun run lint
git add apps/web
git commit -m "feat(web): SEO metadata, sitemap, robots, static params for catalog routes"
```

---

## Task 13 — Playwright E2E setup + 3 critical specs

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/guest-checkout.spec.ts`
- Create: `apps/web/e2e/auth-checkout.spec.ts`
- Create: `apps/web/e2e/newsletter.spec.ts`
- Modify: `apps/web/package.json` (add Playwright + scripts)

- [ ] **Step 1: Add Playwright to `apps/web/package.json`**

Append to `devDependencies`:

```json
"@playwright/test": "1.49.1"
```

Add to `scripts`:

```json
"e2e": "playwright test",
"e2e:install": "playwright install --with-deps chromium"
```

Run `bun install`.

- [ ] **Step 2: `apps/web/playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    locale: "fr-TN",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: "bun run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
```

- [ ] **Step 3: `apps/web/e2e/guest-checkout.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("guest can browse → add to cart → checkout COD → see confirmation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Prenez soin de vous/i })).toBeVisible();

  await page.getByRole("link", { name: "Boutique", exact: true }).first().click();
  await expect(page).toHaveURL(/\/boutique/);

  // Open the first category
  await page.getByRole("link", { name: /Cosmétique|Orthopédie/ }).first().click();
  await expect(page).toHaveURL(/\/boutique\//);

  // Open the first product
  await page.locator("article").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/produit\//);

  await page.getByRole("button", { name: /Ajouter au panier/i }).click();
  await expect(page.getByText(/Ajouté au panier|Votre panier/i)).toBeVisible({ timeout: 5000 });

  await page.goto("/commande");
  await page.getByLabel("Nom complet").fill("Test Acheteur");
  await page.getByLabel("Téléphone").fill("+216 22 110 220");
  await page.getByLabel("Adresse").fill("12 rue Ibn Khaldoun");
  await page.getByLabel("Ville").fill("Nabeul");
  await page.getByLabel("Code postal").fill("8000");
  await page.getByLabel("Email").fill("guest+e2e@example.tn");
  await page.getByLabel("Téléphone", { exact: false }).nth(1).fill("+216 22 110 220");

  await page.getByRole("button", { name: /Confirmer la commande/i }).click();
  await expect(page).toHaveURL(/\/commande\/confirmation\//);
  await expect(page.getByText(/JMS-\d{4}-\d+/)).toBeVisible();
});
```

- [ ] **Step 4: `apps/web/e2e/auth-checkout.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

const email = `e2e+${Date.now()}@example.tn`;
const password = "Motdepasse123";

test("authenticated user signup → login → checkout → order in /compte/commandes", async ({ page }) => {
  await page.goto("/compte/inscription");
  await page.getByLabel("Nom complet").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Mot de passe/).fill(password);
  await page.getByRole("button", { name: /Créer mon compte/i }).click();

  // Either lands on /compte (auto-confirmed dev) or shows confirm-email message.
  await expect(page).toHaveURL(/\/compte/, { timeout: 10_000 });

  await page.goto("/boutique/cosmetique");
  await page.locator("article").first().getByRole("link").first().click();
  await page.getByRole("button", { name: /Ajouter au panier/i }).click();

  await page.goto("/commande");
  await page.getByLabel("Nom complet").fill("E2E User");
  await page.getByLabel("Téléphone").fill("+216 22 110 220");
  await page.getByLabel("Adresse").fill("12 rue Ibn Khaldoun");
  await page.getByLabel("Ville").fill("Nabeul");
  await page.getByLabel("Code postal").fill("8000");
  await page.getByRole("button", { name: /Confirmer la commande/i }).click();

  await expect(page).toHaveURL(/\/commande\/confirmation\//);

  await page.goto("/compte/commandes");
  await expect(page.getByText(/JMS-\d{4}-\d+/)).toBeVisible();
});
```

- [ ] **Step 5: `apps/web/e2e/newsletter.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("newsletter footer signup confirms", async ({ page }) => {
  await page.goto("/");
  const email = `news+${Date.now()}@example.tn`;
  await page.getByLabel("Adresse email").fill(email);
  await page.getByRole("button", { name: /Je m'inscris/i }).click();
  await expect(page.getByText(/Merci, à très vite/i)).toBeVisible({ timeout: 5000 });
});
```

- [ ] **Step 6: Verify + commit**

The E2E tests don't run in CI for Phase 2 (`bun test` only runs the lib + db tests). The engineer running them locally will need a seeded `jasmin-test` Supabase project — see `docs/setup/supabase.md`.

```bash
cd apps/web && bun run typecheck && cd ../.. && bun run lint
git add apps/web bun.lock
git commit -m "test(web): Playwright E2E — guest checkout, auth checkout, newsletter"
```

---

## Done — Phase 2 definition-of-done

- [ ] All 13 tasks landed; commit log shows them in order on `foundation` branch
- [ ] `bun run lint` clean
- [ ] `bun run typecheck` clean
- [ ] `bun test` 12+ tests pass (existing + 3 new query-helper tests)
- [ ] `bun --filter @jasmin/web build` succeeds
- [ ] Three Playwright specs run green when pointed at a seeded local Supabase
- [ ] All routes from §3 of the spec render (with seeded data)
- [ ] No real product photos shipped — `ProductImageFallback` shows on every card

When all boxes are checked, push to GitHub, set up local Supabase per `docs/setup/supabase.md`, run migrations + seed, and demo end-to-end.

