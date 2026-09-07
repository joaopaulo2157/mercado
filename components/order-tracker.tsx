"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/default-data";
import { formatQuantity, substitutionLabel } from "@/lib/commerce";
import type { OrderHistoryEntry } from "@/lib/store-types";

type TrackedOrder = {
  orderNumber: string;
  status: string;
  statusLabel: string;
  customerName: string;
  deliveryType: string;
  address: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  paymentMethod: string;
  scheduledFor: string;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  pointsEarned: number;
  loyaltyCommitted: boolean;
  pointsBalance: number;
  referralCode: string;
  createdAt: string;
  reviewAllowed: boolean;
  reviewStatus: string;
  reviewToken: string;
  items: {
    productId: string;
    productName: string;
    unit: string;
    quantity: number;
    saleMode: "unit" | "weight";
    optionLabel: string;
    substitution: "confirm" | "similar" | "none";
    unitPriceCents: number;
    totalCents: number;
  }[];
  history: {
    status: string;
    label: string;
    note: string;
    createdAt: string;
  }[];
};

const rememberStatus = (tracked: TrackedOrder) => {
  try {
    const history = JSON.parse(
      localStorage.getItem("sc-order-history-v2") || "[]",
    ) as OrderHistoryEntry[];
    localStorage.setItem(
      "sc-order-history-v2",
      JSON.stringify(
        history.map((entry) =>
          entry.orderNumber === tracked.orderNumber
            ? { ...entry, status: tracked.status }
            : entry,
        ),
      ),
    );
  } catch {}
};

