import type { Metadata } from "next";
import CustomerHeader from "@/components/customer-header";
import OrderTracker from "@/components/order-tracker";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
  description:
    "Consulte com segurança o andamento do seu pedido no Supermercado Central.",
  robots: { index: false, follow: false },
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string; token?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="customer-page tracker-page">
      <CustomerHeader />
      <OrderTracker
        initialOrder={params.pedido || ""}
        initialToken={params.token || ""}
      />
    </main>
  );
}
