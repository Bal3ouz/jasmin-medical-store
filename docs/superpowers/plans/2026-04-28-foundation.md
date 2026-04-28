# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Jasmin Médical Store monorepo (Turborepo + Bun + Drizzle + Next.js) with shared design system, complete database schema, RLS policies, realistic seed data, two placeholder apps proving the design system works, CI pipeline, and deploy topology — so Phases 2–4 can start immediately on solid ground.

**Architecture:** Two Next.js 15 apps (`apps/web` public, `apps/admin` internal) on DigitalOcean App Platform, sharing Drizzle DB schema (`packages/db`), domain logic (`packages/lib`), and design tokens + components (`packages/ui`). Supabase EU-Frankfurt is the single Postgres + Auth + Storage backend. RLS enforces public/customer/staff boundaries. Bun is the runtime + package manager + test runner. Tests use pglite (in-memory Postgres) so CI runs zero-deps.

**Tech Stack:** Bun ≥ 1.2, Turborepo 2, Next.js 15, Drizzle ORM, Supabase, Tailwind v4, radix-ui primitives, react-hook-form + Zod, Biome, Playfair Display + Manrope + Plus Jakarta Sans, pglite (test DB).

**Spec reference:** `docs/superpowers/specs/2026-04-28-foundation-design.md`

**Working directory:** `/Users/ghaith.belaazi/dev/jasmin-medical-store` (currently empty, not a git repo).

---

## Task 0: Prerequisites

**Files:** none — verification only.

- [ ] **Step 1: Verify Bun**

```bash
bun --version
```
Expected: `1.2.x` or higher. If missing: `curl -fsSL https://bun.sh/install | bash`

- [ ] **Step 2: Verify git**

```bash
git --version
```
Expected: `git version 2.40+`

- [ ] **Step 3: Verify gh (optional, for CI/PR work later)**

```bash
gh --version
```

---

## Task 1: Bootstrap monorepo skeleton

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `biome.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.editorconfig`
- Create: `README.md`

- [ ] **Step 1: Initialize git**

```bash
cd /Users/ghaith.belaazi/dev/jasmin-medical-store
git init -b main
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "jasmin-medical-store",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.2.0",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "db:generate": "bun --filter @jasmin/db generate",
    "db:migrate": "bun --filter @jasmin/db migrate",
    "db:seed": "bun --filter @jasmin/db seed",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "turbo": "2.3.3",
    "typescript": "5.7.2"
  }
}
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env.local", ".env.example"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignore": ["**/.next", "**/dist", "**/node_modules", "**/migrations/*.sql"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always", "trailingCommas": "all" } },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "useImportType": "warn", "useNodejsImportProtocol": "warn" },
      "suspicious": { "noConsoleLog": "warn" }
    }
  }
}
```

