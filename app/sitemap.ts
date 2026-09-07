import type { MetadataRoute } from "next";
import { DEFAULT_CATALOG } from "@/lib/default-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://supermercado-central.joaopaulo2009.chatgpt.site";
  const now = new Date();
  const staticPages = [
    ["/privacidade", "yearly", 0.25],
    ["/termos", "yearly", 0.25],
    ["/entrega-e-retirada", "monthly", 0.45],
    ["/trocas-e-cancelamentos", "monthly", 0.4],
  ] as const;
  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...staticPages.map(([path, changeFrequency, priority]) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...DEFAULT_CATALOG.categories.map((category) => ({
      url: `${base}/categoria/${category.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...DEFAULT_CATALOG.products.map((product) => ({
      url: `${base}/produto/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
