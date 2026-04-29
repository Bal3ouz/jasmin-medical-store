import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "../cn";

export interface Column<Row> {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
  sortKey?: string; // when set, header becomes a sort link
  className?: string;
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  rowHref?: (row: Row) => string; // when set, row is clickable
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  emptyState?: ReactNode;
  className?: string;
}

function buildUrl(basePath: string, params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
  const q = usp.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  rowHref,
  page,
  pageSize,
  total,
  basePath,
  searchParams,
  emptyState,
  className,
}: DataTableProps<Row>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const sort = searchParams.sort;

  return (
    <div className={cn("rounded-2xl bg-cream-sand p-1 shadow-soft", className)}>
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-warm-taupe-soft">
            {columns.map((c) => {
              if (!c.sortKey) {
                return (
                  <th key={c.key} className={cn("px-4 py-3", c.className)}>
                    {c.header}
                  </th>
                );
              }
              const next =
                sort === c.sortKey
                  ? `-${c.sortKey}`
                  : sort === `-${c.sortKey}`
                    ? undefined
                    : c.sortKey;
              return (
                <th key={c.key} className={cn("px-4 py-3", c.className)}>
                  <Link
                    href={buildUrl(basePath, {
                      ...searchParams,
                      sort: next,
                      page: "1",
                    })}
                    className="hover:text-deep-teal"
                  >
                    {c.header}
                    {sort === c.sortKey ? " ▲" : sort === `-${c.sortKey}` ? " ▼" : ""}
                  </Link>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16 text-center">
                {emptyState ?? <span className="text-warm-taupe-soft">Aucun résultat.</span>}
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const key = rowKey(r);
              const inner = columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                  {c.cell(r)}
                </td>
              ));
              if (rowHref) {
                return (
                  <tr key={key} className="border-t border-linen hover:bg-linen/40">
                    <td colSpan={columns.length} className="p-0">
                      <Link
                        href={rowHref(r)}
                        className="grid w-full"
                        style={{
                          gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))`,
                        }}
                      >
                        {inner}
                      </Link>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={key} className="border-t border-linen hover:bg-linen/40">
                  {inner}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between px-4 py-3 text-xs text-warm-taupe-soft">
        <div>
          {total === 0
            ? "0"
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} sur ${total}`}
        </div>
        <div className="flex gap-3">
          {page > 1 ? (
            <Link
              href={buildUrl(basePath, {
                ...searchParams,
                page: String(page - 1),
              })}
            >
              ← Précédent
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={buildUrl(basePath, {
                ...searchParams,
                page: String(page + 1),
              })}
            >
              Suivant →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
