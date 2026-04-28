# Foundation — Design Spec

**Project:** Jasmin Médical Store
**Phase:** 1 of 4 (Foundation → Landing+Shop → CRM → BI)
**Date:** 2026-04-28
**Status:** Approved (user pre-approved review pass on 2026-04-28)

## 1. Purpose

Establish the shared foundation that every subsequent phase will build on: monorepo, runtime, database schema, auth model, design system, dev workflow, deploy topology. Phases 2–4 must be implementable on top of this foundation without revisiting structural decisions.

This phase deliberately ships **no end-user features**. The only visible artifact is two placeholder apps (web + admin) on production domains, both showing the design tokens are wired correctly.

## 2. Locked decisions (from brainstorm)

| Decision | Pick |
|---|---|
| Repo shape | Turborepo monorepo, Bun workspaces |
| Apps | `apps/web` (public), `apps/admin` (internal) |
| Runtime / pkg manager | Bun |
| Framework | Next.js 15, App Router, RSC + Server Actions |
| ORM | Drizzle + drizzle-kit |
| DB / Auth / Storage | Supabase (EU-Frankfurt region) |
| Hosting Next.js apps | DigitalOcean App Platform |
| Email (Phase 2+) | Resend |
| Locale / currency / TZ | `fr-TN` / `TND` / `Africa/Tunis` |
| Language | French only |
| Styling | Tailwind v4 + shadcn/ui base |
| Forms | react-hook-form + Zod |
| Lint | Biome |
| Tests | Bun test runner; Playwright later for E2E |
| Product variants | **Mixed mode** — `products.has_variants` flag |
| Staff roles | **Graduated** — `admin` / `manager` / `cashier` / `stock` |
| Visual direction | Teal-forward landing hero, airy/cream everywhere else |
| Existing data | None today — realistic seed for CEO demo, real CSV later |

## 3. Repo structure

```
jasmin-medical-store/
├── apps/
│   ├── web/                Next.js 15 — public landing + shop
│   │   ├── app/
│   │   ├── public/
│   │   └── package.json
│   └── admin/              Next.js 15 — internal CRM + BI
│       ├── app/
│       └── package.json
├── packages/
│   ├── db/                 Drizzle schema, migrations, seed scripts
│   │   ├── schema/         (entity-per-file: products.ts, orders.ts, ...)
│   │   ├── migrations/     (drizzle-kit output)
│   │   ├── seed/           (typed seed scripts, realistic data)
│   │   ├── client.ts       (Drizzle client factory)
│   │   └── package.json
│   ├── ui/                 Design system: tokens + components
│   │   ├── tokens/         (Tailwind preset, CSS vars, fonts.css)
│   │   ├── components/     (Button, Logo, JasmineSprig, ProductCard, …)
│   │   └── package.json
│   ├── lib/                Domain logic shared by both apps
│   │   ├── pricing.ts      (TND formatting, tax math)
│   │   ├── inventory.ts    (reserve/release helpers)
│   │   ├── slug.ts
│   │   ├── schemas/        (Zod schemas matching DB rows)
│   │   └── package.json
│   └── config/             Shared eslint/biome, tsconfig presets
├── docs/superpowers/specs/
├── mockups/                (the stitch reference PNGs)
├── turbo.json
├── biome.json
├── bun.lockb
└── package.json            (workspace root)
```

**Why split `web` from `admin`:** different security posture (public vs auth-only), different perf profile (edge-cached storefront vs no-cache CRM), independent deploys.

**Why share `db` / `lib`:** types, schema, and pricing/inventory math must never drift between storefront and CRM. They both import from the same source.

## 4. Stack reference

