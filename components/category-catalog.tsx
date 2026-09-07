"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { money } from "@/lib/default-data";
import type { Category, Product } from "@/lib/store-types";
import {
  changeProductQuantity,
  productPrice,
  productSearchScore,
} from "@/lib/commerce";

export default function CategoryCatalog({
  category,
  products,
}: {
  category: Category;
  products: Product[];
}) {
  const [sort, setSort] = useState("featured"),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState("");
  const deferredQuery = useDeferredValue(query);
  const visible = useMemo(
    () =>
      products
        .map((product) => ({
          product,
          score: productSearchScore(product, deferredQuery),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) =>
          sort === "price-asc"
            ? productPrice(a.product) - productPrice(b.product)
            : sort === "price-desc"
              ? productPrice(b.product) - productPrice(a.product)
              : sort === "name"
                ? a.product.name.localeCompare(b.product.name)
                : deferredQuery
                  ? b.score - a.score
                  : Number(b.product.featured) - Number(a.product.featured),
        )
        .map((item) => item.product),
    [products, deferredQuery, sort],
  );
  const add = (product: Product) => {
    const cart = JSON.parse(
      localStorage.getItem("sc-central-cart:v3") || "{}",
    ) as Record<string, number>;
    cart[product.id] = changeProductQuantity(
      product,
      cart[product.id] || 0,
      1,
    );
    localStorage.setItem("sc-central-cart:v3", JSON.stringify(cart));
    localStorage.setItem("sc-cart-updated-at", String(new Date().getTime()));
    setMessage(`${product.name} foi adicionado ao carrinho.`);
    setTimeout(() => setMessage(""), 2_500);
  };
  return (
    <>
      <section className="category-hero">
        <div>
          <span>
            {category.icon} SETOR {category.name.toUpperCase()}
          </span>
          <h1>Qualidade em cada escolha.</h1>
          <p>
            Explore {products.length} produtos disponíveis, monte sua lista e
            finalize com atendimento pelo WhatsApp.
          </p>
        </div>
        <div className="category-orbit" aria-hidden>
          <span>{category.icon}</span>
          <i />
          <b>OFERTAS</b>
        </div>
      </section>
      <section className="category-shop">
        <div className="category-tools">
          <label>
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Buscar em ${category.name}...`}
            />
          </label>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="featured">Destaques</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome A–Z</option>
          </select>
        </div>
        <div className="category-products">
          {visible.map((product, index) => (
            <article
              key={product.id}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link href={`/produto/${product.slug}`}>
                <div>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 700px) 50vw, 25vw"
                    unoptimized
                  />
                  {product.badge ? <span>{product.badge}</span> : null}
                </div>
                <small>{product.unit}</small>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                {product.oldPriceCents ? (
                  <del>{money(product.oldPriceCents)}</del>
                ) : null}
                <strong>{money(productPrice(product))}</strong>
                {product.saleMode === "weight" ? <small>por kg</small> : null}
              </Link>
              <button onClick={() => add(product)}>+ Adicionar</button>
            </article>
          ))}
        </div>
        {!visible.length ? (
          <div className="category-empty">
            Nenhum produto corresponde à sua busca.
          </div>
        ) : null}
      </section>
      {message ? <div className="category-toast">✓ {message}</div> : null}
    </>
  );
}
