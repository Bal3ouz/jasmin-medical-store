import { ProductForm } from "@/components/ProductForm";
import { getStaffSession } from "@/lib/auth";
import { createClient } from "@jasmin/db";
import { listAllBrands, listAllCategories } from "@jasmin/db/queries";
import { H1Editorial, LabelEyebrow } from "@jasmin/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  // UI gate: writers (catalogue) are admin/manager/stock. Redirect cashier.
  if (!["admin", "manager", "stock"].includes(session.role)) {
    redirect("/catalogue/produits");
  }

  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    return (
      <div>
        <LabelEyebrow>Catalogue</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Nouveau produit</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }
  const db = createClient(url);
  const [brands, categories] = await Promise.all([listAllBrands(db), listAllCategories(db)]);

  return (
    <div className="max-w-3xl">
      <Link
        href="/catalogue/produits"
        className="text-warm-taupe-soft text-sm hover:text-warm-taupe"
      >
        ← Retour aux produits
      </Link>
      <LabelEyebrow className="mt-4">Catalogue</LabelEyebrow>
      <H1Editorial className="mt-2 text-4xl text-deep-teal">Nouveau produit</H1Editorial>

      <div className="mt-10">
        <ProductForm
          mode="create"
          brands={brands}
          categories={categories}
          currentRole={session.role}
        />
      </div>
    </div>
  );
}
