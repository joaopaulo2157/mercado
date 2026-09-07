import { database } from "@/lib/database";

const clean = (value: unknown, max = 500) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = clean(url.searchParams.get("productId"), 80);
  const db = database();
  const rows = productId
    ? await db
        .prepare(
          "SELECT id,customer_name,rating,comment,created_at FROM reviews WHERE status='approved' AND (product_id=? OR product_id IS NULL) ORDER BY created_at DESC LIMIT 12",
        )
        .bind(productId)
        .all<Record<string, unknown>>()
    : await db
        .prepare(
          "SELECT id,customer_name,rating,comment,created_at FROM reviews WHERE status='approved' ORDER BY created_at DESC LIMIT 12",
        )
        .all<Record<string, unknown>>();
  return Response.json(
    rows.results.map((row) => ({
      id: Number(row.id),
      customerName: String(row.customer_name),
      rating: Number(row.rating),
      comment: String(row.comment),
      createdAt: String(row.created_at),
    })),
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Origem não permitida" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 20_000)
    return Response.json({ error: "Avaliação muito grande" }, { status: 413 });

  const body = (await request.json()) as {
    orderNumber?: string;
    reviewToken?: string;
    rating?: number;
    comment?: string;
    productId?: string;
  };
  const orderNumber = clean(body.orderNumber, 30).toUpperCase();
  const reviewToken = clean(body.reviewToken, 80);
  const comment = clean(body.comment, 600);
  const productId = clean(body.productId, 80) || null;
  const rating = Math.round(Number(body.rating));
  if (!orderNumber || reviewToken.length < 24 || rating < 1 || rating > 5)
    return Response.json(
      { error: "Dados de avaliação inválidos" },
      { status: 400 },
    );
  if (comment.length < 8)
    return Response.json(
      { error: "Conte um pouco mais sobre sua experiência" },
      { status: 400 },
    );

  const db = database();
  const settings = await db
    .prepare("SELECT review_enabled FROM store_settings WHERE id=1")
    .first<{ review_enabled: number }>();
  if (Number(settings?.review_enabled) !== 1)
    return Response.json(
      { error: "As avaliações estão temporariamente desativadas" },
      { status: 403 },
    );
  const order = await db
    .prepare(
      "SELECT id,customer_name FROM orders WHERE order_number=? AND review_token=? AND status='completed' LIMIT 1",
    )
    .bind(orderNumber, reviewToken)
    .first<{ id: number; customer_name: string }>();
  if (!order)
    return Response.json(
      { error: "A avaliação é liberada após a conclusão do pedido" },
      { status: 403 },
    );
  const existing = await db
    .prepare("SELECT id FROM reviews WHERE order_id=? LIMIT 1")
    .bind(order.id)
    .first<{ id: number }>();
  if (existing)
    return Response.json(
      { error: "Este pedido já recebeu uma avaliação" },
      { status: 409 },
    );
  if (productId) {
    const item = await db
      .prepare(
        "SELECT 1 ok FROM order_items WHERE order_id=? AND product_id=? LIMIT 1",
      )
      .bind(order.id, productId)
      .first<{ ok: number }>();
    if (!item)
      return Response.json(
        { error: "O produto não pertence a este pedido" },
        { status: 400 },
      );
  }

  await db
    .prepare(
      "INSERT INTO reviews(order_id,product_id,customer_name,rating,comment,status) VALUES(?,?,?,?,?,'pending')",
    )
    .bind(order.id, productId, order.customer_name, rating, comment)
    .run();
  return Response.json(
    { ok: true, message: "Avaliação enviada para moderação" },
    { status: 201 },
  );
}
