# Supabase setup (per environment)

We run two projects: `jasmin-dev` and `jasmin-prod`. Both in **EU-Frankfurt**.

## 1. Create the project

1. Go to https://supabase.com/dashboard → New project
2. Region: **eu-central-1 (Frankfurt)**
3. DB password: store in 1Password under `jasmin / supabase / <env>`
4. Project name: `jasmin-<env>`

## 2. Capture credentials

From Project Settings → API copy:
- `Project URL` → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only)

From Project Settings → Database → Connection string (URI mode, with password):
- `SUPABASE_DB_URL`

Put them in `.env.local` (never commit).

## 3. Run migrations

```bash
SUPABASE_DB_URL=… bun --filter @jasmin/db migrate
```

This applies Drizzle migrations + RLS policies in one shot.

## 4. Seed (dev only)

```bash
SUPABASE_DB_URL=… bun --filter @jasmin/db seed
```

## 5. Storage bucket for product images

In Supabase Studio → Storage → Create bucket
- Name: `product-images`
- Public: yes (read)
- File size limit: 10 MB
- Allowed mime types: `image/jpeg, image/png, image/webp`

## 6. Auth settings

Authentication → Providers → enable **Email**.
- Disable "Confirm email" for the dev project (faster onboarding)
- Keep enabled for prod

Authentication → URL Configuration:
- Site URL (web): `https://jasmin-medical-store.com` (prod) or `http://localhost:3000` (dev)
- Additional redirect URLs: include `https://admin.jasmin-medical-store.com/**`

## 7. Invite staff users

Auth → Users → Invite user → enter the email matching a row in `staff_users` seed.
After acceptance, copy the new auth user's UUID → update `STAFF_SEED` in
`packages/db/src/seed/data/staff.ts` so the IDs match → re-run seed.

In production, invite real staff and create their `staff_users` rows via the admin UI
(built in Phase 3).
