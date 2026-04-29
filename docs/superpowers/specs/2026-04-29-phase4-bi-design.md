# Phase 4 — Business Intelligence Design Spec

**Project:** Jasmin Médical Store
**Phase:** 4 of 4 (Foundation ✓ → Landing+Shop ✓ → CRM ✓ → **BI**)
**Date:** 2026-04-29
**Status:** Approved (sections §1–§13 confirmed by user via brainstorm Q1–Q6)

## 1. Purpose

Build the analytics surface inside `apps/admin/app/(authed)/decisionnel/` so the owner and managers can see what's working: best sellers, sales trends, basket combos, stock health, customer cohorts, newsletter→order conversion. Every report sits on top of CRM data (Phase 3) and reads from existing tables on-demand — no schema changes, no materialized views in v1.

The CEO demo at end-of-Phase-4 must let an admin pick a period (7d / 30d / 90d / 12m / all), see six KPI tiles, and drill into any of the six dedicated sub-reports — end-to-end on real seeded data.

## 2. Locked decisions (from brainstorm)

| Decision | Pick |
|---|---|
| Scope | **B. Core six** — best sellers (qty + revenue), sales trends, basket analysis, stock health, cohorts, funnel |
| Compute | **A. On-demand SQL** — every page run aggregates from raw tables. Materialized-view migration deferred until perf demands it |
| Charts | **Recharts** — declarative, brand-easy, ~50KB |
| Period filter | **Preset buttons** — 7j / 30j / 90j / 12m / Tout via `?period=` |
| Drill-through | **Click-through to existing CRM pages** — re-uses `/catalogue/produits/[id]`, `/stock`, `/clients` |
| RBAC | **admin + manager only** — cashier/stock blocked at `/decisionnel` |
| Tests | Unit tests for period util + describe blocks in `schema.test.ts` for each BI query helper. E2E deferred. |

## 3. Routes

```
apps/admin/app/(authed)/decisionnel/
├── layout.tsx                       guards admin/manager — redirect("/") otherwise
├── page.tsx                         overview: 6 KPI tiles + 6 summary cards w/ sparklines
├── ventes/page.tsx                  sales trend (daily/weekly/monthly auto-grain) + KPI strip
├── best-sellers/page.tsx            top-N by qty + by revenue + category filter
├── panier/page.tsx                  basket pairs ranked by lift × count
├── stock/page.tsx                   turnover + dead stock + reorder candidates
├── cohortes/page.tsx                monthly cohort table — size, repeat rate, LTV
└── conversion/page.tsx              newsletter→order funnel
```

Every BI route: `dynamic = "force-dynamic"`, `revalidate = 0`. No ISR.

## 4. Component layers

### 4.1 Admin-only — `apps/admin/components/bi/`

- `PeriodPicker` — `<form method="get">` with hidden inputs that preserve every other searchParam, plus a row of `<button type="submit" name="period" value="...">` styled as pills. Active pill (matching current `?period`) gets the `bg-deep-teal text-cream-sand` treatment; others `bg-linen text-warm-taupe`. No client JS — relies on native form submission.
- `ReportCard` — wrapper card: Playfair italic H2 title + optional subtitle + content slot + soft-shadow rounded-2xl bg-cream-sand container. Used as the visual primitive on the overview page.
- `SimpleLineChart` — Recharts `LineChart` wrapper, props `{ data, xKey, yKey, tooltipFormatter? }`. Branded tokens.
- `SimpleAreaChart` — Recharts `AreaChart`, jasmine fill at 30% opacity, deep-teal stroke.
- `SimpleBarChart` — Recharts `BarChart`, deep-teal bars.
- `Sparkline` — minimalist `LineChart` (no axes, no legend, height=40px).
- `Funnel` — vertical step bars; CSS-only (no Recharts needed); each step shows label + count + percentage.
- `MetricRow` — small label/value pair used inside the cohort table.

All chart wrappers are `"use client"`; the wrapping page is server-rendered.

### 4.2 Voice constants — append to `packages/lib/src/voice.ts`