- [ ] **Step 5: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "jsx": "preserve"
  },
  "exclude": ["node_modules", "dist", ".next"]
}
```

- [ ] **Step 6: Create `.gitignore`**

```gitignore
node_modules
.next
dist
.turbo
.env
.env.local
.env.*.local
*.log
.DS_Store
.vscode/*
!.vscode/extensions.json
coverage
.bun
```

- [ ] **Step 7: Create `.env.example`**

```bash
# Supabase (per environment — point at jasmin-dev or jasmin-prod)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

# Public Next.js (browser-exposed; SUPABASE_URL + ANON only)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 8: Create `.editorconfig`**

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

- [ ] **Step 9: Create `README.md`**

```markdown
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
```

- [ ] **Step 10: Install root deps and verify**

```bash
bun install
```
Expected: lockfile created, `node_modules/` populated, `bun.lockb` written.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: bootstrap monorepo skeleton"
```

---

## Task 2: Shared configs (`packages/config`)

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.lib.json`
- Create: `packages/config/tsconfig.next.json`

- [ ] **Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@jasmin/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "files": ["tsconfig.*.json"]
}
```

- [ ] **Step 2: Create `packages/config/tsconfig.lib.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist"
  }
}
```

- [ ] **Step 3: Create `packages/config/tsconfig.next.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "noEmit": true,
    "incremental": true,
    "allowJs": true
  }
}
```

- [ ] **Step 4: Install workspace link**

```bash
bun install
```

- [ ] **Step 5: Commit**

```bash
git add packages/config
git commit -m "chore(config): add shared tsconfig presets"
```

---

## Task 3: `packages/lib` utilities — TDD

**Files:**
- Create: `packages/lib/package.json`
- Create: `packages/lib/tsconfig.json`
- Create: `packages/lib/src/index.ts`
- Create: `packages/lib/src/format.ts`
- Create: `packages/lib/src/format.test.ts`
- Create: `packages/lib/src/slug.ts`
- Create: `packages/lib/src/slug.test.ts`
- Create: `packages/lib/src/inventory.ts`
- Create: `packages/lib/src/inventory.test.ts`
- Create: `packages/lib/src/order-number.ts`
- Create: `packages/lib/src/order-number.test.ts`
- Create: `packages/lib/src/voice.ts`

- [ ] **Step 1: Create `packages/lib/package.json`**

```json
{
  "name": "@jasmin/lib",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./schemas": "./src/schemas/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "dependencies": {
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@jasmin/config": "workspace:*",
    "@types/bun": "1.1.14",
    "typescript": "5.7.2"
  }
}
```

- [ ] **Step 2: Create `packages/lib/tsconfig.json`**

```json
{
  "extends": "@jasmin/config/tsconfig.lib.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src"]
}
```

- [ ] **Step 3: Run install to link workspace**

```bash
bun install
```

- [ ] **Step 4: Write the failing test for `formatTND`**

Create `packages/lib/src/format.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { formatTND, formatTNDFromMillimes } from "./format";

describe("formatTND", () => {
  test("formats whole-dinar prices with three-decimal millimes", () => {
    expect(formatTND(32.9)).toBe("32,900 TND");
  });

  test("formats prices with millimes precision", () => {
    expect(formatTND(5.005)).toBe("5,005 TND");
  });

  test("formats zero", () => {
    expect(formatTND(0)).toBe("0,000 TND");
  });

  test("formats large prices with thousand separator (espace insécable)", () => {
    expect(formatTND(1234.5)).toBe("1 234,500 TND");
  });
});

describe("formatTNDFromMillimes", () => {
  test("converts integer millimes to TND string", () => {
    expect(formatTNDFromMillimes(32900)).toBe("32,900 TND");
  });

  test("handles zero millimes", () => {
    expect(formatTNDFromMillimes(0)).toBe("0,000 TND");
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

```bash
cd packages/lib && bun test src/format.test.ts
```
Expected: FAIL with "Cannot find module './format'".

- [ ] **Step 6: Implement `formatTND`**

Create `packages/lib/src/format.ts`:

```ts
const TND_FORMATTER = new Intl.NumberFormat("fr-TN", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
  useGrouping: true,
});

export function formatTND(amount: number): string {
  return `${TND_FORMATTER.format(amount)} TND`;
}

export function formatTNDFromMillimes(millimes: number): string {
  return formatTND(millimes / 1000);
}
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
cd packages/lib && bun test src/format.test.ts
```
Expected: 6/6 PASS.

- [ ] **Step 8: Write the failing test for `slugify`**

Create `packages/lib/src/slug.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { slugify } from "./slug";

describe("slugify", () => {
  test("lowercases and hyphenates spaces", () => {
    expect(slugify("Crème Anti-Imperfections")).toBe("creme-anti-imperfections");
  });

  test("strips French accents (é, è, ê, à, ç)", () => {
    expect(slugify("Hydrance Crème Visage")).toBe("hydrance-creme-visage");
  });

  test("collapses multiple spaces and dashes", () => {
    expect(slugify("Eau   Thermale -- Avène")).toBe("eau-thermale-avene");
  });

  test("strips leading and trailing dashes", () => {
    expect(slugify(" -SVR Sebiaclear- ")).toBe("svr-sebiaclear");
  });

  test("removes punctuation other than dash", () => {
    expect(slugify("L'Oréal: Soin 24h")).toBe("loreal-soin-24h");
  });

  test("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});
```

- [ ] **Step 9: Run the test to verify it fails**

```bash
cd packages/lib && bun test src/slug.test.ts
```
Expected: FAIL with "Cannot find module './slug'".

- [ ] **Step 10: Implement `slugify`**

Create `packages/lib/src/slug.ts`:

```ts
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 11: Run the test to verify it passes**

```bash
cd packages/lib && bun test src/slug.test.ts
```
Expected: 6/6 PASS.

- [ ] **Step 12: Write the failing test for `deriveStockStatus`**

Create `packages/lib/src/inventory.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { deriveStockStatus } from "./inventory";

describe("deriveStockStatus", () => {
  test("returns 'out' when on_hand is 0", () => {
    expect(deriveStockStatus({ onHand: 0, reorderPoint: 5 })).toBe("out");
  });

  test("returns 'low' when on_hand is at or below reorder point", () => {
    expect(deriveStockStatus({ onHand: 5, reorderPoint: 5 })).toBe("low");
    expect(deriveStockStatus({ onHand: 3, reorderPoint: 5 })).toBe("low");
  });

  test("returns 'in_stock' when on_hand is above reorder point", () => {
    expect(deriveStockStatus({ onHand: 6, reorderPoint: 5 })).toBe("in_stock");
    expect(deriveStockStatus({ onHand: 100, reorderPoint: 5 })).toBe("in_stock");
  });

  test("treats negative on_hand defensively as 'out'", () => {
    expect(deriveStockStatus({ onHand: -1, reorderPoint: 5 })).toBe("out");
  });
});
```

- [ ] **Step 13: Run the test to verify it fails**

```bash
cd packages/lib && bun test src/inventory.test.ts
```
Expected: FAIL with "Cannot find module './inventory'".

- [ ] **Step 14: Implement `deriveStockStatus`**

Create `packages/lib/src/inventory.ts`:

```ts
export type StockStatus = "in_stock" | "low" | "out";

export interface StockInput {
  onHand: number;
  reorderPoint: number;
}

export function deriveStockStatus({ onHand, reorderPoint }: StockInput): StockStatus {
  if (onHand <= 0) return "out";
  if (onHand <= reorderPoint) return "low";
  return "in_stock";
}
```

- [ ] **Step 15: Run the test to verify it passes**

```bash
cd packages/lib && bun test src/inventory.test.ts
```
Expected: 4/4 PASS.

- [ ] **Step 16: Write the failing test for `generateOrderNumber`**

Create `packages/lib/src/order-number.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { generateOrderNumber } from "./order-number";

describe("generateOrderNumber", () => {
  test("formats year + zero-padded sequence as JMS-YYYY-NNNNNN", () => {
    expect(generateOrderNumber({ year: 2026, sequence: 1 })).toBe("JMS-2026-000001");
  });

  test("pads up to 6 digits", () => {
    expect(generateOrderNumber({ year: 2026, sequence: 1234 })).toBe("JMS-2026-001234");
  });

  test("does not truncate sequences above 999999", () => {
    expect(generateOrderNumber({ year: 2026, sequence: 1234567 })).toBe("JMS-2026-1234567");
  });
});
```

- [ ] **Step 17: Run the test to verify it fails**

```bash
cd packages/lib && bun test src/order-number.test.ts
```
Expected: FAIL.

- [ ] **Step 18: Implement `generateOrderNumber`**

Create `packages/lib/src/order-number.ts`:

```ts
export interface OrderNumberInput {
  year: number;
  sequence: number;
}

export function generateOrderNumber({ year, sequence }: OrderNumberInput): string {
  return `JMS-${year}-${String(sequence).padStart(6, "0")}`;
}
```

- [ ] **Step 19: Run the test to verify it passes**

```bash
cd packages/lib && bun test src/order-number.test.ts
```
Expected: 3/3 PASS.

- [ ] **Step 20: Add brand voice constants**

Create `packages/lib/src/voice.ts`:

```ts
export const VOICE = {
  emptyCart: "Votre panier est calme pour l'instant.",
  emptyWishlist: "Aucun coup de cœur enregistré.",
  outOfStock: "Bientôt de retour",
  lowStock: "Plus que quelques pièces",
  addToCartCta: "Ajouter au panier",
  buyNowCta: "Acheter",
  newsletterPitch: "Recevez nos sélections en avant-première et nos rituels saisonniers.",
  newsletterCta: "Je m'inscris",
  heroTagline: "Prenez soin de vous, avec douceur.",
  heroSubtitle:
    "Parapharmacie & matériel médical, sélectionné avec amour à Nabeul.",
  trustedBrandsLabel: "Marques de confiance",
  contactBaseline: "Une question ? Notre équipe est joignable du lundi au samedi.",
} as const;

export type VoiceKey = keyof typeof VOICE;
```

- [ ] **Step 21: Create `packages/lib/src/index.ts`**

```ts
export * from "./format";
export * from "./slug";
export * from "./inventory";
export * from "./order-number";
export { VOICE, type VoiceKey } from "./voice";
```

- [ ] **Step 22: Run all lib tests**

```bash
cd packages/lib && bun test
```
Expected: all suites pass (6 + 6 + 4 + 3 = 19 tests).

- [ ] **Step 23: Run typecheck**

```bash
cd packages/lib && bun run typecheck
```
Expected: no errors.

- [ ] **Step 24: Commit**

```bash
git add packages/lib
git commit -m "feat(lib): add format, slug, inventory, order-number utilities + voice copy"
```

---

## Task 4: `packages/db` scaffold — Drizzle config, client, enums, pglite test harness

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/schema/_enums.ts`
- Create: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/test/pglite-harness.ts`
- Create: `packages/db/src/test/migrate.test.ts`

- [ ] **Step 1: Create `packages/db/package.json`**

```json
{
  "name": "@jasmin/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts",
    "./client": "./src/client.ts"
  },
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "bun src/migrate.ts",
    "seed": "bun src/seed/index.ts",
    "studio": "drizzle-kit studio",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "dependencies": {
    "@jasmin/lib": "workspace:*",
    "drizzle-orm": "0.36.4",
    "postgres": "3.4.5"
  },
  "devDependencies": {
    "@electric-sql/pglite": "0.2.14",
    "@jasmin/config": "workspace:*",
    "@types/bun": "1.1.14",
    "drizzle-kit": "0.30.1",
    "typescript": "5.7.2"
  }
}
```

- [ ] **Step 2: Create `packages/db/src/index.ts`**

```ts
export * from "./schema";
export { createClient } from "./client";
```

- [ ] **Step 3: Create `packages/db/tsconfig.json`**

```json
{
  "extends": "@jasmin/config/tsconfig.lib.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src", "drizzle.config.ts"]
}
```

- [ ] **Step 4: Create `packages/db/drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

const url = process.env.SUPABASE_DB_URL;
if (!url && process.env.NODE_ENV !== "test") {
  // drizzle-kit generate works without a URL; only fail loudly when missing for migrate
  // eslint-disable-next-line no-console
  console.warn("[drizzle.config] SUPABASE_DB_URL not set — generate-only mode");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: url ?? "postgres://placeholder" },
  verbose: true,
  strict: true,
});
```

- [ ] **Step 5: Create `packages/db/src/client.ts`**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createClient>;

export function createClient(databaseUrl: string) {
  const sql = postgres(databaseUrl, { max: 10, prepare: false });
  return drizzle(sql, { schema });
}
```

- [ ] **Step 6: Create `packages/db/src/schema/_enums.ts`**

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const staffRole = pgEnum("staff_role", ["admin", "manager", "cashier", "stock"]);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "paid",
  "refunded",
  "failed",
]);

export const paymentMethod = pgEnum("payment_method", [
  "cash_on_delivery",
  "card_konnect",
  "card_clic_to_pay",
  "bank_transfer",
]);

export const stockMovementType = pgEnum("stock_movement_type", [
  "purchase",
  "sale",
  "adjustment",
  "return",
  "transfer",
]);
```

- [ ] **Step 7: Create `packages/db/src/schema/index.ts` (placeholder, entities added in later tasks)**

```ts
export * from "./_enums";
```

- [ ] **Step 8: Create the pglite test harness**

Create `packages/db/src/test/pglite-harness.ts`:

```ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import path from "node:path";
import * as schema from "../schema";

export async function createTestDatabase() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  // pglite has no `auth` schema (Supabase-only). Stub `auth.uid()` to keep
  // policy DDL parseable when we add it.
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS auth`);
  await db.execute(
    sql`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$`,
  );

  return { db, client };
}

export async function migrateTestDatabase(db: ReturnType<typeof drizzle>) {
  const migrationsFolder = path.resolve(import.meta.dir, "../../migrations");
  await migrate(db, { migrationsFolder });
}
```

- [ ] **Step 9: Create the migration smoke test**

Create `packages/db/src/test/migrate.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { createTestDatabase, migrateTestDatabase } from "./pglite-harness";

describe("schema migrations", () => {
  test("apply cleanly on a fresh pglite database", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);

    const result = await db.execute(
      sql`SELECT typname FROM pg_type WHERE typname IN ('staff_role','order_status','payment_status','payment_method','stock_movement_type') ORDER BY typname`,
    );
    const enumNames = result.rows.map((r) => (r as { typname: string }).typname);
    expect(enumNames).toContain("order_status");
    expect(enumNames).toContain("staff_role");
  });
});
```

> **Note:** This test will start passing only after Task 5 generates the first migration. Until then, expect FAIL on "no migrations found" — that's the right red state for the next task.

- [ ] **Step 10: Run install + initial drizzle generate to produce the empty migrations dir**

```bash
bun install
mkdir -p packages/db/migrations
```

- [ ] **Step 11: Generate enum-only migration**

```bash
cd packages/db && bun run generate
```
Expected: a migration file `migrations/0000_*.sql` is produced containing the `CREATE TYPE` statements for the enums in `_enums.ts`.

- [ ] **Step 12: Run the migration smoke test**

```bash
cd packages/db && bun test
```
Expected: PASS — enum types exist after migration.

- [ ] **Step 13: Commit**

```bash
git add packages/db
git commit -m "feat(db): scaffold drizzle, enums, pglite test harness"
```

---

## Task 5: DB catalog schema (brands, categories, products, variants, images)

**Files:**
- Create: `packages/db/src/schema/brands.ts`
- Create: `packages/db/src/schema/categories.ts`
- Create: `packages/db/src/schema/products.ts`
- Create: `packages/db/src/schema/product-variants.ts`
- Create: `packages/db/src/schema/product-categories.ts`
- Create: `packages/db/src/schema/product-images.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/test/catalog.test.ts`

- [ ] **Step 1: Write the failing catalog schema test**

Create `packages/db/src/test/catalog.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { createTestDatabase, migrateTestDatabase } from "./pglite-harness";

describe("catalog schema", () => {
  test("creates brands, categories, products, variants, junction, images tables", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);

    const result = await db.execute(sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname='public' AND tablename IN
        ('brands','categories','products','product_variants','product_categories','product_images')
      ORDER BY tablename`);
    const tables = result.rows.map((r) => (r as { tablename: string }).tablename);

    expect(tables).toContain("brands");
    expect(tables).toContain("categories");
    expect(tables).toContain("products");
    expect(tables).toContain("product_variants");
    expect(tables).toContain("product_categories");
    expect(tables).toContain("product_images");
  });

  test("products has has_variants check constraint", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);

    const result = await db.execute(sql`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'products'::regclass AND contype = 'c'`);
    const checks = result.rows.map((r) => (r as { conname: string }).conname);
    expect(checks.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/db && bun test src/test/catalog.test.ts
```
Expected: FAIL — tables don't exist yet.

- [ ] **Step 3: Create `brands.ts`**

```ts
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    description: text("description"),
    websiteUrl: text("website_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("brands_name_idx").on(t.name)],
);

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
```

- [ ] **Step 4: Create `categories.ts`**

```ts
import { pgTable, uuid, text, timestamp, integer, index, type AnyPgColumn } from "drizzle-orm/pg-core";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    heroImageUrl: text("hero_image_url"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("categories_parent_idx").on(t.parentId)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
```

- [ ] **Step 5: Create `products.ts`**

```ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { brands } from "./brands";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    ingredients: text("ingredients"),
    usage: text("usage"),
    hasVariants: boolean("has_variants").notNull().default(false),
    sku: text("sku").unique(),
    priceTnd: numeric("price_tnd", { precision: 10, scale: 3 }),
    compareAtPriceTnd: numeric("compare_at_price_tnd", { precision: 10, scale: 3 }),
    weightG: integer("weight_g"),
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_brand_idx").on(t.brandId),
    index("products_category_idx").on(t.categoryId),
    index("products_published_idx").on(t.isPublished),
    check(
      "products_variant_or_flat_chk",
      sql`(${t.hasVariants} = true AND ${t.sku} IS NULL AND ${t.priceTnd} IS NULL)
       OR (${t.hasVariants} = false AND ${t.sku} IS NOT NULL AND ${t.priceTnd} IS NOT NULL)`,
    ),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

- [ ] **Step 6: Create `product-variants.ts`**

```ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { products } from "./products";

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    priceTnd: numeric("price_tnd", { precision: 10, scale: 3 }).notNull(),
    compareAtPriceTnd: numeric("compare_at_price_tnd", { precision: 10, scale: 3 }),
    weightG: integer("weight_g"),
    isDefault: boolean("is_default").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("product_variants_product_idx").on(t.productId)],
);

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
```

- [ ] **Step 7: Create `product-categories.ts`**

```ts
import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { products } from "./products";
import { categories } from "./categories";

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);
```

- [ ] **Step 8: Create `product-images.ts`**

```ts
import { pgTable, uuid, text, integer, boolean, index } from "drizzle-orm/pg-core";
import { products } from "./products";
import { productVariants } from "./product-variants";

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull(),
    altText: text("alt_text"),
    displayOrder: integer("display_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
```

- [ ] **Step 9: Update `packages/db/src/schema/index.ts`**

```ts
export * from "./_enums";
export * from "./brands";
export * from "./categories";
export * from "./products";
export * from "./product-variants";
export * from "./product-categories";
export * from "./product-images";
```

- [ ] **Step 10: Generate the migration**

```bash
cd packages/db && bun run generate
```
Expected: a new migration file in `migrations/` containing `CREATE TABLE` statements for all 6 tables, plus the check constraint and indexes.

- [ ] **Step 11: Run the catalog test**

```bash
cd packages/db && bun test src/test/catalog.test.ts
```
Expected: 2/2 PASS.

- [ ] **Step 12: Run all db tests**

```bash
cd packages/db && bun test
```
Expected: all green.

- [ ] **Step 13: Commit**

```bash
git add packages/db
git commit -m "feat(db): add catalog schema (brands, categories, products, variants, images)"
```

---

## Task 6: DB inventory schema + public stock view

**Files:**
- Create: `packages/db/src/schema/inventory.ts`
- Create: `packages/db/src/schema/stock-movements.ts`
- Create: `packages/db/migrations/custom/0001_inventory_public_view.sql`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/test/inventory.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/db/src/test/inventory.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { createTestDatabase, migrateTestDatabase } from "./pglite-harness";

describe("inventory schema", () => {
  test("creates inventory + stock_movements tables and inventory_public view", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);

    const tables = (
      await db.execute(
        sql`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('inventory','stock_movements')`,
      )
    ).rows.map((r) => (r as { tablename: string }).tablename);
    expect(tables).toContain("inventory");
    expect(tables).toContain("stock_movements");

    const views = (
      await db.execute(
        sql`SELECT viewname FROM pg_views WHERE schemaname='public' AND viewname='inventory_public'`,
      )
    ).rows;
    expect(views.length).toBe(1);
  });

  test("inventory_public view derives stock_status correctly", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);

    // seed a brand, category, product, then inventory rows
    await db.execute(sql`
      INSERT INTO brands (id, slug, name) VALUES ('11111111-1111-1111-1111-111111111111','test','Test');
      INSERT INTO categories (id, slug, name) VALUES ('22222222-2222-2222-2222-222222222222','c','Cat');
      INSERT INTO products (id, slug, name, brand_id, category_id, short_description, description, has_variants, sku, price_tnd)
        VALUES
          ('33333333-3333-3333-3333-333333333333','p1','Out',
           '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','x','x',false,'SKU-OUT', 1.000),
          ('44444444-4444-4444-4444-444444444444','p2','Low',
           '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','x','x',false,'SKU-LOW', 1.000),
          ('55555555-5555-5555-5555-555555555555','p3','InStock',
           '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','x','x',false,'SKU-OK',  1.000);
      INSERT INTO inventory (product_id, on_hand, reorder_point) VALUES
        ('33333333-3333-3333-3333-333333333333', 0, 5),
        ('44444444-4444-4444-4444-444444444444', 3, 5),
        ('55555555-5555-5555-5555-555555555555', 50, 5);
    `);

    const result = await db.execute(
      sql`SELECT product_id, stock_status FROM inventory_public ORDER BY stock_status`,
    );
    const statuses = result.rows.map((r) => (r as { stock_status: string }).stock_status);
    expect(statuses).toEqual(["in_stock", "low", "out"]);
  });
});
```

- [ ] **Step 2: Run the test (should fail)**

```bash
cd packages/db && bun test src/test/inventory.test.ts
```
Expected: FAIL — tables/view missing.

- [ ] **Step 3: Create `inventory.ts`**

```ts
import {
  pgTable,
  uuid,
  integer,
  timestamp,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "./products";
import { productVariants } from "./product-variants";

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    onHand: integer("on_hand").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    reorderPoint: integer("reorder_point").notNull().default(5),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("inventory_product_unique").on(t.productId),
    unique("inventory_variant_unique").on(t.variantId),
    check(
      "inventory_xor_chk",
      sql`(${t.productId} IS NOT NULL AND ${t.variantId} IS NULL)
       OR (${t.productId} IS NULL AND ${t.variantId} IS NOT NULL)`,
    ),
  ],
);

export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
```

- [ ] **Step 4: Create `stock-movements.ts`**

```ts
import { pgTable, uuid, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { products } from "./products";
import { productVariants } from "./product-variants";
import { stockMovementType } from "./_enums";

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    type: stockMovementType("type").notNull(),
    quantity: integer("quantity").notNull(),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    notes: text("notes"),
    performedBy: uuid("performed_by"),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("stock_movements_product_idx").on(t.productId, t.performedAt),
    index("stock_movements_variant_idx").on(t.variantId, t.performedAt),
  ],
);

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
```

- [ ] **Step 5: Update `packages/db/src/schema/index.ts`**

Append to existing file:

```ts
export * from "./inventory";
export * from "./stock-movements";
```

- [ ] **Step 6: Generate the table migration**

```bash
cd packages/db && bun run generate
```
Expected: a new migration file with `CREATE TABLE inventory` + `CREATE TABLE stock_movements`.

- [ ] **Step 7: Add the public view as a custom SQL migration**

Create `packages/db/migrations/custom/0001_inventory_public_view.sql`:

```sql
CREATE OR REPLACE VIEW inventory_public AS
SELECT
  product_id,
  variant_id,
  CASE
    WHEN on_hand <= 0 THEN 'out'
    WHEN on_hand <= reorder_point THEN 'low'
    ELSE 'in_stock'
  END AS stock_status
FROM inventory;
```

We append this view to the latest auto-generated migration so drizzle-kit picks it up. Append the file contents into the most-recent migration:

```bash
cat packages/db/migrations/custom/0001_inventory_public_view.sql >> "$(ls packages/db/migrations/0001_*.sql | head -1)"
```

> Why append rather than create a separate migration: drizzle-kit owns its `_journal.json` and only knows about generated files. Hand-edited migrations stay inline.

- [ ] **Step 8: Run inventory tests**

```bash
cd packages/db && bun test src/test/inventory.test.ts
```
Expected: 2/2 PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/db
git commit -m "feat(db): add inventory, stock_movements, inventory_public view"
```

---

## Task 7: DB customer schema (customers, addresses, newsletter)

**Files:**
- Create: `packages/db/src/schema/customers.ts`
- Create: `packages/db/src/schema/customer-addresses.ts`
- Create: `packages/db/src/schema/newsletter-subscribers.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/test/customers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/db/src/test/customers.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { createTestDatabase, migrateTestDatabase } from "./pglite-harness";

describe("customer schema", () => {
  test("creates customers, customer_addresses, newsletter_subscribers", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);
    const tables = (
      await db.execute(
        sql`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('customers','customer_addresses','newsletter_subscribers') ORDER BY tablename`,
      )
    ).rows.map((r) => (r as { tablename: string }).tablename);
    expect(tables).toEqual(["customer_addresses", "customers", "newsletter_subscribers"]);
  });
});
```

- [ ] **Step 2: Run test (fails)**

```bash
cd packages/db && bun test src/test/customers.test.ts
```

- [ ] **Step 3: Create `customers.ts`**

```ts
import { pgTable, uuid, text, boolean, timestamp, date } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  newsletterSubscribed: boolean("newsletter_subscribed").notNull().default(false),
  defaultShippingAddressId: uuid("default_shipping_address_id"),
  defaultBillingAddressId: uuid("default_billing_address_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
```

- [ ] **Step 4: Create `customer-addresses.ts`**

```ts
import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    street: text("street").notNull(),
    city: text("city").notNull(),
    postalCode: text("postal_code").notNull(),
    governorate: text("governorate").notNull(),
    country: text("country").notNull().default("TN"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("customer_addresses_customer_idx").on(t.customerId)],
);

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type NewCustomerAddress = typeof customerAddresses.$inferInsert;
```

- [ ] **Step 5: Create `newsletter-subscribers.ts`**

```ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  source: text("source"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;
```

- [ ] **Step 6: Update `packages/db/src/schema/index.ts`**

Append:

```ts
export * from "./customers";
export * from "./customer-addresses";
export * from "./newsletter-subscribers";
```

- [ ] **Step 7: Generate migration**

```bash
cd packages/db && bun run generate
```

- [ ] **Step 8: Run customer tests**

```bash
cd packages/db && bun test src/test/customers.test.ts
```
Expected: 1/1 PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/db
git commit -m "feat(db): add customers, addresses, newsletter subscribers"
```

---

## Task 8: DB orders schema

**Files:**
- Create: `packages/db/src/schema/orders.ts`
- Create: `packages/db/src/schema/order-items.ts`
- Create: `packages/db/src/schema/order-events.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/test/orders.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/db/src/test/orders.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { createTestDatabase, migrateTestDatabase } from "./pglite-harness";

describe("orders schema", () => {
  test("creates orders, order_items, order_events tables", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);
    const tables = (
      await db.execute(
        sql`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('orders','order_items','order_events') ORDER BY tablename`,
      )
    ).rows.map((r) => (r as { tablename: string }).tablename);
    expect(tables).toEqual(["order_events", "order_items", "orders"]);
  });
});
```

- [ ] **Step 2: Run test (fails)**

```bash
cd packages/db && bun test src/test/orders.test.ts
```

- [ ] **Step 3: Create `orders.ts`**

```ts
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { orderStatus, paymentStatus, paymentMethod } from "./_enums";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),

    shippingFullName: text("shipping_full_name").notNull(),
    shippingPhone: text("shipping_phone").notNull(),
    shippingStreet: text("shipping_street").notNull(),
    shippingCity: text("shipping_city").notNull(),
    shippingPostalCode: text("shipping_postal_code").notNull(),
    shippingGovernorate: text("shipping_governorate").notNull(),
    shippingCountry: text("shipping_country").notNull().default("TN"),

    subtotalTnd: numeric("subtotal_tnd", { precision: 10, scale: 3 }).notNull(),
    shippingTnd: numeric("shipping_tnd", { precision: 10, scale: 3 }).notNull().default("0"),
    discountTnd: numeric("discount_tnd", { precision: 10, scale: 3 }).notNull().default("0"),
    taxTnd: numeric("tax_tnd", { precision: 10, scale: 3 }).notNull().default("0"),
    totalTnd: numeric("total_tnd", { precision: 10, scale: 3 }).notNull(),

    status: orderStatus("status").notNull().default("pending"),
    paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
    paymentMethod: paymentMethod("payment_method"),

    notesCustomer: text("notes_customer"),
    notesInternal: text("notes_internal"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    index("orders_customer_idx").on(t.customerId, t.createdAt),
    index("orders_status_idx").on(t.status, t.createdAt),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
```

- [ ] **Step 4: Create `order-items.ts`**

```ts
import { pgTable, uuid, text, numeric, integer, index } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { products } from "./products";
import { productVariants } from "./product-variants";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "restrict" }),

    productNameSnapshot: text("product_name_snapshot").notNull(),
    variantNameSnapshot: text("variant_name_snapshot"),
    brandSnapshot: text("brand_snapshot").notNull(),
    skuSnapshot: text("sku_snapshot").notNull(),

    unitPriceTnd: numeric("unit_price_tnd", { precision: 10, scale: 3 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalTnd: numeric("line_total_tnd", { precision: 10, scale: 3 }).notNull(),
  },
  (t) => [
    index("order_items_product_idx").on(t.productId),
    index("order_items_variant_idx").on(t.variantId),
  ],
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
```

- [ ] **Step 5: Create `order-events.ts`**

```ts
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { orderStatus } from "./_enums";

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status"),
    notes: text("notes"),
    performedBy: uuid("performed_by"),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId, t.performedAt)],
);

export type OrderEvent = typeof orderEvents.$inferSelect;
export type NewOrderEvent = typeof orderEvents.$inferInsert;
```

- [ ] **Step 6: Update `packages/db/src/schema/index.ts`**

Append:

```ts
export * from "./orders";
export * from "./order-items";
export * from "./order-events";
```

- [ ] **Step 7: Generate migration + run tests**

```bash
cd packages/db && bun run generate && bun test src/test/orders.test.ts
```
Expected: 1/1 PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/db
git commit -m "feat(db): add orders, order_items, order_events"
```

---

## Task 9: DB staff, audit, cart schemas

**Files:**
- Create: `packages/db/src/schema/staff-users.ts`
- Create: `packages/db/src/schema/audit-log.ts`
- Create: `packages/db/src/schema/carts.ts`
- Create: `packages/db/src/schema/cart-items.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/test/staff-cart.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/db/src/test/staff-cart.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { createTestDatabase, migrateTestDatabase } from "./pglite-harness";

describe("staff + cart schema", () => {
  test("creates staff_users, audit_log, carts, cart_items", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);
    const tables = (
      await db.execute(
        sql`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('staff_users','audit_log','carts','cart_items') ORDER BY tablename`,
      )
    ).rows.map((r) => (r as { tablename: string }).tablename);
    expect(tables).toEqual(["audit_log", "cart_items", "carts", "staff_users"]);
  });

  test("staff_users has role enum", async () => {
    const { db } = await createTestDatabase();
    await migrateTestDatabase(db);
    const result = await db.execute(sql`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'staff_role'
      ORDER BY enumsortorder`);
    const labels = result.rows.map((r) => (r as { enumlabel: string }).enumlabel);
    expect(labels).toEqual(["admin", "manager", "cashier", "stock"]);
  });
});
```

- [ ] **Step 2: Run test (fails)**

```bash
cd packages/db && bun test src/test/staff-cart.test.ts
```

- [ ] **Step 3: Create `staff-users.ts`**

```ts
import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { staffRole } from "./_enums";

export const staffUsers = pgTable("staff_users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: staffRole("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export type StaffUser = typeof staffUsers.$inferSelect;
export type NewStaffUser = typeof staffUsers.$inferInsert;
```

- [ ] **Step 4: Create `audit-log.ts`**

```ts
import { pgTable, uuid, text, timestamp, jsonb, bigserial, index } from "drizzle-orm/pg-core";
import { staffUsers } from "./staff-users";

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    staffUserId: uuid("staff_user_id").references(() => staffUsers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    diff: jsonb("diff"),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_entity_idx").on(t.entityType, t.entityId, t.performedAt)],
);

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
```

- [ ] **Step 5: Create `carts.ts`**

```ts
import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("carts_customer_unique").on(t.customerId),
    unique("carts_session_unique").on(t.sessionId),
  ],
);

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
```

- [ ] **Step 6: Create `cart-items.ts`**

Drizzle's `primaryKey({columns})` only accepts column references (no SQL expressions). To enforce uniqueness across (cart, product, variant) where `variant_id` may be NULL, we use a synthetic surrogate `id` PK plus two partial unique indexes — one for variant-less rows, one for variant-bearing rows. The partial indexes are appended as a custom SQL block to the auto-generated migration.

```ts
import { pgTable, uuid, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { carts } from "./carts";
import { products } from "./products";
import { productVariants } from "./product-variants";

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Drizzle-supported full unique on (cartId, productId, variantId). The partial
    // indexes for the NULL case are added in a custom SQL block below.
    uniqueIndex("cart_items_full_unique").on(t.cartId, t.productId, t.variantId),
  ],
);

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
```

After running `bun run generate`, append the partial-NULL unique index to the latest migration file:

```sql
-- partial unique: enforce one row per (cart, product) when variant is absent
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_unique_no_variant
  ON cart_items (cart_id, product_id) WHERE variant_id IS NULL;
```

```bash
echo '
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_unique_no_variant
  ON cart_items (cart_id, product_id) WHERE variant_id IS NULL;
' >> "$(ls -t packages/db/migrations/0*.sql | head -1)"
```

- [ ] **Step 7: Update `packages/db/src/schema/index.ts`**

Append:

```ts
export * from "./staff-users";
export * from "./audit-log";
export * from "./carts";
export * from "./cart-items";
```

- [ ] **Step 8: Generate migration + run tests**

```bash
cd packages/db && bun run generate && bun test src/test/staff-cart.test.ts
```
Expected: 2/2 PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/db
git commit -m "feat(db): add staff_users, audit_log, carts, cart_items"
```

---

## Task 10: RLS policies (Supabase-only migration)

RLS policies use Supabase's `auth.uid()` and JWT claims. We keep them in a **separate** SQL file that is applied to Supabase but skipped by the pglite test harness, so schema tests stay isolated from auth concerns.

**Files:**
- Create: `packages/db/sql/rls.sql`
- Create: `packages/db/src/migrate.ts`

- [ ] **Step 1: Create `packages/db/sql/rls.sql`**

```sql
-- ============================================================
-- Row-Level Security policies for Jasmin Médical Store
-- Applied AFTER drizzle-kit migrations, only against Supabase.
-- ============================================================

-- Enable RLS on every domain table.
ALTER TABLE brands                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items              ENABLE ROW LEVEL SECURITY;

-- Helper: is the current auth user a staff member with role X?
CREATE OR REPLACE FUNCTION is_staff(required_roles staff_role[])
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_users
    WHERE id = auth.uid() AND is_active = true AND role = ANY(required_roles)
  );
$$;

-- ============================================================
-- PUBLIC READ (anon)
-- ============================================================
CREATE POLICY brands_public_read ON brands
  FOR SELECT USING (true);

CREATE POLICY categories_public_read ON categories
  FOR SELECT USING (true);

CREATE POLICY products_public_read ON products
  FOR SELECT USING (is_published = true OR is_staff(ARRAY['admin','manager','cashier','stock']::staff_role[]));

CREATE POLICY product_variants_public_read ON product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_variants.product_id AND (p.is_published = true OR is_staff(ARRAY['admin','manager','cashier','stock']::staff_role[])))
  );

CREATE POLICY product_categories_public_read ON product_categories
  FOR SELECT USING (true);

CREATE POLICY product_images_public_read ON product_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND (p.is_published = true OR is_staff(ARRAY['admin','manager','cashier','stock']::staff_role[])))
  );

-- inventory_public is a view; views inherit base-table policies.
-- We DENY public SELECT on the base inventory table by NOT creating any public policy for it.
-- We grant explicit SELECT to authenticated/anon on the VIEW only:
GRANT SELECT ON inventory_public TO anon, authenticated;

-- Newsletter signup is open to everyone.
CREATE POLICY newsletter_public_insert ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- CUSTOMER (authenticated, exists in customers)
-- ============================================================
CREATE POLICY customers_self_read ON customers
  FOR SELECT USING (id = auth.uid());

CREATE POLICY customers_self_update ON customers
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY customers_self_insert ON customers
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY customer_addresses_self ON customer_addresses
  FOR ALL USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

CREATE POLICY orders_self_read ON orders
  FOR SELECT USING (customer_id = auth.uid() OR is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

CREATE POLICY order_items_self_read ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id
            AND (o.customer_id = auth.uid() OR is_staff(ARRAY['admin','manager','cashier']::staff_role[])))
  );

CREATE POLICY order_events_self_read ON order_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_events.order_id
            AND (o.customer_id = auth.uid() OR is_staff(ARRAY['admin','manager','cashier']::staff_role[])))
  );

CREATE POLICY carts_self ON carts
  FOR ALL USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

CREATE POLICY cart_items_self ON cart_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.customer_id = auth.uid())
  );

-- ============================================================
-- STAFF (authenticated, exists in staff_users)
-- ============================================================
-- admin: full read/write everywhere
CREATE POLICY brands_staff_admin_write ON brands
  FOR ALL USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

CREATE POLICY categories_staff_write ON categories
  FOR ALL USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

-- Products: admin/manager full write; stock can write non-monetary fields (enforced in app layer)
CREATE POLICY products_staff_write ON products
  FOR ALL USING (is_staff(ARRAY['admin','manager','stock']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','stock']::staff_role[]));

CREATE POLICY product_variants_staff_write ON product_variants
  FOR ALL USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

CREATE POLICY product_categories_staff_write ON product_categories
  FOR ALL USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

CREATE POLICY product_images_staff_write ON product_images
  FOR ALL USING (is_staff(ARRAY['admin','manager','stock']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','stock']::staff_role[]));

-- Inventory: admin/manager/stock full write; base table not public (no anon policy = denied)
CREATE POLICY inventory_staff_full ON inventory
  FOR ALL USING (is_staff(ARRAY['admin','manager','stock']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','stock']::staff_role[]));

CREATE POLICY stock_movements_staff_full ON stock_movements
  FOR ALL USING (is_staff(ARRAY['admin','manager','stock']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','stock']::staff_role[]));

-- Customers: admin/manager read; cashier read for POS lookups
CREATE POLICY customers_staff_read ON customers
  FOR SELECT USING (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

CREATE POLICY customers_staff_write ON customers
  FOR INSERT WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));
CREATE POLICY customers_staff_update ON customers
  FOR UPDATE USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

-- Orders: cashier insert (POS); admin/manager full
CREATE POLICY orders_staff_insert ON orders
  FOR INSERT WITH CHECK (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));
CREATE POLICY orders_staff_update ON orders
  FOR UPDATE USING (is_staff(ARRAY['admin','manager','cashier']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

CREATE POLICY order_items_staff ON order_items
  FOR ALL USING (is_staff(ARRAY['admin','manager','cashier']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

CREATE POLICY order_events_staff ON order_events
  FOR ALL USING (is_staff(ARRAY['admin','manager','cashier']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

-- staff_users: only admin can manage
CREATE POLICY staff_users_self_read ON staff_users
  FOR SELECT USING (id = auth.uid() OR is_staff(ARRAY['admin']::staff_role[]));
CREATE POLICY staff_users_admin_write ON staff_users
  FOR INSERT WITH CHECK (is_staff(ARRAY['admin']::staff_role[]));
CREATE POLICY staff_users_admin_update ON staff_users
  FOR UPDATE USING (is_staff(ARRAY['admin']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin']::staff_role[]));

-- Audit log: admin read-only (writes via service role only)
CREATE POLICY audit_log_admin_read ON audit_log
  FOR SELECT USING (is_staff(ARRAY['admin']::staff_role[]));
```

- [ ] **Step 2: Create the unified migrate runner**

Create `packages/db/src/migrate.ts`:

```ts
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });
const db = drizzle(sql);

const migrationsFolder = path.resolve(import.meta.dir, "../migrations");
const rlsPath = path.resolve(import.meta.dir, "../sql/rls.sql");

console.log("→ running drizzle migrations…");
await migrate(db, { migrationsFolder });

console.log("→ applying RLS policies…");
const rlsSql = await readFile(rlsPath, "utf8");
await sql.unsafe(rlsSql);

await sql.end();
console.log("✓ migrate complete");
```

- [ ] **Step 3: Verify the runner against an EMPTY dev Supabase project**

(Manual: ensure `SUPABASE_DB_URL` is set in `.env.local`, then run.)

```bash
cd packages/db && bun run migrate
```
Expected output: `✓ migrate complete`. Re-running is idempotent — drizzle skips applied migrations and the RLS DDL is `CREATE POLICY` only. To make RLS idempotent across re-runs we'll wrap policies later, but for first run this is fine.

- [ ] **Step 4: Commit**

```bash
git add packages/db
git commit -m "feat(db): add RLS policies + unified migrate runner"
```

---

## Task 11: Zod schemas in `packages/lib/schemas/`

Mirror the Drizzle types as Zod schemas usable from server actions, forms, and API routes.

**Files:**
- Create: `packages/lib/src/schemas/index.ts`
- Create: `packages/lib/src/schemas/product.ts`
- Create: `packages/lib/src/schemas/order.ts`
- Create: `packages/lib/src/schemas/customer.ts`
- Create: `packages/lib/src/schemas/staff.ts`
- Create: `packages/lib/src/schemas/product.test.ts`

- [ ] **Step 1: Write failing test for product schema**

Create `packages/lib/src/schemas/product.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { ProductInsertSchema } from "./product";

describe("ProductInsertSchema", () => {
  test("accepts a valid flat product", () => {
    const result = ProductInsertSchema.safeParse({
      slug: "svr-sebiaclear",
      name: "SVR Sebiaclear Crème",
      brandId: "11111111-1111-1111-1111-111111111111",
      categoryId: "22222222-2222-2222-2222-222222222222",
      shortDescription: "x",
      description: "x",
      hasVariants: false,
      sku: "SVR-SC-001",
      priceTnd: "32.900",
    });
    expect(result.success).toBe(true);
  });

  test("rejects flat product missing sku", () => {
    const result = ProductInsertSchema.safeParse({
      slug: "x",
      name: "x",
      brandId: "11111111-1111-1111-1111-111111111111",
      categoryId: "22222222-2222-2222-2222-222222222222",
      shortDescription: "x",
      description: "x",
      hasVariants: false,
      priceTnd: "1.000",
    });
    expect(result.success).toBe(false);
  });

  test("rejects variant product with sku/price set", () => {
    const result = ProductInsertSchema.safeParse({
      slug: "x",
      name: "x",
      brandId: "11111111-1111-1111-1111-111111111111",
      categoryId: "22222222-2222-2222-2222-222222222222",
      shortDescription: "x",
      description: "x",
      hasVariants: true,
      sku: "SHOULD-NOT-BE-HERE",
      priceTnd: "1.000",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test (fails)**

```bash
cd packages/lib && bun test src/schemas/product.test.ts
```

- [ ] **Step 3: Create `product.ts` Zod schema**

```ts
import { z } from "zod";

const uuid = z.string().uuid();
const tndAmount = z.string().regex(/^\d+\.\d{3}$/, "TND amount must be string with 3 decimals (millimes)");

export const ProductInsertSchema = z
  .object({
    slug: z.string().min(1).max(160),
    name: z.string().min(1).max(200),
    brandId: uuid,
    categoryId: uuid,
    shortDescription: z.string().min(1).max(500),
    description: z.string().min(1),
    ingredients: z.string().optional().nullable(),
    usage: z.string().optional().nullable(),
    hasVariants: z.boolean(),
    sku: z.string().min(1).max(64).optional().nullable(),
    priceTnd: tndAmount.optional().nullable(),
    compareAtPriceTnd: tndAmount.optional().nullable(),
    weightG: z.number().int().nonnegative().optional().nullable(),
    isPublished: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    metaTitle: z.string().max(200).optional().nullable(),
    metaDescription: z.string().max(500).optional().nullable(),
  })
  .refine(
    (p) =>
      (p.hasVariants && !p.sku && !p.priceTnd) ||
      (!p.hasVariants && !!p.sku && !!p.priceTnd),
    { message: "When hasVariants=false sku+priceTnd required; when true they must be omitted" },
  );

export type ProductInsert = z.infer<typeof ProductInsertSchema>;
```

- [ ] **Step 4: Run test (passes)**

```bash
cd packages/lib && bun test src/schemas/product.test.ts
```
Expected: 3/3 PASS.

- [ ] **Step 5: Create `order.ts` schema**

```ts
import { z } from "zod";

const uuid = z.string().uuid();
const tndAmount = z.string().regex(/^\d+\.\d{3}$/);
const tunisianPhone = z.string().regex(/^(\+216)?\s?\d{2}\s?\d{3}\s?\d{3}$/, "Numéro de téléphone invalide");

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: tunisianPhone,
  street: z.string().min(3).max(200),
  city: z.string().min(1).max(80),
  postalCode: z.string().min(4).max(10),
  governorate: z.string().min(1).max(80),
  country: z.string().default("TN"),
});
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

export const OrderItemDraftSchema = z.object({
  productId: uuid,
  variantId: uuid.optional().nullable(),
  quantity: z.number().int().positive(),
});
export type OrderItemDraft = z.infer<typeof OrderItemDraftSchema>;

export const CheckoutSchema = z.object({
  customerId: uuid.optional().nullable(),
  guestEmail: z.string().email().optional().nullable(),
  guestPhone: tunisianPhone.optional().nullable(),
  shipping: ShippingAddressSchema,
  items: z.array(OrderItemDraftSchema).min(1),
  paymentMethod: z.enum(["cash_on_delivery", "card_konnect", "card_clic_to_pay", "bank_transfer"]),
  notesCustomer: z.string().max(500).optional().nullable(),
}).refine((c) => !!c.customerId || (!!c.guestEmail && !!c.guestPhone), {
  message: "Guest checkout requires both email and phone",
});
export type Checkout = z.infer<typeof CheckoutSchema>;

export const OrderTotalsSchema = z.object({
  subtotalTnd: tndAmount,
  shippingTnd: tndAmount,
  discountTnd: tndAmount,
  taxTnd: tndAmount,
  totalTnd: tndAmount,
});
export type OrderTotals = z.infer<typeof OrderTotalsSchema>;
```

- [ ] **Step 6: Create `customer.ts` schema**

```ts
import { z } from "zod";

export const CustomerProfileSchema = z.object({
  fullName: z.string().min(1).max(120).nullable().optional(),
  phone: z.string().min(8).max(20).nullable().optional(),
  dateOfBirth: z.string().date().nullable().optional(),
  marketingConsent: z.boolean().default(false),
  newsletterSubscribed: z.boolean().default(false),
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

export const NewsletterSubscribeSchema = z.object({
  email: z.string().email(),
  source: z.enum(["footer", "popup", "checkout", "landing_hero"]).optional(),
});
export type NewsletterSubscribe = z.infer<typeof NewsletterSubscribeSchema>;
```

- [ ] **Step 7: Create `staff.ts` schema**

```ts
import { z } from "zod";

export const StaffRoleSchema = z.enum(["admin", "manager", "cashier", "stock"]);
export type StaffRole = z.infer<typeof StaffRoleSchema>;

export const StaffInviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  role: StaffRoleSchema,
});
export type StaffInvite = z.infer<typeof StaffInviteSchema>;
```

- [ ] **Step 8: Create `index.ts`**

```ts
export * from "./product";
export * from "./order";
export * from "./customer";
export * from "./staff";
```

- [ ] **Step 9: Run all lib tests + typecheck**

```bash
cd packages/lib && bun test && bun run typecheck
```
Expected: green.

- [ ] **Step 10: Commit**

```bash
git add packages/lib
git commit -m "feat(lib): add zod schemas for product, order, customer, staff"
```

---

## Task 12: Realistic seed data (CEO-demo data)

**Files:**
- Create: `packages/db/src/seed/index.ts`
- Create: `packages/db/src/seed/data/brands.ts`
- Create: `packages/db/src/seed/data/categories.ts`
- Create: `packages/db/src/seed/data/products.ts`
- Create: `packages/db/src/seed/data/customers.ts`
- Create: `packages/db/src/seed/data/orders.ts`
- Create: `packages/db/src/seed/data/staff.ts`
- Create: `packages/db/src/seed/idempotent.ts`

The seed script is idempotent — running twice yields the same state. We achieve this via `INSERT ... ON CONFLICT (slug) DO UPDATE` for catalog rows and explicit UUID seeds for stable IDs across runs.

- [ ] **Step 1: Create `packages/db/src/seed/idempotent.ts`**

```ts
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { Database } from "../client";

export async function upsert<T extends Record<string, unknown>>(
  db: Database,
  table: PgTableWithColumns<any>,
  rows: T[],
  conflictColumn: keyof T,
) {
  if (rows.length === 0) return;
  await db
    .insert(table)
    .values(rows as any)
    .onConflictDoUpdate({
      target: (table as any)[conflictColumn as string],
      set: Object.fromEntries(
        Object.keys(rows[0] as object)
          .filter((k) => k !== conflictColumn)
          .map((k) => [k, sql.raw(`EXCLUDED.${(table as any)[k].name}`)]),
      ),
    });
}
```

- [ ] **Step 2: Create `data/brands.ts`**

```ts
export const BRAND_SEED = [
  {
    id: "b0000000-0000-4000-8000-000000000001",
    slug: "svr",
    name: "SVR",
    description: "Laboratoire dermatologique français — soins ciblés pour peaux exigeantes.",
    websiteUrl: "https://www.labo-svr.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000002",
    slug: "avene",
    name: "Avène",
    description: "Eaux thermales et soins apaisants pour peaux sensibles.",
    websiteUrl: "https://www.eau-thermale-avene.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000003",
    slug: "la-roche-posay",
    name: "La Roche-Posay",
    description: "Dermo-cosmétique recommandée par les dermatologues.",
    websiteUrl: "https://www.laroche-posay.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000004",
    slug: "vichy",
    name: "Vichy",
    description: "Soins enrichis à l'eau volcanique de Vichy.",
    websiteUrl: "https://www.vichy.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000005",
    slug: "bioderma",
    name: "Bioderma",
    description: "Biologie au service de la dermatologie.",
    websiteUrl: "https://www.bioderma.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000006",
    slug: "nuxe",
    name: "Nuxe",
    description: "Cosmétiques naturelles et sensorielles.",
    websiteUrl: "https://www.nuxe.com",
  },
];
```

- [ ] **Step 3: Create `data/categories.ts`**

```ts
export const CATEGORY_SEED = [
  // top-level
  { id: "c0000000-0000-4000-8000-000000000001", slug: "cosmetique", name: "Cosmétique", description: "Soins du visage, du corps et des cheveux.", parentId: null, displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000002", slug: "orthopedie", name: "Orthopédie", description: "Maintien, soutien et confort articulaire.", parentId: null, displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000003", slug: "materiel-medical", name: "Matériel médical", description: "Tension, diabète, aérosols, mobilité.", parentId: null, displayOrder: 3 },
  { id: "c0000000-0000-4000-8000-000000000004", slug: "parapharmacie", name: "Parapharmacie générale", description: "Hygiène, premiers soins, compléments.", parentId: null, displayOrder: 4 },

  // cosmétique sub
  { id: "c0000000-0000-4000-8000-000000000011", slug: "visage", name: "Visage", parentId: "c0000000-0000-4000-8000-000000000001", description: "Soins du visage.", displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000012", slug: "corps", name: "Corps", parentId: "c0000000-0000-4000-8000-000000000001", description: "Soins du corps.", displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000013", slug: "cheveux", name: "Cheveux", parentId: "c0000000-0000-4000-8000-000000000001", description: "Soins capillaires.", displayOrder: 3 },
  { id: "c0000000-0000-4000-8000-000000000014", slug: "solaire", name: "Solaire", parentId: "c0000000-0000-4000-8000-000000000001", description: "Protection solaire.", displayOrder: 4 },

  // orthopédie sub
  { id: "c0000000-0000-4000-8000-000000000021", slug: "lombaire", name: "Soutien lombaire", parentId: "c0000000-0000-4000-8000-000000000002", description: "Ceintures et orthèses lombaires.", displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000022", slug: "genou", name: "Genou", parentId: "c0000000-0000-4000-8000-000000000002", description: "Genouillères et orthèses.", displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000023", slug: "cheville", name: "Cheville", parentId: "c0000000-0000-4000-8000-000000000002", description: "Chevillères.", displayOrder: 3 },
  { id: "c0000000-0000-4000-8000-000000000024", slug: "aides-marche", name: "Aides à la marche", parentId: "c0000000-0000-4000-8000-000000000002", description: "Cannes, béquilles, déambulateurs.", displayOrder: 4 },

  // matériel médical sub
  { id: "c0000000-0000-4000-8000-000000000031", slug: "tension", name: "Tension artérielle", parentId: "c0000000-0000-4000-8000-000000000003", description: "Tensiomètres et accessoires.", displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000032", slug: "diabete", name: "Diabète", parentId: "c0000000-0000-4000-8000-000000000003", description: "Lecteurs et bandelettes.", displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000033", slug: "aerosol", name: "Aérosolthérapie", parentId: "c0000000-0000-4000-8000-000000000003", description: "Aérosols et nébuliseurs.", displayOrder: 3 },
  { id: "c0000000-0000-4000-8000-000000000034", slug: "fauteuils", name: "Fauteuils roulants", parentId: "c0000000-0000-4000-8000-000000000003", description: "Mobilité et autonomie.", displayOrder: 4 },

  // parapharmacie sub
  { id: "c0000000-0000-4000-8000-000000000041", slug: "bebe", name: "Bébé", parentId: "c0000000-0000-4000-8000-000000000004", description: "Soins bébé et puériculture.", displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000042", slug: "premiers-soins", name: "Premiers soins", parentId: "c0000000-0000-4000-8000-000000000004", description: "Pansements, antiseptiques.", displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000043", slug: "complements", name: "Compléments alimentaires", parentId: "c0000000-0000-4000-8000-000000000004", description: "Vitamines, énergie, sommeil.", displayOrder: 3 },
];
```

- [ ] **Step 4: Create `data/products.ts`**

```ts
export interface SeedVariant {
  sku: string;
  name: string;
  priceTnd: string;
  isDefault?: boolean;
}

export interface SeedProduct {
  id: string;
  slug: string;
  name: string;
  brandSlug: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  ingredients?: string;
  usage?: string;
  hasVariants: boolean;
  sku?: string;
  priceTnd?: string;
  variants?: SeedVariant[];
  reorderPoint: number;
  initialStock: number;
}

const cosVisage = "visage";
const cosCorps = "corps";
const cosSolaire = "solaire";

export const PRODUCT_SEED: SeedProduct[] = [
  // ──────────────── SVR ────────────────
  { id: "70000000-0000-4000-8000-000000000001", slug: "svr-sebiaclear-creme",
    name: "SVR Sebiaclear Crème Anti-Imperfections 40ml", brandSlug: "svr", categorySlug: cosVisage,
    shortDescription: "Crème ciblée anti-imperfections pour peaux mixtes à grasses.",
    description: "Sebiaclear Crème associe AHA et niacinamide pour réduire visiblement les imperfections en respectant l'équilibre cutané.",
    hasVariants: false, sku: "SVR-SC-40", priceTnd: "32.900", reorderPoint: 6, initialStock: 24 },

  { id: "70000000-0000-4000-8000-000000000002", slug: "svr-sebiaclear-gel-moussant",
    name: "SVR Sebiaclear Gel Moussant 200ml", brandSlug: "svr", categorySlug: cosVisage,
    shortDescription: "Nettoyant moussant purifiant.",
    description: "Élimine excès de sébum et impuretés sans dessécher la peau.",
    hasVariants: false, sku: "SVR-SCG-200", priceTnd: "29.500", reorderPoint: 6, initialStock: 30 },

  { id: "70000000-0000-4000-8000-000000000003", slug: "svr-sun-secure-spf50",
    name: "SVR Sun Secure SPF50+", brandSlug: "svr", categorySlug: cosSolaire,
    shortDescription: "Haute protection solaire, finition invisible.",
    description: "Protection très haute UVA/UVB, photo-stable, résistante à l'eau.",
    hasVariants: true, reorderPoint: 4,
    variants: [
      { sku: "SVR-SUN-CR-50", name: "Crème 50ml", priceTnd: "47.000", isDefault: true },
      { sku: "SVR-SUN-LT-200", name: "Lait 200ml", priceTnd: "59.000" },
      { sku: "SVR-SUN-BR-200", name: "Brume 200ml", priceTnd: "55.000" },
    ], initialStock: 12 },

  { id: "70000000-0000-4000-8000-000000000004", slug: "svr-densitium-creme",
    name: "SVR Densitium Crème", brandSlug: "svr", categorySlug: cosVisage,
    shortDescription: "Soin global anti-âge densifiant.",
    description: "Restructure et redensifie la peau dès 50 ans.",
    hasVariants: false, sku: "SVR-DEN-50", priceTnd: "65.000", reorderPoint: 4, initialStock: 14 },

  // ──────────────── Avène ────────────────
  { id: "70000000-0000-4000-8000-000000000010", slug: "avene-cleanance-gel",
    name: "Avène Cleanance Gel Nettoyant", brandSlug: "avene", categorySlug: cosVisage,
    shortDescription: "Gel doux purifiant pour peaux à imperfections.",
    description: "Nettoie en douceur sans agresser, base lavante sans savon.",
    hasVariants: true, reorderPoint: 6,
    variants: [
      { sku: "AVE-CLG-200", name: "200ml", priceTnd: "26.500", isDefault: true },
      { sku: "AVE-CLG-400", name: "400ml", priceTnd: "42.000" },
    ], initialStock: 30 },

  { id: "70000000-0000-4000-8000-000000000011", slug: "avene-eau-thermale",
    name: "Avène Eau Thermale en spray", brandSlug: "avene", categorySlug: cosVisage,
    shortDescription: "Apaise, adoucit, calme la peau.",
    description: "Eau thermale d'Avène, riche en silicates et oligo-éléments.",
    hasVariants: true, reorderPoint: 8,
    variants: [
      { sku: "AVE-EAU-50", name: "50ml", priceTnd: "9.500", isDefault: false },
      { sku: "AVE-EAU-150", name: "150ml", priceTnd: "21.000", isDefault: true },
      { sku: "AVE-EAU-300", name: "300ml", priceTnd: "32.000" },
    ], initialStock: 50 },

  { id: "70000000-0000-4000-8000-000000000012", slug: "avene-hydrance-creme",
    name: "Avène Hydrance Crème Hydratante 40ml", brandSlug: "avene", categorySlug: cosVisage,
    shortDescription: "Hydratation 24h pour peaux sensibles.",
    description: "Riche, fondante, restaure la barrière cutanée.",
    hasVariants: false, sku: "AVE-HYD-40", priceTnd: "38.500", reorderPoint: 5, initialStock: 18 },

  // ──────────────── La Roche-Posay ────────────────
  { id: "70000000-0000-4000-8000-000000000020", slug: "lrp-effaclar-duo",
    name: "La Roche-Posay Effaclar Duo+M 40ml", brandSlug: "la-roche-posay", categorySlug: cosVisage,
    shortDescription: "Soin anti-imperfections correcteur ciblé.",
    description: "Réduit boutons, marques et points noirs.",
    hasVariants: false, sku: "LRP-EFF-40", priceTnd: "42.000", reorderPoint: 6, initialStock: 22 },

  { id: "70000000-0000-4000-8000-000000000021", slug: "lrp-anthelios-spf50",
    name: "La Roche-Posay Anthelios SPF50+", brandSlug: "la-roche-posay", categorySlug: cosSolaire,
    shortDescription: "Très haute protection visage, ultra-fluide.",
    description: "Protège des UVA longs, UVB et de la lumière bleue.",
    hasVariants: true, reorderPoint: 4,
    variants: [
      { sku: "LRP-ANT-CR-50", name: "Crème 50ml", priceTnd: "55.000", isDefault: true },
      { sku: "LRP-ANT-FL-50", name: "Fluide 50ml", priceTnd: "55.000" },
    ], initialStock: 14 },

  { id: "70000000-0000-4000-8000-000000000022", slug: "lrp-cicaplast-baume",
    name: "La Roche-Posay Cicaplast Baume B5+", brandSlug: "la-roche-posay", categorySlug: cosCorps,
    shortDescription: "Baume réparateur multi-usage.",
    description: "Apaise, répare, hydrate les peaux fragilisées.",
    hasVariants: false, sku: "LRP-CIC-40", priceTnd: "27.500", reorderPoint: 6, initialStock: 25 },

  // ──────────────── Vichy ────────────────
  { id: "70000000-0000-4000-8000-000000000030", slug: "vichy-mineral-89",
    name: "Vichy Minéral 89 Booster Quotidien 50ml", brandSlug: "vichy", categorySlug: cosVisage,
    shortDescription: "Concentré fortifiant à l'acide hyaluronique.",
    description: "Renforce et repulpe la peau en 1 minute.",
    hasVariants: false, sku: "VIC-M89-50", priceTnd: "74.000", reorderPoint: 4, initialStock: 16 },

  { id: "70000000-0000-4000-8000-000000000031", slug: "vichy-liftactiv-serum",
    name: "Vichy Liftactiv Sérum Anti-Rides 30ml", brandSlug: "vichy", categorySlug: cosVisage,
    shortDescription: "Sérum à effet liftant immédiat.",
    description: "Acide hyaluronique fragmenté + complexe rhamnose.",
    hasVariants: false, sku: "VIC-LIF-30", priceTnd: "92.000", reorderPoint: 3, initialStock: 10 },

  { id: "70000000-0000-4000-8000-000000000032", slug: "vichy-capital-soleil",
    name: "Vichy Capital Soleil SPF50+", brandSlug: "vichy", categorySlug: cosSolaire,
    shortDescription: "Protection solaire haute tolérance.",
    description: "Texture légère, résistante à l'eau.",
    hasVariants: true, reorderPoint: 4,
    variants: [
      { sku: "VIC-CAP-LC-300", name: "Lait corps 300ml", priceTnd: "59.000", isDefault: true },
      { sku: "VIC-CAP-CR-50", name: "Crème visage 50ml", priceTnd: "49.000" },
    ], initialStock: 12 },

  // ──────────────── Bioderma ────────────────
  { id: "70000000-0000-4000-8000-000000000040", slug: "bioderma-sensibio-h2o",
    name: "Bioderma Sensibio H2O Eau Micellaire", brandSlug: "bioderma", categorySlug: cosVisage,
    shortDescription: "Démaquillage tout-en-un.",
    description: "Démaquille, nettoie, apaise les peaux sensibles.",
    hasVariants: true, reorderPoint: 8,
    variants: [
      { sku: "BIO-SEN-250", name: "250ml", priceTnd: "27.000", isDefault: true },
      { sku: "BIO-SEN-500", name: "500ml", priceTnd: "44.000" },
    ], initialStock: 40 },

  { id: "70000000-0000-4000-8000-000000000041", slug: "bioderma-sebium-pore",
    name: "Bioderma Sébium Pore Refiner 30ml", brandSlug: "bioderma", categorySlug: cosVisage,
    shortDescription: "Concentré resserre-pores.",
    description: "Texture fluide, fini matifié.",
    hasVariants: false, sku: "BIO-SEB-30", priceTnd: "38.000", reorderPoint: 4, initialStock: 14 },

  { id: "70000000-0000-4000-8000-000000000042", slug: "bioderma-atoderm-creme",
    name: "Bioderma Atoderm Crème 200ml", brandSlug: "bioderma", categorySlug: cosCorps,
    shortDescription: "Crème ultra-nourrissante peaux sèches.",
    description: "Restaure la barrière cutanée.",
    hasVariants: false, sku: "BIO-ATO-200", priceTnd: "39.000", reorderPoint: 5, initialStock: 20 },

  // ──────────────── Nuxe ────────────────
  { id: "70000000-0000-4000-8000-000000000050", slug: "nuxe-creme-fraiche",
    name: "Nuxe Crème Fraîche de Beauté 30ml", brandSlug: "nuxe", categorySlug: cosVisage,
    shortDescription: "Hydratation fraîche 48h.",
    description: "Sensorielle, lait végétal apaisant.",
    hasVariants: false, sku: "NUX-CFB-30", priceTnd: "39.000", reorderPoint: 5, initialStock: 18 },

  { id: "70000000-0000-4000-8000-000000000051", slug: "nuxe-huile-prodigieuse",
    name: "Nuxe Huile Prodigieuse", brandSlug: "nuxe", categorySlug: cosCorps,
    shortDescription: "Huile multi-fonctions visage, corps, cheveux.",
    description: "Iconique, parfum sensuel, 7 huiles précieuses.",
    hasVariants: true, reorderPoint: 5,
    variants: [
      { sku: "NUX-HP-50", name: "50ml", priceTnd: "42.000", isDefault: true },
      { sku: "NUX-HP-100", name: "100ml", priceTnd: "69.000" },
    ], initialStock: 18 },

  { id: "70000000-0000-4000-8000-000000000052", slug: "nuxe-reve-de-miel",
    name: "Nuxe Rêve de Miel Baume Lèvres 15g", brandSlug: "nuxe", categorySlug: cosVisage,
    shortDescription: "Baume nourrissant et réparateur.",
    description: "Texture fondante au miel et aux huiles précieuses.",
    hasVariants: false, sku: "NUX-RDM-15", priceTnd: "19.500", reorderPoint: 8, initialStock: 30 },

  // ──────────────── Matériel médical ────────────────
  { id: "70000000-0000-4000-8000-000000000060", slug: "tensio-omron-m3",
    name: "Tensiomètre Omron M3 Comfort", brandSlug: "vichy", categorySlug: "tension",
    shortDescription: "Tensiomètre brassard automatique.",
    description: "Brassard préformé Intelli Wrap, technologie Intellisense.",
    hasVariants: false, sku: "OMR-M3", priceTnd: "169.000", reorderPoint: 2, initialStock: 6 },

  { id: "70000000-0000-4000-8000-000000000061", slug: "tensio-omron-m7",
    name: "Tensiomètre Omron M7 Intelli IT", brandSlug: "vichy", categorySlug: "tension",
    shortDescription: "Tensiomètre connecté Bluetooth.",
    description: "Détection AFib, application Omron Connect.",
    hasVariants: false, sku: "OMR-M7", priceTnd: "219.000", reorderPoint: 2, initialStock: 4 },

  { id: "70000000-0000-4000-8000-000000000062", slug: "lecteur-glycemie-accuchek",
    name: "Lecteur de glycémie Accu-Chek Performa", brandSlug: "vichy", categorySlug: "diabete",
    shortDescription: "Lecteur de glycémie compact.",
    description: "Mesure rapide, mémoire 500 résultats.",
    hasVariants: false, sku: "ACK-PER", priceTnd: "89.000", reorderPoint: 3, initialStock: 8 },

  { id: "70000000-0000-4000-8000-000000000063", slug: "bandelettes-accuchek",
    name: "Bandelettes Accu-Chek Performa", brandSlug: "vichy", categorySlug: "diabete",
    shortDescription: "Bandelettes pour Accu-Chek Performa.",
    description: "Bandelettes réactives compatibles.",
    hasVariants: true, reorderPoint: 6,
    variants: [
      { sku: "ACK-BD-25", name: "Boîte de 25", priceTnd: "29.500" },
      { sku: "ACK-BD-50", name: "Boîte de 50", priceTnd: "55.000", isDefault: true },
      { sku: "ACK-BD-100", name: "Boîte de 100", priceTnd: "99.000" },
    ], initialStock: 30 },

  { id: "70000000-0000-4000-8000-000000000064", slug: "aerosol-pneumatique",
    name: "Aérosol pneumatique standard", brandSlug: "vichy", categorySlug: "aerosol",
    shortDescription: "Aérosol pneumatique pour adulte et enfant.",
    description: "Compresseur silencieux, masques inclus.",
    hasVariants: false, sku: "AER-PN-STD", priceTnd: "145.000", reorderPoint: 2, initialStock: 5 },

  { id: "70000000-0000-4000-8000-000000000065", slug: "fauteuil-roulant-standard",
    name: "Fauteuil roulant standard pliable", brandSlug: "vichy", categorySlug: "fauteuils",
    shortDescription: "Fauteuil léger pliable, 18 kg.",
    description: "Cadre acier, accoudoirs amovibles, repose-pieds réglables.",
    hasVariants: false, sku: "FR-STD", priceTnd: "720.000", reorderPoint: 1, initialStock: 3 },

  { id: "70000000-0000-4000-8000-000000000066", slug: "fauteuil-roulant-xl",
    name: "Fauteuil roulant XL renforcé", brandSlug: "vichy", categorySlug: "fauteuils",
    shortDescription: "Fauteuil renforcé jusqu'à 160 kg.",
    description: "Cadre acier renforcé, assise large 50 cm.",
    hasVariants: false, sku: "FR-XL", priceTnd: "950.000", reorderPoint: 1, initialStock: 2 },

  // ──────────────── Orthopédie ────────────────
  { id: "70000000-0000-4000-8000-000000000070", slug: "bequille-axillaire",
    name: "Béquille axillaire ajustable (paire)", brandSlug: "vichy", categorySlug: "aides-marche",
    shortDescription: "Paire de béquilles axillaires.",
    description: "Hauteur ajustable, embouts antidérapants.",
    hasVariants: false, sku: "ORT-BEQ", priceTnd: "45.000", reorderPoint: 3, initialStock: 8 },

  { id: "70000000-0000-4000-8000-000000000071", slug: "canne-anglaise",
    name: "Canne anglaise ergonomique", brandSlug: "vichy", categorySlug: "aides-marche",
    shortDescription: "Canne anglaise avec poignée ergonomique.",
    description: "Aluminium léger, 7 réglages de hauteur.",
    hasVariants: false, sku: "ORT-CAN", priceTnd: "35.000", reorderPoint: 4, initialStock: 12 },

  { id: "70000000-0000-4000-8000-000000000072", slug: "ceinture-lombaire",
    name: "Ceinture lombaire de soutien", brandSlug: "vichy", categorySlug: "lombaire",
    shortDescription: "Ceinture lombaire soutien quotidien.",
    description: "Tissu respirant, hauteur 26 cm.",
    hasVariants: true, reorderPoint: 4,
    variants: [
      { sku: "ORT-LOM-S", name: "Taille S", priceTnd: "65.000" },
      { sku: "ORT-LOM-M", name: "Taille M", priceTnd: "65.000", isDefault: true },
      { sku: "ORT-LOM-L", name: "Taille L", priceTnd: "65.000" },
      { sku: "ORT-LOM-XL", name: "Taille XL", priceTnd: "70.000" },
    ], initialStock: 16 },

  { id: "70000000-0000-4000-8000-000000000073", slug: "genouillere-ligamentaire",
    name: "Genouillère ligamentaire", brandSlug: "vichy", categorySlug: "genou",
    shortDescription: "Maintien latéral du genou.",
    description: "Renforts latéraux, sangles ajustables.",
    hasVariants: true, reorderPoint: 4,
    variants: [
      { sku: "ORT-GEN-S", name: "Taille S", priceTnd: "55.000" },
      { sku: "ORT-GEN-M", name: "Taille M", priceTnd: "55.000", isDefault: true },
      { sku: "ORT-GEN-L", name: "Taille L", priceTnd: "55.000" },
    ], initialStock: 12 },

  { id: "70000000-0000-4000-8000-000000000074", slug: "chevillere-ajustable",
    name: "Chevillère ajustable", brandSlug: "vichy", categorySlug: "cheville",
    shortDescription: "Chevillère taille unique ajustable.",
    description: "Bandes auto-agrippantes, néoprène respirant.",
    hasVariants: false, sku: "ORT-CHV", priceTnd: "39.000", reorderPoint: 4, initialStock: 14 },

  // ──────────────── Bébé / Parapharmacie ────────────────
  { id: "70000000-0000-4000-8000-000000000080", slug: "mustela-hydra-bebe",
    name: "Mustela Hydra Bébé Crème Visage 40ml", brandSlug: "nuxe", categorySlug: "bebe",
    shortDescription: "Hydratation visage bébé.",
    description: "Avocat Perseose, hypoallergénique.",
    hasVariants: false, sku: "MUS-HYD-40", priceTnd: "29.000", reorderPoint: 5, initialStock: 18 },

  { id: "70000000-0000-4000-8000-000000000081", slug: "mustela-2en1-gel",
    name: "Mustela 2 en 1 Gel lavant cheveux & corps", brandSlug: "nuxe", categorySlug: "bebe",
    shortDescription: "Gel lavant doux 2 en 1.",
    description: "Sans savon, sans paraben.",
    hasVariants: true, reorderPoint: 5,
    variants: [
      { sku: "MUS-2EN1-200", name: "200ml", priceTnd: "21.000", isDefault: true },
      { sku: "MUS-2EN1-500", name: "500ml", priceTnd: "39.000" },
    ], initialStock: 24 },

  { id: "70000000-0000-4000-8000-000000000082", slug: "liniment-oleocalcaire",
    name: "Liniment oléo-calcaire 500ml", brandSlug: "nuxe", categorySlug: "bebe",
    shortDescription: "Soin de change naturel.",
    description: "Huile d'olive et eau de chaux.",
    hasVariants: false, sku: "LIN-500", priceTnd: "12.000", reorderPoint: 8, initialStock: 30 },

  { id: "70000000-0000-4000-8000-000000000083", slug: "compresses-steriles",
    name: "Compresses stériles 7,5 × 7,5 cm", brandSlug: "nuxe", categorySlug: "premiers-soins",
    shortDescription: "Boîte de 25 compresses.",
    description: "Compresses non tissées, individuellement emballées.",
    hasVariants: false, sku: "PS-CMP-25", priceTnd: "6.500", reorderPoint: 10, initialStock: 60 },

  { id: "70000000-0000-4000-8000-000000000084", slug: "thermometre-frontal",
    name: "Thermomètre infrarouge frontal", brandSlug: "vichy", categorySlug: "premiers-soins",
    shortDescription: "Mesure sans contact en 1 seconde.",
    description: "Affichage rétroéclairé, mémoire 32 résultats.",
    hasVariants: false, sku: "TH-IR", priceTnd: "79.000", reorderPoint: 3, initialStock: 9 },

  { id: "70000000-0000-4000-8000-000000000085", slug: "forte-pharma-energie",
    name: "Forté Pharma Energie 4G — 30 comprimés", brandSlug: "nuxe", categorySlug: "complements",
    shortDescription: "Complément vitalité 4 actions.",
    description: "Ginseng, gelée royale, vitamines, magnésium.",
    hasVariants: false, sku: "FP-EN-30", priceTnd: "28.000", reorderPoint: 6, initialStock: 20 },
];
```

> Note: a few non-cosmetic products use placeholder brand slugs (`vichy`, `nuxe`) since we only seed 6 brands. In Phase 3 the real CSV import will introduce dedicated brands like Omron, Mustela, Forté Pharma, etc.

- [ ] **Step 5: Create `data/customers.ts`**

```ts
export const CUSTOMER_SEED = [
  { id: "a0000000-0000-4000-8000-000000000001", email: "salma.benali@example.tn", fullName: "Salma Ben Ali", phone: "+216 22 110 220", marketingConsent: true, newsletterSubscribed: true },
  { id: "a0000000-0000-4000-8000-000000000002", email: "mohamed.trabelsi@example.tn", fullName: "Mohamed Trabelsi", phone: "+216 98 233 411", marketingConsent: false, newsletterSubscribed: false },
  { id: "a0000000-0000-4000-8000-000000000003", email: "yasmine.bouzid@example.tn", fullName: "Yasmine Bouzid", phone: "+216 24 556 178", marketingConsent: true, newsletterSubscribed: true },
  { id: "a0000000-0000-4000-8000-000000000004", email: "karim.mansouri@example.tn", fullName: "Karim Mansouri", phone: "+216 95 774 332", marketingConsent: true, newsletterSubscribed: false },
  { id: "a0000000-0000-4000-8000-000000000005", email: "nour.bensalah@example.tn", fullName: "Nour Ben Salah", phone: "+216 27 882 011", marketingConsent: true, newsletterSubscribed: true },
  { id: "a0000000-0000-4000-8000-000000000006", email: "ahmed.karoui@example.tn", fullName: "Ahmed Karoui", phone: "+216 50 113 274", marketingConsent: false, newsletterSubscribed: false },
  { id: "a0000000-0000-4000-8000-000000000007", email: "imen.gharbi@example.tn", fullName: "Imen Gharbi", phone: "+216 21 990 008", marketingConsent: true, newsletterSubscribed: true },
  { id: "a0000000-0000-4000-8000-000000000008", email: "wassim.benammar@example.tn", fullName: "Wassim Ben Ammar", phone: "+216 99 102 654", marketingConsent: false, newsletterSubscribed: true },
  { id: "a0000000-0000-4000-8000-000000000009", email: "houda.mejri@example.tn", fullName: "Houda Mejri", phone: "+216 28 114 887", marketingConsent: true, newsletterSubscribed: true },
  { id: "a0000000-0000-4000-8000-00000000000a", email: "tarek.riahi@example.tn", fullName: "Tarek Riahi", phone: "+216 96 224 117", marketingConsent: true, newsletterSubscribed: false },
];

export const ADDRESS_SEED = [
  { customerEmail: "salma.benali@example.tn", fullName: "Salma Ben Ali", phone: "+216 22 110 220", street: "12 rue Ibn Khaldoun", city: "Nabeul", postalCode: "8000", governorate: "Nabeul", isDefault: true },
  { customerEmail: "mohamed.trabelsi@example.tn", fullName: "Mohamed Trabelsi", phone: "+216 98 233 411", street: "45 av. de la Liberté", city: "Tunis", postalCode: "1002", governorate: "Tunis", isDefault: true },
  { customerEmail: "yasmine.bouzid@example.tn", fullName: "Yasmine Bouzid", phone: "+216 24 556 178", street: "9 rue des Jasmins", city: "Sfax", postalCode: "3000", governorate: "Sfax", isDefault: true },
  { customerEmail: "karim.mansouri@example.tn", fullName: "Karim Mansouri", phone: "+216 95 774 332", street: "30 av. Habib Bourguiba", city: "Sousse", postalCode: "4000", governorate: "Sousse", isDefault: true },
  { customerEmail: "nour.bensalah@example.tn", fullName: "Nour Ben Salah", phone: "+216 27 882 011", street: "5 rue de la Plage", city: "Nabeul", postalCode: "8000", governorate: "Nabeul", isDefault: true },
];
```

- [ ] **Step 6: Create `data/orders.ts`**

```ts
export interface SeedOrderItem {
  productSlug: string;
  variantSku?: string;
  quantity: number;
}
export interface SeedOrder {
  orderNumber: string;
  customerEmail?: string;
  guestEmail?: string;
  guestPhone?: string;
  shipping: { fullName: string; phone: string; street: string; city: string; postalCode: string; governorate: string };
  items: SeedOrderItem[];
  paymentMethod: "cash_on_delivery" | "card_konnect" | "card_clic_to_pay" | "bank_transfer";
  status: "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
  daysAgo: number;
}

export const ORDER_SEED: SeedOrder[] = [
  { orderNumber: "JMS-2026-000001", customerEmail: "salma.benali@example.tn",
    shipping: { fullName: "Salma Ben Ali", phone: "+216 22 110 220", street: "12 rue Ibn Khaldoun", city: "Nabeul", postalCode: "8000", governorate: "Nabeul" },
    items: [{ productSlug: "svr-sebiaclear-creme", quantity: 2 }, { productSlug: "avene-eau-thermale", variantSku: "AVE-EAU-150", quantity: 1 }],
    paymentMethod: "cash_on_delivery", status: "delivered", daysAgo: 28 },

  { orderNumber: "JMS-2026-000002", customerEmail: "mohamed.trabelsi@example.tn",
    shipping: { fullName: "Mohamed Trabelsi", phone: "+216 98 233 411", street: "45 av. de la Liberté", city: "Tunis", postalCode: "1002", governorate: "Tunis" },
    items: [{ productSlug: "tensio-omron-m3", quantity: 1 }],
    paymentMethod: "card_konnect", status: "delivered", daysAgo: 25 },

  { orderNumber: "JMS-2026-000003", customerEmail: "yasmine.bouzid@example.tn",
    shipping: { fullName: "Yasmine Bouzid", phone: "+216 24 556 178", street: "9 rue des Jasmins", city: "Sfax", postalCode: "3000", governorate: "Sfax" },
    items: [{ productSlug: "nuxe-huile-prodigieuse", variantSku: "NUX-HP-100", quantity: 1 }, { productSlug: "nuxe-creme-fraiche", quantity: 1 }],
    paymentMethod: "cash_on_delivery", status: "delivered", daysAgo: 22 },

  { orderNumber: "JMS-2026-000004", customerEmail: "karim.mansouri@example.tn",
    shipping: { fullName: "Karim Mansouri", phone: "+216 95 774 332", street: "30 av. Habib Bourguiba", city: "Sousse", postalCode: "4000", governorate: "Sousse" },
    items: [{ productSlug: "fauteuil-roulant-standard", quantity: 1 }],
    paymentMethod: "bank_transfer", status: "shipped", daysAgo: 5 },

  { orderNumber: "JMS-2026-000005", guestEmail: "fatma.guest@example.tn", guestPhone: "+216 92 555 333",
    shipping: { fullName: "Fatma Cherif", phone: "+216 92 555 333", street: "8 rue du Lac", city: "Hammamet", postalCode: "8050", governorate: "Nabeul" },
    items: [{ productSlug: "vichy-mineral-89", quantity: 1 }, { productSlug: "lrp-cicaplast-baume", quantity: 2 }],
    paymentMethod: "cash_on_delivery", status: "preparing", daysAgo: 1 },

  { orderNumber: "JMS-2026-000006", customerEmail: "nour.bensalah@example.tn",
    shipping: { fullName: "Nour Ben Salah", phone: "+216 27 882 011", street: "5 rue de la Plage", city: "Nabeul", postalCode: "8000", governorate: "Nabeul" },
    items: [{ productSlug: "bioderma-sensibio-h2o", variantSku: "BIO-SEN-500", quantity: 2 }],
    paymentMethod: "cash_on_delivery", status: "delivered", daysAgo: 18 },

  { orderNumber: "JMS-2026-000007", customerEmail: "ahmed.karoui@example.tn",
    shipping: { fullName: "Ahmed Karoui", phone: "+216 50 113 274", street: "11 rue Tanit", city: "Bizerte", postalCode: "7000", governorate: "Bizerte" },
    items: [{ productSlug: "lecteur-glycemie-accuchek", quantity: 1 }, { productSlug: "bandelettes-accuchek", variantSku: "ACK-BD-50", quantity: 2 }],
    paymentMethod: "card_clic_to_pay", status: "delivered", daysAgo: 14 },

  { orderNumber: "JMS-2026-000008", customerEmail: "imen.gharbi@example.tn",
    shipping: { fullName: "Imen Gharbi", phone: "+216 21 990 008", street: "22 rue de Mahdia", city: "Monastir", postalCode: "5000", governorate: "Monastir" },
    items: [{ productSlug: "ceinture-lombaire", variantSku: "ORT-LOM-M", quantity: 1 }],
    paymentMethod: "cash_on_delivery", status: "delivered", daysAgo: 10 },

  { orderNumber: "JMS-2026-000009", customerEmail: "wassim.benammar@example.tn",
    shipping: { fullName: "Wassim Ben Ammar", phone: "+216 99 102 654", street: "12 rue Ali Bach Hamba", city: "Tunis", postalCode: "1001", governorate: "Tunis" },
    items: [{ productSlug: "lrp-effaclar-duo", quantity: 1 }, { productSlug: "lrp-anthelios-spf50", variantSku: "LRP-ANT-FL-50", quantity: 1 }],
    paymentMethod: "card_konnect", status: "delivered", daysAgo: 8 },

  { orderNumber: "JMS-2026-000010", customerEmail: "houda.mejri@example.tn",
    shipping: { fullName: "Houda Mejri", phone: "+216 28 114 887", street: "3 av. Mediterranée", city: "Hammamet", postalCode: "8050", governorate: "Nabeul" },
    items: [{ productSlug: "mustela-2en1-gel", variantSku: "MUS-2EN1-500", quantity: 1 }, { productSlug: "liniment-oleocalcaire", quantity: 2 }],
    paymentMethod: "cash_on_delivery", status: "delivered", daysAgo: 6 },

  { orderNumber: "JMS-2026-000011", customerEmail: "tarek.riahi@example.tn",
    shipping: { fullName: "Tarek Riahi", phone: "+216 96 224 117", street: "44 rue de Carthage", city: "Nabeul", postalCode: "8000", governorate: "Nabeul" },
    items: [{ productSlug: "thermometre-frontal", quantity: 1 }, { productSlug: "compresses-steriles", quantity: 3 }],
    paymentMethod: "cash_on_delivery", status: "shipped", daysAgo: 3 },

  { orderNumber: "JMS-2026-000012", guestEmail: "leila.guest@example.tn", guestPhone: "+216 24 778 119",
    shipping: { fullName: "Leila Hamdi", phone: "+216 24 778 119", street: "7 rue Sidi Bou Said", city: "Tunis", postalCode: "2026", governorate: "Tunis" },
    items: [{ productSlug: "svr-sun-secure-spf50", variantSku: "SVR-SUN-CR-50", quantity: 1 }, { productSlug: "vichy-capital-soleil", variantSku: "VIC-CAP-CR-50", quantity: 1 }],
    paymentMethod: "cash_on_delivery", status: "delivered", daysAgo: 12 },

  { orderNumber: "JMS-2026-000013", customerEmail: "salma.benali@example.tn",
    shipping: { fullName: "Salma Ben Ali", phone: "+216 22 110 220", street: "12 rue Ibn Khaldoun", city: "Nabeul", postalCode: "8000", governorate: "Nabeul" },
    items: [{ productSlug: "nuxe-reve-de-miel", quantity: 3 }],
    paymentMethod: "cash_on_delivery", status: "confirmed", daysAgo: 0 },

  { orderNumber: "JMS-2026-000014", customerEmail: "yasmine.bouzid@example.tn",
    shipping: { fullName: "Yasmine Bouzid", phone: "+216 24 556 178", street: "9 rue des Jasmins", city: "Sfax", postalCode: "3000", governorate: "Sfax" },
    items: [{ productSlug: "vichy-liftactiv-serum", quantity: 1 }],
    paymentMethod: "card_konnect", status: "cancelled", daysAgo: 16 },

  { orderNumber: "JMS-2026-000015", customerEmail: "imen.gharbi@example.tn",
    shipping: { fullName: "Imen Gharbi", phone: "+216 21 990 008", street: "22 rue de Mahdia", city: "Monastir", postalCode: "5000", governorate: "Monastir" },
    items: [{ productSlug: "genouillere-ligamentaire", variantSku: "ORT-GEN-M", quantity: 1 }, { productSlug: "chevillere-ajustable", quantity: 1 }],
    paymentMethod: "cash_on_delivery", status: "delivered", daysAgo: 4 },

  { orderNumber: "JMS-2026-000016", customerEmail: "mohamed.trabelsi@example.tn",
    shipping: { fullName: "Mohamed Trabelsi", phone: "+216 98 233 411", street: "45 av. de la Liberté", city: "Tunis", postalCode: "1002", governorate: "Tunis" },
    items: [{ productSlug: "bandelettes-accuchek", variantSku: "ACK-BD-100", quantity: 1 }],
    paymentMethod: "card_clic_to_pay", status: "delivered", daysAgo: 7 },

  { orderNumber: "JMS-2026-000017", customerEmail: "nour.bensalah@example.tn",
    shipping: { fullName: "Nour Ben Salah", phone: "+216 27 882 011", street: "5 rue de la Plage", city: "Nabeul", postalCode: "8000", governorate: "Nabeul" },
    items: [{ productSlug: "avene-cleanance-gel", variantSku: "AVE-CLG-200", quantity: 1 }, { productSlug: "avene-hydrance-creme", quantity: 1 }],
    paymentMethod: "cash_on_delivery", status: "preparing", daysAgo: 1 },

  { orderNumber: "JMS-2026-000018", customerEmail: "ahmed.karoui@example.tn",
    shipping: { fullName: "Ahmed Karoui", phone: "+216 50 113 274", street: "11 rue Tanit", city: "Bizerte", postalCode: "7000", governorate: "Bizerte" },
    items: [{ productSlug: "tensio-omron-m7", quantity: 1 }],
    paymentMethod: "bank_transfer", status: "delivered", daysAgo: 19 },

  { orderNumber: "JMS-2026-000019", customerEmail: "tarek.riahi@example.tn",
    shipping: { fullName: "Tarek Riahi", phone: "+216 96 224 117", street: "44 rue de Carthage", city: "Nabeul", postalCode: "8000", governorate: "Nabeul" },
    items: [{ productSlug: "forte-pharma-energie", quantity: 2 }],
    paymentMethod: "cash_on_delivery", status: "delivered", daysAgo: 11 },

  { orderNumber: "JMS-2026-000020", customerEmail: "houda.mejri@example.tn",
    shipping: { fullName: "Houda Mejri", phone: "+216 28 114 887", street: "3 av. Mediterranée", city: "Hammamet", postalCode: "8050", governorate: "Nabeul" },
    items: [{ productSlug: "bioderma-atoderm-creme", quantity: 1 }, { productSlug: "mustela-hydra-bebe", quantity: 1 }],
    paymentMethod: "card_konnect", status: "shipped", daysAgo: 2 },
];
```

- [ ] **Step 7: Create `data/staff.ts`**

```ts
export const STAFF_SEED = [
  { id: "f0000000-0000-4000-8000-000000000001", email: "owner@jasmin-medical-store.com", fullName: "Direction Jasmin", role: "admin" as const },
  { id: "f0000000-0000-4000-8000-000000000002", email: "manager@jasmin-medical-store.com", fullName: "Manager Boutique", role: "manager" as const },
  { id: "f0000000-0000-4000-8000-000000000003", email: "caisse@jasmin-medical-store.com", fullName: "Caissier·ère", role: "cashier" as const },
  { id: "f0000000-0000-4000-8000-000000000004", email: "stock@jasmin-medical-store.com", fullName: "Gestion stock", role: "stock" as const },
];
```

- [ ] **Step 8: Create the seed orchestrator `src/seed/index.ts`**

```ts
import { createClient } from "../client";
import * as schema from "../schema";
import { eq } from "drizzle-orm";
import { generateOrderNumber } from "@jasmin/lib";
import { BRAND_SEED } from "./data/brands";
import { CATEGORY_SEED } from "./data/categories";
import { PRODUCT_SEED } from "./data/products";
import { CUSTOMER_SEED, ADDRESS_SEED } from "./data/customers";
import { ORDER_SEED } from "./data/orders";
import { STAFF_SEED } from "./data/staff";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL not set");
  process.exit(1);
}

const db = createClient(url);

async function seed() {
  console.log("→ brands");
  for (const b of BRAND_SEED) {
    await db.insert(schema.brands).values(b).onConflictDoUpdate({ target: schema.brands.slug, set: b });
  }

  console.log("→ categories");
  for (const c of CATEGORY_SEED) {
    await db.insert(schema.categories).values(c).onConflictDoUpdate({ target: schema.categories.slug, set: c });
  }

  console.log("→ products + variants + inventory");
  for (const p of PRODUCT_SEED) {
    const brand = (await db.select().from(schema.brands).where(eq(schema.brands.slug, p.brandSlug)))[0];
    const category = (await db.select().from(schema.categories).where(eq(schema.categories.slug, p.categorySlug)))[0];
    if (!brand || !category) {
      console.warn(`  skip ${p.slug}: missing brand or category`);
      continue;
    }

    const productRow = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brandId: brand.id,
      categoryId: category.id,
      shortDescription: p.shortDescription,
      description: p.description,
      ingredients: p.ingredients ?? null,
      usage: p.usage ?? null,
      hasVariants: p.hasVariants,
      sku: p.hasVariants ? null : (p.sku ?? null),
      priceTnd: p.hasVariants ? null : (p.priceTnd ?? null),
      isPublished: true,
      isFeatured: false,
    };
    await db
      .insert(schema.products)
      .values(productRow)
      .onConflictDoUpdate({ target: schema.products.slug, set: productRow });

    if (p.hasVariants && p.variants) {
      for (const v of p.variants) {
        await db
          .insert(schema.productVariants)
          .values({
            productId: p.id,
            sku: v.sku,
            name: v.name,
            priceTnd: v.priceTnd,
            isDefault: v.isDefault ?? false,
          })
          .onConflictDoUpdate({
            target: schema.productVariants.sku,
            set: { name: v.name, priceTnd: v.priceTnd, isDefault: v.isDefault ?? false },
          });
      }
    }

    // Inventory rows
    if (p.hasVariants && p.variants) {
      for (const v of p.variants) {
        const variant = (
          await db.select().from(schema.productVariants).where(eq(schema.productVariants.sku, v.sku))
        )[0];
        if (variant) {
          await db
            .insert(schema.inventory)
            .values({ variantId: variant.id, onHand: p.initialStock, reorderPoint: p.reorderPoint })
            .onConflictDoUpdate({
              target: schema.inventory.variantId,
              set: { onHand: p.initialStock, reorderPoint: p.reorderPoint },
            });
        }
      }
    } else {
      await db
        .insert(schema.inventory)
        .values({ productId: p.id, onHand: p.initialStock, reorderPoint: p.reorderPoint })
        .onConflictDoUpdate({
          target: schema.inventory.productId,
          set: { onHand: p.initialStock, reorderPoint: p.reorderPoint },
        });
    }

    // initial purchase stock_movement
    if (!p.hasVariants) {
      await db.insert(schema.stockMovements).values({
        productId: p.id,
        type: "purchase",
        quantity: p.initialStock,
        notes: "Seed: initial stock",
      });
    }
  }

  console.log("→ customers + addresses");
  for (const c of CUSTOMER_SEED) {
    await db.insert(schema.customers).values(c).onConflictDoUpdate({ target: schema.customers.email, set: c });
  }
  for (const a of ADDRESS_SEED) {
    const cust = (
      await db.select().from(schema.customers).where(eq(schema.customers.email, a.customerEmail))
    )[0];
    if (!cust) continue;
    await db
      .insert(schema.customerAddresses)
      .values({
        customerId: cust.id,
        fullName: a.fullName,
        phone: a.phone,
        street: a.street,
        city: a.city,
        postalCode: a.postalCode,
        governorate: a.governorate,
        isDefault: a.isDefault,
      })
      .onConflictDoNothing();
  }

  console.log("→ staff");
  for (const s of STAFF_SEED) {
    await db.insert(schema.staffUsers).values(s).onConflictDoUpdate({ target: schema.staffUsers.email, set: s });
  }

  console.log("→ orders + items + events + sale stock movements");
  for (const o of ORDER_SEED) {
    const cust = o.customerEmail
      ? (await db.select().from(schema.customers).where(eq(schema.customers.email, o.customerEmail)))[0]
      : undefined;

    // Compute totals
    let subtotal = 0;
    const itemRows: typeof schema.orderItems.$inferInsert[] = [];
    for (const it of o.items) {
      const product = (await db.select().from(schema.products).where(eq(schema.products.slug, it.productSlug)))[0];
      if (!product) continue;
      const variant = it.variantSku
        ? (await db.select().from(schema.productVariants).where(eq(schema.productVariants.sku, it.variantSku)))[0]
        : undefined;
      const brand = (await db.select().from(schema.brands).where(eq(schema.brands.id, product.brandId)))[0];
      const unitPrice = Number(variant?.priceTnd ?? product.priceTnd ?? 0);
      const lineTotal = unitPrice * it.quantity;
      subtotal += lineTotal;

      itemRows.push({
        orderId: "00000000-0000-0000-0000-000000000000", // patched after order insert
        productId: product.id,
        variantId: variant?.id,
        productNameSnapshot: product.name,
        variantNameSnapshot: variant?.name,
        brandSnapshot: brand?.name ?? "",
        skuSnapshot: variant?.sku ?? product.sku ?? "",
        unitPriceTnd: unitPrice.toFixed(3),
        quantity: it.quantity,
        lineTotalTnd: lineTotal.toFixed(3),
      });
    }

    const shippingFee = subtotal > 200 ? 0 : 7;
    const total = subtotal + shippingFee;
    const createdAt = new Date(Date.now() - o.daysAgo * 86_400_000);

    const inserted = await db
      .insert(schema.orders)
      .values({
        orderNumber: o.orderNumber,
        customerId: cust?.id,
        guestEmail: o.guestEmail,
        guestPhone: o.guestPhone,
        shippingFullName: o.shipping.fullName,
        shippingPhone: o.shipping.phone,
        shippingStreet: o.shipping.street,
        shippingCity: o.shipping.city,
        shippingPostalCode: o.shipping.postalCode,
        shippingGovernorate: o.shipping.governorate,
        subtotalTnd: subtotal.toFixed(3),
        shippingTnd: shippingFee.toFixed(3),
        totalTnd: total.toFixed(3),
        status: o.status,
        paymentStatus: o.status === "delivered" ? "paid" : o.status === "cancelled" ? "failed" : "pending",
        paymentMethod: o.paymentMethod,
        createdAt,
        updatedAt: createdAt,
        confirmedAt: ["confirmed", "preparing", "shipped", "delivered"].includes(o.status) ? createdAt : null,
        shippedAt: ["shipped", "delivered"].includes(o.status) ? new Date(createdAt.getTime() + 86_400_000) : null,
        deliveredAt: o.status === "delivered" ? new Date(createdAt.getTime() + 2 * 86_400_000) : null,
        cancelledAt: o.status === "cancelled" ? new Date(createdAt.getTime() + 3600_000) : null,
      })
      .onConflictDoUpdate({
        target: schema.orders.orderNumber,
        set: { totalTnd: total.toFixed(3), status: o.status },
      })
      .returning({ id: schema.orders.id });

    const orderId = inserted[0]!.id;

    // patch line orderId, idempotent: delete then insert
    await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
    for (const row of itemRows) {
      await db.insert(schema.orderItems).values({ ...row, orderId });
    }

    // event log
    await db.delete(schema.orderEvents).where(eq(schema.orderEvents.orderId, orderId));
    await db.insert(schema.orderEvents).values({
      orderId,
      eventType: "created",
      toStatus: "pending",
      performedAt: createdAt,
    });
    if (o.status !== "pending") {
      await db.insert(schema.orderEvents).values({
        orderId,
        eventType: o.status,
        fromStatus: "pending",
        toStatus: o.status,
        performedAt: new Date(createdAt.getTime() + 3600_000),
      });
    }

    // sale stock movements (only for delivered/shipped/preparing/confirmed)
    if (["confirmed", "preparing", "shipped", "delivered"].includes(o.status)) {
      for (const it of o.items) {
        const product = (await db.select().from(schema.products).where(eq(schema.products.slug, it.productSlug)))[0];
        if (!product) continue;
        const variant = it.variantSku
          ? (await db.select().from(schema.productVariants).where(eq(schema.productVariants.sku, it.variantSku)))[0]
          : undefined;
        await db.insert(schema.stockMovements).values({
          productId: variant ? null : product.id,
          variantId: variant?.id,
          type: "sale",
          quantity: -it.quantity,
          referenceType: "order",
          referenceId: orderId,
          performedAt: createdAt,
        });
      }
    }
  }

  console.log("✓ seed complete");
  process.exit(0);
}

void seed();
```

- [ ] **Step 9: Run the seed against dev Supabase**

```bash
cd packages/db && bun run seed
```
Expected output: prints each section with check marks; rerunning produces the same final state (idempotent).

- [ ] **Step 10: Verify in Supabase Studio**

Open the Supabase dashboard → Table editor → confirm `products` has ~38 rows, `inventory` has matching rows, `orders` has 20 with mixed statuses, `customers` has 10.

- [ ] **Step 11: Commit**

```bash
git add packages/db
git commit -m "feat(db): add idempotent realistic Tunisian parapharmacy seed"
```

---

## Task 13: `packages/ui` tokens, Tailwind preset, fonts

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/tokens/tokens.css`
- Create: `packages/ui/src/tokens/fonts.css`
- Create: `packages/ui/src/tokens/preset.ts`

- [ ] **Step 1: Create `packages/ui/package.json`**

```json
{
  "name": "@jasmin/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./src/tokens/tokens.css",
    "./fonts.css": "./src/tokens/fonts.css",
    "./preset": "./src/tokens/preset.ts"
  },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@jasmin/lib": "workspace:*",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-checkbox": "1.1.3",
    "@radix-ui/react-radio-group": "1.2.2",
    "@radix-ui/react-select": "2.1.4",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-switch": "1.1.2",
    "@radix-ui/react-tooltip": "1.1.6",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "lucide-react": "0.469.0",
    "tailwind-merge": "2.5.5"
  },
  "peerDependencies": { "react": ">=18", "react-dom": ">=18" },
  "devDependencies": {
    "@jasmin/config": "workspace:*",
    "@types/react": "19.0.2",
    "@types/react-dom": "19.0.2",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "typescript": "5.7.2"
  }
}
```

- [ ] **Step 2: Create `packages/ui/tsconfig.json`**

```json
{
  "extends": "@jasmin/config/tsconfig.next.json",
  "compilerOptions": { "rootDir": "src", "jsx": "react-jsx" },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `tokens/tokens.css`**

This file is imported once at the top of each app. It defines the CSS variables AND the Tailwind v4 `@theme` mapping in one place.

```css
@import "tailwindcss";

@theme {
  --color-cream-sand: #FAF6F0;
  --color-linen: #F2EBDF;
  --color-soft-teal: #5BA8A5;
  --color-deep-teal: #1F6F6D;
  --color-deep-teal-dark: #16504F;
  --color-jasmine: #C5D17A;
  --color-jasmine-dark: #A8B85A;
  --color-terracotta: #D8B27E;
  --color-warm-taupe: #3D3934;
  --color-warm-taupe-soft: #6B6661;

  --font-display: "Playfair Display", "Times New Roman", serif;
  --font-body: "Manrope", system-ui, -apple-system, sans-serif;
  --font-label: "Plus Jakarta Sans", system-ui, sans-serif;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 24px;
  --radius-pill: 9999px;

  --shadow-soft: 0 8px 24px rgba(31, 111, 109, 0.08);
  --shadow-card: 0 12px 32px rgba(31, 111, 109, 0.06);
}

:root {
  color-scheme: light;
  background: var(--color-cream-sand);
  color: var(--color-warm-taupe);
  font-family: var(--font-body);
}

body { background: var(--color-cream-sand); }

::selection { background: var(--color-jasmine); color: var(--color-warm-taupe); }
```

- [ ] **Step 4: Create `tokens/fonts.css`**

```css
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
```

- [ ] **Step 5: Create `tokens/preset.ts`**

```ts
// Re-export the css path so apps can import via JS too if needed.
// In Tailwind v4 we don't need a JS preset; the @theme block in tokens.css is canonical.
export const TOKENS_CSS_PATH = "@jasmin/ui/tokens.css";
export const FONTS_CSS_PATH = "@jasmin/ui/fonts.css";
```

- [ ] **Step 6: Create the package barrel `src/index.ts`**

```ts
export * from "./tokens/preset";
```

- [ ] **Step 7: Install + typecheck**

```bash
bun install
cd packages/ui && bun run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add packages/ui
git commit -m "feat(ui): add design tokens, Tailwind v4 preset, fonts"
```

---

## Task 14: `packages/ui` primitives (Button, Input, Pill, cn helper)

**Files:**
- Create: `packages/ui/src/cn.ts`
- Create: `packages/ui/src/components/Button.tsx`
- Create: `packages/ui/src/components/Input.tsx`
- Create: `packages/ui/src/components/Pill.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `components/Button.tsx`**

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 font-[var(--font-label)] font-medium tracking-wide transition-transform duration-300 ease-out hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-sand",
  {
    variants: {
      variant: {
        "primary-teal":
          "bg-deep-teal text-cream-sand hover:bg-deep-teal-dark shadow-soft",
        jasmine:
          "bg-jasmine text-warm-taupe hover:bg-jasmine-dark shadow-soft",
        outline:
          "border border-deep-teal/30 text-deep-teal hover:bg-linen",
        ghost:
          "text-deep-teal hover:bg-linen",
        link: "text-deep-teal underline underline-offset-4 hover:text-deep-teal-dark",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-pill",
        md: "h-11 px-6 text-base rounded-pill",
        lg: "h-14 px-8 text-base rounded-pill",
      },
    },
    defaultVariants: { variant: "primary-teal", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild, variant, size, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...rest} />;
});
```

- [ ] **Step 3: Create `components/Input.tsx`**

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-linen px-4 text-base font-[var(--font-body)] text-warm-taupe placeholder:text-warm-taupe-soft transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40",
          "disabled:opacity-50",
          className,
        )}
        {...rest}
      />
    );
  },
);
```

- [ ] **Step 4: Create `components/Pill.tsx`**

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

const pillStyles = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-[var(--font-label)] font-medium tracking-wider uppercase",
  {
    variants: {
      tone: {
        teal: "bg-deep-teal/10 text-deep-teal",
        jasmine: "bg-jasmine/30 text-warm-taupe",
        taupe: "bg-linen text-warm-taupe",
        out: "bg-warm-taupe/10 text-warm-taupe-soft",
      },
    },
    defaultVariants: { tone: "teal" },
  },
);

export interface PillProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof pillStyles> {}

export function Pill({ tone, className, ...rest }: PillProps) {
  return <span className={cn(pillStyles({ tone }), className)} {...rest} />;
}
```

- [ ] **Step 5: Update `src/index.ts`**

```ts
export * from "./tokens/preset";
export { cn } from "./cn";
export { Button, type ButtonProps } from "./components/Button";
export { Input } from "./components/Input";
export { Pill, type PillProps } from "./components/Pill";
```

- [ ] **Step 6: Typecheck**

```bash
cd packages/ui && bun run typecheck
```
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add packages/ui
git commit -m "feat(ui): add primitives Button/Input/Pill + cn helper"
```

---

## Task 15: `packages/ui` brand components

**Files:**
- Create: `packages/ui/src/components/Logo.tsx`
- Create: `packages/ui/src/components/JasmineSprig.tsx`
- Create: `packages/ui/src/components/Marquee.tsx`
- Create: `packages/ui/src/components/AiryContainer.tsx`
- Create: `packages/ui/src/components/TealHeroPanel.tsx`
- Create: `packages/ui/src/components/EditorialPanel.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `Logo.tsx`**

```tsx
import { cn } from "../cn";

export interface LogoProps {
  variant?: "default" | "cream";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ variant = "default", size = "md", className }: LogoProps) {
  const colour = variant === "cream" ? "text-cream-sand" : "text-deep-teal";
  const wordmarkSize = { sm: "text-2xl", md: "text-3xl", lg: "text-5xl" }[size];
  const subSize = { sm: "text-[9px]", md: "text-[10px]", lg: "text-xs" }[size];
  return (
    <div className={cn("inline-flex flex-col leading-none", colour, className)}>
      <span className={cn("font-[var(--font-display)] italic font-medium", wordmarkSize)}>
        Jasmin
      </span>
      <span
        className={cn(
          "font-[var(--font-label)] tracking-[0.32em] uppercase opacity-80 mt-0.5",
          subSize,
        )}
      >
        Médical Store
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create `JasmineSprig.tsx`**

```tsx
import type { SVGProps } from "react";

export function JasmineSprig({
  className,
  ...rest
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M8 56 C 18 36, 28 28, 40 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g fill="currentColor">
        <circle cx="40" cy="22" r="3.6" />
        <circle cx="46" cy="16" r="2.6" />
        <circle cx="34" cy="14" r="2.4" />
        <circle cx="50" cy="22" r="2.2" />
      </g>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <path d="M22 38 q-4 -2 -8 0" />
        <path d="M28 32 q-4 -3 -10 -1" />
      </g>
    </svg>
  );
}
```

- [ ] **Step 3: Create `Marquee.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "../cn";

export interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** seconds for one full loop */
  duration?: number;
}

