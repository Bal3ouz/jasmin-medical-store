# Jasmin Médical Store

Parapharmacie + matériel médical e-commerce + CRM + BI for Jasmin Médical Store, Nabeul, Tunisia.

## Quickstart

```bash
bun install
cp .env.example .env.local  # fill in Supabase credentials
bun db:migrate
bun db:seed
bun dev                      # starts apps/web (3000) + apps/admin (3001)
```

## Structure

- `apps/web` — public landing + shop
- `apps/admin` — internal CRM + BI (auth-only)
- `packages/db` — Drizzle schema, migrations, seed
- `packages/ui` — design system tokens + components
- `packages/lib` — shared domain logic
- `packages/config` — shared tsconfig + biome presets

See `docs/superpowers/specs/2026-04-28-foundation-design.md` for the full design.

## Running admin E2E tests

Pre-requisites: a provisioned Supabase project for testing, with the schema migrated and seed loaded. Set:

```
E2E_ADMIN_EMAIL=admin@jasmin.tn
E2E_ADMIN_PASSWORD=...
E2E_CASHIER_EMAIL=cashier@jasmin.tn
E2E_CASHIER_PASSWORD=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_DB_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Then from the repo root:

```bash
cd apps/admin && bun run e2e
```

The product spec also opens the storefront at `http://localhost:3000/produit/<slug>` to verify cross-app publication; run `bun dev` (or `cd apps/web && bun run dev`) in a separate terminal so the web server is up alongside the admin server Playwright launches.
