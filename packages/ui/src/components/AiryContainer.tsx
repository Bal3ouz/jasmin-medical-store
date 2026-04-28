import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export function AiryContainer({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("bg-cream-sand text-warm-taupe", className)} {...rest} />;
}