| Layer | Tool | Notes |
|---|---|---|
| Runtime + pkg mgr | Bun ≥ 1.2 | Workspaces, bun test, bun run |
| Build pipeline | Turborepo 2.x | Caching, parallel builds, remote cache later |
| Framework | Next.js 15 | App Router, RSC, Server Actions, route handlers |
| Styling | Tailwind v4 | CSS-vars-based; `packages/ui/tokens` is the preset |
| Component primitives | shadcn/ui (radix) | Vendored into `packages/ui`, restyled to tokens |
| ORM | Drizzle | + drizzle-kit for migrations |
| DB | Supabase Postgres 15 | EU-Frankfurt |
| Auth | Supabase Auth | Email + magic link; staff use email/pwd |
| Storage | Supabase Storage | Public bucket for product images, signed URLs for private |
| Forms / validation | react-hook-form + Zod | Zod schemas reused server-side |
| Email | Resend (Phase 2+) | Free tier 3K/mo |
| Lint / format | Biome | Faster than eslint, single-binary |
| Tests | Bun test | + Playwright later |
| Hosting | DO App Platform | Two apps, custom domains |
| Observability | Sentry (Phase 2+) | Browser + server SDK |
| CI | GitHub Actions | Lint, typecheck, test, migrate-check, deploy |

## 5. Data model

### 5.1 Enums

```ts
staff_role         = 'admin' | 'manager' | 'cashier' | 'stock'
order_status       = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
payment_status     = 'pending' | 'paid' | 'refunded' | 'failed'
payment_method     = 'cash_on_delivery' | 'card_konnect' | 'card_clic_to_pay' | 'bank_transfer'
stock_movement_type = 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer'
```

### 5.2 Catalog

```sql
brands (
  id uuid pk, slug text unique, name text, logo_url text,
  description text, website_url text, created_at, updated_at
)

categories (
  id uuid pk, parent_id uuid fk -> categories.id null,
  slug text unique, name text, description text,
  hero_image_url text, display_order int default 0,
  created_at, updated_at
)
-- Tree: e.g., Cosmétique > Soins du visage > Anti-acné

products (
  id uuid pk, slug text unique, name text,
  brand_id uuid fk -> brands.id,
  category_id uuid fk -> categories.id,   -- primary category
  short_description text, description text,
  ingredients text null, usage text null,
  has_variants boolean default false,
  -- when has_variants=false:
  sku text null, price_tnd numeric(10,3) null,
  compare_at_price_tnd numeric(10,3) null,
  weight_g int null,
  is_published boolean default false,
  is_featured boolean default false,
  meta_title text null, meta_description text null,
  search_vector tsvector,                 -- French FTS
  created_at, updated_at,
  CHECK ((has_variants = true AND sku IS NULL AND price_tnd IS NULL)
      OR (has_variants = false AND sku IS NOT NULL AND price_tnd IS NOT NULL))
)

product_variants (
  id uuid pk, product_id uuid fk -> products.id ON DELETE CASCADE,
  sku text unique, name text,             -- "40ml", "Taille M"
  price_tnd numeric(10,3) not null,
  compare_at_price_tnd numeric(10,3) null,
  weight_g int null,
  is_default boolean default false,
  display_order int default 0,
  created_at, updated_at
)

product_categories (
  product_id uuid fk, category_id uuid fk,
  PK (product_id, category_id)
)
-- A product may live in multiple categories (e.g., "Hydratant" + "Visage")

product_images (
  id uuid pk,
  product_id uuid fk -> products.id ON DELETE CASCADE,
  variant_id uuid fk -> product_variants.id null,  -- variant-specific shot
  storage_path text,                       -- supabase storage key
  alt_text text, display_order int,
  is_primary boolean default false
)
```

### 5.3 Inventory

```sql
inventory (
  id uuid pk,
  product_id uuid fk null,                 -- when has_variants=false
  variant_id uuid fk null,                 -- when has_variants=true
  on_hand int default 0,                   -- physical stock
  reserved int default 0,                  -- in active carts/pending orders
  reorder_point int default 5,             -- alert threshold
  updated_at,
  CHECK ((product_id IS NOT NULL) <> (variant_id IS NOT NULL)),
  UNIQUE (product_id), UNIQUE (variant_id)
)

stock_movements (                          -- append-only ledger
  id uuid pk,
  product_id uuid null, variant_id uuid null,
  type stock_movement_type,
  quantity int,                            -- signed (+ purchase, − sale)
  reference_type text null,                -- 'order' | 'manual_adjustment' | 'supplier_delivery'
  reference_id uuid null,
  notes text null,
  performed_by uuid fk -> staff_users.id null,
  performed_at timestamptz default now()
)
```

