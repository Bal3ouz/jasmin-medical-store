# Phase 3 — Internal CRM Design Spec

**Project:** Jasmin Médical Store
**Phase:** 3 of 4 (Foundation ✓ → Landing+Shop ✓ → **CRM** → BI)
**Date:** 2026-04-29
**Status:** Approved (sections §1–§14 confirmed by user via brainstorm Q1–Q7)

## 1. Purpose

Build the internal back-office on top of `apps/admin` so the Jasmin team can run the store end-to-end: edit catalog, manage stock, work the order queue with a forward-only state machine, view customers, invite teammates, audit changes, and create in-store walk-in orders from a POS-lite form. The CEO demo at the end of Phase 3 must let an admin sign in, create + publish a product, see it appear on the storefront, fulfil a web order through the lifecycle, refund one, and create a walk-in sale — end-to-end on real seeded data.

This phase ships **no analytics dashboards** beyond four KPI tiles + two queue cards on `/`. Heavy BI (basket analysis, trends, cohorts, dead stock) is deferred to **Phase 4**.

## 2. Locked decisions (from brainstorm)

| Decision | Pick |
|---|---|
| Scope | **B. Full ops console** (catalog + stock + orders + customers + staff + audit + dashboard tiles + POS-lite walk-in) |
| Order state machine | **Strict-with-admin-override** — non-admins forward-only; admin can rewind/cancel/refund |
| Image upload | **Server-action pass-through** with `serverActions.bodySizeLimit: '8mb'` |
| Audit log | **Explicit `recordAudit()` helper** called inside each mutation transaction |
| Refund | **Full-order only** (no partial line-item) |
| Staff invite | **Supabase magic-link invite** + trigger-skip-on-staff-flag |
| POS-lite | Auto-confirms; payment_method `cash_on_delivery` re-labelled "Espèces"; `payment_status='paid'`; cashier+ |
| Dashboard | 4 KPI tiles + 2 queue cards |
| Tests | Bun unit + new describe blocks in `schema.test.ts` + 3 admin Playwright specs |
| Search | products via `search_vector` FTS; customers/orders via ILIKE |

## 3. Routes

```
apps/admin/app/
├── layout.tsx                    AdminShell (sidebar + topbar + role chip + signout)
├── page.tsx                      / — dashboard (4 KPI tiles + 2 queue cards)
├── globals.css                   (existing)
├── login/
│   ├── page.tsx                  (existing, extend with link to forgot)
│   ├── actions.ts                (existing signInAction; adds forgotPassword/resetPassword)
│   ├── mot-de-passe-oublie/page.tsx
│   └── reinitialiser/page.tsx
├── auth/
│   └── callback/route.ts         exchanges magic-link code → session, redirects /
├── compte/
│   └── page.tsx                  staff sets / changes own password; signs out
├── catalogue/
│   ├── produits/
│   │   ├── page.tsx              list + FTS search + brand/category filters + publish toggle
│   │   ├── nouveau/page.tsx      create form
│   │   └── [id]/page.tsx         edit (basics + variants + images + categories + SEO)
│   ├── categories/page.tsx       tree edit + reorder + create + rename + delete
│   └── marques/page.tsx          brand CRUD list
├── stock/
│   ├── page.tsx                  inventory list (sortable) + per-row "Ajuster" with reason
│   └── mouvements/page.tsx       stock_movements ledger (filterable by type, product, date)
├── commandes/
│   ├── page.tsx                  queue with status filter chips + ILIKE search on order_number
│   ├── nouvelle/page.tsx         POS-lite walk-in form (cashier+)
│   └── [orderNumber]/page.tsx    detail + state transitions + refund (admin) + internal notes
├── clients/
│   ├── page.tsx                  list + ILIKE search (email/phone/name)
│   └── [id]/page.tsx             detail (profile + addresses + orders)
├── equipe/                       admin only
│   ├── page.tsx                  list + invite form
│   └── [id]/page.tsx             role + (de)activate
├── audit/
│   └── page.tsx                  log viewer (admin only) — filter by entity / action / staff / date; cursor pagination
├── actions/
│   ├── products.ts               create/update/publish/unpublish/duplicate/delete
│   ├── variants.ts               add/update/remove/setDefault
│   ├── brands.ts                 create/update/delete (rejected if products reference brand)
│   ├── categories.ts             create/rename/move/reorder/delete (cascade-guarded)
│   ├── productImages.ts          uploadProductImage / deleteProductImage / setPrimary / reorder
│   ├── inventory.ts              adjustInventory(productOrVariantId, delta, reason)
│   ├── orders.ts                 transitionOrder, addInternalNote
│   ├── refund.ts                 refundOrder (admin only)
│   ├── walkInOrder.ts            createWalkInOrder
│   ├── customers.ts              updateCustomerProfile (no delete; deactivation Phase 3.5)
│   ├── staff.ts                  inviteStaff / updateStaffRole / setStaffActive
│   └── audit.ts                  internal helper recordAudit({tx, action, entityType, entityId, before, after})
└── components/
    └── (see §4)
```

