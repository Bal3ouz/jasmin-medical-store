import { cn } from "../cn";
import { JasmineSprig } from "./JasmineSprig";

export interface ProductImageFallbackProps {
  productName: string;
  brandName?: string;
  className?: string;
}

export function ProductImageFallback({
  productName,
  brandName,
  className,
}: ProductImageFallbackProps) {
  return (
    <div
      role="img"
      aria-label={`${brandName ? `${brandName} — ` : ""}${productName}`}
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-cream-sand",
        className,
      )}
    >
      <JasmineSprig className="absolute inset-0 m-auto h-1/2 w-1/2 text-jasmine opacity-30" />
      <div className="relative z-10 flex flex-col items-center gap-1 px-6 text-center">
        {brandName && (
          <span className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.32em] text-deep-teal/70">
            {brandName}
          </span>
        )}
        <span className="font-[var(--font-display)] text-base italic text-warm-taupe">
          {productName}
        </span>
      </div>
    </div>
  );
}