**Single warehouse for now.** Schema is extensible: when a second location is needed, add `locations` and `location_id` to `inventory` + `stock_movements` without breaking existing rows (default to a `'main'` location seeded on day one).

### 5.4 Customers

```sql
customers (
  id uuid pk = auth.users.id,              -- linked to Supabase auth
  email text unique, full_name text, phone text,
  date_of_birth date null,
  marketing_consent boolean default false,
  newsletter_subscribed boolean default false,
  default_shipping_address_id uuid null,
  default_billing_address_id uuid null,
  created_at, updated_at
)

customer_addresses (
  id uuid pk, customer_id uuid fk ON DELETE CASCADE,
  full_name, phone, street, city, postal_code,
  governorate text,                        -- "Nabeul", "Tunis", …
  country text default 'TN',
  is_default boolean default false,
  created_at, updated_at
)

newsletter_subscribers (
  id uuid pk, email text unique,
  customer_id uuid fk null,                -- linked when account created later
  source text,                             -- 'footer' | 'popup' | 'checkout' | 'landing_hero'
  confirmed_at timestamptz null,           -- double opt-in
  unsubscribed_at timestamptz null,
  created_at
)
```

### 5.5 Orders

```sql
orders (
  id uuid pk,
  order_number text unique,                -- human-friendly: JMS-2026-001234
  customer_id uuid fk null,                -- null for guest checkout
  guest_email text null, guest_phone text null,
  -- shipping snapshot at order time (immutable)
  shipping_full_name, shipping_phone,
  shipping_street, shipping_city,
  shipping_postal_code, shipping_governorate,
  shipping_country text default 'TN',
  -- monetary, all in TND with millimes
  subtotal_tnd numeric(10,3),
  shipping_tnd numeric(10,3) default 0,
  discount_tnd numeric(10,3) default 0,
  tax_tnd numeric(10,3) default 0,
  total_tnd numeric(10,3),
  status order_status default 'pending',
  payment_status payment_status default 'pending',
  payment_method payment_method null,
  notes_customer text null, notes_internal text null,
  created_at, updated_at,
  confirmed_at, shipped_at, delivered_at, cancelled_at
)

order_items (
  id uuid pk, order_id uuid fk ON DELETE CASCADE,
  product_id uuid fk, variant_id uuid fk null,
  -- snapshot at order time (immutable, even if product later renamed)
  product_name_snapshot text, variant_name_snapshot text null,
  brand_snapshot text, sku_snapshot text,
  unit_price_tnd numeric(10,3),
  quantity int,
  line_total_tnd numeric(10,3)
)

order_events (                             -- audit trail + BI input
  id uuid pk, order_id uuid fk ON DELETE CASCADE,
  event_type text,                         -- 'created' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'note_added'
  from_status order_status null, to_status order_status null,
  notes text null,
  performed_by uuid fk -> staff_users.id null,  -- null when customer-initiated
  performed_at timestamptz default now()
)
```

### 5.6 Staff & audit

```sql
staff_users (
  id uuid pk = auth.users.id,
  email text unique, full_name text,
  role staff_role not null,
  is_active boolean default true,
  created_at, updated_at,
  last_login_at timestamptz null
)

audit_log (
  id bigserial pk,
  staff_user_id uuid fk -> staff_users.id,
  action text,                             -- 'product.create' | 'order.refund' | …
  entity_type text,                        -- 'product' | 'order' | 'inventory' | 'customer'
  entity_id uuid,
  diff jsonb,                              -- {before, after}
  performed_at timestamptz default now()
)
```

### 5.7 Cart

```sql
carts (
  id uuid pk,
  customer_id uuid fk null,                -- when logged in
  session_id text null,                    -- when guest (cookie)
  created_at, updated_at,
  UNIQUE(customer_id), UNIQUE(session_id)
)

cart_items (
  cart_id uuid fk ON DELETE CASCADE,
  product_id uuid fk, variant_id uuid null,
  quantity int, added_at,
  PK (cart_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'))
)
```

