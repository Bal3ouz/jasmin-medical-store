import type { AuditLogRow } from "@jasmin/db/queries";
import { VOICE } from "@jasmin/lib";

/**
 * Row-expand audit table.
 *
 * Server-only — there's no client-side state. Each row is wrapped in a
 * `<details>` element so the diff JSON pretty-print stays collapsed by
 * default; opening the disclosure reveals a `<pre>` of the formatted
 * before/after payload.
 *
 * The table layout intentionally mirrors the rest of the admin DataTable
 * styling (cream-sand bg, linen separators) without using DataTable
 * itself, because DataTable doesn't model row expansion.
 */
export function AuditLogTable({ rows }: { rows: AuditLogRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-cream-sand p-12 text-center text-warm-taupe-soft text-sm shadow-soft">
        {VOICE.auditLogEmpty}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-cream-sand shadow-soft">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-warm-taupe-soft">
            <th className="px-4 py-3">Quand</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Entité</th>
            <th className="px-4 py-3">Acteur</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-linen align-top">
              <td className="px-4 py-3 text-warm-taupe-soft text-xs">
                {new Date(r.performedAt).toLocaleString("fr-TN", {
                  dateStyle: "short",
                  timeStyle: "medium",
                })}
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-deep-teal text-xs">{r.action}</span>
              </td>
              <td className="px-4 py-3 text-warm-taupe text-xs">
                <div>{r.entityType}</div>
                <div className="font-mono text-warm-taupe-soft text-[10px]">{r.entityId}</div>
              </td>
              <td className="px-4 py-3 text-warm-taupe text-xs">
                {r.staffFullName ?? "—"}
                {r.staffEmail ? (
                  <div className="text-warm-taupe-soft text-[10px]">{r.staffEmail}</div>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <details>
                  <summary className="cursor-pointer text-deep-teal text-xs">Voir le diff</summary>
                  <pre className="mt-2 max-w-md overflow-x-auto rounded-lg bg-linen/60 p-3 text-[11px] text-warm-taupe">
                    {JSON.stringify(r.diff, null, 2)}
                  </pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
