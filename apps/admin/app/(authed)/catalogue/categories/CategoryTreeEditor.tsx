"use client";

import {
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
} from "@/app/actions/categories";
import { Button, Input } from "@jasmin/ui";
import { useMemo, useState, useTransition } from "react";

export interface CategoryNode {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  displayOrder: number;
}

interface Props {
  /** Flat list, server-sorted by parent_id NULLS FIRST, displayOrder, name. */
  categories: CategoryNode[];
}

/**
 * Tree editor for the category list.
 *
 * Renders roots first, then their children grouped under each, recursively.
 * Per node:
 *   - up/down arrows that call `reorderCategoriesAction` for this parent's
 *     ordered ids (we never trust client-side ordering — the server re-validates)
 *   - inline edit form (name, slug, parent select)
 *   - delete button (server returns a friendly error if the category is in use)
 */
export function CategoryTreeEditor({ categories }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Group children by parent id once. We reuse this map both for rendering
  // siblings and for computing the new ordered-ids array on reorder.
  const childrenByParent = useMemo(() => {
    const map = new Map<string | "root", CategoryNode[]>();
    for (const cat of categories) {
      const key = cat.parentId ?? "root";
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(cat);
    }
    return map;
  }, [categories]);

  function move(parentKey: string | "root", id: string, direction: "up" | "down") {
    const siblings = childrenByParent.get(parentKey) ?? [];
    const ids = siblings.map((s) => s.id);
    const idx = ids.indexOf(id);
    if (idx === -1) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= ids.length) return;
    const next = ids.slice();
    next[idx] = ids[target] as string;
    next[target] = ids[idx] as string;

    setError(null);
    startTransition(async () => {
      const result = await reorderCategoriesAction({
        parentId: parentKey === "root" ? null : parentKey,
        orderedIds: next,
      });
      if (!result.ok) setError("Réordonnancement échoué.");
    });
  }

  return (
    <div>
      {error && <p className="mb-4 text-rose-600 text-sm">{error}</p>}
      <ul className="divide-y divide-linen rounded-2xl bg-cream-sand shadow-soft">
        {(childrenByParent.get("root") ?? []).map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            allCategories={categories}
            childrenByParent={childrenByParent}
            depth={0}
            onMove={move}
            pending={pending}
          />
        ))}
      </ul>
      {(childrenByParent.get("root") ?? []).length === 0 && (
        <p className="text-warm-taupe-soft text-sm">Aucune catégorie pour le moment.</p>
      )}
    </div>
  );
}

interface RowProps {
  category: CategoryNode;
  allCategories: CategoryNode[];
  childrenByParent: Map<string | "root", CategoryNode[]>;
  depth: number;
  onMove: (parentKey: string | "root", id: string, direction: "up" | "down") => void;
  pending: boolean;
}

function CategoryRow({
  category,
  allCategories,
  childrenByParent,
  depth,
  onMove,
  pending,
}: RowProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const parentKey: string | "root" = category.parentId ?? "root";
  const siblings = childrenByParent.get(parentKey) ?? [];
  const idx = siblings.findIndex((s) => s.id === category.id);
  const isFirst = idx <= 0;
  const isLast = idx >= siblings.length - 1;

  const children = childrenByParent.get(category.id) ?? [];

  function handleDelete() {
    if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.ok) setError(result.error);
    });
  }

  async function handleUpdate(formData: FormData) {
    setError(null);
    const result = await updateCategoryAction(formData);
    if (!result.ok) {
      setError("Mise à jour échouée. Vérifiez les champs.");
      return;
    }
    setEditing(false);
  }

  // Parent options: every category except this one and its descendants
  // (avoids forming cycles). For Phase 3 we only block the self-reference
  // here in the UI; the server already rejects parentId === id.
  const parentOptions = allCategories.filter((c) => c.id !== category.id);

  return (
    <li>
      <div
        className="flex items-center justify-between gap-4 px-6 py-4"
        style={{ paddingLeft: `${1.5 + depth * 1.5}rem` }}
      >
        <div className="min-w-0">
          <div className="font-medium text-warm-taupe">{category.name}</div>
          <div className="text-warm-taupe-soft text-xs">/{category.slug}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onMove(parentKey, category.id, "up")}
            disabled={pending || isFirst}
            aria-label="Monter"
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => onMove(parentKey, category.id, "down")}
            disabled={pending || isLast}
            aria-label="Descendre"
          >
            ↓
          </Button>
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
        <form
          action={handleUpdate}
          className="grid max-w-xl gap-3 px-6 pb-4"
          style={{ paddingLeft: `${1.5 + depth * 1.5}rem` }}
        >
          <input type="hidden" name="id" value={category.id} />
          <Input name="name" defaultValue={category.name} required />
          <Input name="slug" defaultValue={category.slug} required pattern="[a-z0-9-]+" />
          <select
            name="parentId"
            defaultValue={category.parentId ?? "root"}
            className="h-11 rounded-md bg-linen px-4 text-warm-taupe"
          >
            <option value="root">— Racine —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button type="submit">Enregistrer</Button>
        </form>
      )}

      {error && (
        <p
          className="px-6 pb-3 text-rose-600 text-sm"
          style={{ paddingLeft: `${1.5 + depth * 1.5}rem` }}
        >
          {error}
        </p>
      )}

      {children.length > 0 && (
        <ul className="border-linen border-t">
          {children.map((child) => (
            <CategoryRow
              key={child.id}
              category={child}
              allCategories={allCategories}
              childrenByParent={childrenByParent}
              depth={depth + 1}
              onMove={onMove}
              pending={pending}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
