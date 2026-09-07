import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import CategoryCatalog from "@/components/category-catalog";
import CustomerHeader from "@/components/customer-header";
import { loadCatalog } from "@/lib/database";
import { DEFAULT_CATALOG } from "@/lib/default-data";

export const dynamic = "force-dynamic";

const getCategoryData = cache(async (slug: string) => {
  const catalog = await loadCatalog().catch(() => DEFAULT_CATALOG);
  const category = catalog.categories.find((item) => item.slug === slug);
  if (!category) return null;
  return {
    category,
    products: catalog.products.filter(
      (product) => product.categoryId === category.id,
    ),
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryData(slug);
  if (!data)
    return { title: "Categoria não encontrada", robots: { index: false } };
  return {
    title: `${data.category.name}: produtos e ofertas`,
    description: `Veja produtos e ofertas do setor ${data.category.name} no Supermercado Central.`,
    alternates: { canonical: `/categoria/${data.category.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCategoryData(slug);
  if (!data) notFound();
  return (
    <main className="customer-page category-page">
      <CustomerHeader />
      <CategoryCatalog category={data.category} products={data.products} />
    </main>
  );
}
