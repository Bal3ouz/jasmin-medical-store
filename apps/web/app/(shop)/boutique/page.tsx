import { CategoryHeader } from "@/components/shop/CategoryHeader";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { createClient } from "@jasmin/db";
import { listCategories, listPublishedProducts } from "@jasmin/db/queries";
import { AiryContainer, Breadcrumbs } from "@jasmin/ui";
import Link from "next/link";

export const revalidate = 60;

export default async function BoutiquePage() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    return (
      <main>
        <AiryContainer className="px-6 py-20 lg:px-12">
          <p>Configuration manquante.</p>
        </AiryContainer>
      </main>
    );
  }
  const db = createClient(dbUrl);
  const [categories, featured] = await Promise.all([
    listCategories(db),
    listPublishedProducts(db, { sort: "newest", limit: 12 }),
  ]);

  const rootCategories = categories.filter((c) => c.parentId === null);

  return (
    <main>
      <AiryContainer className="px-6 pb-16 pt-12 lg:px-12 lg:pt-16">
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Boutique" }]} />
        <div className="mt-6">
          <CategoryHeader
            eyebrow="Boutique"
            title="Toute la sélection"
            description="Explorez nos rayons et découvrez les marques qui prennent soin de vous au quotidien."
          />
        </div>

        <section className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rootCategories.map((c) => (
            <Link
              key={c.id}
              href={`/boutique/${c.slug}`}
              className="group flex flex-col gap-3 rounded-lg bg-linen/60 p-6 transition-colors hover:bg-linen"
            >
              <h3 className="font-[var(--font-display)] text-xl italic text-deep-teal">{c.name}</h3>
              <p className="font-[var(--font-body)] text-sm text-warm-taupe-soft">
                {c.description}
              </p>
              <span className="mt-2 font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-deep-teal transition-colors group-hover:text-deep-teal-dark">
                Découvrir →
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="font-[var(--font-display)] text-3xl italic text-deep-teal">
            Sélection du moment
          </h2>
          <div className="mt-8">
            <ProductGrid products={featured} />
          </div>
        </section>
      </AiryContainer>
    </main>
  );
}
