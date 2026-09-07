import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PrintButton from "@/components/print-button";
import { can, requireAdminPage } from "@/lib/admin-auth";
import { database } from "@/lib/database";
import { money } from "@/lib/default-data";
import { isOrderStatus, ORDER_STATUS_LABELS } from "@/lib/order-status";
import "./print.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Imprimir pedido",
  robots: { index: false, follow: false },
};

type Row = Record<string, unknown>;

const quantityLabel = (item: Row) => {
  const millis = Number(item.quantity_millis || 0);
  const quantity = millis > 0 ? millis / 1000 : Number(item.quantity || 0);
  if (millis % 1000 !== 0 || /kg|peso/i.test(String(item.unit)))
    return `${quantity.toLocaleString("pt-BR", {
      maximumFractionDigits: 3,
    })} kg`;
  return `${quantity} un.`;
};

const substitutionLabel = (value: unknown) =>
  String(value) === "similar"
    ? "Pode substituir por similar"
    : String(value) === "none"
      ? "Não substituir"
      : "Confirmar antes";

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdminPage();
  if (
    !auth.allowed ||
    !auth.role ||
    !can(auth.role, "orders", auth.permissions)
  )
    return (
      <main className="print-denied">
        <h1>Acesso não autorizado</h1>
        <Link href="/admin">Voltar ao painel</Link>
      </main>
    );
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const db = database();
  const [order, items, settings] = await Promise.all([
    db
      .prepare(
        "SELECT o.*,z.name zone_name FROM orders o LEFT JOIN delivery_zones z ON z.id=o.neighborhood WHERE o.id=?",
      )
      .bind(id)
      .first<Row>(),
    db
      .prepare(
        "SELECT i.*,p.sku,p.barcode FROM order_items i LEFT JOIN products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY i.category_name,i.product_name",
      )
      .bind(id)
      .all<Row>(),
    db.prepare("SELECT * FROM store_settings WHERE id=1").first<Row>(),
  ]);
  if (!order) notFound();
  const status = isOrderStatus(order.status)
    ? ORDER_STATUS_LABELS[order.status]
    : String(order.status);
  return (
    <main className="print-order">
      <header>
        <Image
          src="/assets/sc-supermercado-central-oficial.png"
          alt="Supermercado Central"
          width={260}
          height={95}
          priority
          unoptimized
        />
        <div>
          <span>FOLHA DE SEPARAÇÃO</span>
          <h1>{String(order.order_number)}</h1>
          <p>{status}</p>
        </div>
      </header>
      <div className="print-actions">
        <Link href="/admin">← Voltar ao painel</Link>
        <PrintButton />
      </div>
      <section className="print-customer">
        <article>
          <span>CLIENTE</span>
          <h2>{String(order.customer_name)}</h2>
          <p>{String(order.customer_phone)}</p>
        </article>
        <article>
          <span>RECEBIMENTO</span>
          <h2>
            {String(order.delivery_type) === "delivery"
              ? "Entrega"
              : "Retirada"}
          </h2>
          <p>
            {String(order.delivery_type) === "delivery"
              ? `${String(order.address)} · ${String(order.zone_name || order.neighborhood)} · CEP ${String(order.postal_code)} · ${String(order.city)}/${String(order.state)}`
              : String(settings?.address || "Retirada na loja")}
          </p>
          {order.reference ? <p>Ref.: {String(order.reference)}</p> : null}
        </article>
        <article>
          <span>PAGAMENTO / HORÁRIO</span>
          <h2>{String(order.payment_method)}</h2>
          <p>{String(order.scheduled_for)}</p>
        </article>
      </section>
      <section className="print-items">
        <table>
          <thead>
            <tr>
              <th>✓</th>
              <th>Produto</th>
              <th>SKU / Código</th>
              <th>Qtd.</th>
              <th>Unidade</th>
              <th>Preço</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.results.map((item) => (
              <tr key={String(item.id)}>
                <td>
                  <span className="print-checkbox" />
                </td>
                <td>
                  <b>{String(item.product_name)}</b>
                  <small>{String(item.category_name)}</small>
                  {item.option_label ? (
                    <small>Variação: {String(item.option_label)}</small>
                  ) : null}
                  <small>
                    Se faltar: {substitutionLabel(item.substitution)}
                  </small>
                </td>
                <td>
                  {String(item.sku || "—")}
                  {item.barcode ? <small>{String(item.barcode)}</small> : null}
                </td>
                <td>
                  <strong>{quantityLabel(item)}</strong>
                </td>
                <td>{String(item.unit)}</td>
                <td>{money(Number(item.unit_price_cents))}</td>
                <td>{money(Number(item.total_cents))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="print-bottom">
        <div>
          <h3>Conferência e observações</h3>
          <p>
            <span className="print-checkbox" /> Itens separados
          </p>
          <p>
            <span className="print-checkbox" /> Pesos e substituições
            confirmados
          </p>
          <p>
            <span className="print-checkbox" /> Pagamento confirmado
          </p>
          <p>
            <b>Substituições:</b> {String(order.substitution)}
          </p>
          <p>
            <b>Observações:</b> {String(order.notes || "Sem observações")}
          </p>
        </div>
        <div className="print-totals">
          <p>
            <span>Subtotal</span>
            <b>{money(Number(order.subtotal_cents))}</b>
          </p>
          <p>
            <span>Desconto</span>
            <b>-{money(Number(order.discount_cents))}</b>
          </p>
          <p>
            <span>Entrega</span>
            <b>{money(Number(order.delivery_fee_cents))}</b>
          </p>
          <p>
            <span>Total estimado</span>
            <strong>{money(Number(order.total_cents))}</strong>
          </p>
        </div>
      </section>
      <footer>
        Emitido em {new Date().toLocaleString("pt-BR")} · Pedido criado em{" "}
        {new Date(String(order.created_at)).toLocaleString("pt-BR")}
      </footer>
    </main>
  );
}
