import { createBrandAction } from "@/app/actions/brands";
import { createClient } from "@jasmin/db";
import { listAllBrands } from "@jasmin/db/queries";
import { Button, H1Editorial, Input, LabelEyebrow } from "@jasmin/ui";
import { MarqueRow } from "./MarqueRow";

export const dynamic = "force-dynamic";

// Thin server-action wrapper: forms expect `(FormData) => void | Promise<void>`,
// so we discard the action's structured result here. Real validation feedback
// lives in the per-row client component (MarqueRow).
async function createBrandFormAction(formData: FormData) {
  "use server";
  await createBrandAction(formData);
}

export default async function MarquesPage() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  // Gracefully degrade when the DB URL is missing (preview/build environments)
  // so the admin shell still renders instead of throwing during render.
  const list = dbUrl ? await listAllBrands(createClient(dbUrl)) : [];

  return (
    <div>
      <LabelEyebrow>Catalogue</LabelEyebrow>
      <H1Editorial className="mt-2 text-4xl text-deep-teal">Marques</H1Editorial>

      <form
        action={createBrandFormAction}
        className="mt-10 grid max-w-xl gap-3 rounded-2xl bg-linen p-6"
      >
        <Input name="name" placeholder="Nom" required />
        <Input name="slug" placeholder="slug-url" required pattern="[a-z0-9-]+" />
        <Input name="websiteUrl" placeholder="https://…" type="url" />
        <Input name="logoUrl" placeholder="URL logo" type="url" />
        <Button type="submit">Ajouter une marque</Button>
      </form>

      {list.length === 0 ? (
        <p className="mt-10 text-warm-taupe-soft text-sm">
          {dbUrl ? "Aucune marque pour le moment." : "Base de données non configurée."}
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-linen rounded-2xl bg-cream-sand shadow-soft">
          {list.map((b) => (
            <MarqueRow
              key={b.id}
              brand={{
                id: b.id,
                name: b.name,
                slug: b.slug,
                websiteUrl: b.websiteUrl,
                logoUrl: b.logoUrl,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
