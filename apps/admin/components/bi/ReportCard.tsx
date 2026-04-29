import { cn } from "@jasmin/ui";

export function ReportCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl bg-cream-sand p-6 shadow-soft", className)}>
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-deep-teal italic">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-warm-taupe-soft">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      <div className="mt-6">{children}</div>
    </section>
  );
}
