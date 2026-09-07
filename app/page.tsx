import type { Metadata } from "next";
import Storefront from "@/components/storefront";
import { DEFAULT_CATALOG } from "@/lib/default-data";
export const metadata: Metadata = {
  title: "Ofertas e compras pelo WhatsApp",
  description:
    "Encontre ofertas no Supermercado Central em São José da Tapera, monte seu carrinho e finalize pelo WhatsApp.",
  alternates: { canonical: "/" },
};
export default function Home() {
  const settings = DEFAULT_CATALOG.settings;
  const structured = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: "Supermercado Central",
    url: "https://supermercado-central.joaopaulo2009.chatgpt.site",
    logo: "https://supermercado-central.joaopaulo2009.chatgpt.site/assets/sc-supermercado-central-oficial.png",
    priceRange: "R$",
    telephone: "+55 82 98201-6966",
    openingHours: settings.hours,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Avenida Deputado Elisio da Silva Maia, 19 - Centro",
      addressLocality: "São José da Tapera",
      addressRegion: "AL",
      addressCountry: "BR",
    },
    hasMap: settings.mapsUrl,
    description:
      "Supermercado em São José da Tapera com catálogo online e pedidos pelo WhatsApp.",
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }}
      />
      <Storefront initialCatalog={DEFAULT_CATALOG} />
    </>
  );
}
