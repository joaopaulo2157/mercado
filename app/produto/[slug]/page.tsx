import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import ProductActions from "@/components/product-actions";
import { applyOfferSchedule, database, mapProduct } from "@/lib/database";
import { DEFAULT_CATALOG, money } from "@/lib/default-data";
import type { Product } from "@/lib/store-types";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type SqlRow = Record<string, unknown>;
type ProductWithCategorySlug = Product & { categorySlug: string };

const getProduct = cache(async (slug: string): Promise<ProductWithCategorySlug | null> => {
  try {
    const row = await database()
      .prepare(
        "SELECT p.*,c.name AS category_name,c.slug AS category_slug FROM products p JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.active=1 LIMIT 1",
      )
      .bind(slug)
      .first<SqlRow>();
    return row
      ? { ...applyOfferSchedule(mapProduct(row)), categorySlug: String(row.category_slug || row.category_id || "") }
      : null;
  } catch (error) {
    console.error("product-fallback", error);
    const fallback = DEFAULT_CATALOG.products.find((product) => product.slug === slug);
    if (!fallback) return null;
    const category = DEFAULT_CATALOG.categories.find((item) => item.id === fallback.categoryId);
    return { ...fallback, categorySlug: category?.slug || fallback.categoryId };
  }
});

const getRelatedProducts = cache(async (product: Product): Promise<Product[]> => {
  try {
    const rows = await database()
      .prepare(
        "SELECT p.*,c.name AS category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.active=1 AND p.stock_quantity>0 AND p.category_id=? AND p.id<>? ORDER BY p.featured DESC,p.name LIMIT 4",
      )
      .bind(product.categoryId, product.id)
      .all<SqlRow>();
    return rows.results.map(mapProduct).map((item) => applyOfferSchedule(item));
  } catch {
    return DEFAULT_CATALOG.products
      .filter(
        (item) => item.categoryId === product.categoryId && item.id !== product.id,
      )
      .slice(0, 4);
  }
});

const absoluteImageUrl = (imageUrl: string) =>
  imageUrl.startsWith("http") ? imageUrl : absoluteSiteUrl(imageUrl || "/og.png");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Produto não encontrado", robots: { index: false } };
  const image = absoluteImageUrl(product.imageUrl);
  return {
    title: `${product.name} | Supermercado Central`,
    description: product.description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: `${money(product.priceCents)} · ${product.unit}`,
      type: "website",
      images: [{ url: image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: `${money(product.priceCents)} no Supermercado Central`,
      images: [image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product)
    return (
      <main className="product-not-found">
        <h1>Produto não encontrado</h1>
        <p>Ele pode estar temporariamente indisponível.</p>
        <Link href="/#ofertas">Voltar ao catálogo</Link>
      </main>
    );

  const related = await getRelatedProducts(product);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [absoluteImageUrl(product.imageUrl)],
    description: product.description,
    sku: product.sku,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: absoluteSiteUrl(`/produto/${product.slug}`),
    },
  };

  return (
    <main className="product-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <header>
        <Link href="/">
          <Image
            src="/assets/sc-supermercado-central-oficial.png"
            alt="Supermercado Central"
            width={220}
            height={90}
            priority
          />
        </Link>
        <Link href="/#ofertas">← Voltar ao catálogo</Link>
      </header>
      <nav className="breadcrumb" aria-label="Navegação estrutural">
        <Link href="/">Início</Link>
        <span>›</span>
        <Link href={`/categoria/${product.categorySlug}`}>{product.categoryName}</Link>
        <span>›</span>
        <b>{product.name}</b>
      </nav>
      <section className="product-detail">
        <div className="detail-image">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width:800px) 95vw,50vw"
            priority
            unoptimized={product.imageUrl.startsWith("http")}
          />
          {product.badge && <span>{product.badge}</span>}
        </div>
        <div className="detail-copy">
          <small>
            {product.categoryName} · {product.sku}
          </small>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-meta">
            <span>✓ Estoque disponível</span>
            <span>✓ Qualidade selecionada</span>
            <span>✓ Pedido pelo WhatsApp</span>
          </div>
          <div className="detail-price">
            {product.oldPriceCents && <del>{money(product.oldPriceCents)}</del>}
            <strong>{money(product.priceCents)}</strong>
            <small>{product.unit}</small>
          </div>
          <ProductActions product={product} />
          <div className="detail-info">
            <article>
              <b>Entrega</b>
              <p>Taxa e prazo calculados conforme a área selecionada no checkout.</p>
            </article>
            <article>
              <b>Pagamento</b>
              <p>PIX, dinheiro e cartões. Confirmação final pelo atendimento.</p>
            </article>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="related">
          <span>VOCÊ TAMBÉM PODE GOSTAR</span>
          <h2>Produtos relacionados</h2>
          <div>
            {related.map((item) => (
              <Link key={item.id} href={`/produto/${item.slug}`}>
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={190}
                  height={150}
                  unoptimized={item.imageUrl.startsWith("http")}
                />
                <b>{item.name}</b>
                <small>{money(item.priceCents)}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
