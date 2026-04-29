"use client";
import { useRouter, useSearchParams } from "next/navigation";

const SORTS = [
  { value: "newest", label: "Nouveautés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
] as const;

export function FilterToolbar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "newest";

  return (
    <div className="flex items-center justify-between gap-4 border-b border-linen pb-4">
      <span className="font-[var(--font-body)] text-sm text-warm-taupe-soft">
        {resultCount} {resultCount > 1 ? "produits" : "produit"}
      </span>
      <label className="flex items-center gap-3 font-[var(--font-label)] text-xs uppercase tracking-[0.18em] text-warm-taupe-soft">
        Trier
        <select
          value={current}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            next.set("sort", e.target.value);
            router.replace(`?${next.toString()}`, { scroll: false });
          }}
          className="rounded-pill bg-linen px-4 py-2 font-[var(--font-body)] text-sm tracking-normal text-warm-taupe focus:outline-none focus:ring-2 focus:ring-deep-teal/30"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
