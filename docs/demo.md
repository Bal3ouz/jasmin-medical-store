# Demo guide — Jasmin Médical Store

A fully self-contained local demo for prospect meetings. Everything runs on
your laptop. No internet needed once the Docker images are pulled.

## One-shot bring-up

```bash
bun run demo:up
```

This wraps:

1. `supabase start` — launches the local Postgres + Auth + Storage Docker stack
2. `bun run db:migrate` — applies Drizzle migrations + RLS policies
3. `bun run db:seed:extended` — composes baseline + extended seed
   (~85 products, ~35 customers, ~70 orders, varied statuses)
4. `bun run db:seed:demo-staff` — creates the four demo auth users
5. `bun run db:upload-images` — scrapes manufacturer product photos and
   uploads them to Supabase Storage `product-images`

Then in a second terminal:

```bash
bun dev                # launches both apps via Turbo
# storefront → http://localhost:3000
# admin     → http://localhost:3001
```

### Reset the demo state mid-meeting

```bash
bun run demo:reset
```

(Wipes the local Supabase database, re-runs migrations + seed + image upload.
Takes ~30s.)

### Tear down

```bash
bun run demo:down       # supabase stop
```

## Demo accounts

| Role     | Email              | Password    |
|----------|--------------------|-------------|
| admin    | admin@jasmin.tn    | Demo1234!   |
| manager  | manager@jasmin.tn  | Demo1234!   |
| cashier  | cashier@jasmin.tn  | Demo1234!   |
| stock    | stock@jasmin.tn    | Demo1234!   |

Login at <http://localhost:3001/login>.

The storefront accepts customer signup / signin via the standard form at
<http://localhost:3000/compte/connexion>; or check out as guest.

## 5-minute walkthrough script

### 0. Open both apps side by side

- Storefront `http://localhost:3000` — the public face.
- Admin `http://localhost:3001` — the back-office.

### 1. Storefront (1 min)

1. **Landing** — Motion hero, Playfair italic headline, jasmine-yellow CTA.
2. **Boutique → Cosmétique** — editorial 3-col grid with real product photos
   on populated rows; branded fallback for the rest (cream + JasmineSprig
   silhouette + Playfair italic name — designed to look like a "photo coming"
   slot, not a missing asset).
3. **Click any product** — gallery + variant picker (try one with size variants
   like Avène Cleanance Gel: 200ml / 400ml).
4. **Add to cart** → cart drawer slides in.

### 2. Guest checkout (1 min)

1. Open cart, click "Passer commande".
2. Fill the address (any Tunisian city — Nabeul / Tunis / Sfax).
3. Payment: cash on delivery (Konnect / Click-to-Pay are visible as
   "Bientôt" disabled pills — the roadmap is on screen).
4. Confirm — order number `JMS-2026-NNNNNN` is assigned via a Postgres
   sequence, inventory decrements atomically, the customer lands on a
   confirmation page.

### 3. Admin — orders queue (1 min)

1. Sign in as admin.
2. Sidebar → **Commandes**. Status filter chips. Search by order number.
3. Click the new pending order from step 2. Walk the state machine:
   `Confirmer` → `Préparer` → `Expédier` → `Marquer livrée`. Each transition
   appears in the events timeline with its timestamp.
4. Show the `Refund` flow on a delivered order — admin-only button. The
   refund revives inventory atomically, writes `return` movements to the
   stock ledger, audit-logs everything.

### 4. Admin — POS-lite walk-in (45 s)

1. Sign out, sign in as **cashier** (cashier@jasmin.tn).
2. **Commandes → Nouvelle commande**.
3. Pick a customer (typeahead) or "Client invité".
4. Add a couple of lines, submit. The order is created with
   `status='confirmed'`, `payment_method='cash_on_delivery'`,
   `payment_status='paid'`. Inventory decrements.

### 5. Admin — catalog management (45 s)

