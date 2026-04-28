import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-linen px-4 text-base font-[var(--font-body)] text-warm-taupe placeholder:text-warm-taupe-soft transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40",
          "disabled:opacity-50",
          className,
        )}
        {...rest}
      />
    );
  },
);
