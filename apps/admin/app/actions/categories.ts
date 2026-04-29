"use server";

import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { categories, productCategories, products } from "@jasmin/db/schema";
import {
  CategoryCreateSchema,
  CategoryReorderSchema,
  CategoryUpdateSchema,
} from "@jasmin/lib/schemas";
import { eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAudit } from "./audit";

function db() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL not set");
  return createClient(url);
}

async function assertManagerOrAdmin() {
  const session = await getStaffSession();
  if (!session) throw new Error("Unauthenticated");
  if (!["admin", "manager"].includes(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

/**
 * Normalise empty-string form fields to `undefined` so optional fields
 * aren't sent through Zod's stricter URL/uuid validators when blank.
 *
 * `parentId` is special-cased: an empty value means "make this a root
 * category" so we map "" / "root" → null, not undefined, so the update
 * action actually unsets it instead of skipping the field.
 */
function normaliseForm(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (k === "parentId") {
        out[k] = trimmed === "" || trimmed === "root" ? null : trimmed;
      } else if (trimmed === "") {
        out[k] = undefined;
      } else {
        out[k] = trimmed;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function createCategoryAction(formData: FormData) {
  const session = await assertManagerOrAdmin();
  const parsed = CategoryCreateSchema.safeParse(normaliseForm(Object.fromEntries(formData)));
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  const created = await db().transaction(async (tx) => {
    const [row] = await tx.insert(categories).values(parsed.data).returning();
    if (!row) throw new Error("Failed to insert category");
    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: "category.create",
      entityType: "category",
      entityId: row.id,
      after: row,
    });
    return row;
  });

  revalidatePath("/catalogue/categories");
  return { ok: true as const, category: created };
}

export async function updateCategoryAction(formData: FormData) {
  const session = await assertManagerOrAdmin();
  const parsed = CategoryUpdateSchema.safeParse(normaliseForm(Object.fromEntries(formData)));
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }
  const { id, ...rest } = parsed.data;

  // Guard against creating a self-reference. Cycle detection across deeper
  // ancestry is left for now; the UI's parent-select only allows roots and
  // direct siblings, so the surface area is small.
  if (rest.parentId === id) {
    return {
      ok: false as const,
      errors: {
        formErrors: ["Une catégorie ne peut pas être son propre parent."],
        fieldErrors: {},
      },
    };
  }

  await db().transaction(async (tx) => {
    const [before] = await tx.select().from(categories).where(eq(categories.id, id));
    if (!before) throw new Error("Category not found");
    const [after] = await tx
      .update(categories)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: "category.update",
      entityType: "category",
      entityId: id,
      before,
      after: after ?? null,
    });
  });

  revalidatePath("/catalogue/categories");
  return { ok: true as const };
}

/**
 * Reorder a single parent's children. We rewrite each row's `displayOrder` to
 * its position in `orderedIds` (0-indexed) inside one transaction and emit a
 * single `category.reorder` audit row covering the parent — `before` captures
 * the old order, `after` the new one.
 */
export async function reorderCategoriesAction(input: {
  parentId: string | null;
  orderedIds: string[];
}) {
  const session = await assertManagerOrAdmin();
  const parsed = CategoryReorderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }
  const { parentId, orderedIds } = parsed.data;

  await db().transaction(async (tx) => {
    // Snapshot every sibling under this parent before mutating, so the audit
    // diff is meaningful even if an id in orderedIds was stale.
    const siblings = await tx
      .select()
      .from(categories)
      .where(parentId === null ? isNull(categories.parentId) : eq(categories.parentId, parentId));

    const beforeOrder = siblings
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
      .map((c) => ({ id: c.id, name: c.name, displayOrder: c.displayOrder }));

    // Reject ids that don't belong under this parent — never trust the client.
    const validIds = new Set(siblings.map((c) => c.id));
    for (const id of orderedIds) {
      if (!validIds.has(id)) {
        throw new Error(`Category ${id} is not a child of the requested parent`);
      }
    }

    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (!id) continue;
      await tx
        .update(categories)
        .set({ displayOrder: i, updatedAt: new Date() })
        .where(eq(categories.id, id));
    }

    const afterOrder = orderedIds.map((id, i) => {
      const c = siblings.find((s) => s.id === id);
      return { id, name: c?.name ?? "", displayOrder: i };
    });

    // Emit one category.reorder audit row per call (per spec §13 + plan note),
    // attached to the parent id when available, otherwise to the first child
    // so the row still resolves to a category entity.
    const auditEntityId = parentId ?? orderedIds[0];
    if (auditEntityId) {
      await recordAudit(tx, {
        staffUserId: session.authUserId,
        action: "category.reorder",
        entityType: "category",
        entityId: auditEntityId,
        before: { parentId, order: beforeOrder },
        after: { parentId, order: afterOrder },
      });
    }
  });

  revalidatePath("/catalogue/categories");
  return { ok: true as const };
}

export async function deleteCategoryAction(id: string) {
  const session = await assertManagerOrAdmin();

  // Three independent guards — any in-use reference blocks deletion. We
  // surface a friendly French error instead of relying on FK errors.
  const [childRefs, productRefs, joinRefs] = await Promise.all([
    db().select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).limit(1),
    db().select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1),
    db()
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, id))
      .limit(1),
  ]);

  if (childRefs.length > 0) {
    return {
      ok: false as const,
      error: "Cette catégorie a des sous-catégories, impossible de supprimer.",
    };
  }
  if (productRefs.length > 0 || joinRefs.length > 0) {
    return {
      ok: false as const,
      error: "Catégorie utilisée par un produit, impossible de supprimer.",
    };
  }

  await db().transaction(async (tx) => {
    const [before] = await tx.select().from(categories).where(eq(categories.id, id));
    if (!before) throw new Error("Category not found");
    await tx.delete(categories).where(eq(categories.id, id));
    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: "category.delete",
      entityType: "category",
      entityId: id,
      before,
    });
  });

  revalidatePath("/catalogue/categories");
  return { ok: true as const };
}