Every admin route: `dynamic = "force-dynamic"`, `revalidate = 0`. No ISR. Admin subdomain robots already blocks indexing.

## 4. Component layers

### 4.1 New shared primitives — `packages/ui/src/components/`

Only what's reusable across web + admin (most of admin is admin-specific):

- `DataTable` (server-driven; props: columns, rows, sort, page, total, onSort, basePath, searchParams) — paginated; emits new `URLSearchParams` for sort/page; works inside RSC pages without client JS for navigation.
- `Stat` (KPI tile) — eyebrow label + headline value (Playfair) + optional delta text.
- `EmptyState` exists from Phase 2 — reused, no change.

### 4.2 Admin-only — `apps/admin/components/`

**Shell:** `AdminShell` (left sidebar with section nav + top bar with role chip + user menu + sign-out). Sidebar items conditionally rendered by role via `RoleGate`.

**Catalog:**
- `ProductForm` (name, slug auto-generated + override, brand select, primary category, multi-category chips, short_description, description, ingredients, usage, weight, has_variants toggle, sku/price when flat, compare_at_price, is_published, is_featured, meta fields). Accepts `currentRole: StaffRole` prop; when `currentRole === 'stock'`, `price_tnd` and `compare_at_price_tnd` inputs render `disabled` and the corresponding server action strips them from the payload (matches Foundation §6.2 column-level rule).
- `VariantEditor` (table-style inline rows: sku / name / price / compare_at_price / weight / is_default / display_order; add/remove buttons)
- `ImageUploader` (drag-drop multiple; per-image: preview, alt text, primary toggle, delete; sortable via display_order)
- `CategoryTree` (recursive list with expand/collapse, create-child button per node, drag-handle for reorder via onChange writing display_order)
- `BrandForm`

**Stock:**
- `InventoryTable` columns (product/variant, sku, on_hand, reserved, reorder_point, status badge, "Ajuster")
- `InventoryAdjustForm` modal (delta signed int + reason text → server action)
- `StockMovementsTable` (ledger view)

**Orders:**
- `OrderQueue` (status filter chips + DataTable)
- `OrderDetail` (header summary, line items, customer/shipping snapshot, payment, internal notes, events timeline)
- `OrderStateBadge` (color-coded by status)
- `OrderTransitionMenu` (uses `canTransition` from `@jasmin/lib`; shows only allowed next states for current role; opens confirm dialog with optional note that becomes the `order_events.notes`)
- `RefundDialog` (admin-only; explains stock-revival; confirms total amount)
- `WalkInOrderForm` (POS-lite — see §8)

**Customers:**
- `CustomerProfileCard`
- `CustomerOrdersList`
- `CustomerAddressesList`

**Team:**
- `StaffList` table
- `StaffInviteForm` (email + full_name + role select)
- `StaffRoleSelect`
- `StaffActiveToggle`

**Audit:**
- `AuditLogTable` (action / entity / staff / date; row expand → JSON diff via `<details>`)

**Dashboard:**
- `KpiTile` (uses `Stat` from packages/ui under the hood)
- `QueueCard` (e.g., pending orders list, low-stock items list — each row links to detail)

**Cross-cutting:**
- `RoleGate` (RSC; props: `roles: StaffRole[]`, `children` — returns null when current role ∉ allowed)
- `FilterChips`, `Pagination` (small UI helpers)

### 4.3 Voice constants — append to `packages/lib/src/voice.ts`

