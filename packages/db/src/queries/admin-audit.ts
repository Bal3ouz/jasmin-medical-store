import { type SQL, and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import type { Database } from "../client";
import { auditLog, staffUsers } from "../schema";

export interface ListAuditLogParams {
  entityType?: string | null;
  action?: string | null;
  staffUserId?: string | null;
  /** ISO-8601 string parsed to Date by the caller. */
  dateFrom?: string | null;
  dateTo?: string | null;
  /** Base64-encoded `{performedAt, id}` from a previous page's `nextCursor`. */
  cursor?: string | null;
  limit: number;
}

export interface AuditLogRow {
  id: number;
  staffUserId: string | null;
  staffEmail: string | null;
  staffFullName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  diff: unknown;
  performedAt: Date;
}

export interface ListAuditLogResult {
  rows: AuditLogRow[];
  nextCursor: string | null;
}

/**
 * Decode a base64 cursor token. Returns `null` for missing/invalid input
 * so the caller can fall back to "first page" semantics on a corrupted
 * URL parameter without 500-ing.
 */
function decodeCursor(token: string | null | undefined): { performedAt: Date; id: number } | null {
  if (!token) return null;
  try {
    const json = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (typeof json?.performedAt !== "string" || typeof json?.id !== "number") return null;
    const performedAt = new Date(json.performedAt);
    if (Number.isNaN(performedAt.getTime())) return null;
    return { performedAt, id: json.id };
  } catch {
    return null;
  }
}

function encodeCursor(performedAt: Date, id: number): string {
  return Buffer.from(JSON.stringify({ performedAt: performedAt.toISOString(), id })).toString(
    "base64url",
  );
}

/**
 * Cursor-paginated audit log read.
 *
 * Sort key is `(performed_at desc, id desc)` — `id` is the bigserial PK so
 * within the same microsecond it produces a stable, unambiguous ordering.
 * The cursor encodes both fields and the `WHERE` clause uses the standard
 * "less-than tuple" comparison rewritten as
 *   `(performed_at < c.performedAt) OR (performed_at = c.performedAt AND id < c.id)`
 * which Postgres can satisfy from the `(entity_type, entity_id, performed_at)`
 * + bigserial PK indexes without sorting the whole table.
 *
 * Filters:
 *  - `entityType`, `staffUserId`: exact match
 *  - `action`: exact match (Phase 3 — prefix variant deferred to Phase 4)
 *  - `dateFrom`/`dateTo`: inclusive bounds on `performed_at`
 *
 * The function fetches `limit + 1` rows so we can detect whether another
 * page exists without a separate `count(*)` round-trip.
 */
export async function listAuditLog(
  db: Database,
  p: ListAuditLogParams,
): Promise<ListAuditLogResult> {
  const conditions: SQL[] = [];

  if (p.entityType) conditions.push(eq(auditLog.entityType, p.entityType));
  if (p.action) conditions.push(eq(auditLog.action, p.action));
  if (p.staffUserId) conditions.push(eq(auditLog.staffUserId, p.staffUserId));

  if (p.dateFrom) {
    const d = new Date(p.dateFrom);
    if (!Number.isNaN(d.getTime())) conditions.push(gte(auditLog.performedAt, d));
  }
  if (p.dateTo) {
    const d = new Date(p.dateTo);
    if (!Number.isNaN(d.getTime())) conditions.push(lte(auditLog.performedAt, d));
  }

  const c = decodeCursor(p.cursor);
  if (c) {
    const tuple = or(
      sql`${auditLog.performedAt} < ${c.performedAt}`,
      and(sql`${auditLog.performedAt} = ${c.performedAt}`, sql`${auditLog.id} < ${c.id}`),
    );
    if (tuple) conditions.push(tuple);
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const limit = Math.max(1, p.limit);

  const raw = await db
    .select({
      id: auditLog.id,
      staffUserId: auditLog.staffUserId,
      staffEmail: staffUsers.email,
      staffFullName: staffUsers.fullName,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      diff: auditLog.diff,
      performedAt: auditLog.performedAt,
    })
    .from(auditLog)
    .leftJoin(staffUsers, eq(staffUsers.id, auditLog.staffUserId))
    .where(where)
    .orderBy(desc(auditLog.performedAt), desc(auditLog.id))
    .limit(limit + 1);

  const hasNext = raw.length > limit;
  const rows = hasNext ? raw.slice(0, limit) : raw;
  const last = rows[rows.length - 1];
  const nextCursor = hasNext && last ? encodeCursor(last.performedAt, last.id) : null;

  return { rows, nextCursor };
}
