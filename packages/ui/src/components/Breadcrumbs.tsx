import Link from "next/link";
import { Fragment } from "react";
import { cn } from "../cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn(
        "font-[var(--font-label)] text-xs uppercase tracking-[0.18em] text-warm-taupe-soft",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li>
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-deep-teal transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className="text-deep-teal">
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden className="text-warm-taupe-soft/50">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