```ts
dashboardWelcome:        "Bonjour {name}, voici l'essentiel du jour.",
emptyOrdersQueue:        "Aucune commande en attente. Belle journée !",
emptyLowStock:           "Tous les rayons sont bien remplis.",
inviteSent:              "Invitation envoyée. Votre collègue recevra un lien magique.",
refundConfirmed:         "Remboursement enregistré, le stock est rétabli.",
walkInOrderCreated:      "Vente en magasin enregistrée.",
productPublished:        "Produit publié — visible sur la boutique.",
productUnpublished:      "Produit masqué — retiré de la boutique.",
variantAdded:            "Déclinaison ajoutée.",
inventoryAdjusted:       "Stock ajusté.",
auditLogEmpty:           "Aucun événement pour ces filtres.",
posPaymentLabel:         "Espèces",
```

## 5. Data flow

### 5.1 Reads (server components)

Every page queries via `createClient(process.env.SUPABASE_DB_URL)` from `@jasmin/db`. RLS is the enforced boundary; the page-level `await getStaffSession()` provides UI gating + `redirect('/login')` on no-session.

New query helpers in `packages/db/src/queries/admin-dashboard.ts`:

```ts
getTodayRevenue()             → Promise<{ totalTnd: number; orderCount: number }>
countPendingOrders()          → Promise<number>
countLowStockItems()          → Promise<number>
countPublishedProducts()      → Promise<number>
listPendingOrders(limit=8)    → Promise<OrderQueueRow[]>
listLowStockItems(limit=8)    → Promise<LowStockRow[]>
```

Catalog admin queries in `packages/db/src/queries/admin-catalog.ts`:

```ts
listProductsForAdmin({ search?, brandId?, categoryId?, published?, page, limit, sort })
getProductForEdit(id)          // joins variants, images, categories
listAllBrands(), listAllCategories()
```

Orders admin queries in `packages/db/src/queries/admin-orders.ts`:

```ts
listOrdersForAdmin({ status?, search?, page, limit, sort })
getOrderForAdmin(orderNumber)   // joins items, events, customer, addresses
```

Customers queries in `packages/db/src/queries/admin-customers.ts`:

```ts
listCustomersForAdmin({ search?, page, limit, sort })
getCustomerForAdmin(id)         // joins addresses + orders
```

Staff + audit queries in `packages/db/src/queries/admin-staff.ts` and `admin-audit.ts`:

```ts
listStaff(), getStaff(id)
listAuditLog({ entityType?, action?, staffId?, dateFrom?, dateTo?, cursor?, limit })
```

Inventory + movements in `packages/db/src/queries/admin-inventory.ts`:

```ts
listInventoryForAdmin({ search?, status?, page, limit, sort })
listStockMovements({ productId?, variantId?, type?, dateFrom?, dateTo?, page, limit })
```

All new query helpers are **pure functions of `Database`**, exported via `packages/db/src/queries/index.ts`, and tested via describe-blocks added to `packages/db/src/test/schema.test.ts` (the singleton-pglite-harness rule from CLAUDE memory still applies).

### 5.2 Writes (server actions)

All actions live under `apps/admin/app/actions/` (mirroring `apps/web` pattern). Every action:

1. `await getStaffSession()` — redirect to `/login` if null
2. Assert `session.role` ∈ allowed-for-this-action; otherwise `throw new Error('Forbidden')` (Next renders error.tsx)
3. Zod-validate `formData` (or typed args) using `@jasmin/lib` schemas (new ones in §6)
4. Re-fetch authoritative server-side data where needed (prices on walk-in, current state on order transition)
5. Wrap all DB work in `db.transaction(async tx => { ... await recordAudit(tx, {...}); })`
6. On success: `revalidatePath` for affected routes; return `{ ok: true, … }` shape
7. On Zod fail: return `{ ok: false, errors }` for `useActionState`-driven forms; on auth/permission fail: throw

Service-role client — `apps/admin/lib/supabase/service.ts` — created on demand for two narrow uses:

- `serviceRole.auth.admin.inviteUserByEmail(...)` in `inviteStaff`
- `serviceRole.storage.from('product-images').upload/remove` in `productImages` actions

Service role key lives only in `SUPABASE_SERVICE_ROLE_KEY` env var, server-only, not bundled.

### 5.3 Audit helper — `apps/admin/app/actions/audit.ts`

