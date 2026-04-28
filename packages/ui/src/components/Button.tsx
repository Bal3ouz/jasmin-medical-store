import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 font-[var(--font-label)] font-medium tracking-wide transition-transform duration-300 ease-out hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-sand",
  {
    variants: {
      variant: {
        "primary-teal": "bg-deep-teal text-cream-sand hover:bg-deep-teal-dark shadow-soft",
        jasmine: "bg-jasmine text-warm-taupe hover:bg-jasmine-dark shadow-soft",
        outline: "border border-deep-teal/30 text-deep-teal hover:bg-linen",
        ghost: "text-deep-teal hover:bg-linen",
        link: "text-deep-teal underline underline-offset-4 hover:text-deep-teal-dark",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-pill",
        md: "h-11 px-6 text-base rounded-pill",
        lg: "h-14 px-8 text-base rounded-pill",
      },
    },
    defaultVariants: { variant: "primary-teal", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild, variant, size, className, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...rest} />;
});
