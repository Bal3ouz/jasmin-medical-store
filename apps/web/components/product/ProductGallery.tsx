"use client";
import type { ProductImage } from "@jasmin/db";
import { ProductImageFallback, cn, getImageUrl } from "@jasmin/ui";
import Image from "next/image";
import { useState } from "react";

export function ProductGallery({
  images,
  productName,
  brandName,
}: {
  images: ProductImage[];
  productName: string;
  brandName: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full">
        <ProductImageFallback productName={productName} brandName={brandName} className="h-full" />
      </div>
    );
  }

  const active = images[activeIdx]!;
  const activeUrl = getImageUrl(active.storagePath);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-linen">
        {activeUrl && (
          <Image
            src={activeUrl}
            alt={active.altText ?? productName}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="object-cover"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => {
            const url = getImageUrl(img.storagePath);
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md bg-linen transition-all",
                  idx === activeIdx
                    ? "ring-2 ring-deep-teal ring-offset-2 ring-offset-cream-sand"
                    : "opacity-70 hover:opacity-100",
                )}
                aria-label={`Image ${idx + 1} de ${images.length}`}
              >
                {url && (
                  <Image
                    src={url}
                    alt={img.altText ?? `${productName} ${idx + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
