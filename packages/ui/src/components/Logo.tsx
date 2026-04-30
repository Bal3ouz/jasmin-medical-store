import { cn } from "../cn";

export interface LogoProps {
  /** @deprecated The image asset is the same regardless of variant. Kept so existing callers compile; pick a dark surface for legibility. */
  variant?: "default" | "cream";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Brand wordmark — `apps/{web,admin}/public/brand/logo-white.png`.
 *
 * The asset is white script on transparent — only legible on a dark surface
 * (deep-teal works best). Callers must place this on a dark backdrop.
 */
const SIZE_HEIGHT = { sm: "h-10", md: "h-14", lg: "h-20" } as const;

export function Logo({ size = "md", className }: LogoProps) {
  return (
    // biome-ignore lint/performance/noImgElement: shared package can't use next/image
    <img
      src="/brand/logo-white.png"
      alt="Jasmin Médical Store"
      className={cn(SIZE_HEIGHT[size], "w-auto select-none", className)}
      draggable={false}
    />
  );
}
