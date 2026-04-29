"use client";

import { deleteBrandAction, updateBrandAction } from "@/app/actions/brands";
import { Button, Input } from "@jasmin/ui";
import { useState, useTransition } from "react";

export interface BrandRowData {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
}

/**
 * Single brand row: collapsed by default, expands into an inline edit form
 * with "Enregistrer" and "Supprimer" actions. We keep state client-side so
 * the list page itself stays a server component.
 */
export function MarqueRow({ brand }: { brand: BrandRowData }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Supprimer la marque "${brand.name}" ?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteBrandAction(brand.id);
      if (!result.ok) setError(result.error);
    });
  }

  async function handleUpdate(formData: FormData) {
    setError(null);
    const result = await updateBrandAction(formData);
    if (!result.ok) {
      setError("Validation échouée. Vérifiez les champs.");
      return;
    }
    setEditing(false);
  }

  return (
    <li className="px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium text-warm-taupe">{brand.name}</div>
          <div className="text-warm-taupe-soft text-xs">/{brand.slug}</div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => setEditing((v) => !v)}
            disabled={pending}
          >
            {editing ? "Annuler" : "Modifier"}
          </Button>
          <Button variant="ghost" type="button" onClick={handleDelete} disabled={pending}>
            Supprimer
          </Button>
        </div>
      </div>

      {editing && (
        <form action={handleUpdate} className="mt-4 grid max-w-xl gap-3">
          <input type="hidden" name="id" value={brand.id} />
          <Input name="name" defaultValue={brand.name} required />
          <Input name="slug" defaultValue={brand.slug} required pattern="[a-z0-9-]+" />
          <Input name="websiteUrl" defaultValue={brand.websiteUrl ?? ""} placeholder="https://…" />
          <Input name="logoUrl" defaultValue={brand.logoUrl ?? ""} placeholder="URL logo" />
          <Button type="submit">Enregistrer</Button>
        </form>
      )}

      {error && <p className="mt-2 text-rose-600 text-sm">{error}</p>}
    </li>
  );
}