```ts
export async function recordAudit(
  tx: DbTransaction,
  args: {
    staffUserId: string;
    action: string;        // dot-namespaced verb: 'product.publish', 'order.refund'
    entityType: 'product' | 'variant' | 'brand' | 'category' | 'product_image'
              | 'inventory' | 'order' | 'customer' | 'staff' | 'cart' | 'newsletter';
    entityId: string;
    before?: Record<string, unknown> | null;
    after?:  Record<string, unknown> | null;
  },
): Promise<void>
```

Inserts into `audit_log`. Diff JSON shape: `{ before, after }`. Same tx as the mutation so failure rolls back the audit row.

## 6. New Zod schemas — `packages/lib/src/schemas/`

Each one is **server-side authoritative**; the form re-uses the same schema for client validation when feasible. New files:

- `product-admin.ts` — `ProductCreateSchema`, `ProductUpdateSchema`, `ProductPublishSchema`, `ProductDuplicateSchema`
- `variant.ts` — `VariantCreateSchema`, `VariantUpdateSchema`, `VariantSetDefaultSchema`
- `brand-admin.ts` — `BrandCreateSchema`, `BrandUpdateSchema`
- `category-admin.ts` — `CategoryCreateSchema`, `CategoryUpdateSchema`, `CategoryReorderSchema`
- `product-image.ts` — `ProductImageUploadSchema` (file + alt + isPrimary), `ProductImageReorderSchema`
- `inventory-adjust.ts` — `InventoryAdjustSchema` (target + delta + reason)
- `order-transition.ts` — `OrderTransitionSchema` (orderId + toStatus + note?)
- `refund.ts` — `RefundOrderSchema` (orderId + reason?)
- `walk-in-order.ts` — `WalkInOrderSchema` (lines[] + customerId | guestName/Phone)
- `staff-admin.ts` — `StaffInviteSchema` (email + fullName + role), `StaffUpdateRoleSchema`, `StaffSetActiveSchema`
- `audit-filter.ts` — `AuditFilterSchema`
- `forgot-password.ts`, `reset-password.ts` — admin self-service password recovery (admin-side mirrors of the web ones)

All exported via `packages/lib/src/schemas/index.ts` (which already exists from Phase 2 — append).

## 7. Order state machine

New module `packages/lib/src/order-state.ts`:

```ts
import type { OrderStatus, StaffRole } from "@jasmin/db/schema";

export const ORDER_TRANSITIONS: Record<OrderStatus, Partial<Record<OrderStatus, StaffRole[]>>> = {
  pending:   { confirmed: ['cashier','manager','admin'], cancelled: ['admin','manager'] },
  confirmed: { preparing: ['cashier','manager','admin'], cancelled: ['admin','manager'] },
  preparing: { shipped:   ['cashier','manager','admin'], cancelled: ['admin'] },
  shipped:   { delivered: ['cashier','manager','admin'], refunded:  ['admin'], cancelled: ['admin'] },
  delivered: { refunded:  ['admin'] },
  cancelled: {},
  refunded:  {},
};

export function canTransition(from: OrderStatus, to: OrderStatus, role: StaffRole): boolean {
  const allowedRoles = ORDER_TRANSITIONS[from]?.[to];
  return Array.isArray(allowedRoles) && allowedRoles.includes(role);
}

export function allowedNextStates(from: OrderStatus, role: StaffRole): OrderStatus[] {
  return Object.entries(ORDER_TRANSITIONS[from] ?? {})
    .filter(([, roles]) => roles!.includes(role))
    .map(([s]) => s as OrderStatus);
}
```

Server action `transitionOrder(formData)` in `apps/admin/app/actions/orders.ts`:

```
1. Zod-validate input (orderId, toStatus, note?)
2. session = getStaffSession(); assert non-null
3. tx.begin
   3a. SELECT orders FOR UPDATE WHERE id = orderId  → currentStatus
   3b. canTransition(currentStatus, toStatus, session.role) → else throw Forbidden
   3c. UPDATE orders SET status=toStatus, <statusTimestamp>=now() WHERE id
       (statusTimestamp = confirmed_at | shipped_at | delivered_at | cancelled_at)
   3d. INSERT order_events(event_type=toStatus, from_status, to_status, notes, performed_by)
   3e. recordAudit(tx, action='order.{toStatus}', entityType='order', entityId, before, after)
4. tx.commit
5. revalidatePath('/commandes', `/commandes/${orderNumber}`, '/')
```

