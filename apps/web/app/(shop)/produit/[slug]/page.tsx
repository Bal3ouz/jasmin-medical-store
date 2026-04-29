import { ProductDetailLayout } from "@/components/product/ProductDetailLayout";
import { ProductTabsAccordion } from "@/components/product/ProductTabsAccordion";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { createClient } from "@jasmin/db";
import { getProductBySlug, getRelatedProducts } from "@jasmin/db/queries";
import { AiryContainer, Breadcrumbs } from "@jasmin/ui";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) notFound();
  const db = createClient(dbUrl);
  const detail = await getProductBySlug(db, slug);
  if (!detail) notFound();

  const related = await getRelatedProducts(db, detail.product.id, 4);

  return (
    <main>
      <AiryContainer className="px-6 pb-20 pt-12 lg:px-12 lg:pt-16">
        <Breadcrumbs
          items={[
            { label: "Accueil", href: "/" },
            { label: "Boutique", href: "/boutique" },
            { label: detail.category.name, href: `/boutique/${detail.category.slug}` },
            { label: detail.product.name },
          ]}
        />
        <div className="mt-8">
          <ProductDetailLayout detail={detail} />
        </div>

        <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
          <ProductTabsAccordion
            description={detail.product.description}
            ingredients={detail.product.ingredients}
            usage={detail.product.usage}
          />
        </div>

        <RelatedProducts products={related} />
      </AiryContainer>
    </main>
  );
}
