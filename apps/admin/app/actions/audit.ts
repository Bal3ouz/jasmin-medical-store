import type { DbTransaction } from "@jasmin/db";
import { auditLog } from "@jasmin/db/schema";

/**
 * The set of entity types currently audited by the admin app.
 *
 * Keep this list in lockstep with the action verbs documented in the
 * Phase 3 spec §13. Adding a new entity here is the only place to widen
 * the union.
 */
export type AuditEntityType =
  | "product"
  | "variant"
  | "brand"
  | "category"
  | "product_image"
  | "inventory"
  | "order"
  | "customer"
  | "staff"
  | "cart"
  | "newsletter";

export interface RecordAuditArgs {
  /** The staff user performing the action. Must exist in `staff_users`. */
  staffUserId: string;
  /** Dot-namespaced verb, e.g. "product.publish", "order.refund". */
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * Insert one row into `audit_log`, scoped to a caller-provided transaction.
 *
 * Always pass the same `tx` that owns the surrounding mutation so the audit
 * row commits/rolls back atomically with the change it describes.
 */
export async function recordAudit(tx: DbTransaction, args: RecordAuditArgs): Promise<void> {
  await tx.insert(auditLog).values({
    staffUserId: args.staffUserId,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId,
    diff: { before: args.before ?? null, after: args.after ?? null },
  });
}
