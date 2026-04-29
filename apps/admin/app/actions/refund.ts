"use server";

import { getStaffSession } from "@/lib/auth";
import { type Database, type DbTransaction, createClient } from "@jasmin/db";
import { inventory, orderEvents, orderItems, orders, stockMovements } from "@jasmin/db/schema";
import { RefundOrderSchema } from "@jasmin/lib/schemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAudit } from "./audit";

/**
 * Lazily build a DB client. Missing `SUPABASE_DB_URL` throws at use-site —
 * the page-side guard renders a friendlier message before we ever reach
 * the action.
 */
function db(): Database {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL not set");
  return createClient(url);
}

export interface RefundParams {
  orderId: string;
  staffUserId: string;
  reason?: string | null;
}

/* -------------------------------------------------------------------------- */
/* refundOrderCore — exported standalone for tests and for delegation from    */
/* `transitionOrderCore` (Task 6.2). Takes an *already-open* `tx` rather than */
/* a `Database`, because the caller (either `refundOrderAction` here, or the  */
/* state-machine transition) owns the surrounding transaction.                */
/* -------------------------------------------------------------------------- */

export async function refundOrderCore(tx: DbTransaction, p: RefundParams) {
  // 1. Lock the order row.
  const lockedRows = await tx.select().from(orders).where(eq(orders.id, p.orderId)).for("update");
  const current = lockedRows[0];
  if (!current) throw new Error("Order not found");

  // 2. Only `shipped` and `delivered` orders are refundable. Idempotent
  //    against re-clicks because the second pass sees `status='refunded'`
  //    and bails here.
  if (!["shipped", "delivered"].includes(current.status)) {
    throw new Error("Refund only allowed from shipped or delivered");
  }

  // 3. Pull every line item once — we revive inventory per line.
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, p.orderId));

  // 4. For each line: write a `return` stock movement and bump on_hand.
  for (const it of items) {
    await tx.insert(stockMovements).values({
      productId: it.variantId ? null : it.productId,
      variantId: it.variantId ?? null,
      type: "return",
      quantity: it.quantity,
      referenceType: "order",
      referenceId: p.orderId,
      notes: `refund ${current.orderNumber}`,
      performedBy: p.staffUserId,
    });

    if (it.variantId) {
      const lockedInv = await tx
        .select()
        .from(inventory)
        .where(eq(inventory.variantId, it.variantId))
        .for("update");
      const inv = lockedInv[0];
      if (inv) {
        await tx
          .update(inventory)
          .set({ onHand: inv.onHand + it.quantity, updatedAt: new Date() })
          .where(eq(inventory.id, inv.id));
      }
    } else {
      const lockedInv = await tx
        .select()
        .from(inventory)
        .where(eq(inventory.productId, it.productId))
        .for("update");
      const inv = lockedInv[0];
      if (inv) {
        await tx
          .update(inventory)
          .set({ onHand: inv.onHand + it.quantity, updatedAt: new Date() })
          .where(eq(inventory.id, inv.id));
      }
    }
  }

  // 5. Flip status + payment_status; bump updatedAt for the change-feed
  //    consumers (revalidate, etc.).
  const [updated] = await tx
    .update(orders)
    .set({
      status: "refunded",
      paymentStatus: "refunded",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, p.orderId))
    .returning();

  // 6. Audit trail event.
  await tx.insert(orderEvents).values({
    orderId: p.orderId,
    eventType: "refunded",
    fromStatus: current.status,
    toStatus: "refunded",
    notes: p.reason ?? null,
    performedBy: p.staffUserId,
  });

  // 7. Audit-log row inside the same tx so it rolls back on failure.
  await recordAudit(tx, {
    staffUserId: p.staffUserId,
    action: "order.refund",
    entityType: "order",
    entityId: p.orderId,
    before: { status: current.status, paymentStatus: current.paymentStatus },
    after: { status: "refunded", paymentStatus: "refunded" },
  });

  return updated!;
}

/* -------------------------------------------------------------------------- */
/* refundOrderAction — server-action wrapper bound to the RefundDialog form. */
/* Returns Promise<void>; errors bubble to the nearest error.tsx so the      */
/* dialog re-renders without state.                                          */
/* -------------------------------------------------------------------------- */

export async function refundOrderAction(formData: FormData): Promise<void> {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");
  if (session.role !== "admin") throw new Error("Forbidden");

  const parsed = RefundOrderSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason") || null,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    throw new Error(
      flat.formErrors[0] ?? Object.values(flat.fieldErrors).flat()[0] ?? "Invalid input",
    );
  }

  await db().transaction(async (tx) => {
    await refundOrderCore(tx, {
      orderId: parsed.data.orderId,
      staffUserId: session.authUserId,
      reason: parsed.data.reason ?? null,
    });
  });

  const orderNumber = formData.get("orderNumber");
  revalidatePath("/commandes");
  if (orderNumber) revalidatePath(`/commandes/${String(orderNumber)}`);
  revalidatePath("/stock");
  revalidatePath("/");
}
