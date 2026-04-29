import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jasmin-medical-store.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/compte", "/panier", "/commande"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
