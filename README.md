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
