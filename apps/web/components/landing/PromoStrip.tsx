import { createClient } from "@jasmin/db";
import { listPublishedProducts } from "@jasmin/db/queries";
import {
  LabelEyebrow,
  ProductCard,
  type ProductCardData,
  getImageUrl,
} from "@jasmin/ui";
import { Tag } from "lucide-react";
import Link from "next/link";

/**
 * Home-page "En promo" shelf. Visually distinct from neighbouring sections:
 *
 *   - Outer band:  warm linen + faint terracotta wash so the section reads
 *                  as a "promo zone", not just another row of cards
 *   - Inner card:  cream-sand rounded shelf with shadow-soft so it floats
 *                  above the band like a curated rack on a counter
 *   - Accents:     terracotta tag on the eyebrow + a "−XX%" badge per card
 *                  (drives the eye to the savings)
 *
 * Returns null if no products are flagged so the home page stays clean.
 */
export async function PromoStrip() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return null;
  const db = createClient(dbUrl);

  const products = await listPublishedProducts(db, {
    onlyPromo: true,
    limit: 8,
  });
  if (products.length === 0) return null;

  return (
    <section className="relative bg-linen px-6 py-20 lg:px-12 lg:py-24">
      {/* Faint terracotta wash + jasmine speckle so the band reads warmer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-terracotta-whisper/20 via-transparent to-jasmine/10"
      />
      {/* Hairline accent at the very top */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-terracotta/0 via-terracotta/60 to-terracotta/0"
      />

      <div className="relative mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <LabelEyebrow className="inline-flex items-center gap-2 rounded-pill bg-terracotta/15 px-4 py-1.5 text-deep-teal">
              <Tag className="h-3 w-3" aria-hidden /> En promotion
            </LabelEyebrow>
            <h2 className="mt-4 font-[var(--font-display)] text-4xl italic leading-[1.05] text-deep-teal lg:text-5xl">
              Nos coups de cœur du moment
            </h2>
            <p className="mt-3 max-w-xl font-[var(--font-body)] text-sm leading-[1.6] text-warm-taupe lg:text-base">
              Une sélection de soins à prix doux — choisis chaque semaine par notre équipe pour
              vous faire (re)découvrir ce qu&apos;ils ont de mieux.
            </p>
          </div>
          <Link
            href="/boutique?promo=1"
            className="font-[var(--font-label)] text-deep-teal text-xs uppercase tracking-[0.24em] transition-colors hover:text-deep-teal-dark"
          >
            Voir toutes les offres →
          </Link>
        </div>

        {/* The cream "shelf" that floats above the linen band */}
        <div className="mt-10 rounded-[2rem] bg-cream-sand p-6 shadow-card lg:p-10">
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const price = p.product.hasVariants
                ? (p.defaultVariant?.priceTnd ?? null)
                : p.product.priceTnd;
              const compare = p.product.compareAtPriceTnd;
              const discount =
                price && compare
                  ? Math.round((1 - Number(price) / Number(compare)) * 100)
                  : null;
              const card: ProductCardData = {
                slug: p.product.slug,
                name: p.product.name,
                brandName: p.brand.name,
                priceTnd: price,
                compareAtPriceTnd: compare,
                imageUrl: getImageUrl(p.primaryImage?.storagePath),
                imageAlt: p.primaryImage?.altText,
                stockStatus: p.stockStatus,
                hasVariants: p.product.hasVariants,
              };
              return (
                <div key={p.product.id} className="relative">
                  {discount && discount > 0 ? (
                    <span
                      aria-label={`Promotion ${discount} pour cent`}
                      className="absolute top-3 left-3 z-10 inline-flex items-center rounded-pill bg-terracotta px-3 py-1 font-[var(--font-label)] text-[11px] font-medium uppercase tracking-[0.12em] text-cream-sand shadow-soft"
                    >
                      −{discount} %
                    </span>
                  ) : null}
                  <ProductCard product={card} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
