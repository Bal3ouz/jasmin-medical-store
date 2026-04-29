# Phase 2 — Landing + Shop Design Spec

**Project:** Jasmin Médical Store
**Phase:** 2 of 4 (Foundation ✓ → **Landing + Shop** → CRM → BI)
**Date:** 2026-04-29
**Status:** Approved (sections §1–§10 confirmed by user)

## 1. Purpose

Build the public storefront on top of the Foundation: landing page (teal-forward Motion-animated hero), category browse, product detail, cart, guest+authenticated checkout (cash-on-delivery), customer auth + account/order history, newsletter signup, plus brand-story content pages. Visual direction is locked from the stitch mockups (variant-C teal hero, airy cream cosmétique listing). All content in French. The CEO demo at the end of Phase 2 must let a visitor browse → add to cart → check out → see a confirmation page, end-to-end, on real seeded data.

This phase ships **no CRM screens** (Phase 3) and **no BI dashboards** (Phase 4). Order management from the staff side is deferred — Phase 2 orders just sit at `status = pending` until Phase 3 builds the queue.

## 2. Locked decisions (from brainstorm)

| Decision | Pick |
|---|---|
| Scope | Full storefront (B): landing + browse + cart + guest checkout + auth + account + newsletter |
| Content pages | `/notre-histoire` + `/contact` + legal trio (mentions-légales, CGV, confidentialité) |
| Auth | Supabase Auth, email + password (+ forgot-password) |
| Cart UX | Drawer on desktop, full `/panier` page on mobile + as alt on desktop |
| Payment in Phase 2 | **COD only**; card options visible as "bientôt" disabled pills |
| Animation | Motion on landing only; CSS hover everywhere else |
| Search | **Out of scope** — category filters only |
| Image fallback | Branded `ProductImageFallback` (cream + JasmineSprig + name) until real photos arrive |
| Cart persistence | session_id cookie for guests; customer_id when logged in; merged on login |
| Locale | `fr-TN`, French URLs (`/boutique`, `/produit`, `/panier`, `/commande`) |
| Tax | Show TND prices as "TTC" — no separate tax math in Phase 2 (revisit when accountant input arrives) |
| Shipping rule | 7 TND flat, free above 200 TND subtotal (matches seed; expressed in dinars, not millimes) |
| Tests | E2E via Playwright, 3 critical paths; lib/db tests untouched |

## 3. Routes

```
apps/web/app/
├── (shop)/
│   ├── layout.tsx                shared layout: TopNav + CartDrawer + Footer
│   ├── page.tsx                  / — landing, Motion hero
│   ├── boutique/
│   │   ├── page.tsx              /boutique — all categories overview
│   │   └── [category]/page.tsx   /boutique/cosmetique, /boutique/orthopedie, …
│   ├── produit/[slug]/page.tsx   /produit/svr-sebiaclear-creme
│   ├── panier/page.tsx           /panier
│   ├── commande/
│   │   ├── page.tsx              /commande — checkout
│   │   └── confirmation/[orderNumber]/page.tsx
│   ├── compte/
│   │   ├── connexion/page.tsx
│   │   ├── inscription/page.tsx
│   │   ├── mot-de-passe-oublie/page.tsx
│   │   ├── reinitialiser/page.tsx
│   │   └── (dashboard)/
│   │       ├── page.tsx          /compte
│   │       ├── commandes/page.tsx
│   │       └── adresses/page.tsx
│   ├── notre-histoire/page.tsx
│   ├── contact/page.tsx
│   └── (legal)/
│       ├── mentions-legales/page.tsx
│       ├── cgv/page.tsx
│       └── confidentialite/page.tsx
├── api/
│   └── newsletter/route.ts       (only if a webhook is needed; otherwise server actions)
├── sitemap.ts                    /sitemap.xml — published catalog
└── robots.ts                     /robots.txt
```

Server Components by default. Cart, checkout, account, login, signup all force-dynamic. Catalog routes use ISR (`revalidate = 60`).

## 4. Component layers

### 4.1 New shared components (`packages/ui`)

