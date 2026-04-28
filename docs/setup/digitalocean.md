# DigitalOcean App Platform setup

We deploy two apps from one GitHub repo: `apps/web` and `apps/admin`.

## 1. GitHub connection

DigitalOcean → Apps → Create App → connect the GitHub repo for the monorepo.

## 2. App: web (storefront)

- App name: `jasmin-web-prod`
- Source: `apps/web`
- Build command: `bun install --frozen-lockfile && bun --filter @jasmin/web build`
- Run command: `bun --filter @jasmin/web start`
- HTTP port: 3000
- Plan: **Pro Basic** (so it never sleeps)
- Region: Frankfurt (FRA1)
- Domain: `jasmin-medical-store.com` (+ `www.` redirect)
- Env vars (encrypted where appropriate):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (mark **encrypted**)
  - `SUPABASE_DB_URL` (mark **encrypted**)

## 3. App: admin (CRM)

- App name: `jasmin-admin-prod`
- Source: `apps/admin`
- Build command: `bun install --frozen-lockfile && bun --filter @jasmin/admin build`
- Run command: `bun --filter @jasmin/admin start`
- HTTP port: 3001
- Plan: **Basic**
- Region: Frankfurt (FRA1)
- Domain: `admin.jasmin-medical-store.com`
- Same env vars as web

## 4. Auto-deploy

Both apps: enable "Autodeploy" on push to `main`. PRs do NOT auto-deploy.

## 5. Migrations on deploy

Add a **pre-deploy job** to each app:
- Job kind: pre-deploy
- Run command: `bun --filter @jasmin/db migrate`
- Env: same as the parent app

This ensures schema is up-to-date before the new app code starts serving.