export function Marquee({ children, className, duration = 32 }: MarqueeProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="flex w-max animate-[jasmin-marquee_var(--mq-d)_linear_infinite] gap-16"
        style={{ ["--mq-d" as never]: `${duration}s` }}
      >
        <div className="flex shrink-0 items-center gap-16">{children}</div>
        <div className="flex shrink-0 items-center gap-16" aria-hidden>
          {children}
        </div>
      </div>
      <style>{`@keyframes jasmin-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
```

- [ ] **Step 4: Create `AiryContainer.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export function AiryContainer({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("bg-cream-sand text-warm-taupe", className)}
      {...rest}
    />
  );
}
```

- [ ] **Step 5: Create `TealHeroPanel.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export function TealHeroPanel({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-deep-teal text-cream-sand",
        "min-h-[75vh] px-8 py-16 lg:px-24",
        className,
      )}
      {...rest}
    />
  );
}
```

- [ ] **Step 6: Create `EditorialPanel.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export function EditorialPanel({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "bg-cream-sand text-warm-taupe",
        "px-8 py-16 lg:px-24 lg:py-24",
        className,
      )}
      {...rest}
    />
  );
}
```

- [ ] **Step 7: Update `src/index.ts`**

Append:

```ts
export { Logo, type LogoProps } from "./components/Logo";
export { JasmineSprig } from "./components/JasmineSprig";
export { Marquee, type MarqueeProps } from "./components/Marquee";
export { AiryContainer } from "./components/AiryContainer";
export { TealHeroPanel } from "./components/TealHeroPanel";
export { EditorialPanel } from "./components/EditorialPanel";
```

- [ ] **Step 8: Typecheck + commit**

```bash
cd packages/ui && bun run typecheck
git add packages/ui
git commit -m "feat(ui): add brand components (Logo, JasmineSprig, Marquee, panels)"
```

---

## Task 16: `packages/ui` typography + PriceTag

**Files:**
- Create: `packages/ui/src/components/typography.tsx`
- Create: `packages/ui/src/components/PriceTag.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `typography.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export function H1Editorial({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "font-[var(--font-display)] italic font-medium",
        "text-5xl leading-[1.05] sm:text-6xl lg:text-[7.5rem]",
        "tracking-[-0.01em]",
        className,
      )}
      {...rest}
    />
  );
}

