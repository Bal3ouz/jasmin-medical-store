"use client";

import {
  type ImageActionResult,
  deleteProductImageAction,
  reorderProductImagesAction,
  setPrimaryProductImageAction,
  uploadProductImageAction,
} from "@/app/actions/productImages";
import type { ProductImage } from "@jasmin/db/schema";
import { Button, getImageUrl } from "@jasmin/ui";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";

export interface ImageUploaderProps {
  productId: string;
  productSlug: string;
  images: ProductImage[];
}

/**
 * Image management widget for the product edit page. Server-rendered
 * `images` are displayed as cards with thumbnail + alt-text + reorder /
 * primary / delete controls. New uploads happen via a top-of-section
 * file input that triggers `uploadProductImageAction` per file.
 *
 * The component intentionally keeps state minimal — every mutation is a
 * server-action call followed by `router.refresh()` so the page-level
 * `getProductForEdit` re-fetch is the source of truth. Per-action
 * `useTransition` flags drive the disabled state.
 *
 * NOTE: alt-text editing post-upload is deferred. Upload sets `altText`
 * once; subsequent edits are surfaced as an inline hint until a future
 * Phase 3.5 ships an `updateProductImageAction`.
 */
export function ImageUploader({ productId, productSlug, images }: ImageUploaderProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clearFlash() {
    setError(null);
    setSuccess(null);
  }

  async function handleUpload(formData: FormData) {
    clearFlash();
    formData.set("productId", productId);
    formData.set("altText", altText);
    formData.set("isPrimary", isPrimary ? "true" : "false");
    const result = await uploadProductImageAction(formData);
    handleResult(result);
    if (result.ok) {
      setAltText("");
      setIsPrimary(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleResult(result: ImageActionResult) {
    if (result.ok) {
      setSuccess(result.message ?? "Action réalisée");
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="rounded-2xl border border-linen bg-cream-sand p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => {
            void handleUpload(fd);
          });
        }}
      >
        <div className="grid gap-3 md:grid-cols-3 md:items-end">
          <label htmlFor="upload-image-file" className="grid gap-1 text-xs md:col-span-1">
            <span className="text-warm-taupe-soft">Fichier (JPEG, PNG, WebP — 8 Mo max)</span>
            <input
              ref={fileInputRef}
              id="upload-image-file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="block w-full text-sm text-warm-taupe file:mr-3 file:rounded-md file:border-0 file:bg-deep-teal/10 file:px-3 file:py-1.5 file:text-deep-teal file:text-sm"
            />
          </label>
          <label htmlFor="upload-image-alt" className="grid gap-1 text-xs md:col-span-1">
            <span className="text-warm-taupe-soft">Texte alternatif</span>
            <input
              id="upload-image-alt"
              type="text"
              maxLength={160}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="h-9 rounded-md bg-linen px-3 text-sm text-warm-taupe"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="upload-image-primary"
              className="flex items-center gap-2 text-warm-taupe text-xs"
            >
              <input
                id="upload-image-primary"
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
              />
              Image principale
            </label>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Envoi…" : "Téléverser"}
            </Button>
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-rose-600 text-xs" role="alert">
            {error}
          </p>
        ) : null}
        {success ? <p className="mt-3 text-deep-teal text-xs">{success}</p> : null}
      </form>

      {images.length === 0 ? (
        <p className="rounded-2xl border border-linen bg-cream-sand/50 p-6 text-warm-taupe-soft text-sm">
          Aucune image téléversée pour ce produit.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {images.map((image, idx) => (
            <ImageCard
              key={image.id}
              image={image}
              productId={productId}
              productSlug={productSlug}
              allIds={images.map((i) => i.id)}
              index={idx}
              onResult={(r) => {
                clearFlash();
                handleResult(r);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Per-image card                                                              */
/* -------------------------------------------------------------------------- */

function ImageCard({
  image,
  productId,
  allIds,
  index,
  onResult,
}: {
  image: ProductImage;
  productId: string;
  productSlug: string;
  allIds: string[];
  index: number;
  onResult: (result: ImageActionResult) => void;
}) {
  const [pending, startTransition] = useTransition();
  const url = getImageUrl(image.storagePath);

  async function callAction(action: (fd: FormData) => Promise<ImageActionResult>, fd: FormData) {
    const result = await action(fd);
    onResult(result);
  }

  function handleSetPrimary() {
    const fd = new FormData();
    fd.set("id", image.id);
    startTransition(() => {
      void callAction(setPrimaryProductImageAction, fd);
    });
  }

  function handleDelete() {
    if (!window.confirm("Supprimer cette image ?")) return;
    const fd = new FormData();
    fd.set("id", image.id);
    startTransition(() => {
      void callAction(deleteProductImageAction, fd);
    });
  }

  function handleReorder(direction: "up" | "down") {
    // Build a new ordering array by swapping the current index with the
    // neighbour in the requested direction. Bail if at the edge.
    const reordered = [...allIds];
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= reordered.length) return;
    const [a, b] = [reordered[index], reordered[swapWith]];
    if (a == null || b == null) return;
    reordered[index] = b;
    reordered[swapWith] = a;

    const fd = new FormData();
    fd.set("productId", productId);
    for (const id of reordered) fd.append("orderedIds", id);
    startTransition(() => {
      void callAction(reorderProductImagesAction, fd);
    });
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-linen bg-cream-sand">
      <div className="relative aspect-square w-full bg-linen/40">
        {url ? (
          <Image
            src={url}
            alt={image.altText ?? ""}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-warm-taupe-soft text-xs">
            Aperçu indisponible
          </div>
        )}
        {image.isPrimary ? (
          <span className="absolute top-2 left-2 rounded-pill bg-deep-teal px-2 py-0.5 text-cream-sand text-xs">
            Principale
          </span>
        ) : null}
      </div>

      <div className="space-y-2 p-3 text-xs">
        <p className="text-warm-taupe">
          <span className="text-warm-taupe-soft">Alt:</span>{" "}
          {image.altText && image.altText.length > 0 ? (
            image.altText
          ) : (
            <span className="text-warm-taupe-soft italic">aucun</span>
          )}
        </p>
        <p className="text-warm-taupe-soft">Modifier le texte alt prochainement.</p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleReorder("up")}
            disabled={pending || index === 0}
            aria-label="Monter dans l'ordre"
          >
            ↑
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleReorder("down")}
            disabled={pending || index === allIds.length - 1}
            aria-label="Descendre dans l'ordre"
          >
            ↓
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleSetPrimary}
            disabled={pending || image.isPrimary}
          >
            Définir comme principale
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-rose-700 hover:bg-rose-50"
            onClick={handleDelete}
            disabled={pending}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </li>
  );
}
