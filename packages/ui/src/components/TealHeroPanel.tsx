import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export function TealHeroPanel({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-deep-teal text-cream-sand",
        "min-h-[75vh] px-8 py-16 lg:px-24",
        className,
      )}
      {...rest}
    />
  );
}