export function H2Section({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-[var(--font-display)] font-semibold",
        "text-3xl lg:text-5xl",
        "tracking-[-0.005em] text-deep-teal",
        className,
      )}
      {...rest}
    />
  );
}

export function H3Card({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-[var(--font-display)] font-medium text-lg lg:text-xl text-warm-taupe",
        className,
      )}
      {...rest}
    />
  );
}

export function BodyText({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "font-[var(--font-body)] text-base leading-[1.6] text-warm-taupe",
        className,
      )}
      {...rest}
    />
  );
}

export function LabelEyebrow({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-[var(--font-label)] text-xs font-medium uppercase tracking-[0.24em] text-deep-teal/80",
        className,
      )}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: Create `PriceTag.tsx`**

```tsx
import { formatTND } from "@jasmin/lib";
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export interface PriceTagProps extends HTMLAttributes<HTMLSpanElement> {
  /** TND amount — number (e.g., 32.9) or string from DB numeric (e.g., "32.900"). */
  amount: number | string;
  compareAt?: number | string | null;
}

function asNumber(v: number | string): number {
  return typeof v === "number" ? v : Number(v);
}

export function PriceTag({ amount, compareAt, className, ...rest }: PriceTagProps) {
  const price = asNumber(amount);
  const compare = compareAt != null ? asNumber(compareAt) : null;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)} {...rest}>
      <span className="font-[var(--font-body)] font-medium text-deep-teal">{formatTND(price)}</span>
      {compare && compare > price && (
        <span className="font-[var(--font-body)] text-warm-taupe-soft line-through text-sm">
          {formatTND(compare)}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 3: Update `src/index.ts`**

Append:

```ts
export {
  H1Editorial,
  H2Section,
  H3Card,
  BodyText,
  LabelEyebrow,
} from "./components/typography";
export { PriceTag, type PriceTagProps } from "./components/PriceTag";
```

- [ ] **Step 4: Typecheck + commit**

```bash
cd packages/ui && bun run typecheck
git add packages/ui
git commit -m "feat(ui): add typography components + PriceTag"
```

---

## Task 17: `apps/web` — Next.js public app placeholder

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/lib/supabase/server.ts`
- Create: `apps/web/lib/supabase/browser.ts`
- Create: `apps/web/.env.example`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@jasmin/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "typecheck": "tsc --noEmit",
    "test": "echo 'no app tests yet'"
  },
  "dependencies": {
    "@jasmin/db": "workspace:*",
    "@jasmin/lib": "workspace:*",
    "@jasmin/ui": "workspace:*",
    "@supabase/ssr": "0.5.2",
    "@supabase/supabase-js": "2.46.2",
    "next": "15.1.3",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@jasmin/config": "workspace:*",
    "@tailwindcss/postcss": "4.0.0-beta.7",
    "@types/node": "22.10.2",
    "@types/react": "19.0.2",
    "@types/react-dom": "19.0.2",
    "tailwindcss": "4.0.0-beta.7",
    "typescript": "5.7.2"
  }
}
```

- [ ] **Step 2: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  transpilePackages: ["@jasmin/ui", "@jasmin/lib", "@jasmin/db"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default config;
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "@jasmin/config/tsconfig.next.json",
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

- [ ] **Step 5: Create `app/globals.css`**

```css
@import "@jasmin/ui/fonts.css";
@import "@jasmin/ui/tokens.css";

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; min-height: 100%; }
```

- [ ] **Step 6: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jasmin Médical Store — Parapharmacie & matériel médical",
  description:
    "Parapharmacie & matériel médical sélectionné avec amour à Nabeul. Cosmétique, orthopédie, diabète, tension — pour votre bien-être au quotidien.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create `app/page.tsx`** — design-system smoke test

```tsx
import {
  AiryContainer,
  BodyText,
  Button,
  H1Editorial,
  H2Section,
  JasmineSprig,
  LabelEyebrow,
  Logo,
  Marquee,
  Pill,
  PriceTag,
  TealHeroPanel,
} from "@jasmin/ui";
import { VOICE } from "@jasmin/lib";

