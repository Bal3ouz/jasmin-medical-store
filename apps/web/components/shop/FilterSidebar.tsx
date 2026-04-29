import type { Brand } from "@jasmin/db";
import { LabelEyebrow } from "@jasmin/ui";
import Link from "next/link";

export function FilterSidebar({
  brands,
  activeCategorySlug,
  activeBrandSlug,
}: {
  brands: Brand[];
  activeCategorySlug?: string;
  activeBrandSlug?: string;
}) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        <LabelEyebrow>Filtrer</LabelEyebrow>
        <section>
          <h3 className="font-[var(--font-display)] text-lg text-deep-teal">Marques</h3>
          <ul className="mt-3 space-y-2 font-[var(--font-body)] text-sm text-warm-taupe">
            {brands.map((b) => {
              const active = b.slug === activeBrandSlug;
              const href = activeCategorySlug
                ? `/boutique/${activeCategorySlug}?brand=${b.slug}`
                : `/boutique?brand=${b.slug}`;
              return (
                <li key={b.id}>
                  <Link
                    href={href}
                    className={
                      active
                        ? "text-deep-teal underline underline-offset-4"
                        : "transition-colors hover:text-deep-teal"
                    }
                  >
                    {b.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </aside>
  );
}
