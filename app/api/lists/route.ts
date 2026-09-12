import { database } from "@/lib/database";
import type {
  Cart,
  CartOptions,
  ItemSubstitutions,
  ShoppingList,
} from "@/lib/store-types";

type ListPayload = {
  id?: string;
  ownerToken?: string;
  name?: string;
  cart?: Cart;
  options?: CartOptions;
  substitutions?: ItemSubstitutions;
};

const clean = (value: unknown, max: number) =>
  String(value ?? "").trim().slice(0, max);

const validToken = (value: unknown) => {
  const token = clean(value, 120);
  return /^[a-zA-Z0-9-]{24,120}$/.test(token) ? token : "";
};

const sameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
};

const parseList = (row: Record<string, unknown>): ShoppingList => {
  let value: Partial<ShoppingList> = {};
  try {
    value = JSON.parse(String(row.items_json || "{}"));
  } catch {}
  return {
    id: String(row.id),
    name: String(row.name),
    cart: value.cart || {},
    options: value.options || {},
    substitutions: value.substitutions || {},
    updatedAt: String(row.updated_at),
  };
};

export async function GET(request: Request) {
  const ownerToken = validToken(new URL(request.url).searchParams.get("token"));
  if (!ownerToken)
    return Response.json({ error: "Identificador inválido" }, { status: 400 });
  try {
    const rows = await database()
      .prepare(
        "SELECT id,name,items_json,updated_at FROM shopping_lists WHERE owner_token=? ORDER BY updated_at DESC LIMIT 25",
      )
      .bind(ownerToken)
      .all<Record<string, unknown>>();
    return Response.json(rows.results.map(parseList), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Origem não permitida" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 120_000)
    return Response.json({ error: "Lista muito grande" }, { status: 413 });
  try {
    const body = (await request.json()) as ListPayload;
    const ownerToken = validToken(body.ownerToken);
    const name = clean(body.name, 70);
    const cart = body.cart || {};
    if (!ownerToken || !name || !Object.keys(cart).length)
      return Response.json(
        { error: "Informe um nome e adicione produtos à lista" },
        { status: 400 },
      );
    const items = JSON.stringify({
      cart: Object.fromEntries(
        Object.entries(cart).slice(0, 100).map(([id, quantity]) => [
          clean(id, 80),
          Math.max(0, Math.min(999, Number(quantity) || 0)),
        ]),
      ),
      options: Object.fromEntries(
        Object.entries(body.options || {}).slice(0, 100).map(([id, option]) => [
          clean(id, 80),
          clean(option, 80),
        ]),
      ),
      substitutions: Object.fromEntries(
        Object.entries(body.substitutions || {})
          .slice(0, 100)
          .map(([id, substitution]) => [
            clean(id, 80),
            ["confirm", "similar", "none"].includes(String(substitution))
              ? substitution
              : "confirm",
          ]),
      ),
    });
    const id = clean(body.id, 80) || crypto.randomUUID();
    const db = database();
    const count = await db
      .prepare("SELECT COUNT(*) total FROM shopping_lists WHERE owner_token=?")
      .bind(ownerToken)
      .first<{ total: number }>();
    if (!body.id && Number(count?.total || 0) >= 25)
      return Response.json(
        { error: "Limite de 25 listas atingido" },
        { status: 400 },
      );
    await db
      .prepare(
        "INSERT INTO shopping_lists(id,owner_token,name,items_json) VALUES(?,?,?,?) ON CONFLICT (id) DO UPDATE SET name=CASE WHEN shopping_lists.owner_token=EXCLUDED.owner_token THEN EXCLUDED.name ELSE shopping_lists.name END,items_json=CASE WHEN shopping_lists.owner_token=EXCLUDED.owner_token THEN EXCLUDED.items_json ELSE shopping_lists.items_json END,updated_at=CASE WHEN shopping_lists.owner_token=EXCLUDED.owner_token THEN CURRENT_TIMESTAMP ELSE shopping_lists.updated_at END",
      )
      .bind(id, ownerToken, name, items)
      .run();
    return Response.json({ ok: true, id }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Não foi possível salvar a lista" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Origem não permitida" }, { status: 403 });
  try {
    const body = (await request.json()) as ListPayload;
    const ownerToken = validToken(body.ownerToken);
    const id = clean(body.id, 80);
    if (!ownerToken || !id)
      return Response.json({ error: "Lista inválida" }, { status: 400 });
    await database()
      .prepare("DELETE FROM shopping_lists WHERE id=? AND owner_token=?")
      .bind(id, ownerToken)
      .run();
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Não foi possível excluir a lista" },
      { status: 500 },
    );
  }
}
