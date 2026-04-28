import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export function H1Editorial({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "font-[var(--font-display)] italic font-medium",
        "text-5xl leading-[1.05] sm:text-6xl lg:text-[7.5rem]",
        "tracking-[-0.01em]",
        className,
      )}
      {...rest}
    />
  );
}

export function H2Section({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-[var(--font-display)] font-semibold",
        "text-3xl lg:text-5xl",
        "tracking-[-0.005em] text-deep-teal",
        className,
      )}
      {...rest}
    />
  );
}

export function H3Card({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-[var(--font-display)] font-medium text-lg lg:text-xl text-warm-taupe",
        className,
      )}
      {...rest}
    />
  );
}

export function BodyText({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "font-[var(--font-body)] text-base leading-[1.6] text-warm-taupe",
        className,
      )}
      {...rest}
    />
  );
}

export function LabelEyebrow({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-[var(--font-label)] text-xs font-medium uppercase tracking-[0.24em] text-deep-teal/80",
        className,
      )}
      {...rest}
    />
  );
}
