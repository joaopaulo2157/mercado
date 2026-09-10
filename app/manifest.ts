import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Supermercado Central",
    short_name: "SC Central",
    description: "Ofertas, catálogo e pedidos pelo WhatsApp.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0756d9",
    orientation: "portrait-primary",
    categories: ["shopping", "food"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Comprar", short_name: "Comprar", url: "/#ofertas", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Acompanhar pedido", short_name: "Acompanhar", url: "/acompanhar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Meus pedidos", short_name: "Pedidos", url: "/meus-pedidos", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
