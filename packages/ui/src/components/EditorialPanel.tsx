import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export function EditorialPanel({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("bg-cream-sand text-warm-taupe", "px-8 py-16 lg:px-24 lg:py-24", className)}
      {...rest}
    />
  );
}