export default function HomePage() {
  return (
    <main>
      <TealHeroPanel>
        <header className="flex items-center justify-between">
          <Logo variant="cream" />
          <nav className="hidden gap-8 text-sm tracking-wide text-cream-sand/90 lg:flex">
            <span>Boutique</span>
            <span>Cosmétique</span>
            <span>Orthopédie</span>
            <span>Matériel médical</span>
            <span>Notre histoire</span>
            <span>Contact</span>
          </nav>
        </header>

        <div className="mt-24 max-w-4xl">
          <LabelEyebrow className="text-jasmine">Bienvenue</LabelEyebrow>
          <H1Editorial className="mt-6 text-cream-sand">{VOICE.heroTagline}</H1Editorial>
          <BodyText className="mt-6 max-w-xl text-cream-sand/80">{VOICE.heroSubtitle}</BodyText>
          <div className="mt-10 flex items-center gap-4">
            <Button variant="jasmine">Découvrir la boutique</Button>
            <Button variant="ghost" className="text-cream-sand hover:bg-cream-sand/10">
              Notre histoire
            </Button>
          </div>
        </div>

        <JasmineSprig className="absolute right-12 bottom-12 h-40 w-40 text-jasmine/40" />
      </TealHeroPanel>

      <AiryContainer className="px-8 py-16 lg:px-24">
        <LabelEyebrow>{VOICE.trustedBrandsLabel}</LabelEyebrow>
        <Marquee className="mt-6">
          {["SVR", "Avène", "La Roche-Posay", "Vichy", "Bioderma", "Nuxe"].map((b) => (
            <span key={b} className="font-[var(--font-display)] italic text-2xl text-warm-taupe-soft">
              {b}
            </span>
          ))}
        </Marquee>
      </AiryContainer>

      <AiryContainer className="bg-linen px-8 py-16 lg:px-24">
        <H2Section>Aperçu du système de design</H2Section>
        <BodyText className="mt-4 max-w-2xl">
          Cette page est un témoin technique : elle prouve que les jetons, polices et composants se chargent correctement.
        </BodyText>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Pill tone="teal">En stock</Pill>
          <Pill tone="jasmine">Coup de cœur</Pill>
          <Pill tone="taupe">Nouveauté</Pill>
          <PriceTag amount={32.9} compareAt={45} />
          <Button>Bouton primaire</Button>
          <Button variant="outline">Bouton secondaire</Button>
        </div>
      </AiryContainer>
    </main>
  );
}
```

- [ ] **Step 8: Create `lib/supabase/browser.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 9: Create `lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}
```