export default function OrderTracker({
  initialOrder = "",
  initialToken = "",
}: {
  initialOrder?: string;
  initialToken?: string;
}) {
  const [orderNumber, setOrderNumber] = useState(initialOrder),
    [phone, setPhone] = useState(""),
    [order, setOrder] = useState<TrackedOrder | null>(null),
    [loading, setLoading] = useState(Boolean(initialOrder && initialToken)),
    [error, setError] = useState(""),
    [rating, setRating] = useState(5),
    [comment, setComment] = useState(""),
    [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    if (!initialOrder || !initialToken) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          pedido: initialOrder,
          token: initialToken,
        });
        const response = await fetch(`/api/orders/track?${params}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) {
          setOrder(data);
          rememberStatus(data);
        }
      } catch (loadError) {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível consultar o pedido",
          );
      } finally {
        if (active) setLoading(false);
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [initialOrder, initialToken]);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrder(data);
      rememberStatus(data);
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Não foi possível consultar o pedido",
      );
    } finally {
      setLoading(false);
    }
  };

  const sendReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order) return;
    setReviewMessage("");
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: order.orderNumber,
        reviewToken: order.reviewToken,
        rating,
        comment,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setReviewMessage(data.error || "Não foi possível enviar a avaliação");
      return;
    }
    setReviewMessage(data.message);
    setOrder({ ...order, reviewAllowed: false, reviewStatus: "pending" });
  };

  return (
    <div className="tracker-layout">
      <section className="tracker-search">
        <span>ACOMPANHAMENTO SEGURO</span>
        <h1>Onde está o meu pedido?</h1>
        <p>
          Use o link recebido na confirmação ou informe o número do pedido e o
          mesmo WhatsApp usado na compra.
        </p>
        <form onSubmit={search}>
          <label>
            Número do pedido
            <input
              required
              value={orderNumber}
              onChange={(event) =>
                setOrderNumber(event.target.value.toUpperCase())
              }
              placeholder="Ex.: SC12345678"
            />
          </label>
          <label>
            WhatsApp da compra
            <input
              required
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(82) 99999-9999"
            />
          </label>
          <button disabled={loading}>
            {loading ? "Consultando..." : "Acompanhar pedido"}
          </button>
        </form>
        <small>
          Seus dados são usados somente para localizar a compra correspondente.
        </small>
        {error ? <div className="tracker-error">{error}</div> : null}
      </section>

      <section className="tracker-result" aria-live="polite">
        {loading ? (
          <div className="tracker-loading">
            <i />
            <p>Buscando as informações mais recentes...</p>
          </div>
        ) : order ? (
          <>
            <header>
              <div>
                <span>PEDIDO {order.orderNumber}</span>
                <h2>{order.statusLabel}</h2>
                <p>
                  Criado em {new Date(order.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <strong className={`order-state ${order.status}`}>
                {order.statusLabel}
              </strong>
            </header>
            <div className="tracking-timeline">
              {order.history.map((entry, index) => (
                <article key={`${entry.status}-${entry.createdAt}-${index}`}>
                  <i>{index === order.history.length - 1 ? "✓" : ""}</i>
                  <div>
                    <b>{entry.label}</b>
                    <p>{entry.note}</p>
                    <small>
                      {new Date(entry.createdAt).toLocaleString("pt-BR")}
                    </small>
                  </div>
                </article>
              ))}
            </div>
            <div className="tracked-order-grid">
              <article>
                <h3>Itens do pedido</h3>
                {order.items.map((item) => (
                  <div key={item.productId}>
                    <span>
                      {formatQuantity(item, item.quantity)} · {item.productName}
                      <small>
                        {item.optionLabel || item.unit} · Se faltar: {" "}
                        {substitutionLabel(item.substitution)}
                      </small>
                    </span>
                    <b>{money(item.totalCents)}</b>
                  </div>
                ))}
                {order.discountCents > 0 ? (
                  <div>
                    <span>Desconto</span>
                    <b>-{money(order.discountCents)}</b>
                  </div>
                ) : null}
                <div>
                  <span>Entrega</span>
                  <b>{money(order.deliveryFeeCents)}</b>
                </div>
                <div className="tracked-total">
                  <span>Total estimado</span>
                  <b>{money(order.totalCents)}</b>
                </div>
              </article>
              <article>
                <h3>Entrega e pagamento</h3>
                <p>
                  <b>Recebimento</b>
                  {order.deliveryType === "delivery"
                    ? `${order.address} · ${order.city}/${order.state}`
                    : "Retirada na loja"}
                </p>
                <p>
                  <b>Pagamento</b>
                  {order.paymentMethod}
                </p>
                <p>
                  <b>Previsão solicitada</b>
                  {order.scheduledFor}
                </p>
              </article>
            </div>
            <div className="tracking-loyalty">
              <span>★</span>
              <div>
                <b>{order.pointsBalance} pontos no Clube Central</b>
                <small>
                  {order.loyaltyCommitted
                    ? `${order.pointsEarned} pontos deste pedido já creditados.`
                    : `${order.pointsEarned} pontos serão liberados após a conclusão.`}
                </small>
              </div>
              {order.referralCode ? (
                <button
                  onClick={() =>
                    void navigator.clipboard.writeText(order.referralCode)
                  }
                >
                  Indique: {order.referralCode}
                </button>
              ) : null}
            </div>
            {order.reviewAllowed ? (
              <form className="review-form" onSubmit={sendReview}>
                <span>COMPRA CONCLUÍDA</span>
                <h3>Como foi sua experiência?</h3>
                <div className="review-stars" aria-label="Nota da avaliação">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={value <= rating ? "active" : ""}
                      onClick={() => setRating(value)}
                      aria-label={`${value} estrelas`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  minLength={8}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Conte o que mais gostou ou o que podemos melhorar..."
                />
                <button>Enviar avaliação</button>
                {reviewMessage ? <p>{reviewMessage}</p> : null}
              </form>
            ) : order.reviewStatus ? (
              <div className="review-sent">
                ✓ Sua avaliação foi recebida e está em moderação.
              </div>
            ) : null}
          </>
        ) : (
          <div className="tracker-placeholder">
            <span>📦</span>
            <h2>Acompanhe cada etapa</h2>
            <p>
              Confirmação, separação, saída para entrega e conclusão aparecem
              aqui em tempo real conforme a equipe atualiza o pedido.
            </p>
            <Link href="/meus-pedidos">Ver pedidos salvos neste aparelho</Link>
          </div>
        )}
      </section>
    </div>
  );
}