### 5.8 Indexing notes

- `products.search_vector` GIN, populated by trigger on insert/update from `name + brand.name + short_description` with French dictionary
- `products (slug)`, `categories (slug)`, `brands (slug)` unique already
- `orders (customer_id, created_at desc)` for "my orders"
- `orders (status, created_at desc)` for CRM dashboard queues
- `stock_movements (product_id, performed_at desc)`, `stock_movements (variant_id, performed_at desc)` for product-level history
- `order_items (product_id)` and `(variant_id)` for BI best-seller queries

## 6. Auth & RLS model

### 6.1 Two audiences, one Supabase project

- **Customers** authenticate via `apps/web` using email + magic link (Supabase Auth). On first login a `customers` row is created (post-signup hook) linked by `id = auth.uid()`.
- **Staff** authenticate via `apps/admin` using email + password. Staff rows are created manually by an `admin` (no public signup). A row in `staff_users` with `is_active=true` is what proves "this auth user is staff."

We distinguish staff from customers by *which table their auth.uid() appears in*. The same auth user is never both.

### 6.2 RLS policies (summary; full DDL with policies in migrations)

Public (anon JWT, e.g., browsing apps/web without login):
- `brands` SELECT all
- `categories` SELECT all
- `products` SELECT where `is_published=true`
- `product_variants`, `product_images` SELECT where parent product is published
- `inventory` SELECT only via a public **view** `inventory_public` that exposes `(product_id, variant_id, stock_status)` where `stock_status` is derived: `'out'` when `on_hand=0`, `'low'` when `on_hand <= reorder_point`, else `'in_stock'`. The base `inventory` table is **denied** to the anon role — never expose `on_hand` directly.
- `newsletter_subscribers` INSERT (anyone can subscribe with email+source)

Customer (auth user that exists in `customers`):
- All public reads, plus
- `customers` SELECT/UPDATE where `id = auth.uid()`
- `customer_addresses` SELECT/INSERT/UPDATE/DELETE where `customer_id = auth.uid()`
- `orders` SELECT where `customer_id = auth.uid()` (read own only — no insert/update from customer JWT; checkout server action uses service role)
- `carts`, `cart_items` SELECT/INSERT/UPDATE/DELETE where `customer_id = auth.uid()`

