import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Supermercado Central",
    short_name: "SC Central",
    description: "Ofertas, catálogo e pedidos pelo WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0756d9",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/assets/logo-central-vertical.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Comprar",
        short_name: "Comprar",
        url: "/#ofertas",
      },
      {
        name: "Acompanhar pedido",
        short_name: "Acompanhar",
        url: "/acompanhar",
      },
      {
        name: "Meus pedidos",
        short_name: "Pedidos",
        url: "/meus-pedidos",
      },
    ],
  };
}
