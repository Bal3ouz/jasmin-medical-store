import { cn } from "../cn";

export interface LogoProps {
  variant?: "default" | "cream";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ variant = "default", size = "md", className }: LogoProps) {
  const colour = variant === "cream" ? "text-cream-sand" : "text-deep-teal";
  const wordmarkSize = { sm: "text-2xl", md: "text-3xl", lg: "text-5xl" }[size];
  const subSize = { sm: "text-[9px]", md: "text-[10px]", lg: "text-xs" }[size];
  return (
    <div className={cn("inline-flex flex-col leading-none", colour, className)}>
      <span className={cn("font-[var(--font-display)] italic font-medium", wordmarkSize)}>
        Jasmin
      </span>
      <span
        className={cn(
          "font-[var(--font-label)] tracking-[0.32em] uppercase opacity-80 mt-0.5",
          subSize,
        )}
      >
        Médical Store
      </span>
    </div>
  );
}
