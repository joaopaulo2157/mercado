import type { Metadata } from "next";
import Storefront from "@/components/storefront";
import { loadCatalog } from "@/lib/database";
import { DEFAULT_CATALOG } from "@/lib/default-data";
import { absoluteSiteUrl, publicSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Ofertas e compras pelo WhatsApp",
  description:
    "Encontre ofertas no Supermercado Central em São José da Tapera, monte seu carrinho e finalize pelo WhatsApp.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const catalog = await loadCatalog().catch((error) => {
    console.error("home-catalog-fallback", error);
    return DEFAULT_CATALOG;
  });
  const settings = catalog.settings;
  const structured = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: settings.storeName || "Supermercado Central",
    url: publicSiteUrl(),
    logo: absoluteSiteUrl("/assets/sc-supermercado-central-oficial.png"),
    priceRange: "R$",
    telephone: settings.phone || undefined,
    openingHours: settings.hours,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: "São José da Tapera",
      addressRegion: "AL",
      addressCountry: "BR",
    },
    hasMap: settings.mapsUrl || undefined,
    description:
      "Supermercado em São José da Tapera com catálogo online e pedidos pelo WhatsApp.",
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }}
      />
      <Storefront initialCatalog={catalog} />
    </>
  );
}
