import { createClient } from "@jasmin/db";
import { listCategories, listPublishedProducts } from "@jasmin/db/queries";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jasmin-medical-store.com";
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return [{ url: base, lastModified: new Date() }];

  const db = createClient(dbUrl);
  const [categories, products] = await Promise.all([
    listCategories(db),
    listPublishedProducts(db, { limit: 1000 }),
  ]);

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/boutique`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/notre-histoire`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.4 },
    ...categories.map((c) => ({
      url: `${base}/boutique/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/produit/${p.product.slug}`,
      lastModified: new Date(p.product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