```ts
biTitle: "Décisionnel",
biEmpty: "Pas encore d'activité sur cette période.",
biPeriod7d: "7 jours",
biPeriod30d: "30 jours",
biPeriod90d: "90 jours",
biPeriod12m: "12 mois",
biPeriodAll: "Depuis le début",
biBestSellers: "Meilleures ventes",
biSalesTrend: "Tendances de vente",
biBasket: "Paniers types",
biStockHealth: "Santé du stock",
biCohorts: "Cohortes clients",
biFunnel: "Conversion",
biSubtitleQty: "Par quantité",
biSubtitleRevenue: "Par chiffre d'affaires",
biReorderHint: "À réapprovisionner",
biDeadStockHint: "Pas de vente sur la période",
biRevenueLabel: "Chiffre d'affaires",
biOrdersLabel: "Commandes",
biAovLabel: "Panier moyen",
biNewCustomersLabel: "Nouveaux clients",
biRepeatRateLabel: "Taux de fidélité",
biConversionRateLabel: "Taux de conversion",
biLiftLabel: "Affinité",
biSeenTogetherLabel: "Vu ensemble",
biTurnoverLabel: "Rotation",
biDaysOfCoverLabel: "Jours de stock",
```

## 5. Data layer

### 5.1 Period util — `packages/db/src/queries/bi/period.ts`

```ts
export type Period = "7d" | "30d" | "90d" | "12m" | "all";
export type Granularity = "day" | "week" | "month";

export interface PeriodInterval {
  period: Period;
  since: Date | null; // null when period === "all"
  until: Date;
  granularity: Granularity;
}

export function periodToInterval(period: Period, now: Date = new Date()): PeriodInterval {
  const until = now;
  switch (period) {
    case "7d":  return { period, since: subDays(now, 7),  until, granularity: "day" };
    case "30d": return { period, since: subDays(now, 30), until, granularity: "day" };
    case "90d": return { period, since: subDays(now, 90), until, granularity: "week" };
    case "12m": return { period, since: subMonths(now, 12), until, granularity: "month" };
    case "all": return { period, since: null,             until, granularity: "month" };
  }
}

export function parsePeriod(input: string | undefined): Period {
  if (input === "7d" || input === "30d" || input === "90d" || input === "12m" || input === "all") return input;
  return "30d";
}
```

Granularity choice: `7d / 30d` per-day buckets, `90d` per-week, `12m / all` per-month — keeps the chart point density readable across all presets.

### 5.2 Sales — `packages/db/src/queries/bi/sales.ts`

```ts
getSalesKpis({ since })  →  { totalRevenue, orderCount, aov, customerCount }
getSalesTrend({ since, granularity })  →  { bucket: Date, revenue, orders, aov }[]
```

Both exclude `status IN ('cancelled','refunded')`. Trend uses `date_trunc(granularity, created_at)`. Customer count = `COUNT(DISTINCT customer_id)` plus a `+ COUNT(DISTINCT guest_phone) FILTER (WHERE customer_id IS NULL)` for guest orders (avoid double-counting same guest across multiple orders by phone match).

### 5.3 Best sellers — `packages/db/src/queries/bi/best-sellers.ts`

```ts
getBestSellers({ since, sortBy: "qty" | "revenue", categoryId?, limit })  →
  { productId, slug, name, brandName, categoryName, qty, revenue }[]
```

Aggregates `order_items` joined to non-cancelled/non-refunded `orders` joined to `products` (by id) joined to `brands` and primary `categories`. `WHERE created_at >= since` (skip if since === null). Group by product. Sort by chosen metric desc.

### 5.4 Basket pairs — `packages/db/src/queries/bi/basket.ts`

```ts
getBasketPairs({ since, limit = 20 })  →
  { productAId, productAName, productBId, productBName, count, lift }[]
```

```sql
WITH co AS (
  SELECT oi1.product_id AS a, oi2.product_id AS b
  FROM order_items oi1
  JOIN order_items oi2
    ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
  JOIN orders o ON o.id = oi1.order_id
  WHERE o.status NOT IN ('cancelled','refunded')
    AND ($since::timestamptz IS NULL OR o.created_at >= $since)
),
totals AS (
  SELECT COUNT(DISTINCT o.id) AS n_orders
  FROM orders o WHERE o.status NOT IN ('cancelled','refunded')
    AND ($since::timestamptz IS NULL OR o.created_at >= $since)
),
freq AS (
  SELECT product_id, COUNT(DISTINCT o.id) AS n
  FROM order_items oi JOIN orders o ON o.id = oi.order_id
  WHERE o.status NOT IN ('cancelled','refunded')
    AND ($since::timestamptz IS NULL OR o.created_at >= $since)
  GROUP BY product_id
)
SELECT a, b,
       COUNT(*) AS pair_count,
       (COUNT(*)::float / NULLIF((fa.n::float * fb.n / t.n_orders), 0)) AS lift
FROM co
JOIN freq fa ON fa.product_id = co.a
JOIN freq fb ON fb.product_id = co.b
CROSS JOIN totals t
GROUP BY a, b, fa.n, fb.n, t.n_orders
ORDER BY pair_count DESC, lift DESC
LIMIT $limit
```

