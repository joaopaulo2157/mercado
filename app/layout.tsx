import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://supermercado-central.joaopaulo2009.chatgpt.site",
  ),
  title: {
    default: "Supermercado Central | Economia perto de você",
    template: "%s | Supermercado Central",
  },
  description:
    "Faça suas compras no Supermercado Central em São José da Tapera e envie seu pedido completo pelo WhatsApp.",
  icons: { icon: "/assets/logo-central-vertical.png" },
  manifest: "/manifest.webmanifest",
  applicationName: "Supermercado Central",
  keywords: [
    "supermercado",
    "ofertas",
    "compras online",
    "entrega",
    "WhatsApp",
  ],
  category: "shopping",
  authors: [{ name: "Supermercado Central" }],
  creator: "Supermercado Central",
  formatDetection: {
    telephone: true,
    address: false,
    email: false,
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Supermercado Central",
    description: "Preço baixo, variedade e compra fácil pelo WhatsApp.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Supermercado Central — Economia perto de você",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supermercado Central",
    description:
      "Economia perto de você. Monte seu carrinho e finalize pelo WhatsApp.",
    images: ["/og.png"],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0756d9",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
