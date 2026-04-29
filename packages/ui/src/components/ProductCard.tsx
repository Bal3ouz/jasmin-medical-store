import Image from "next/image";
import Link from "next/link";
import { cn } from "../cn";
import { Pill } from "./Pill";
import { PriceTag } from "./PriceTag";
import { ProductImageFallback } from "./ProductImageFallback";

export interface ProductCardData {
  slug: string;
  name: string;
  brandName: string;
  priceTnd: number | string | null;
  compareAtPriceTnd?: number | string | null;
  imageUrl: string | null;
  imageAlt?: string | null;
  stockStatus: "in_stock" | "low" | "out";
  hasVariants: boolean;
  variantCountLabel?: string;
}

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const href = `/produit/${product.slug}`;
  return (
    <article
      className={cn(
        "group flex flex-col gap-4 rounded-lg p-3 transition-all duration-300 hover:bg-linen/60",
        className,
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-linen">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <ProductImageFallback productName={product.name} brandName={product.brandName} />
          )}
          {product.stockStatus === "out" && (
            <Pill tone="out" className="absolute left-3 top-3">
              Bientôt de retour
            </Pill>
          )}
          {product.stockStatus === "low" && (
            <Pill tone="jasmine" className="absolute left-3 top-3">
              Plus que quelques pièces
            </Pill>
          )}
        </div>
      </Link>
      <div className="flex flex-col gap-1.5 px-1">
        <span className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-deep-teal/80">
          {product.brandName}
        </span>
        <Link href={href} className="block">
          <h3 className="font-[var(--font-display)] text-base text-warm-taupe transition-colors group-hover:text-deep-teal lg:text-lg">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          {product.priceTnd != null ? (
            <PriceTag amount={product.priceTnd} compareAt={product.compareAtPriceTnd ?? null} />
          ) : (
            <span className="font-[var(--font-body)] text-sm text-warm-taupe-soft">
              {product.variantCountLabel ?? "Plusieurs formats"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
