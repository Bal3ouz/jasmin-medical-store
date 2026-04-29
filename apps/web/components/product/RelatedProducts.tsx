import type { ListedProduct } from "@jasmin/db/queries";
import { ProductCard, type ProductCardData, getImageUrl } from "@jasmin/ui";

export function RelatedProducts({ products }: { products: ListedProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mt-20">
      <h2 className="font-[var(--font-display)] text-3xl italic text-deep-teal lg:text-4xl">
        Vous aimerez aussi
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {products.map((p) => {
          const data: ProductCardData = {
            slug: p.product.slug,
            name: p.product.name,
            brandName: p.brand.name,
            priceTnd: p.product.hasVariants
              ? (p.defaultVariant?.priceTnd ?? null)
              : p.product.priceTnd,
            compareAtPriceTnd: p.product.compareAtPriceTnd,
            imageUrl: getImageUrl(p.primaryImage?.storagePath),
            imageAlt: p.primaryImage?.altText,
            stockStatus: p.stockStatus,
            hasVariants: p.product.hasVariants,
          };
          return <ProductCard key={p.product.id} product={data} />;
        })}
      </div>
    </section>
  );
}
