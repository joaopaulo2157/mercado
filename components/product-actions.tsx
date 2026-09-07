"use client";
import { useState } from "react";
import type { Product } from "@/lib/store-types";
import { money } from "@/lib/default-data";
import {
  changeProductQuantity,
  formatQuantity,
  productMinimum,
} from "@/lib/commerce";

const stored = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
};

export default function ProductActions({ product }: { product: Product }) {
  const [done, setDone] = useState(false),
    [favorite, setFavorite] = useState(false),
    [optionId, setOptionId] = useState(product.options[0]?.id || "");
  const add = () => {
    const cart = stored<Record<string, number>>("sc-central-cart:v3", {});
    cart[product.id] = changeProductQuantity(
      product,
      cart[product.id] || 0,
      1,
    );
    localStorage.setItem("sc-central-cart:v3", JSON.stringify(cart));
    if (optionId) {
      const options = stored<Record<string, string>>("sc-cart-options:v1", {});
      options[product.id] = optionId;
      localStorage.setItem("sc-cart-options:v1", JSON.stringify(options));
    }
    localStorage.setItem("sc-cart-updated-at", String(Date.now()));
    fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "cart_add",
        productId: product.id,
        sessionKey: localStorage.getItem("sc-session") || "product-page",
      }),
    }).catch(() => {});
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };
  const fav = () => {
    const list = stored<string[]>("sc-favorites:v2", []),
      adding = !list.includes(product.id),
      next = adding
        ? [...list, product.id]
        : list.filter((id) => id !== product.id);
    localStorage.setItem("sc-favorites:v2", JSON.stringify(next));
    setFavorite(adding);
  };
  const share = async () => {
    const data = {
      title: product.name,
      text: `Confira ${product.name} no Supermercado Central`,
      url: location.href,
    };
    if (navigator.share) await navigator.share(data);
    else await navigator.clipboard.writeText(location.href);
  };
  const activeOption = product.options.find((option) => option.id === optionId);
  return (
    <div className="detail-commerce">
      {product.options.length ? (
        <label className="detail-option-select">
          Escolha a embalagem
          <select
            value={optionId}
            onChange={(event) => setOptionId(event.target.value)}
          >
            {product.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} — {money(option.priceCents)}
              </option>
            ))}
          </select>
          {activeOption?.oldPriceCents ? (
            <small>
              De {money(activeOption.oldPriceCents)} por {money(activeOption.priceCents)}
            </small>
          ) : null}
        </label>
      ) : null}
      {product.saleMode === "weight" ? (
        <p className="detail-weight-note">
          Venda por peso · mínimo de {formatQuantity(product, productMinimum(product))}
        </p>
      ) : null}
      <div className="detail-actions">
        <button className="detail-add" onClick={add}>
          {done ? "✓ Adicionado ao carrinho" : "Adicionar ao carrinho"}
        </button>
        <button onClick={fav} aria-label="Favoritar">
          {favorite ? "♥" : "♡"}
        </button>
        <button onClick={share} aria-label="Compartilhar">
          ↗
        </button>
      </div>
    </div>
  );
}
