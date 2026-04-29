import { createCategoryAction } from "@/app/actions/categories";
import { createClient } from "@jasmin/db";
import { listAllCategories } from "@jasmin/db/queries";
import { Button, H1Editorial, Input, LabelEyebrow } from "@jasmin/ui";
import { CategoryTreeEditor } from "./CategoryTreeEditor";

export const dynamic = "force-dynamic";

// Wrapper: forms expect `(FormData) => void | Promise<void>`. The action
// returns a discriminated result we don't surface from this top-level form
// (errors for create flow through page revalidation; per-row updates handle
// their own error UX inside the client tree).
async function createCategoryFormAction(formData: FormData) {
  "use server";
  await createCategoryAction(formData);
}

export default async function CategoriesPage() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const list = dbUrl ? await listAllCategories(createClient(dbUrl)) : [];

  // Trim the row down to fields the client component actually needs.
  const flat = list.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    slug: c.slug,
    name: c.name,
    displayOrder: c.displayOrder,
  }));

  return (
    <div>
      <LabelEyebrow>Catalogue</LabelEyebrow>
      <H1Editorial className="mt-2 text-4xl text-deep-teal">Catégories</H1Editorial>

      <form
        action={createCategoryFormAction}
        className="mt-10 grid max-w-xl gap-3 rounded-2xl bg-linen p-6"
      >
        <Input name="name" placeholder="Nom" required />
        <Input name="slug" placeholder="slug-url" required pattern="[a-z0-9-]+" />
        <select
          name="parentId"
          defaultValue="root"
          className="h-11 rounded-md bg-linen px-4 text-warm-taupe ring-1 ring-warm-taupe/10"
        >
          <option value="root">— Catégorie racine —</option>
          {flat.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentId ? `↳ ${c.name}` : c.name}
            </option>
          ))}
        </select>
        <Input name="heroImageUrl" placeholder="URL image (optionnel)" type="url" />
        <Button type="submit">Ajouter une catégorie</Button>
      </form>

      <div className="mt-10">
        {!dbUrl ? (
          <p className="text-warm-taupe-soft text-sm">Base de données non configurée.</p>
        ) : (
          <CategoryTreeEditor categories={flat} />
        )}
      </div>
    </div>
  );
}
