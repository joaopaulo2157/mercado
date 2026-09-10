import type { MetadataRoute } from "next";
import { loadCatalog } from "@/lib/database";
import { DEFAULT_CATALOG } from "@/lib/default-data";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await loadCatalog().catch(() => DEFAULT_CATALOG);
  const now = new Date();
  const staticPages = [
    ["/privacidade", "yearly", 0.25],
    ["/termos", "yearly", 0.25],
    ["/entrega-e-retirada", "monthly", 0.45],
    ["/trocas-e-cancelamentos", "monthly", 0.4],
  ] as const;

  return [
    {
      url: absoluteSiteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...staticPages.map(([path, changeFrequency, priority]) => ({
      url: absoluteSiteUrl(path),
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...catalog.categories.map((category) => ({
      url: absoluteSiteUrl(`/categoria/${category.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...catalog.products.map((product) => ({
      url: absoluteSiteUrl(`/produto/${product.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