If `toStatus === 'refunded'`, the action delegates to `refundOrder` for the stock-revival branch.

## 8. Refund flow

`refundOrder(formData)` — admin-only:

```
tx.begin
  1. SELECT order + items FOR UPDATE
  2. Assert status IN ('shipped','delivered'); else throw
  3. UPDATE orders SET status='refunded', payment_status='refunded', updated_at=now()
  4. For each line item:
     a. INSERT stock_movements(type='return', quantity=+qty, product_id|variant_id,
        reference_type='order', reference_id=orderId, performed_by=session.authUserId)
     b. UPDATE inventory SET on_hand = on_hand + qty WHERE matches
  5. INSERT order_events(event_type='refunded', from_status, to_status='refunded', notes='reason')
  6. recordAudit(tx, 'order.refund', 'order', orderId, before, after)
tx.commit
revalidatePath('/commandes', '/commandes/[orderNumber]', '/stock', '/')
```

Idempotent against re-clicks via the status-check FOR UPDATE. No partial refunds (deferred to Phase 3.5+).

## 9. POS-lite walk-in (`/commandes/nouvelle`)

Form layout:

- **Mode customer** toggle: "Client enregistré" | "Client invité"
- If registered: typeahead search over `customers` (email / full_name / phone) → picks `customer_id`
- If guest: full_name + phone fields (saved to `orders.shipping_full_name` / `shipping_phone`; `customer_id = null`, `guest_phone = phone`)
- **Lines**: searchable picker over published products + variants; each line shows current price + on-hand; qty stepper enforces ≤ on_hand client-side and re-checks server-side
- **Pickup address snapshot**: shop's own address (constants in `apps/admin/lib/shop-info.ts`) — these are walk-ins, so shipping = pickup
- **Notes**: optional internal note

Server action `createWalkInOrder(formData)`:

```
1. Zod-validate
2. session.role ∈ ['cashier','manager','admin']
3. tx:
   a. nextval('jms_order_seq') → order_number
   b. Re-fetch each product/variant price from DB (never trust form)
   c. For each line: SELECT inventory FOR UPDATE; assert on_hand >= qty
   d. INSERT orders (
        order_number,
        customer_id | guest_phone+guest_email='',
        status='confirmed', confirmed_at=now(),
        payment_method='cash_on_delivery', payment_status='paid',
        subtotal_tnd=…, shipping_tnd=0, total_tnd=…,
        shipping_*=shop address snapshot,
        notes_internal=note
      )
   e. INSERT order_items snapshots (price, name, brand, sku at order time)
   f. INSERT stock_movements (type='sale', quantity=-qty, ref order)
   g. UPDATE inventory.on_hand = on_hand - qty
   h. INSERT order_events(event_type='created') and ('confirmed') — two rows
   i. recordAudit('order.create_walkin', 'order', orderId)
4. revalidatePath('/commandes','/stock','/')
5. redirect(`/commandes/${order_number}`)
```

The action uses `payment_method='cash_on_delivery'` (the existing enum value); the **UI label** is "Espèces" (`VOICE.posPaymentLabel`). No schema enum change needed.

## 10. Image upload pipeline

### 10.1 Bucket setup (`sql/rls.sql` Phase 3 section)

```sql
INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
CREATE POLICY product_images_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS product_images_staff_write ON storage.objects;
CREATE POLICY product_images_staff_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND is_staff(ARRAY['admin','manager','stock']::staff_role[])
  );

DROP POLICY IF EXISTS product_images_staff_update ON storage.objects;
CREATE POLICY product_images_staff_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND is_staff(ARRAY['admin','manager','stock']::staff_role[])
  );

DROP POLICY IF EXISTS product_images_staff_delete ON storage.objects;
CREATE POLICY product_images_staff_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND is_staff(ARRAY['admin','manager','stock']::staff_role[])
  );
```

The server action uses the **service-role client** to upload, but the policies above keep the bucket secure if anyone else somehow obtains a staff JWT.

### 10.2 Server action `uploadProductImage(formData)`

```
1. session.role ∈ ['admin','manager','stock']
2. Validate file: mime in [jpeg,png,webp], size <= 8MB
3. path = `${productSlug}/${crypto.randomUUID()}.${ext}`
4. serviceRole.storage.from('product-images').upload(path, file, { contentType, cacheControl: '31536000', upsert: false })
5. tx:
   a. INSERT product_images(product_id, storage_path=path, alt_text, display_order=COALESCE(MAX+10, 0), is_primary=…)
   b. recordAudit('product_image.upload', 'product_image', newId)
6. revalidatePath(`/catalogue/produits/${productId}`, `/produit/${slug}`)
```