Then JOIN to products for names. Lift > 1 means "buyers of A buy B more often than chance would predict."

**Performance note:** the self-join over `order_items` is O(n²) per order; at demo scale (~20 orders, ~80 line items) it's fine. **Follow-up §13:** materialize when row count crosses several thousand orders.

### 5.5 Stock health — `packages/db/src/queries/bi/stock-health.ts`

Three independent helpers:

```ts
getTurnover({ since })  →  { productId, variantId, name, sold, currentOnHand, daysOfCover }[]
getDeadStock({ since })  →  { productId, variantId, name, currentOnHand, lastSaleAt }[]
getReorderCandidates()  →  { productId, variantId, name, onHand, reorderPoint, deficit }[]
```

`daysOfCover = currentOnHand / NULLIF(sold / NULLIF(periodDays, 0), 0)` — guards against div-by-zero. `lastSaleAt = MAX(stock_movements.performed_at WHERE type='sale')`. `deficit = reorderPoint - onHand`.

### 5.6 Cohorts — `packages/db/src/queries/bi/cohorts.ts`

```ts
getCohortsMonthly({ since })  →
  { cohortMonth: string, customers: number, ordersTotal: number,
    revenueTotal: number, repeatRate: number, ltv: number }[]
```

```sql
WITH first_order AS (
  SELECT customer_id,
         date_trunc('month', MIN(created_at)) AS cohort_month
  FROM orders
  WHERE customer_id IS NOT NULL
    AND status NOT IN ('cancelled','refunded')
  GROUP BY customer_id
),
agg AS (
  SELECT fo.cohort_month,
         o.customer_id,
         COUNT(*) AS order_count,
         SUM(o.total_tnd) AS revenue
  FROM first_order fo
  JOIN orders o ON o.customer_id = fo.customer_id
  WHERE o.status NOT IN ('cancelled','refunded')
    AND ($since::timestamptz IS NULL OR fo.cohort_month >= $since)
  GROUP BY fo.cohort_month, o.customer_id
)
SELECT cohort_month::date AS cohort_month,
       COUNT(*) AS customers,
       SUM(order_count) AS orders_total,
       SUM(revenue) AS revenue_total,
       (COUNT(*) FILTER (WHERE order_count >= 2))::float / NULLIF(COUNT(*), 0) AS repeat_rate,
       SUM(revenue) / NULLIF(COUNT(*), 0) AS ltv
FROM agg
GROUP BY cohort_month
ORDER BY cohort_month DESC
```

Cohort = month of first order. Repeat rate = share of cohort customers with ≥2 lifetime orders. LTV = average lifetime revenue per cohort customer (in TND, lifetime, not period-bounded).

### 5.7 Funnel — `packages/db/src/queries/bi/funnel.ts`

```ts
getNewsletterFunnel({ since })  →
  { subscribers, subscribersWhoOrdered, conversionRate }
```

```sql
WITH subs AS (
  SELECT email FROM newsletter_subscribers
  WHERE confirmed_at IS NOT NULL
    AND ($since::timestamptz IS NULL OR created_at >= $since)
),
ordered AS (
  SELECT DISTINCT s.email
  FROM subs s
  JOIN orders o ON
       (o.customer_id IS NOT NULL AND o.customer_id IN (
          SELECT id FROM customers WHERE email = s.email))
    OR LOWER(o.guest_email) = LOWER(s.email)
  WHERE o.status NOT IN ('cancelled','refunded')
    AND ($since::timestamptz IS NULL OR o.created_at >= $since)
)
SELECT (SELECT COUNT(*) FROM subs) AS subscribers,
       (SELECT COUNT(*) FROM ordered) AS subscribers_who_ordered;
```

