import {
  deleteProductAction,
  duplicateProductAction,
  publishProductAction,
} from "@/app/actions/products";
import { ProductForm } from "@/components/ProductForm";
import { VariantEditor } from "@/components/VariantEditor";
import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { getProductForEdit, listAllBrands, listAllCategories } from "@jasmin/db/queries";
import { Button, H1Editorial, LabelEyebrow, Pill } from "@jasmin/ui";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Server-action shims: forms expect `(FormData) => void | Promise<void>`,
// so we discard the structured result. Auth-failure branches throw and are
// caught by error.tsx; the success path revalidates / redirects.
async function publishShim(formData: FormData) {
  "use server";
  await publishProductAction(formData);
}
async function duplicateShim(formData: FormData) {
  "use server";
  await duplicateProductAction(formData);
}
async function deleteShim(formData: FormData) {
  "use server";
  await deleteProductAction(formData);
}

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (!["admin", "manager", "stock"].includes(session.role)) {
    redirect("/catalogue/produits");
  }

  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    return (
      <div>
        <LabelEyebrow>Catalogue</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Produit</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const db = createClient(url);
  const [data, brands, categories] = await Promise.all([
    getProductForEdit(db, id),
    listAllBrands(db),
    listAllCategories(db),
  ]);

  if (!data) notFound();

  const { product, variants, images, categoryIds } = data;
  const isAdmin = session.role === "admin";
  const isAdminOrManager = isAdmin || session.role === "manager";

  return (
    <div className="max-w-3xl">
      <Link
        href="/catalogue/produits"
        className="text-warm-taupe-soft text-sm hover:text-warm-taupe"
      >
        ← Retour aux produits
      </Link>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <LabelEyebrow>Catalogue</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">{product.name}</H1Editorial>
          <div className="mt-2 flex items-center gap-2 text-warm-taupe-soft text-sm">
            <span>/{product.slug}</span>
            {product.isPublished ? (
              <Pill tone="teal">Publié</Pill>
            ) : (
              <Pill tone="taupe">Brouillon</Pill>
            )}
          </div>
        </div>
      </div>

      {/* Action toolbar: publish/unpublish, duplicate, delete (admin only). */}
      {isAdminOrManager ? (
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-cream-sand p-4 shadow-soft">
          <form action={publishShim}>
            <input type="hidden" name="id" value={product.id} />
            <input
              type="hidden"
              name="isPublished"
              value={product.isPublished ? "false" : "true"}
            />
            <Button type="submit" variant="ghost">
              {product.isPublished ? "Dépublier" : "Publier"}
            </Button>
          </form>

          <form action={duplicateShim}>
            <input type="hidden" name="id" value={product.id} />
            <Button type="submit" variant="ghost">
              Dupliquer
            </Button>
          </form>

          {isAdmin ? (
            <form action={deleteShim}>
              <input type="hidden" name="id" value={product.id} />
              <Button type="submit" variant="ghost" className="text-rose-700 hover:bg-rose-50">
                Supprimer
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}

      <div className="mt-10">
        <ProductForm
          mode="edit"
          initial={product}
          initialCategoryIds={categoryIds}
          brands={brands}
          categories={categories}
          currentRole={session.role}
        />
      </div>

      <section className="mt-12">
        <h2 className="text-lg text-warm-taupe">Déclinaisons</h2>
        <div className="mt-3">
          {product.hasVariants ? (
            <VariantEditor productId={product.id} variants={variants} />
          ) : (
            <div className="rounded-2xl border border-dashed border-linen bg-cream-sand/50 p-6 text-warm-taupe-soft text-sm">
              Activez « Le produit a des déclinaisons » dans le formulaire ci-dessus pour gérer les
              variantes (et leur stock par déclinaison).
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg text-warm-taupe">Images</h2>
        <div className="mt-3 rounded-2xl border border-dashed border-linen bg-cream-sand/50 p-6 text-warm-taupe-soft text-sm">
          {images.length === 0
            ? "Aucune image. Géré dans la prochaine itération."
            : `${images.length} image(s). Géré dans la prochaine itération.`}
        </div>
      </section>
    </div>
  );
}
