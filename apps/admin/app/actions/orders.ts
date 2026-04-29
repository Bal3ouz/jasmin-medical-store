"use server";

import { getStaffSession } from "@/lib/auth";
import { type Database, createClient } from "@jasmin/db";
import { orderEvents, orders } from "@jasmin/db/schema";
import {
  type OrderStatus,
  STATUS_TIMESTAMP_COLUMN,
  type StaffRole,
  canTransition,
} from "@jasmin/lib";
import { OrderTransitionSchema } from "@jasmin/lib/schemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAudit } from "./audit";

/**
 * Lazily build a DB client. Missing `SUPABASE_DB_URL` is reported as a
 * thrown error at use-site — the page-side guard renders a friendlier
 * message before we ever reach the action.
 */
function db() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL not set");
  return createClient(url);
}

/* -------------------------------------------------------------------------- */
/* transitionOrderCore — exported standalone for tests                        */
/* -------------------------------------------------------------------------- */

export interface TransitionParams {
  orderId: string;
  toStatus: OrderStatus;
  role: StaffRole;
  staffUserId: string;
  note?: string | null;
}

/**
 * Maps the camelCased Drizzle column names that match the
 * `confirmed_at | shipped_at | delivered_at | cancelled_at` snake_case
 * columns. Drizzle's `.set({ confirmedAt: ... })` form accepts the JS-side
 * key, so we route the runtime string from `STATUS_TIMESTAMP_COLUMN` through
 * this map to keep both sides in lockstep.
 */
const TIMESTAMP_KEY: Partial<
  Record<OrderStatus, "confirmedAt" | "shippedAt" | "deliveredAt" | "cancelledAt">
> = {
  confirmed: "confirmedAt",
  shipped: "shippedAt",
  delivered: "deliveredAt",
  cancelled: "cancelledAt",
};

/**
 * Apply a state-machine transition to an order. The whole flow runs inside a
 * single transaction so the status update, timestamp bump, `order_events`
 * row, and audit-log entry commit/rollback together.
 *
 * `database` is passed in (rather than reaching for a module-level singleton)
 * so unit tests can substitute the shared PGlite database fixture.
 *
 * The `refunded` branch dynamically imports `./refund` so Task 6.3's refund
 * implementation can land later without forcing this file to know about
 * stock-revival semantics. Until that file exists we throw the documented
 * "lands in Task 6.3" error.
 */
export async function transitionOrderCore(database: Database, p: TransitionParams) {
  return database.transaction(async (tx) => {
    const lockedRows = await tx.select().from(orders).where(eq(orders.id, p.orderId)).for("update");
    const current = lockedRows[0];
    if (!current) throw new Error("Order not found");

    if (!canTransition(current.status, p.toStatus, p.role)) {
      throw new Error(`Forbidden transition ${current.status} → ${p.toStatus} for role ${p.role}`);
    }

    if (p.toStatus === "refunded") {
      // Delegate to refundOrderCore so the refund branch handles stock
      // revival. The runtime-built specifier keeps TypeScript from chasing
      // ./refund (which does not exist until Task 6.3 ships) while Bun /
      // Node still resolve the module normally if it does exist.
      const refundSpecifier = `./${"refund"}`;
      let refundOrderCore:
        | ((
            tx: unknown,
            params: { orderId: string; staffUserId: string; reason: string | null },
          ) => Promise<unknown>)
        | undefined;
      try {
        const mod = (await import(refundSpecifier)) as {
          refundOrderCore: NonNullable<typeof refundOrderCore>;
        };
        refundOrderCore = mod.refundOrderCore;
      } catch {
        throw new Error("Refund flow lands in Task 6.3");
      }
      if (!refundOrderCore) {
        throw new Error("Refund flow lands in Task 6.3");
      }
      return refundOrderCore(tx, {
        orderId: p.orderId,
        staffUserId: p.staffUserId,
        reason: p.note ?? null,
      });
    }

    const tsColumn = STATUS_TIMESTAMP_COLUMN[p.toStatus];
    const setObj: Record<string, unknown> = {
      status: p.toStatus,
      updatedAt: new Date(),
    };
    if (tsColumn) {
      const key = TIMESTAMP_KEY[p.toStatus];
      if (key) setObj[key] = new Date();
    }

    const [updated] = await tx
      .update(orders)
      .set(setObj)
      .where(eq(orders.id, p.orderId))
      .returning();

    await tx.insert(orderEvents).values({
      orderId: p.orderId,
      eventType: p.toStatus,
      fromStatus: current.status,
      toStatus: p.toStatus,
      notes: p.note ?? null,
      performedBy: p.staffUserId,
    });

    await recordAudit(tx, {
      staffUserId: p.staffUserId,
      action: `order.${p.toStatus}`,
      entityType: "order",
      entityId: p.orderId,
      before: { status: current.status },
      after: { status: p.toStatus },
    });

    return updated;
  });
}

/* -------------------------------------------------------------------------- */
/* Server-action wrappers                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Form-action shim around `transitionOrderCore`. Bound directly to
 * `<form action={...}>` so the contract is `Promise<void>` — Next.js refuses
 * action functions that return non-void payloads when wired this way. The
 * caller observes success/failure via the page re-render driven by
 * `revalidatePath`. Errors are re-thrown so Next.js surfaces them in the
 * standard error boundary.
 */
export async function transitionOrderAction(formData: FormData): Promise<void> {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");

  const parsed = OrderTransitionSchema.safeParse({
    orderId: formData.get("orderId"),
    toStatus: formData.get("toStatus"),
    note: formData.get("note") || null,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    throw new Error(
      flat.formErrors[0] ?? Object.values(flat.fieldErrors).flat()[0] ?? "Invalid input",
    );
  }

  await transitionOrderCore(db(), {
    orderId: parsed.data.orderId,
    toStatus: parsed.data.toStatus,
    note: parsed.data.note ?? null,
    role: session.role,
    staffUserId: session.authUserId,
  });

  const orderNumber = formData.get("orderNumber");
  revalidatePath("/commandes");
  if (orderNumber) revalidatePath(`/commandes/${String(orderNumber)}`);
  revalidatePath("/");
}

/* -------------------------------------------------------------------------- */
/* addInternalNoteAction — append a note-only event                           */
/* -------------------------------------------------------------------------- */

/**
 * Append a note-only entry to `order_events` (no status change). Useful for
 * staff communication / hand-offs that aren't bound to a transition.
 *
 * Returns `Promise<void>` for the same reason as `transitionOrderAction` —
 * the contract for direct `<form action>` bindings.
 */
export async function addInternalNoteAction(formData: FormData): Promise<void> {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");

  const orderId = String(formData.get("orderId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!orderId || !note) throw new Error("Note vide");

  await db().transaction(async (tx) => {
    await tx.insert(orderEvents).values({
      orderId,
      eventType: "note",
      notes: note,
      performedBy: session.authUserId,
    });
    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: "order.note",
      entityType: "order",
      entityId: orderId,
      after: { note },
    });
  });

  const orderNumber = formData.get("orderNumber");
  if (orderNumber) revalidatePath(`/commandes/${String(orderNumber)}`);
}