- [ ] **Step 10: Create `apps/web/.env.example`**

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
```

- [ ] **Step 11: Run dev**

```bash
bun install
bun --filter @jasmin/web dev
```
Open http://localhost:3000. Expected: teal hero with "Prenez soin de vous, avec douceur." in italic Playfair, jasmine button visible, brand marquee scrolling, design tokens section showing pills + price tag.

- [ ] **Step 12: Commit**

```bash
git add apps/web
git commit -m "feat(web): scaffold public app with design-system smoke page"
```

---

## Task 18: `apps/admin` — Next.js internal app with Supabase auth wall

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/postcss.config.mjs`
- Create: `apps/admin/middleware.ts`
- Create: `apps/admin/app/layout.tsx`
- Create: `apps/admin/app/page.tsx`
- Create: `apps/admin/app/globals.css`
- Create: `apps/admin/app/login/page.tsx`
- Create: `apps/admin/app/login/actions.ts`
- Create: `apps/admin/lib/supabase/server.ts`
- Create: `apps/admin/lib/supabase/browser.ts`
- Create: `apps/admin/lib/auth.ts`
- Create: `apps/admin/.env.example`

- [ ] **Step 1: Create `package.json`** (port 3001)

```json
{
  "name": "@jasmin/admin",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "typecheck": "tsc --noEmit",
    "test": "echo 'no app tests yet'"
  },
  "dependencies": {
    "@jasmin/db": "workspace:*",
    "@jasmin/lib": "workspace:*",
    "@jasmin/ui": "workspace:*",
    "@supabase/ssr": "0.5.2",
    "@supabase/supabase-js": "2.46.2",
    "next": "15.1.3",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@jasmin/config": "workspace:*",
    "@tailwindcss/postcss": "4.0.0-beta.7",
    "@types/node": "22.10.2",
    "@types/react": "19.0.2",
    "@types/react-dom": "19.0.2",
    "tailwindcss": "4.0.0-beta.7",
    "typescript": "5.7.2"
  }
}
```