`conversionRate = subscribersWhoOrdered / NULLIF(subscribers, 0)`. The newsletter signup rule is "double opt-in eventually"; for now Phase 2 sets `confirmed_at` only when explicitly confirmed (which Phase 2 doesn't do). Until that flow lands, treat any newsletter row as "subscriber". Spec follow-up §13.

### 5.8 Re-exports

`packages/db/src/queries/bi/index.ts` — `export * from "./period"; export * from "./sales"; ...`. Then add `export * from "./bi"` to `packages/db/src/queries/index.ts`.

## 6. Page layouts

### 6.1 Overview — `/decisionnel/page.tsx`

```
┌ Décisionnel  ─ [PeriodPicker: 7j 30j▼ 90j 12m Tout] ─ ┐
│ ┌─KPI──┐ ┌─KPI──┐ ┌─KPI──┐ ┌─KPI──┐ ┌─KPI──┐ ┌─KPI──┐│
│ │ CA   │ │ Cmds │ │ AOV  │ │ Nouv │ │ Fid. │ │ Conv ││
│ │ X TND│ │  N   │ │  Y   │ │ M    │ │  %   │ │  %   ││
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│ ┌──ReportCard "Tendances"────────┐  ┌──ReportCard...┐│
│ │ <Sparkline data={trend} />     │  │ <Sparkline /> ││
│ │ Voir le détail →               │  │ Voir le ...   ││
│ └────────────────────────────────┘  └───────────────┘│
│ … six total summary cards in 3×2 grid …              │
└──────────────────────────────────────────────────────┘
```

Six KPI tiles (using `Stat` from `@jasmin/ui`), six summary cards with sparkline (where applicable — basket and cohorts get a top-3 list instead of a sparkline).

### 6.2 Sales — `/decisionnel/ventes/page.tsx`

PeriodPicker + KPI strip (revenue, orders, AOV, distinct customers) + `SimpleAreaChart` of revenue over time + a `SimpleBarChart` of orders/bucket + monthly summary table.

### 6.3 Best sellers — `/decisionnel/best-sellers/page.tsx`

PeriodPicker + segmented control "Par quantité | Par chiffre d'affaires" (writes `?sortBy=`) + category filter (`?categoryId=`) + table of top-50 with row-link to `/catalogue/produits/[id]` + bar chart of top 10.

### 6.4 Basket — `/decisionnel/panier/page.tsx`

PeriodPicker + table of top-20 pair cards: each card shows product A, product B (each linked), seen-together count, lift badge.

### 6.5 Stock health — `/decisionnel/stock/page.tsx`

Three sections:
- "À réapprovisionner" — table from `getReorderCandidates`. Row link to `/stock?search={name}`.
- "Pas de vente sur la période" — table from `getDeadStock`. Same drill.
- "Rotation rapide" — top-20 by `1/daysOfCover` (i.e., low daysOfCover = fast turnover) from `getTurnover`. Same drill.

### 6.6 Cohorts — `/decisionnel/cohortes/page.tsx`

PeriodPicker (period scopes which cohort months are shown) + table: cohortMonth | customers | orders | revenue | repeatRate% | LTV. Row link to `/clients?cohort=YYYY-MM`.

### 6.7 Conversion funnel — `/decisionnel/conversion/page.tsx`

PeriodPicker + `<Funnel>` rendering two steps: subscribers → orderers, with a percentage drop. Below: explanatory copy.

## 7. Drill-through wiring

| Source | Destination |
|---|---|
| Best-seller row | `/catalogue/produits/[id]` |
| Basket pair card (each side) | `/catalogue/produits/[id]` |
| Reorder/dead/turnover row | `/stock?search=<name>` |
| Cohort row | `/clients?cohort=YYYY-MM` (filter customers whose first-order month equals the cohort) |
| Funnel subscribers count | (no destination v1; flagged in §13) |

`listCustomersForAdmin` (in `packages/db/src/queries/admin-customers.ts`) gains an optional `cohort?: string` parameter that compiles to `WHERE date_trunc('month', (SELECT MIN(created_at) FROM orders o WHERE o.customer_id = customers.id)) = $cohort::date`. Two-line addition; backwards-compatible (omitted/undefined → unchanged behavior).

## 8. RBAC

- `apps/admin/app/(authed)/decisionnel/layout.tsx` — server layout: `await getStaffSession()`; if null → `redirect('/login')`; if `role ∉ {admin, manager}` → `redirect('/')`. All sub-pages inherit.
- `AdminShell.NAV_ITEMS` — append `{ href: "/decisionnel", label: "Décisionnel", visibleTo: ["admin","manager"] }` (after Stock, before Mon compte).

## 9. Caching

| Aspect | Strategy |
|---|---|
| All BI routes | `dynamic = "force-dynamic"`, `revalidate = 0` |
| Compute | On-demand SQL (Q2 lock). At demo scale, sub-100ms; flagged as §13 follow-up |

## 10. Testing

### 10.1 Unit (`packages/db/src/queries/bi/period.test.ts` — new)

- `parsePeriod` returns `30d` for unknown / undefined input.
- `periodToInterval('7d')` returns granularity `day`, since=now-7d.
- `periodToInterval('90d')` returns granularity `week`.
- `periodToInterval('all')` returns `since=null`.

### 10.2 Schema/integration (additions to `packages/db/src/test/schema.test.ts`)

- `bi: best sellers` — seed 1 product + 2 orders (different statuses); assert qty/revenue ordering excludes cancelled, includes confirmed.
- `bi: basket pairs` — seed 3 orders, two of which contain (A, B) pair, one contains (A, C); assert the (A, B) pair ranks first by count.
- `bi: cohorts` — seed customer with 2 orders 1 month apart; assert cohortMonth = first order month, repeatRate = 1.0.
- `bi: sales kpis + trend smoke` — seed 2 confirmed orders today; assert kpi.orderCount=2, trend has at least one bucket today.
- `bi: stock health smoke` — seed product with on_hand=0 and a reorder_point=5 → appears in `getReorderCandidates`. Seed dead stock (no sales, on_hand>0) → appears in `getDeadStock`.
- `bi: funnel smoke` — seed newsletter subscriber with email matching a customer who has an order; assert conversion>0.

Each test uses unique uuids per the singleton-PGlite rule.

### 10.3 E2E

Deferred to Phase 4.5. Visual QA on demo data is sufficient for v1.

## 11. Schema/SQL deltas

**None.** All queries operate on existing tables. No new tables, no new columns, no new sequences/triggers, no new enum values, no materialized views in v1.

## 12. Phase 4 deliverables (DoD)

- [ ] All 7 BI routes (overview + 6 sub-reports) render against seeded local Supabase under admin and manager roles
- [ ] Cashier and stock roles redirected from `/decisionnel` to `/`
- [ ] PeriodPicker present on every report and works (no client JS needed beyond native form submission)
- [ ] Each chart wrapper component branded to design tokens (Playfair italic titles, deep-teal lines, jasmine fills, Plus Jakarta axis labels)
- [ ] Drill-through links land on the right CRM destination (catalog, stock, clients)
- [ ] `listCustomersForAdmin` gains the `cohort?: string` filter
- [ ] All BI query helpers covered by describe blocks in `schema.test.ts`
- [ ] Period util unit tests pass (`packages/db/src/queries/bi/period.test.ts`)
- [ ] Voice constants in `@jasmin/lib`
- [ ] Lint clean, typecheck clean, all `bun test` green
- [ ] `bun run build` for both apps succeeds (Phase-3 baseline)

## 13. Out of scope (deferred → Phase 4.5+)

- Materialized views + pg_cron / DO scheduled refresh — wire when on-demand SQL feels slow
- Forecasting / reorder-point recommendations from sales velocity
- Custom date-range picker — today: presets only
- Funnel "subscribers" count drilling into a newsletter list
- CSV / Excel export for any report
- Saved bookmarks / shareable URLs beyond the searchParams
- Per-product mini-report (qty over time, basket affinities for that product)
- Newsletter double-opt-in confirmation — until Phase 2's `confirmed_at` actually gets populated, the funnel uses every newsletter row as a subscriber
- Recharts variants (e.g., heat map for hour-of-day sales)
- E2E Playwright specs for BI

## 14. Open follow-ups

- The basket-pairs SQL self-joins `order_items`. At ~20 orders this is fine; revisit (and migrate to a materialized view) when order count crosses several thousand.
- Cohorts is calendar-month-binned; if seasonality dominates (e.g., Ramadan), consider weekly cohorts as a follow-up segmented control.
- `getNewsletterFunnel` joins by email match; if Phase 2 ever updates customers when they subscribe, switch to a foreign-key join.
- Phase 4 doesn't change Phase 3's nav order; if the section grows past Stock + Décisionnel + Audit, regroup.
