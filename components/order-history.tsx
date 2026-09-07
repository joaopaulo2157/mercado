"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/default-data";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status";
import type { OrderHistoryEntry } from "@/lib/store-types";

type Loyalty = {
  name: string;
  points: number;
  orderCount: number;
  lifetimeValueCents: number;
  referralCode: string;
};

export default function OrderHistory() {
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]),
    [message, setMessage] = useState(""),
    [phone, setPhone] = useState(""),
    [verificationOrder, setVerificationOrder] = useState(""),
    [loyalty, setLoyalty] = useState<Loyalty | null>(null),
    [loyaltyError, setLoyaltyError] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("sc-order-history-v2") || "[]",
        ) as OrderHistoryEntry[];
        if (saved.length) {
          setHistory(saved);
          setVerificationOrder(saved[0].orderNumber);
          return;
        }
        const legacy = JSON.parse(
          localStorage.getItem("sc-last-order") || "null",
        ) as OrderHistoryEntry | null;
        if (legacy?.orderNumber) {
          setHistory([legacy]);
          setVerificationOrder(legacy.orderNumber);
        }
      } catch {}
    });
  }, []);

  const repeat = (entry: OrderHistoryEntry) => {
    localStorage.setItem("sc-central-cart:v3", JSON.stringify(entry.cart || {}));
    localStorage.setItem(
      "sc-cart-options:v1",
      JSON.stringify(entry.options || {}),
    );
    localStorage.setItem(
      "sc-item-substitutions:v1",
      JSON.stringify(entry.substitutions || {}),
    );
    localStorage.setItem("sc-cart-updated-at", String(new Date().getTime()));
    setMessage(
      `A lista do pedido ${entry.orderNumber} voltou para o carrinho.`,
    );
    setTimeout(() => setMessage(""), 3_000);
  };

  const checkLoyalty = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoyaltyError("");
    const response = await fetch("/api/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, orderNumber: verificationOrder }),
    });
    const data = await response.json();
    if (!response.ok) {
      setLoyaltyError(data.error || "Não foi possível consultar os pontos");
      return;
    }
    setLoyalty(data);
  };

  return (
    <div className="history-layout">
      <section className="history-hero">
        <span>HISTÓRICO NESTE APARELHO</span>
        <h1>Suas compras, sempre por perto.</h1>
        <p>
          Acompanhe pedidos recentes, repita sua lista em um clique e consulte
          os pontos do Clube Central.
        </p>
      </section>
      <section className="history-content">
        <div className="history-list">
          <div className="history-title">
            <div>
              <span>PEDIDOS SALVOS</span>
              <h2>{history.length} compras recentes</h2>
            </div>
            <Link href="/#ofertas">+ Nova compra</Link>
          </div>
          {history.length ? (
            history.map((entry) => {
              const status = entry.status as OrderStatus | undefined;
              const trackingHref = entry.trackingToken
                ? `/acompanhar?pedido=${encodeURIComponent(entry.orderNumber)}&token=${encodeURIComponent(entry.trackingToken)}`
                : `/acompanhar?pedido=${encodeURIComponent(entry.orderNumber)}`;
              return (
                <article key={entry.orderNumber}>
                  <div className="history-order-icon">📦</div>
                  <div>
                    <span>{entry.orderNumber}</span>
                    <h3>
                      {status && ORDER_STATUS_LABELS[status]
                        ? ORDER_STATUS_LABELS[status]
                        : "Pedido registrado"}
                    </h3>
                    <small>
                      {new Date(entry.createdAt).toLocaleString("pt-BR")} ·{" "}
                      {Object.keys(entry.cart || {}).length}{" "}
                      {Object.keys(entry.cart || {}).length === 1
                        ? "produto"
                        : "produtos"}
                    </small>
                  </div>
                  <strong>{money(entry.totalCents || 0)}</strong>
                  <div className="history-actions">
                    <Link href={trackingHref}>Acompanhar</Link>
                    <button onClick={() => repeat(entry)}>Repetir lista</button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="history-empty">
              <span>🛒</span>
              <h3>Nenhum pedido salvo neste aparelho</h3>
              <p>Quando você finalizar uma compra, ela aparecerá aqui.</p>
              <Link href="/#ofertas">Explorar o catálogo</Link>
            </div>
          )}
          {message ? <div className="history-message">✓ {message}</div> : null}
        </div>
        <aside className="loyalty-card">
          <span>★ CLUBE CENTRAL</span>
          <h2>Economia que volta para você.</h2>
          {loyalty ? (
            <div className="loyalty-result">
              <small>Olá, {loyalty.name}</small>
              <strong>{loyalty.points}</strong>
              <b>pontos disponíveis</b>
              <p>
                {loyalty.orderCount} pedidos ·{" "}
                {money(loyalty.lifetimeValueCents)}
                em compras registradas
              </p>
              <button
                onClick={() =>
                  void navigator.clipboard.writeText(loyalty.referralCode)
                }
              >
                Código de indicação: <b>{loyalty.referralCode}</b>
              </button>
            </div>
          ) : (
            <form onSubmit={checkLoyalty}>
              <p>
                Confirme uma compra para consultar seu saldo e código de
                indicação.
              </p>
              <label>
                Número de um pedido
                <input
                  required
                  value={verificationOrder}
                  onChange={(event) =>
                    setVerificationOrder(event.target.value.toUpperCase())
                  }
                  placeholder="SC12345678"
                />
              </label>
              <label>
                WhatsApp usado na compra
                <input
                  required
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(82) 99999-9999"
                />
              </label>
              <button>Consultar meus pontos</button>
              {loyaltyError ? <small>{loyaltyError}</small> : null}
            </form>
          )}
        </aside>
      </section>
    </div>
  );
}
