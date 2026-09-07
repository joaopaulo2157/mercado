import { database } from "@/lib/database";

const clean = (value: unknown, max = 100) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const digits = (value: unknown) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 16);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Origem não permitida" }, { status: 403 });
  const body = (await request.json()) as {
    phone?: string;
    orderNumber?: string;
  };
  const phone = digits(body.phone);
  const orderNumber = clean(body.orderNumber, 30).toUpperCase();
  if (phone.length < 10 || !orderNumber)
    return Response.json(
      { error: "Informe seu WhatsApp e um número de pedido" },
      { status: 400 },
    );

  const db = database();
  const verified = await db
    .prepare(
      "SELECT 1 ok FROM orders WHERE order_number=? AND customer_phone=? LIMIT 1",
    )
    .bind(orderNumber, phone)
    .first<{ ok: number }>();
  if (!verified)
    return Response.json(
      { error: "Não foi possível confirmar seus dados" },
      { status: 404 },
    );
  const customer = await db
    .prepare(
      "SELECT name,points,order_count,lifetime_value_cents,referral_code FROM customers WHERE phone=?",
    )
    .bind(phone)
    .first<Record<string, unknown>>();
  if (!customer)
    return Response.json({ error: "Cliente não encontrado" }, { status: 404 });

  return Response.json(
    {
      name: String(customer.name),
      points: Number(customer.points),
      orderCount: Number(customer.order_count),
      lifetimeValueCents: Number(customer.lifetime_value_cents),
      referralCode: String(customer.referral_code),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