1. Sign back in as admin or manager.
2. **Catalogue → Produits** — full-text search by French dictionary, brand
   filter, publish toggle.
3. Open a product. Show the variant editor (inline rows), image uploader
   (drag-drop, sortable), publish toggle, duplicate, delete.
4. Stock role: log out, log back in as `stock@jasmin.tn`. Pricing inputs are
   disabled. The role is enforced both in the UI and at the server-action
   layer.

### 6. Admin — Décisionnel (BI) (1 min)

1. Sign in as admin or manager.
2. Sidebar → **Décisionnel**.
3. Six KPI tiles + six summary cards. Switch the period preset (7j / 30j /
   90j / 12m / Tout).
4. Drill into:
   - **Tendances** — area chart of revenue, bar chart of orders.
   - **Meilleures ventes** — qty / revenue toggle, drill to product.
   - **Paniers types** — basket pair affinity (lift score).
   - **Santé du stock** — reorder candidates, dead stock, turnover.
   - **Cohortes** — monthly cohorts with repeat rate + LTV.
   - **Conversion** — newsletter→order funnel.

## What to highlight to the prospect

- **French throughout, TND prices, Tunisian addresses** — not a localized US
  app; built for them.
- **Editorial design language** — Playfair display + Manrope body + soft
  cream sand background, deep teal CTAs, jasmine-yellow accents matching the
  brand bag photo.
- **Real state machine on orders** — forward-only for non-admins, refunds
  admin-only, every transition audit-logged with diff JSONs.
- **Atomic inventory** — every web checkout, walk-in, and refund mutates
  stock + writes the ledger row inside a single Postgres transaction.
- **Self-hosted-ready** — running on Supabase Cloud OR a self-hosted
  Postgres + Supabase Storage of the prospect's choice. EU-Frankfurt for
  Tunisia latency.
- **Six BI reports already shipped** — they're not a roadmap promise.

## Known demo-time gotchas

- **Image coverage**: ~15 of 50 extended products have real manufacturer
  photos uploaded. The rest render with the branded `ProductImageFallback`
  (cream + JasmineSprig + Playfair italic product name). This is by design
  — the fallback was Phase-2 spec'd specifically for the
  before-photos-arrive state and looks editorial.
- **Email confirmation** is OFF in local Supabase, so customer signup is
  instant. Production would flip this on.
- **Magic-link admin invites** route through the local Mailpit
  (<http://localhost:54324>) — open it to see the invite email.
- **Port 54324** = Mailpit; **54323** = Supabase Studio (raw DB browser);
  **54322** = the Postgres port.

## Pre-meeting smoke test

```bash
bash scripts/demo-smoke.sh
```

Curls every prospect-visible page (storefront landing, boutique, all 4 top
categories, content pages, admin login, Supabase Auth health) and prints a
data-sanity summary (products/orders/customers/images counts). Use this as
your final go/no-go check 60 seconds before opening the demo browser.

## E2E coverage

- **Storefront** Playwright suite (`apps/web/e2e/`): `bun run e2e` from
  `apps/web/`. Six demo-smoke specs pass against the seeded data.
- **Admin** Playwright suite (`apps/admin/e2e/`): the three Phase-3 specs
  (orders lifecycle, product upload, walk-in) require `next start` against a
  prod build. Server Actions race with Playwright clicks under `next dev`.
  For the live demo the human-driven flow works perfectly — this only
  matters if you want hands-off CI coverage.

## Resetting between meetings

```bash
bun run demo:reset
```

Wipes the DB, re-applies migrations + RLS, re-runs the seed, re-uploads
images. Takes ~30 seconds.

## Operational quick reference

```bash
# View Mailpit (magic-link invites land here)
open http://localhost:54324

# View Supabase Studio (raw DB explorer)
open http://localhost:54323

# Tail postgres logs
docker logs -f supabase_db_jasmin-medical-store

# Inspect a row directly
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```