Staff role-based (auth user exists in `staff_users` with role X):
- `admin`: full read/write on every table; create/disable other staff
- `manager`: full read on everything; write on `products`, `product_variants`, `categories`, `brands`, `inventory`, `orders`, `customers`; cannot create staff_users
- `cashier`: read on catalog + customers + orders; INSERT into `orders` + `order_items` (POS / phone orders); cannot edit prices or product master data
- `stock`: read on catalog; full write on `inventory`, `stock_movements`; write on `products` for non-monetary fields (Postgres RLS doesn't support column-level restrictions, so the "no pricing" rule is enforced in the app layer — `apps/admin` server actions strip `price_tnd` / `compare_at_price_tnd` from any update payload submitted by a `stock` role); no access to `orders`, `customers`, `audit_log`

### 6.3 Server-side privileged operations

Two write paths exist:

1. **Authenticated client writes** — staff using `apps/admin` write through their own JWT; RLS policies above enforce role boundaries directly. The cashier creating an in-store order is this path.
2. **Server-action writes** — `apps/web` checkout (create order from a guest or customer cart) and BI aggregation queries use the Supabase **service role** key (server-only, never reaches the browser). These bypass RLS by design and are wrapped in domain-level functions in `packages/lib` / `packages/db` so RLS remains the enforced boundary for any code running with a user JWT.

The service-role key lives only in server env vars on DO App Platform. It is never imported in client components.

## 7. Design system package (`packages/ui`)

### 7.1 Tokens (Tailwind v4 preset)

Exposed as CSS variables; Tailwind classes generated from them.

```css
--color-cream-sand:        #FAF6F0;   /* page background */
--color-linen:             #F2EBDF;   /* card / panel */
--color-soft-teal:         #5BA8A5;
--color-deep-teal:         #1F6F6D;
--color-jasmine:           #C5D17A;
--color-terracotta-whisper:#D8B27E;
--color-warm-taupe:        #3D3934;   /* body text */

--font-display:  "Playfair Display", serif;
--font-body:     "Manrope", system-ui, sans-serif;
--font-label:    "Plus Jakarta Sans", system-ui, sans-serif;

--radius-md:  12px;
--radius-lg:  24px;
--radius-pill: 9999px;

--shadow-soft: 0 8px 24px rgba(31, 111, 109, 0.08);
```

### 7.2 Components shipped in Foundation

Primitives (radix/shadcn vendored, restyled to tokens): `Button` (variants `primary-teal`, `jasmine`, `outline`, `ghost`, `link`), `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Pill`/`Chip`, `Dialog`, `Drawer`, `Tooltip`, `Toast`/`Sonner`.

Brand: `Logo` (wordmark), `JasmineSprig` (SVG, jasmine green-yellow), `Marquee` (trusted brands strip), `EditorialPanel`, `TealHeroPanel`, `AiryContainer`, `PriceTag` (formats TND with millimes).

Typography: `H1Editorial` (Playfair italic), `H2Section`, `H3Card`, `BodyText`, `LabelEyebrow`.

Phase-2-only (mentioned for awareness, not built in Foundation): `ProductCard`, `FilterSidebar`, `BreadcrumbsAiry`, `CartDrawer`, `MiniCart`.

### 7.3 Voice helpers

`packages/lib/voice.ts` — French copy fragments used across both apps (e.g., `EMPTY_CART = "Votre panier est calme pour l'instant."`). Single source so the brand voice stays consistent.

## 8. Dev workflow

### 8.1 Local

- Two Supabase projects on Supabase Cloud: `jasmin-dev` and `jasmin-prod` (free tier for dev). No local Postgres.
- `.env.local` per app, gitignored. `.env.example` committed.
- `bun dev` at root → turbo runs both `apps/web` and `apps/admin` in parallel on different ports (3000, 3001).
- `bun db:generate` → drizzle-kit generates migration from schema diff.
- `bun db:migrate` → runs pending migrations against the env-pointed DB.
- `bun db:seed` → loads realistic Jasmin seed.
- `bun lint` → biome check.
- `bun typecheck` → tsc --noEmit across packages.
- `bun test` → Bun test runner.

### 8.2 Realistic seed (the CEO-demo data)

Generated by hand-curated TypeScript scripts in `packages/db/seed/`:

- **Brands (6):** SVR, Avène, La Roche-Posay, Vichy, Bioderma, Nuxe — each with French description and logo placeholder
- **Categories (top-level 4):** Cosmétique, Orthopédie, Matériel médical, Parapharmacie générale — each with 2–4 subcategories
- **Products (~40):** mix of variant and flat. Examples:
  - SVR Sebiaclear Crème (flat, single SKU, 32.90 TND)
  - Avène Cleanance Gel Nettoyant (variants: 200ml / 400ml)
  - Wheelchair Standard (flat)
  - Tensiomètre Omron M3 (flat)
  - Lecteur de glycémie Accu-Chek (flat, 89.00 TND)
  - SVR Sun Secure SPF50 (variants: lait / crème / brume)
- **Customers (~10):** Tunisian names, Nabeul/Tunis/Sfax addresses
- **Orders (~20):** spread across last 30 days, varied statuses, mix of guest + customer
- **Stock movements:** initial purchase batches + the order-driven sales for last 30 days

The seed is idempotent — running it twice yields the same state.

### 8.3 Migrations safety

- All migrations are forward-only and reviewed in PR.
- Drizzle's snapshot (`drizzle/_meta/_journal.json`) is committed.
- CI runs migrations against an ephemeral Postgres on PR to catch breakage before it reaches dev.
- Production migrations run via a one-shot CI job before the deploy step.

## 9. Deploy topology

```
                ┌──────────────────┐         ┌──────────────────────┐
                │  jasmin-medical- │         │  admin.jasmin-       │
   visitors  ──▶│  store.com       │         │  medical-store.com   │
                │  (apps/web)      │         │  (apps/admin)        │
                │  DO App Platform │         │  DO App Platform     │
                │  Pro tier        │         │  Basic tier          │
                └────────┬─────────┘         └─────────┬────────────┘
                         │                             │
                         │      Drizzle / supabase-js  │
                         ▼                             ▼
                ┌─────────────────────────────────────────────┐
                │  Supabase project (EU-Frankfurt)            │
                │  Postgres 15  +  Auth  +  Storage           │
                └─────────────────────────────────────────────┘
```

- `apps/web` Pro tier: never sleeps, edge cache, custom domain, automatic TLS.
- `apps/admin` Basic tier: cheaper, fine for staff use, custom domain.
- Supabase DB region: EU-Frankfurt — lowest latency to Tunisia among Supabase regions.
- Product images served via Supabase Storage CDN (built-in).
- DNS at the user's registrar; CNAME to DO App Platform endpoints.

## 10. CI/CD

GitHub Actions workflow on push:

1. `bun install --frozen-lockfile`
2. `bun lint` (Biome)
3. `bun typecheck` (tsc --noEmit, every package)
4. `bun test` (Bun test runner)
5. **Migration check:** spin ephemeral Postgres, run all migrations, fail if drizzle-kit reports schema drift
6. On `main` branch only: `db:migrate` against `jasmin-prod`, then DO App Platform auto-deploys both apps

Branch deploys: each PR gets ephemeral DO App Platform preview URLs (web + admin) pointed at `jasmin-dev`.

## 11. Phase 1 deliverables (definition-of-done)

- [ ] Monorepo scaffolded: `bun create` + `turbo init`, both apps run via `bun dev`
- [ ] `packages/db` complete: Drizzle schema for §5 entities, migrations generated, seed loads cleanly
- [ ] `packages/ui` complete: tokens preset + primitives + brand components listed in §7.2
- [ ] `packages/lib` complete: Zod schemas for every DB entity, `formatTND()`, `slugify()`, voice copy
- [ ] `apps/web` placeholder: home route renders Logo + H1Editorial + a button using primary-teal — proves design system works
- [ ] `apps/admin` placeholder: protected by Supabase auth (only staff_users can enter), shows the staff role chip
- [ ] Both apps deployed to DO App Platform on production domains with TLS
- [ ] Supabase dev + prod projects provisioned, schema migrated, seed loaded into dev
- [ ] CI green: lint, typecheck, test, migration check
- [ ] README documenting `bun dev` flow and env-var setup

## 12. Out of scope for Phase 1 (deferred)

- Actual landing page hero, product listing UI, product detail UI → **Phase 2 (Landing+Shop)**
- CRM screens (product editor, order workflow, inventory dashboard) → **Phase 3 (CRM)**
- BI dashboards, materialized views, reports → **Phase 4 (BI)**
- Payment integrations (Konnect / Click to Pay / COD flow) → Phase 2
- Transactional email templates (Resend) → Phase 2
- Newsletter campaigns → Phase 2
- SMS / WhatsApp notifications → Phase 3+
- Multi-warehouse → Phase 3+ (schema is forward-compatible)
- Returns / refunds workflow → Phase 3
- Loyalty program / coupons → Phase 4+

## 13. Open follow-ups (to revisit at Phase 2 brainstorm)

- Exact payment-method roster (Cash on Delivery confirmed; Konnect vs Clic-to-Pay TBD)
- Tax / TVA rules for parapharmacy in Tunisia (some categories may be exempt — needs accountant input)
- Whether storefront supports Arabic later (schema must allow `name_fr` + `name_ar` columns; for now French-only as locked)
- Sentry vs Logflare for error tracking
- Whether to add Storybook for `packages/ui` (skipped in Foundation; revisit if visual regressions become painful)
