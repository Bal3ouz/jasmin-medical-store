"use client";
import { addToCartAction } from "@/app/actions/cart";
import type { ProductDetail } from "@jasmin/db/queries";
import { BodyText, Button, LabelEyebrow, Pill, PriceTag, Stepper } from "@jasmin/ui";
import { ArrowRight, Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { ProductGallery } from "./ProductGallery";
import { VariantSelector } from "./VariantSelector";

export function ProductDetailLayout({ detail }: { detail: ProductDetail }) {
  const { product, brand, variants, images, defaultVariant, stockStatus } = detail;
  const [variantId, setVariantId] = useState(defaultVariant?.id ?? "");
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeVariant = variants.find((v) => v.id === variantId) ?? defaultVariant;
  const displayPrice = product.hasVariants ? activeVariant?.priceTnd : product.priceTnd;
  const compareAt = product.compareAtPriceTnd;

  const handleAdd = () => {
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("productId", product.id);
      if (product.hasVariants && activeVariant) fd.set("variantId", activeVariant.id);
      fd.set("quantity", String(qty));
      const result = await addToCartAction(fd);
      setFeedback(result.ok ? "Ajouté au panier" : (result.error ?? "Erreur"));
    });
  };

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
      <ProductGallery images={images} productName={product.name} brandName={brand.name} />

      <div className="flex flex-col gap-6">
        <LabelEyebrow>{brand.name}</LabelEyebrow>
        <h1 className="font-[var(--font-display)] text-4xl italic text-deep-teal lg:text-5xl">
          {product.name}
        </h1>
        <BodyText className="text-warm-taupe-soft">{product.shortDescription}</BodyText>

        {product.hasVariants && variants.length > 0 && (
          <div className="space-y-2">
            <span className="font-[var(--font-label)] text-xs uppercase tracking-[0.18em] text-warm-taupe-soft">
              Format
            </span>
            <VariantSelector variants={variants} value={variantId} onChange={setVariantId} />
          </div>
        )}

        <div className="flex flex-wrap items-baseline gap-3">
          {displayPrice != null && (
            <span className="font-[var(--font-display)] text-3xl text-deep-teal">
              <PriceTag amount={displayPrice} compareAt={compareAt ?? null} />
            </span>
          )}
        </div>

        {stockStatus === "in_stock" && (
          <Pill tone="jasmine" className="self-start">
            En stock — livraison sous 48h
          </Pill>
        )}
        {stockStatus === "low" && (
          <Pill tone="jasmine" className="self-start">
            Plus que quelques pièces
          </Pill>
        )}
        {stockStatus === "out" && (
          <Pill tone="out" className="self-start">
            Bientôt de retour
          </Pill>
        )}

        <div className="flex items-center gap-4">
          <Stepper value={qty} onChange={setQty} />
          <Button
            variant="primary-teal"
            size="lg"
            disabled={pending || stockStatus === "out"}
            onClick={handleAdd}
            className="flex-1"
          >
            {pending ? "Ajout…" : "Ajouter au panier"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="md" className="self-start">
          <Heart className="h-4 w-4" />
          Ajouter aux favoris
        </Button>

        {feedback && (
          <output
            className={
              feedback === "Ajouté au panier" ? "text-sm text-deep-teal" : "text-sm text-warm-taupe"
            }
          >
            {feedback}
          </output>
        )}

        <div className="mt-2 flex items-center gap-3 border-t border-linen pt-4 font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-warm-taupe-soft">
          <span>Paiement à la livraison</span>
          <span aria-hidden>·</span>
          <span>Livraison sous 48h</span>
        </div>
      </div>
    </div>
  );
}