- `ProductCard` — photo (or fallback) + brand eyebrow + Playfair name + `PriceTag` + add-to-cart button. Variant-mode products open a small variant picker before adding.
- `ProductImageFallback` — branded placeholder (cream + JasmineSprig at 30% opacity + product name in Playfair italic + brand line in Plus Jakarta Sans).
- `CartDrawer` — radix `Dialog` from right edge with line items, qty stepper, subtotal, primary "Passer commande" CTA.
- `MiniCart` — header trigger with item-count badge.
- `FilterSidebar` — brand checkboxes + price range slider + "préoccupation" tag pills.
- `Stepper` — qty `(− N +)` inside a linen pill.
- `Breadcrumbs` — small Plus Jakarta Sans warm-taupe-soft links.
- `EmptyState` — composable with optional CTA, used for empty cart, no orders, no results.
- `Skeleton` — for loading states on dynamic islands.
- `getImageUrl(storagePath: string | null)` helper (wraps Supabase Storage public-URL). When passed null/empty, returns `null` so caller renders the fallback.

### 4.2 Web-only components (`apps/web/components`)

- **Layout:** `TopNav`, `Footer`, `NewsletterSignup` (form posting to `subscribeNewsletter` server action), `MobileMenu` (drawer).
- **Landing:** `LandingHeroAnimated` (Motion), `BrandMarqueeStrip`, `CategoryShowcase` (4 large editorial tiles linking to top-level categories), `EditorialQuote`, `BoutiqueTeaser`.
- **Shop:** `ProductGrid`, `CategoryHeader`, `FilterToolbar`, `Pagination`, `EmptyResults`.
- **Product:** `ProductDetailLayout` (gallery left + info right), `ProductGallery` with thumbnails, `VariantSelector`, `ProductTabsAccordion` (Description / Composition / Mode d'emploi), `RelatedProducts`.
- **Cart:** `CartLineItem`, `CartTotals`, `EmptyCart`.
- **Checkout:** `CheckoutForm` (multi-step: address → review → confirm), `ShippingAddressForm`, `PaymentMethodPicker`, `OrderSummary`.
- **Account:** `LoginForm`, `SignupForm`, `OrderHistoryTable`, `AddressBook`, `OrderDetailCard`.
- **Content:** `NotreHistoireLayout`, `ContactLayout` with embed-map placeholder.

### 4.3 Voice constants

Add Phase-2 keys to `packages/lib/src/voice.ts`:

```ts
emptyCartTitle: "Votre panier est calme pour l'instant.",
emptyCartCta: "Découvrir la boutique",
checkoutTitle: "Finaliser votre commande",
codNotice: "Vous payez à la livraison, en main propre, en toute sérénité.",
orderConfirmed: "Merci ! Votre commande est entre nos mains.",
orderConfirmedSub: "Nous préparons votre colis avec soin. Un appel de confirmation suit dans la journée.",
loginTitle: "Bon retour parmi nous.",
signupTitle: "Créez votre compte Jasmin.",
contactBaseline: "Une question ? Notre équipe est joignable du lundi au samedi.",
notreHistoireHero: "Le soin, comme un rituel.",
```

## 5. Data flow

### 5.1 Reads (server components)

Each server component uses `createClient(SUPABASE_DB_URL)` from `@jasmin/db`. Public reads operate under the anon key path implicitly — the server action invocation also goes through anon JWT for customer-scoped reads. Service role is reserved for writes that bypass RLS (checkout, cart merge).

Catalog query helpers live in `packages/db/src/queries/`:

```ts
listCategories()
listPublishedProducts({ categorySlug?, brandSlug?, sort?, limit?, offset? })
getProductBySlug(slug)                  // joins brand, variants, primary image, stock_status
getRelatedProducts(productId, limit=4)
getCustomerOrders(customerId)
getOrderByNumber(orderNumber, customerId? | guestEmail?)
```

These are pure functions taking `Database`; tested with the existing pglite harness in `schema.test.ts` (each new query gets a describe block).

### 5.2 Writes (server actions in `apps/web/app/actions/`)

```ts
addToCart(formData)                      // FormData: productId, variantId?, qty
updateCartItem(formData)
removeCartItem(formData)
mergeGuestCart(customerId, sessionId)    // called after successful sign-in
subscribeNewsletter(formData)
createOrder(formData)                    // FormData maps to CheckoutSchema
signUp(formData), signIn(formData), signOut(), requestPasswordReset(formData), resetPassword(formData)
```

All server actions:
- Use `@jasmin/lib` Zod schemas to validate `formData` first; on parse error, return `{ ok: false, errors }` to surface in the form via `useActionState`.
- Re-fetch authoritative prices/stock from DB before writing — never trust client values.
- Wrap mutating logic in a Postgres transaction via Drizzle `db.transaction(async (tx) => { … })`.

### 5.3 Newsletter signup

Server action inserts into `newsletter_subscribers` (RLS allows anon insert) with `source` set from the form's hidden field. No double-opt-in flow in Phase 2 — `confirmed_at` stays null. Phase 3 adds the email via Resend.

## 6. Cart + checkout state machine

```
guest visitor                            authenticated customer
     │                                          │
     ▼                                          ▼
session_id cookie set                  customer.id = auth.uid()
     │                                          │
     └──── cart row keyed by session_id ────────┤
                                                │
                                cart row keyed by customer_id
                                (on login: merge guest cart → customer cart)

checkout submit
   ├─ validate Zod CheckoutSchema (existing)
   ├─ re-fetch product/variant prices server-side
   ├─ verify each item's inventory.on_hand ≥ qty (else "Stock insuffisant")
   ├─ assign next order_number from a Postgres SEQUENCE jms_order_seq
   ├─ INSERT order (status=pending) + order_items (snapshots) + order_events("created")
   ├─ INSERT sale stock_movements (negative qty)
   ├─ UPDATE inventory.on_hand (decrement)
   ├─ DELETE cart_items (keep cart row)
   └─ redirect → /commande/confirmation/JMS-2026-NNNNNN
```

A Postgres sequence `jms_order_seq` is created in `sql/rls.sql` (or a new migration). The `createOrder` action calls `nextval('jms_order_seq')` then formats via `generateOrderNumber({ year, sequence })` from `@jasmin/lib`.

Payment in Phase 2: `payment_method = 'cash_on_delivery'` always; `payment_status` stays `pending`. Card payment chips show in the picker as "Bientôt" — disabled, jasmine accent stripe.

## 7. Auth flow

| Step | Mechanism |
|---|---|
| Sign up | `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` |
| Customer row sync | Postgres trigger `on_auth_user_created` upserts `customers` row (id = auth.uid(), email, full_name) — added in `sql/rls.sql` |
| Sign in | `supabase.auth.signInWithPassword`, then `mergeGuestCart(customerId, sessionId)` |
| Session refresh | `@supabase/ssr` middleware on every request (existing in apps/web from Phase 1) |
| Forgot password | `supabase.auth.resetPasswordForEmail` → email link to `/compte/reinitialiser` |
| Sign out | `supabase.auth.signOut()` then redirect to `/` |

Dev Supabase project: email confirmation OFF (faster onboarding). Prod: confirmation ON.

## 8. Image strategy

- Supabase Storage bucket `product-images` (per Foundation deploy docs). Path convention: `<product_slug>/<filename>`.
- `product_images.storage_path` is the relative path within the bucket; `getImageUrl()` joins with the project URL.
- **Zero photos ship with Phase 2.** Every product shows `ProductImageFallback`. When the user uploads real photos later, they insert `product_images` rows manually (or via a tiny admin upload form added in Phase 3) and the storefront picks them up automatically.
- Next/Image with `remotePatterns: [{ hostname: "*.supabase.co" }]` (already set).
- Lazy load below the fold; eager on the product detail hero.

## 9. SEO + metadata

- `generateMetadata` per route:
  - Landing: brand name + tagline; OG image = a static curated photo (added later, fallback for now).
  - Category: "{name} — Jasmin Médical Store" + category description.
  - Product: name + brand + first 160 chars of short description.
- `Product` JSON-LD on detail pages with price + availability + brand.
- `/sitemap.xml` enumerates `/`, `/boutique`, `/boutique/<category>`, `/produit/<slug>` for all `is_published = true`.
- `/robots.txt`: allow all on web; admin subdomain has its own robots blocking indexing.

## 10. Motion integration

`apps/web` adds dependency `motion` (formerly framer-motion) — only imported in `LandingHeroAnimated` and the small `ScrollIndicator` component. Motion stays out of every other route's bundle thanks to dynamic import on the landing page.

```tsx
import dynamic from "next/dynamic";
const LandingHeroAnimated = dynamic(
  () => import("@/components/landing/LandingHeroAnimated"),
  { ssr: true, loading: () => <TealHeroPanel className="min-h-[75vh]" /> },
);
```

Animations:
- Headline word-stagger (0.08s) on first paint.
- Background botanical illustration parallax (translateY at 0.3× scroll).
- "↓ Découvrir" indicator: `animate y [0, 8, 0]` infinite gentle 2s loop.
- All wrapped in `prefers-reduced-motion` guards (Motion handles natively).

## 11. Testing

- Existing `bun test` (39) untouched.
- Add **Playwright** at the repo root in `apps/web/e2e/`. CI integration deferred to Phase 3.
- Three E2E specs:
  1. `guest-checkout.spec.ts` — landing → category → product → add to cart → guest checkout → confirmation page renders order number.
  2. `auth-checkout.spec.ts` — signup → login → add to cart → checkout → see order in `/compte/commandes`.
  3. `newsletter.spec.ts` — submit footer form → confirmation toast → row appears in DB.
- E2E runs against `bun dev` + a separate `jasmin-test` Supabase project with a fresh seeded DB.

## 12. Caching

| Route | Strategy |
|---|---|
| `/` | ISR `revalidate = 60` |
| `/boutique`, `/boutique/[category]` | ISR `revalidate = 60` |
| `/produit/[slug]` | `generateStaticParams` + ISR `revalidate = 60` |
| `/notre-histoire`, `/contact`, legal | static (build-time) |
| `/panier`, `/commande`, `/compte/**` | `dynamic = "force-dynamic"` |

## 13. Phase 2 deliverables (definition-of-done)

- [ ] All routes in §3 render without runtime errors against a seeded local Supabase
- [ ] All `packages/ui` additions in §4.1 exist with stories-by-example in `apps/web` pages (no Storybook for Phase 2)
- [ ] All `apps/web/components` in §4.2 exist
- [ ] Phase-2 voice constants merged into `@jasmin/lib`
- [ ] Catalog query helpers in `packages/db/src/queries/` with describe-block tests in `schema.test.ts`
- [ ] Server actions in §5.2 implemented, validated via Zod, transactional where mutating
- [ ] `jms_order_seq` Postgres sequence + `on_auth_user_created` trigger in `sql/rls.sql`
- [ ] Motion installed and used only on landing
- [ ] Three Playwright specs pass against `bun dev` + `jasmin-test` project
- [ ] Lint clean, typecheck clean, all `bun test` green (existing lib + db schema tests + new query-helper tests in `schema.test.ts`)
- [ ] `bun build` succeeds for `apps/web`

## 14. Out of scope (deferred)

- CRM order queue / fulfillment workflow → Phase 3
- BI dashboards → Phase 4
- Real card payments (Konnect, Click-to-Pay) → Phase 3+ once gateway access acquired
- Transactional emails (order confirmation by email) → Phase 3 with Resend
- Search (full-text) → Phase 3+
- Wishlist persistence → Phase 4 (UI scaffold ships in Phase 2 as cosmetic only)
- Reviews / ratings → backlog
- Storybook → backlog
- Accessibility audit pass — Phase 2 follows accessible defaults; full audit Phase 3
- Multi-language (Arabic) — schema is forward-compatible; UI is FR only

## 15. Open follow-ups

- Confirm shipping zones — currently flat 7 TND / free above 200 TND, hard-coded in `createOrder`. May need a governorate-tiered table when actual courier rates are known.
- Confirm TVA rate / exemptions for parapharmacy categories. Currently Phase 2 displays "Prix TTC" without breaking out tax.
- Decide on order-confirmation email template tone (Phase 3) — should fit the editorial voice (Playfair italic header, warm copy).