- [ ] **Step 2: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  transpilePackages: ["@jasmin/ui", "@jasmin/lib", "@jasmin/db"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default config;
```

- [ ] **Step 3a: Create `tsconfig.json`**

```json
{
  "extends": "@jasmin/config/tsconfig.next.json",
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3b: Create `postcss.config.mjs`**

```js
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

- [ ] **Step 3c: Create `app/globals.css`**

```css
@import "@jasmin/ui/fonts.css";
@import "@jasmin/ui/tokens.css";

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; min-height: 100%; }
```

- [ ] **Step 3d: Create `lib/supabase/browser.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3e: Create `lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Create `lib/auth.ts`**

```ts
import { createSupabaseServerClient } from "./supabase/server";
import { createClient } from "@jasmin/db";
import { staffUsers } from "@jasmin/db/schema";
import { eq } from "drizzle-orm";

export interface StaffSession {
  authUserId: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "cashier" | "stock";
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) throw new Error("SUPABASE_DB_URL not set");
  const db = createClient(dbUrl);

  const rows = await db.select().from(staffUsers).where(eq(staffUsers.id, data.user.id));
  const staff = rows[0];
  if (!staff || !staff.isActive) return null;

  return {
    authUserId: data.user.id,
    email: staff.email,
    fullName: staff.fullName,
    role: staff.role,
  };
}
```

- [ ] **Step 5: Create `middleware.ts` (auth wall on every route except `/login`)**

```ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

