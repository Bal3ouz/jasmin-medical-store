import { CategoryHeader } from "@/components/shop/CategoryHeader";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { FilterToolbar } from "@/components/shop/FilterToolbar";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { createClient } from "@jasmin/db";
import { getCategoryBySlug, listBrands, listPublishedProducts } from "@jasmin/db/queries";
import { AiryContainer, Breadcrumbs } from "@jasmin/ui";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ brand?: string; sort?: string }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: categorySlug } = await params;
  const { brand: brandSlug, sort } = await searchParams;

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) notFound();
  const db = createClient(dbUrl);

  const cat = await getCategoryBySlug(db, categorySlug);
  if (!cat) notFound();

  const [products, brands] = await Promise.all([
    listPublishedProducts(db, {
      categorySlug,
      brandSlug,
      sort: (sort as "newest" | "price-asc" | "price-desc" | undefined) ?? "newest",
    }),
    listBrands(db),
  ]);

  return (
    <main>
      <AiryContainer className="px-6 pb-20 pt-12 lg:px-12 lg:pt-16">
        <Breadcrumbs
          items={[
            { label: "Accueil", href: "/" },
            { label: "Boutique", href: "/boutique" },
            { label: cat.name },
          ]}
        />
        <div className="mt-6">
          <CategoryHeader
            eyebrow={cat.parentId ? "Catégorie" : "Rayon"}
            title={cat.name}
            description={cat.description ?? undefined}
          />
        </div>

        <div className="mt-10 flex gap-12">
          <FilterSidebar
            brands={brands}
            activeCategorySlug={categorySlug}
            activeBrandSlug={brandSlug}
          />
          <div className="flex-1">
            <FilterToolbar resultCount={products.length} />
            <div className="mt-8">
              <ProductGrid products={products} />
            </div>
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