`bodySizeLimit` set to `'8mb'` in `apps/admin/next.config.ts`:

```ts
export default {
  experimental: { serverActions: { bodySizeLimit: '8mb' } },
};
```

### 10.3 Companion actions

- `deleteProductImage(imageId)` — fetch storage_path, `serviceRole.storage.remove([path])`, then DELETE row, audit, revalidate.
- `setPrimaryProductImage(imageId)` — flips `is_primary=true` on target, false on siblings of same product, audit.
- `reorderProductImages(productId, orderedIds[])` — updates `display_order` in ascending sequence, single audit row.

## 11. Staff invite flow

### 11.1 Trigger update (in `sql/rls.sql` Phase 3 section, replaces existing function body)

```sql
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Skip customers row when this is a staff invite (set via inviteUserByEmail data flag)
  IF (NEW.raw_user_meta_data ->> 'is_staff') = 'true' THEN
    RETURN NEW;
  END IF;

  INSERT INTO customers (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, customers.full_name),
    updated_at = now();
  RETURN NEW;
END;
$$;
```

Trigger binding stays the same (`AFTER INSERT ON auth.users`).

### 11.2 `inviteStaff(formData)` action

```
1. session.role === 'admin'
2. Zod-validate { email, fullName, role }
3. invite = await serviceRole.auth.admin.inviteUserByEmail(email, {
     data: { is_staff: true, full_name, role },
     redirectTo: `${SITE_URL_ADMIN}/auth/callback`,
   });
4. tx: INSERT staff_users(id=invite.user.id, email, full_name, role, is_active=true)
       + recordAudit('staff.invite', 'staff', userId, after={email, full_name, role})
5. revalidatePath('/equipe')
6. return { ok: true, message: VOICE.inviteSent }
```

**Failure recovery:** the `auth.users` insert and the `staff_users` insert run in separate connections (Supabase Auth API vs Drizzle). Wrap step 4 in a try/catch; on failure, `await serviceRole.auth.admin.deleteUser(invite.user.id)` to roll back the orphaned auth user before surfacing the error to the form.

### 11.3 `/auth/callback/route.ts`

Handles both possible Supabase invite/recovery URL formats:

```ts
// GET /auth/callback?token_hash=...&type=invite
//   or /auth/callback?code=...   (PKCE)
const tokenHash = url.searchParams.get('token_hash')
const type      = url.searchParams.get('type') as EmailOtpType | null
const code      = url.searchParams.get('code')

if (tokenHash && type) {
  await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
} else if (code) {
  await supabase.auth.exchangeCodeForSession(code)
}
return NextResponse.redirect(new URL('/', req.url))
```

After first sign-in via the magic link, the staff member is signed in. They can either keep using magic links (each subsequent login goes through "Mot de passe oublié" → email link) or set a password via `/compte` (the action calls `supabase.auth.updateUser({ password })`).

### 11.4 Forgot-password (admin)

