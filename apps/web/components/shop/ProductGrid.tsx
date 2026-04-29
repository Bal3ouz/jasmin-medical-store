import type { ListedProduct } from "@jasmin/db/queries";
import { EmptyState, ProductCard, type ProductCardData, getImageUrl } from "@jasmin/ui";

export function ProductGrid({ products }: { products: ListedProduct[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Aucun produit pour le moment."
        description="Ajustez vos filtres ou revenez très bientôt — notre sélection s'enrichit chaque semaine."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
          variantCountLabel:
            p.product.hasVariants && p.defaultVariant?.priceTnd
              ? `À partir de ${p.defaultVariant.priceTnd} TND`
              : undefined,
        };
        return <ProductCard key={p.product.id} product={data} />;
      })}
    </div>
  );
}
