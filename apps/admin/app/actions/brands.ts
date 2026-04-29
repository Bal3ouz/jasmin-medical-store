"use server";

import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { brands, products } from "@jasmin/db/schema";
import { BrandCreateSchema, BrandUpdateSchema } from "@jasmin/lib/schemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAudit } from "./audit";

/**
 * Build a fresh DB client. The connection string lives in
 * `SUPABASE_DB_URL` and is required for any mutation — we never want
 * to silently degrade on writes.
 */
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
 * Normalise empty-string form fields to `undefined` so optional URL/text
 * fields don't fail Zod's `.url()` validation when the user leaves them blank.
 */
function normaliseForm(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    out[k] = typeof v === "string" && v.trim() === "" ? undefined : v;
  }
  return out;
}

export async function createBrandAction(formData: FormData) {
  const session = await assertManagerOrAdmin();
  const parsed = BrandCreateSchema.safeParse(normaliseForm(Object.fromEntries(formData)));
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  const created = await db().transaction(async (tx) => {
    const [row] = await tx.insert(brands).values(parsed.data).returning();
    if (!row) throw new Error("Failed to insert brand");
    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: "brand.create",
      entityType: "brand",
      entityId: row.id,
      after: row,
    });
    return row;
  });

  revalidatePath("/catalogue/marques");
  return { ok: true as const, brand: created };
}

export async function updateBrandAction(formData: FormData) {
  const session = await assertManagerOrAdmin();
  const parsed = BrandUpdateSchema.safeParse(normaliseForm(Object.fromEntries(formData)));
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }
  const { id, ...rest } = parsed.data;

  await db().transaction(async (tx) => {
    const [before] = await tx.select().from(brands).where(eq(brands.id, id));
    if (!before) throw new Error("Brand not found");
    const [after] = await tx
      .update(brands)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();
    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: "brand.update",
      entityType: "brand",
      entityId: id,
      before,
      after: after ?? null,
    });
  });

  revalidatePath("/catalogue/marques");
  return { ok: true as const };
}

export async function deleteBrandAction(id: string) {
  const session = await assertManagerOrAdmin();

  // Guard: refuse to orphan products. Surfaces a friendly error to the page
  // instead of relying on the FK's onDelete restrict (which would 500).
  const used = await db()
    .select({ id: products.id })
    .from(products)
    .where(eq(products.brandId, id))
    .limit(1);
  if (used.length > 0) {
    return {
      ok: false as const,
      error: "Marque utilisée par un produit, impossible de supprimer.",
    };
  }

  await db().transaction(async (tx) => {
    const [before] = await tx.select().from(brands).where(eq(brands.id, id));
    if (!before) throw new Error("Brand not found");
    await tx.delete(brands).where(eq(brands.id, id));
    await recordAudit(tx, {
      staffUserId: session.authUserId,
      action: "brand.delete",
      entityType: "brand",
      entityId: id,
      before,
    });
  });

  revalidatePath("/catalogue/marques");
  return { ok: true as const };
}