`/login/mot-de-passe-oublie` form posts → `requestPasswordResetAction` → `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL_ADMIN}/login/reinitialiser` })`. Reset page calls `updateUser({ password })` then redirects to `/`. Mirrors the web pattern in `apps/web/app/actions/auth.ts`.

## 12. RBAC matrix (UI gating)

Server-side authority remains RLS + the per-action role assertions in §5.2. UI gating only hides what the role can't do.

| Section | admin | manager | cashier | stock |
|---|---|---|---|---|
| Dashboard `/` | ✓ | ✓ | ✓ | ✓ |
| Catalogue (read) | ✓ | ✓ | ✓ | ✓ |
| Catalogue (write — non-pricing) | ✓ | ✓ | — | ✓ |
| Catalogue (write — pricing) | ✓ | ✓ | — | hidden |
| Catalogue → Marques | ✓ | ✓ | — | — |
| Stock | ✓ | ✓ | — | ✓ |
| Commandes (read) | ✓ | ✓ | ✓ | — |
| Commandes (transitions) | ✓ all | ✓ except admin-only | ✓ forward only | — |
| Commandes nouvelle (POS) | ✓ | ✓ | ✓ | — |
| Refund | admin only | — | — | — |
| Clients | ✓ | ✓ | ✓ read | — |
| Équipe | admin only | — | — | — |
| Audit | admin only | — | — | — |
| Compte (own) | ✓ | ✓ | ✓ | ✓ |

Pricing-field gating for stock role: `ProductForm` reads role; if `stock`, the `price_tnd` / `compare_at_price_tnd` inputs render disabled and the server action strips them (matches the Foundation §6.2 spec).

## 13. Audit log

- Stored in `audit_log(id bigserial, staff_user_id uuid, action text, entity_type text, entity_id uuid, diff jsonb, performed_at timestamptz)` — already exists.
- Action verbs are dot-namespaced: `product.create | product.update | product.publish | product.unpublish | product.delete | product.duplicate | variant.create | variant.update | variant.delete | brand.create | brand.update | brand.delete | category.create | category.update | category.delete | product_image.upload | product_image.delete | product_image.set_primary | product_image.reorder | inventory.adjust | order.confirm | order.preparing | order.shipped | order.delivered | order.cancelled | order.refund | order.note | order.create_walkin | customer.update | staff.invite | staff.update_role | staff.set_active`.
- `diff` is `{ before, after }` JSON. For "create" actions, `before=null`. For "delete", `after=null`. For "publish/unpublish/set_active", just the toggled column.
- Pagination: cursor on `(performed_at desc, id desc)`. Filters: action prefix, entity_type, staff_user_id, date range.
- Viewer at `/audit` shows table + row-expand JSON diff inside `<details>` tag.

## 14. Caching, search, pagination

| Aspect | Strategy |
|---|---|
| All admin routes | `dynamic = "force-dynamic"`; no ISR |
| Products search | `to_tsquery('french', q)` matched against `products.search_vector` (already trigger-populated in Phase 2) |
| Customers search | `ILIKE '%q%'` on email / full_name / phone |
| Orders search | exact match on `order_number`; ILIKE fallback if `q` doesn't match `JMS-...` |
| Audit log | cursor-based — query LIMIT N+1, return next-cursor when N+1 returned |
| Other lists | offset-based via `?page=N&limit=20`; `DataTable` reads/writes `URLSearchParams` |
| Server-side sort | whitelisted columns only per query helper |

## 15. Schema / SQL deltas

**No table column changes.** Phase 3 modifies only:

1. `sql/rls.sql` — replace `on_auth_user_created()` body with the staff-skip variant (§11.1).
2. `sql/rls.sql` — append storage bucket + policies (§10.1).
3. (No new sequences, no new enums, no new tables.)

Existing tables already cover everything: `audit_log`, `order_events`, `stock_movements` accept type=`return`, `payment_status` accepts `'refunded'`, `order_status` accepts `'refunded'`.

## 16. Testing

### 16.1 Unit (`packages/lib/`)

- `order-state.test.ts` — table-driven test for the full transitions matrix × roles
- `voice.test.ts` already exists indirectly; voice additions don't need new tests

### 16.2 Schema/integration (`packages/db/src/test/schema.test.ts`)

Add new describe blocks (singleton-pglite-harness rule per CLAUDE memory):

- `describe('admin: order transitions')` — given seeded order at status X, action transitions correctly, writes order_events row, refuses invalid moves
- `describe('admin: refund')` — refund of delivered order increments inventory and writes return movements per line
- `describe('admin: audit log')` — recordAudit inserts row with correct shape; rolls back if outer tx aborts
- `describe('admin: inventory adjust')` — positive/negative deltas write stock_movements(type='adjustment') and update on_hand
- `describe('admin: walk-in order')` — re-fetches prices, snapshots correctly, decrements inventory
- `describe('admin: dashboard queries')` — KPIs return expected shapes against seeded fixtures

### 16.3 E2E (Playwright)

New folder `apps/admin/e2e/`. Add `pathIgnorePatterns` entry in `bunfig.toml` for it. Three specs:

1. `admin-orders.spec.ts` — admin signs in, opens an order at `pending`, transitions through `confirmed → preparing → shipped → delivered`, verifies events timeline grows.
2. `admin-product.spec.ts` — admin creates a new product, uploads an image (use a small fixture jpeg), publishes, opens storefront, verifies product card shows the uploaded image.
3. `admin-walkin.spec.ts` — cashier signs in, opens `/commandes/nouvelle`, picks a product, submits, gets redirected to the detail with `status=confirmed`, verifies inventory decremented in `/stock`.

Specs run against `bun dev` + the `jasmin-test` Supabase project (per Phase 2 setup). Admin port 3001.

## 17. Tooling / config touch-points

- `apps/admin/next.config.ts` — `experimental.serverActions.bodySizeLimit = '8mb'`; `images.remotePatterns` for `*.supabase.co`
- `bunfig.toml` — add `apps/admin/e2e/**/*` to `[test].pathIgnorePatterns`
- `apps/admin/package.json` — add `playwright` dev dep + `@types/...` if needed; add `motion` is NOT needed (admin stays fast/static)
- `apps/admin/lib/supabase/service.ts` — new file, factory for service-role client (reads `SUPABASE_SERVICE_ROLE_KEY`; `.env.example` updated to document the var)
- `apps/admin/lib/shop-info.ts` — new file, exports `SHOP_ADDRESS`, `SHOP_PHONE`, `SHOP_NAME` consts (used by walk-in snapshot + about page later)
- `packages/db/src/queries/index.ts` — re-export new admin-* query modules
- `packages/lib/src/schemas/index.ts` — re-export new schemas
- `packages/lib/src/voice.ts` — append §4.3 keys
- `packages/lib/src/order-state.ts` — new module (§7)
- Biome — likely no overrides needed; if `noUselessElse` or similar fires on RoleGate/transition machine, scope a narrow override matching CLAUDE-memory pattern.

## 18. Phase 3 deliverables (definition-of-done)

- [ ] All routes in §3 render against seeded local Supabase under each of the 4 roles, with proper UI gating
- [ ] All admin server actions implemented, transactional, Zod-validated, audit-logged
- [ ] `recordAudit()` helper covers every mutation in §13
- [ ] Order state machine in `@jasmin/lib/order-state.ts` + `transitionOrder` action + UI menu
- [ ] Refund flow revives inventory and writes return movements + events
- [ ] Image upload end-to-end (file → bucket → row → storefront card displays it)
- [ ] Staff invite end-to-end (invite email sent → magic-link callback → first sign-in → staff_users row exists, customers row absent)
- [ ] Walk-in flow decrements inventory atomically and creates `confirmed/paid` order
- [ ] Dashboard `/` shows 4 KPI tiles + 2 queue cards with live data
- [ ] Audit viewer paginates and filters
- [ ] `sql/rls.sql` Phase-3 section appended (trigger update + storage policies)
- [ ] Lint clean (Biome), typecheck clean (every package), all `bun test` green
- [ ] Three new admin Playwright specs pass against `bun dev` + `jasmin-test`
- [ ] `bun build` succeeds for `apps/admin`
- [ ] Voice constants merged into `@jasmin/lib`

## 19. Out of scope (deferred)

- Partial line-item refunds → Phase 3.5
- CSV product import / supplier deliveries via UI → Phase 3.5 (today: SQL only)
- Outbound email/SMS to customers on state change → Phase 3.5 with Resend (web order confirmation also still pending)
- Soft-delete of products / customers → today: `is_published=false` and `is_active=false` flags, no purge
- Multi-warehouse / locations on inventory → Phase 4+
- Coupons / discounts / loyalty → backlog
- Barcode scanner support on POS-lite → backlog
- Print-friendly invoice / packing slip → Phase 3.5
- Advanced inventory forecasting → Phase 4 BI
- Sentry/Logflare wiring → backlog

## 20. Open follow-ups (re-visit at Phase 4)

- Whether to materialize the four KPI numbers via a refresh-on-write trigger or compute on every page load (today: per-request; Phase 4 may add `mv_admin_dashboard`).
- Whether `audit_log.diff` JSONB should be GIN-indexed for the viewer's filter — defer until viewer feels slow.
- Whether `stock_movements` for refunds should reference the original sale movement (chained ledger) — not needed for v1; consider during BI.
- The Phase-2 web `requestPasswordResetAction` redirects to `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?type=recovery`, which lands the user on Supabase's hosted page rather than the app's own `/compte/reinitialiser`. Phase 3's admin equivalent uses `${SITE_URL_ADMIN}/login/reinitialiser` (correct). Worth aligning the web action when revisiting auth UX.