- [ ] **Step 6: Create `app/login/page.tsx`**

```tsx
import { signInAction } from "./actions";
import { Button, H1Editorial, Input, Logo, BodyText, AiryContainer } from "@jasmin/ui";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <AiryContainer className="min-h-screen px-8 py-24 lg:px-24">
      <Logo />
      <div className="mx-auto mt-16 max-w-md">
        <H1Editorial className="text-deep-teal text-4xl">Espace équipe</H1Editorial>
        <BodyText className="mt-4">Connectez-vous pour accéder au tableau de bord interne.</BodyText>
        <form action={signInAction} className="mt-10 space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">Email</span>
            <Input type="email" name="email" required autoComplete="email" />
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">Mot de passe</span>
            <Input type="password" name="password" required autoComplete="current-password" />
          </label>
          <Button type="submit" className="w-full">Se connecter</Button>
        </form>
      </div>
    </AiryContainer>
  );
}
```

- [ ] **Step 7: Create `app/login/actions.ts`**

```ts
"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/");
}
```

- [ ] **Step 8: Create `app/page.tsx`** — staff dashboard placeholder showing role chip

```tsx
import { getStaffSession } from "@/lib/auth";
import {
  AiryContainer,
  BodyText,
  H1Editorial,
  H2Section,
  LabelEyebrow,
  Logo,
  Pill,
} from "@jasmin/ui";
import { redirect } from "next/navigation";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  manager: "Manager",
  cashier: "Caisse",
  stock: "Stock",
};

export default async function DashboardPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");

  return (
    <main>
      <AiryContainer className="px-8 py-12 lg:px-24">
        <header className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="text-sm text-warm-taupe-soft">{session.fullName}</span>
            <Pill tone="teal">{ROLE_LABEL[session.role]}</Pill>
          </div>
        </header>

        <div className="mt-16 max-w-3xl">
          <LabelEyebrow>Tableau de bord</LabelEyebrow>
          <H1Editorial className="mt-4 text-deep-teal text-5xl">Bienvenue, {session.fullName.split(" ")[0]}.</H1Editorial>
          <BodyText className="mt-4">
            L'espace équipe Jasmin Médical Store est en cours d'aménagement.
            Les modules Catalogue, Commandes, Stock et Décisionnel arrivent dans les prochaines phases.
          </BodyText>
        </div>

        <section className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <H2Section>Phase 1 — Foundation ✓</H2Section>
          <BodyText>
            La base technique est en place : monorepo, base de données, système de design,
            authentification, déploiement. Les phases suivantes apportent le contenu fonctionnel.
          </BodyText>
        </section>
      </AiryContainer>
    </main>
  );
}
```

- [ ] **Step 9: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jasmin — Espace équipe",
  description: "CRM interne Jasmin Médical Store",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Create `apps/admin/.env.example`** — same as `apps/web/.env.example`

- [ ] **Step 11: Manual prerequisite — invite a staff auth user**

In Supabase Studio → Authentication → Users → Invite user with email matching one of the seed `staff_users` rows (e.g., `owner@jasmin-medical-store.com`). When the user signs in once, their `auth.uid()` becomes the `id` for the staff_users row. **Important:** the seeded `staff_users.id` UUIDs must match the auth user IDs. The simplest way for the demo: after creating the auth user, copy their UUID from Supabase and update the `STAFF_SEED` ID for that row, then re-run `bun db:seed`.

- [ ] **Step 12: Run dev + verify auth flow**

```bash
bun --filter @jasmin/admin dev
```
Open http://localhost:3001 → should redirect to `/login`. Sign in with the invited staff user → should land on the dashboard with the role chip showing.

- [ ] **Step 13: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): scaffold internal app with Supabase auth wall + role chip"
```

---

## Task 19: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with: { bun-version: "1.2.0" }

      - name: Install
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Typecheck
        run: bun run typecheck

      - name: Test (lib + db with pglite)
        run: bun run test

      - name: Migration drift check
        run: |
          cd packages/db
          bun run generate
          if [[ -n $(git status --porcelain migrations/) ]]; then
            echo "::error::Drizzle schema drift — run \`bun db:generate\` and commit"
            git status --short migrations/
            exit 1
          fi
```

- [ ] **Step 2: Commit**

```bash
git add .github
git commit -m "ci: add lint/typecheck/test/migration-drift workflow"
```

---

## Task 20: Deploy + Supabase setup docs

**Files:**
- Create: `docs/setup/supabase.md`
- Create: `docs/setup/digitalocean.md`
- Create: `docs/setup/dns.md`

These are operational runbooks — manual one-time setup. Treat them as definition-of-done documentation, not automated tasks.

- [ ] **Step 1: Create `docs/setup/supabase.md`**

```markdown
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
After acceptance, copy the new auth user's UUID → update `STAFF_SEED` in `packages/db/src/seed/data/staff.ts` so the IDs match → re-run seed.

In production, invite real staff and create their `staff_users` rows via the admin UI (built in Phase 3).
```

- [ ] **Step 2: Create `docs/setup/digitalocean.md`**

```markdown
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

Both apps: enable "Autodeploy" on push to `main`. PRs do NOT auto-deploy (we'll add ephemeral preview apps in a later phase if needed).

## 5. Migrations on deploy

Add a **pre-deploy job** to each app:
- Job kind: pre-deploy
- Run command: `bun --filter @jasmin/db migrate`
- Env: same as the parent app

This ensures schema is up-to-date before the new app code starts serving.
```

- [ ] **Step 3: Create `docs/setup/dns.md`**

```markdown
# DNS

Domain registrar: (TBD — confirm with owner before phase-2 launch).

- `jasmin-medical-store.com` → CNAME → `jasmin-web-prod.ondigitalocean.app`
- `www.jasmin-medical-store.com` → CNAME → `jasmin-web-prod.ondigitalocean.app`
- `admin.jasmin-medical-store.com` → CNAME → `jasmin-admin-prod.ondigitalocean.app`

Ensure TLS is auto-provisioned by DigitalOcean (Let's Encrypt) once the CNAME resolves.
```

- [ ] **Step 4: Commit**

```bash
git add docs/setup
git commit -m "docs: add Supabase, DigitalOcean, and DNS runbooks"
```

---

## Done — Definition-of-done check

After all 20 tasks land, verify the spec's §11 checklist:

- [ ] Monorepo scaffolded; `bun dev` runs both apps in parallel
- [ ] `packages/db` complete with all entities + migrations + seed; pglite tests green
- [ ] `packages/ui` exports tokens preset + primitives + brand components + typography
- [ ] `packages/lib` exports Zod schemas + format/slug/inventory/order-number/voice
- [ ] `apps/web` placeholder renders Logo + H1Editorial + Button using design tokens
- [ ] `apps/admin` placeholder protected by Supabase auth, shows the staff role chip after login
- [ ] Both apps deployed to DO App Platform on production domains with TLS
- [ ] Supabase dev + prod projects provisioned, schema migrated, seed loaded into dev
- [ ] CI green: lint + typecheck + test + migration drift check
- [ ] README documents `bun dev` flow + env-var setup

When all boxes are checked, Foundation is complete. **Do NOT** start any Phase-2 (Landing+Shop) work in this same plan — that gets its own brainstorm + spec + plan cycle.

