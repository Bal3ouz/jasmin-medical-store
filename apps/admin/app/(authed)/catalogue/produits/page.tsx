import { PromoToggleButton } from "@/components/PromoToggleButton";
import { createClient } from "@jasmin/db";
import { listAllBrands, listProductsForAdmin } from "@jasmin/db/queries";
import { Button, DataTable, H1Editorial, LabelEyebrow, Pill, PriceTag } from "@jasmin/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SORT_VALUES = ["name", "-name", "createdAt", "-createdAt", "priceTnd", "-priceTnd"] as const;
type Sort = (typeof SORT_VALUES)[number];

function parseSort(input: string | undefined): Sort {
  if (input && (SORT_VALUES as readonly string[]).includes(input)) {
    return input as Sort;
  }
  return "-createdAt";
}

export default async function ProductsAdminPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;
  const url = process.env.SUPABASE_DB_URL;

  if (!url) {
    return (
      <div>
        <LabelEyebrow>Catalogue</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Produits</H1Editorial>
        <p className="mt-8 text-warm-taupe-soft text-sm">Base de données non configurée.</p>
      </div>
    );
  }

  const db = createClient(url);
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const published = sp.published === "true" ? true : sp.published === "false" ? false : undefined;

  const [{ rows, total }, brandList] = await Promise.all([
    listProductsForAdmin(db, {
      search: sp.q,
      brandId: sp.brand,
      published,
      page,
      limit: 20,
      sort: parseSort(sp.sort),
    }),
    listAllBrands(db),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <LabelEyebrow>Catalogue</LabelEyebrow>
          <H1Editorial className="mt-2 text-4xl text-deep-teal">Produits</H1Editorial>
        </div>
        <Link href="/catalogue/produits/nouveau">
          <Button>+ Nouveau produit</Button>
        </Link>
      </div>

      <form className="mt-8 flex flex-wrap items-end gap-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Rechercher"
          className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-warm-taupe text-sm"
        />
        <select
          name="brand"
          defaultValue={sp.brand ?? ""}
          className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-warm-taupe text-sm"
        >
          <option value="">Toutes marques</option>
          {brandList.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          name="published"
          defaultValue={sp.published ?? ""}
          className="rounded-lg border border-linen bg-cream-sand px-3 py-2 text-warm-taupe text-sm"
        >
          <option value="">Tous</option>
          <option value="true">Publiés</option>
          <option value="false">Brouillons</option>
        </select>
        <Button type="submit" variant="ghost">
          Filtrer
        </Button>
      </form>

      <div className="mt-8">
        <DataTable
          columns={[
            {
              key: "name",
              header: "Nom",
              sortKey: "name",
              cell: (r) => <span className="font-medium text-warm-taupe">{r.name}</span>,
            },
            {
              key: "brand",
              header: "Marque",
              cell: (r) => r.brandName ?? "—",
            },
            {
              key: "price",
              header: "Prix",
              sortKey: "priceTnd",
              cell: (r) =>
                r.hasVariants ? (
                  <span className="text-warm-taupe-soft">déclinaisons</span>
                ) : (
                  <PriceTag amount={Number(r.priceTnd ?? 0)} />
                ),
            },
            {
              key: "status",
              header: "Statut",
              cell: (r) =>
                r.isPublished ? (
                  <Pill tone="teal">Publié</Pill>
                ) : (
                  <Pill tone="taupe">Brouillon</Pill>
                ),
            },
            {
              key: "promo",
              header: "Promo",
              cell: (r) => <PromoToggleButton id={r.id} isPromo={r.isPromo} />,
            },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          rowHref={(r) => `/catalogue/produits/${r.id}`}
          page={page}
          pageSize={20}
          total={total}
          basePath="/catalogue/produits"
          searchParams={sp}
        />
      </div>
    </div>
  );
}
