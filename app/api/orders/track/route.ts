import { database } from "@/lib/database";
import { isOrderStatus, ORDER_STATUS_LABELS } from "@/lib/order-status";

type Row = Record<string, unknown>;

const clean = (value: unknown, max = 100) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const digits = (value: unknown, max = 16) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, max);

async function findOrder(orderNumber: string, token: string, phone: string) {
  const db = database();
  const normalizedOrder = clean(orderNumber, 30).toUpperCase();
  if (!normalizedOrder) return null;

  let order: Row | null = null;
  if (token.length >= 24)
    order = await db
      .prepare(
        "SELECT * FROM orders WHERE order_number=? AND tracking_token=? LIMIT 1",
      )
      .bind(normalizedOrder, token)
      .first<Row>();
  else if (phone.length >= 10)
    order = await db
      .prepare(
        "SELECT * FROM orders WHERE order_number=? AND customer_phone=? LIMIT 1",
      )
      .bind(normalizedOrder, phone)
      .first<Row>();

  if (!order) return null;
  const [items, history, customer, review, settings] = await Promise.all([
    db
      .prepare(
        "SELECT product_id,product_name,unit,quantity,quantity_millis,option_label,substitution,unit_price_cents,total_cents FROM order_items WHERE order_id=? ORDER BY id",
      )
      .bind(order.id)
      .all<Row>(),
    db
      .prepare(
        "SELECT status,note,created_at FROM order_status_history WHERE order_id=? ORDER BY id",
      )
      .bind(order.id)
      .all<Row>(),
    db
      .prepare(
        "SELECT points,order_count,referral_code FROM customers WHERE phone=?",
      )
      .bind(order.customer_phone)
      .first<Row>(),
    db
      .prepare("SELECT id,status FROM reviews WHERE order_id=? LIMIT 1")
      .bind(order.id)
      .first<Row>(),
    db
      .prepare("SELECT review_enabled FROM store_settings WHERE id=1")
      .first<Row>(),
  ]);
  const status = isOrderStatus(order.status)
    ? order.status
    : "whatsapp_pending";

  return {
    orderNumber: String(order.order_number),
    status,
    statusLabel: ORDER_STATUS_LABELS[status],
    customerName: String(order.customer_name),
    deliveryType: String(order.delivery_type),
    address: String(order.address || ""),
    neighborhood: String(order.neighborhood || ""),
    postalCode: String(order.postal_code || ""),
    city: String(order.city || ""),
    state: String(order.state || ""),
    paymentMethod: String(order.payment_method),
    scheduledFor: String(order.scheduled_for),
    subtotalCents: Number(order.subtotal_cents),
    discountCents: Number(order.discount_cents),
    deliveryFeeCents: Number(order.delivery_fee_cents),
    totalCents: Number(order.total_cents),
    pointsEarned: Number(order.loyalty_points_earned),
    loyaltyCommitted: Number(order.loyalty_committed) === 1,
    pointsBalance: Number(customer?.points || 0),
    referralCode: String(customer?.referral_code || ""),
    createdAt: String(order.created_at),
    updatedAt: String(order.updated_at),
    reviewAllowed:
      status === "completed" &&
      !review &&
      Number(settings?.review_enabled) === 1,
    reviewStatus: review ? String(review.status) : "",
    reviewToken: status === "completed" ? String(order.review_token || "") : "",
    items: items.results.map((item) => ({
      productId: String(item.product_id),
      productName: String(item.product_name),
      unit: String(item.unit),
      quantity:
        Number(item.quantity_millis || 0) > 0
          ? Number(item.quantity_millis) / 1000
          : Number(item.quantity),
      saleMode:
        Number(item.quantity_millis || 0) % 1000 !== 0 ||
        /kg|peso/i.test(String(item.unit))
          ? "weight"
          : "unit",
      optionLabel: String(item.option_label || ""),
      substitution: String(item.substitution || "confirm"),
      unitPriceCents: Number(item.unit_price_cents),
      totalCents: Number(item.total_cents),
    })),
    history: history.results.map((entry) => {
      const entryStatus = isOrderStatus(entry.status)
        ? entry.status
        : "whatsapp_pending";
      return {
        status: entryStatus,
        label: ORDER_STATUS_LABELS[entryStatus],
        note: String(entry.note || ""),
        createdAt: String(entry.created_at),
      };
    }),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await findOrder(
    url.searchParams.get("pedido") || "",
    clean(url.searchParams.get("token"), 80),
    "",
  );
  if (!result)
    return Response.json(
      { error: "Pedido não encontrado ou link inválido" },
      { status: 404 },
    );
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Origem não permitida" }, { status: 403 });
  const body = (await request.json()) as {
    orderNumber?: string;
    phone?: string;
  };
  const result = await findOrder(
    body.orderNumber || "",
    "",
    digits(body.phone),
  );
  if (!result)
    return Response.json(
      { error: "Pedido não encontrado. Confira o número e o WhatsApp." },
      { status: 404 },
    );
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
