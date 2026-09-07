import type { Metadata } from "next";
import CustomerHeader from "@/components/customer-header";
import OrderHistory from "@/components/order-history";

export const metadata: Metadata = {
  title: "Meus pedidos",
  description:
    "Acesse seus pedidos recentes, repita listas e consulte pontos no Supermercado Central.",
  robots: { index: false, follow: false },
};

export default function MyOrdersPage() {
  return (
    <main className="customer-page history-page">
      <CustomerHeader />
      <OrderHistory />
    </main>
  );
}
