import { database, mapCoupon, mapSettings, mapZone } from "@/lib/database";
import { money } from "@/lib/default-data";
import { buildPixPayload } from "@/lib/pix";
import {
  formatQuantity,
  parseProductOptions,
  substitutionLabel,
} from "@/lib/commerce";
import type {
  CheckoutCustomer,
  ItemSubstitution,
} from "@/lib/store-types";

type Input = {
  cart: Record<string, number>;
  customer: CheckoutCustomer;
  sessionKey?: string;
  cartOptions?: Record<string, string>;
  itemSubstitutions?: Record<string, ItemSubstitution>;
  requestKey?: string;
};

type ProductRow = {
  id: string;
  name: string;
  unit: string;
  price_cents: number;
  cost_cents: number;
  stock_quantity: number;
  active: number;
  category_name: string;
  sale_mode: string;
  quantity_step_millis: number;
  minimum_quantity_millis: number;
  options_json: string;
};

const clean = (value: unknown, max = 250) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

const digits = (value: unknown, max = 16) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, max);

const token = () => crypto.randomUUID().replaceAll("-", "");
const referral = () => `SC${token().slice(0, 8).toUpperCase()}`;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return Response.json({ error: "Origem não permitida" }, { status: 403 });
    if (Number(request.headers.get("content-length") || 0) > 120_000)
      return Response.json(
        { error: "Solicitação muito grande" },
        { status: 413 },
      );

    const input = (await request.json()) as Input;
    const requestKey = clean(input.requestKey, 80);
    const customer = input.customer;
    const customerPhone = digits(customer?.phone);
    if (!customer || !clean(customer.name, 100) || customerPhone.length < 10)
      return Response.json(
        { error: "Informe nome e telefone válidos" },
        { status: 400 },
      );
    if (!["delivery", "pickup"].includes(customer.deliveryType))
      return Response.json(
        { error: "Forma de recebimento inválida" },
        { status: 400 },
      );
    if (
      !["PIX", "Dinheiro", "Cartão de débito", "Cartão de crédito"].includes(
        clean(customer.paymentMethod, 80),
      )
    )
      return Response.json(
        { error: "Forma de pagamento inválida" },
        { status: 400 },
      );

    const ids = Object.entries(input.cart ?? {})
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([id]) => id)
      .slice(0, 100);
    if (!ids.length)
      return Response.json({ error: "Carrinho vazio" }, { status: 400 });

    const db = database();
    if (requestKey) {
      const duplicate = await db
        .prepare("SELECT order_number FROM orders WHERE request_key=?")
        .bind(requestKey)
        .first<{ order_number: string }>();
      if (duplicate)
        return Response.json(
          {
            error: `Este pedido já foi registrado como ${duplicate.order_number}`,
            orderNumber: duplicate.order_number,
          },
          { status: 409 },
        );
    }
    const recentOrders = await db
      .prepare(
        "SELECT COUNT(*) total FROM orders WHERE customer_phone=? AND created_at>=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 MINUTE)",
      )
      .bind(customerPhone)
      .first<{ total: number }>();
    if (Number(recentOrders?.total || 0) >= 5)
      return Response.json(
        { error: "Muitas tentativas seguidas. Aguarde alguns minutos." },
        { status: 429 },
      );

    const placeholders = ids.map(() => "?").join(",");
    const rows = await db
      .prepare(
        `SELECT p.id,p.name,p.unit,p.price_cents,p.cost_cents,p.stock_quantity,p.active,p.sale_mode,p.quantity_step_millis,p.minimum_quantity_millis,p.options_json,c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id IN (${placeholders})`,
      )
      .bind(...ids)
      .all<ProductRow>();
    const selected = rows.results.filter((row) => Number(row.active) === 1);
    if (selected.length !== ids.length)
      return Response.json(
        {
          error:
            "Um ou mais produtos ficaram indisponíveis. Atualize o carrinho.",
        },
        { status: 409 },
      );

    let subtotal = 0;
    let costTotal = 0;
    let itemCount = 0;
    const substitutionPreference = clean(customer.substitution, 80).toLowerCase();
    const defaultSubstitution: ItemSubstitution = /não|nao/.test(
      substitutionPreference,
    )
      ? "none"
      : /similar/.test(substitutionPreference)
        ? "similar"
        : "confirm";
    const items = selected.map((row) => {
      const isWeight = String(row.sale_mode) === "weight";
      const step = isWeight
        ? Math.max(0.05, Number(row.quantity_step_millis || 250) / 1000)
        : 1;
      const minimum = isWeight
        ? Math.max(step, Number(row.minimum_quantity_millis || 500) / 1000)
        : 1;
      const requested = Number(input.cart[String(row.id)] ?? minimum);
      const quantity = Math.max(
        minimum,
        Math.min(99, Math.round(requested / step) * step),
      );
      if (quantity > Number(row.stock_quantity))
        throw new Error(`Estoque insuficiente para ${String(row.name)}`);
      const options = parseProductOptions(row.options_json);
      const optionId = clean(input.cartOptions?.[String(row.id)], 80);
      const option = options.find((item) => item.id === optionId) || options[0];
      const unitPriceCents = Number(option?.priceCents ?? row.price_cents);
      const unitCostCents = Number(row.cost_cents || 0);
      const totalCents = Math.round(unitPriceCents * quantity);
      subtotal += totalCents;
      costTotal += Math.round(unitCostCents * quantity);
      itemCount += 1;
      const requestedSubstitution = input.itemSubstitutions?.[String(row.id)];
      const substitution: ItemSubstitution = ["confirm", "similar", "none"].includes(
        String(requestedSubstitution),
      )
        ? (requestedSubstitution as ItemSubstitution)
        : defaultSubstitution;
      return {
        productId: String(row.id),
        productName: String(row.name),
        unit: option?.label || String(row.unit),
        categoryName: String(row.category_name || "Sem categoria"),
        quantity,
        quantityMillis: Math.round(quantity * 1000),
        saleMode: isWeight ? ("weight" as const) : ("unit" as const),
        optionId: option?.id || "",
        optionLabel: option?.label || "",
        substitution,
        unitPriceCents,
        unitCostCents,
        totalCents,
      };
    });

    const settingsRow = await db
      .prepare("SELECT * FROM store_settings WHERE id=1")
      .first<Record<string, unknown>>();
    if (!settingsRow) throw new Error("Configuração da loja ausente");
    const settings = mapSettings(settingsRow);
    if (customer.deliveryType === "delivery" && !settings.allowDelivery)
      return Response.json(
        { error: "Entregas estão temporariamente pausadas" },
        { status: 409 },
      );
    if (customer.deliveryType === "pickup" && !settings.allowPickup)
      return Response.json(
        { error: "Retirada está temporariamente indisponível" },
        { status: 409 },
      );

    let deliveryFee = 0;
    let zone: ReturnType<typeof mapZone> | null = null;
    const postalCode = digits(customer.postalCode, 8);
    if (customer.deliveryType === "delivery") {
      if (
        postalCode.length !== 8 ||
        !clean(customer.neighborhood, 100) ||
        !clean(customer.address, 250)
      )
        return Response.json(
          { error: "Informe CEP, bairro e endereço para entrega" },
          { status: 400 },
        );
      const zoneRow = await db
        .prepare("SELECT * FROM delivery_zones WHERE id=? AND active=1")
        .bind(clean(customer.neighborhood, 80))
        .first<Record<string, unknown>>();
      if (!zoneRow)
        return Response.json(
          { error: "Selecione uma área de entrega válida" },
          { status: 400 },
        );
      zone = mapZone(zoneRow);
      const minimum = Math.max(
        settings.minimumOrderCents,
        zone.minimumOrderCents,
      );
      if (subtotal < minimum)
        return Response.json(
          { error: `Pedido mínimo para ${zone.name}: ${money(minimum)}` },
          { status: 400 },
        );
      deliveryFee =
        zone.freeShippingCents > 0 && subtotal >= zone.freeShippingCents
          ? 0
          : zone.feeCents;
    } else if (subtotal < settings.minimumOrderCents)
      return Response.json(
        { error: `Pedido mínimo: ${money(settings.minimumOrderCents)}` },
        { status: 400 },
      );

    let discount = 0;
    const couponCode = clean(customer.couponCode, 40).toUpperCase();
    let coupon: null | ReturnType<typeof mapCoupon> = null;
    if (couponCode) {
      const couponRow = await db
        .prepare("SELECT * FROM coupons WHERE code=?")
        .bind(couponCode)
        .first<Record<string, unknown>>();
      if (!couponRow)
        return Response.json({ error: "Cupom inválido" }, { status: 400 });
      coupon = mapCoupon(couponRow);
      const now = new Date().toISOString();
      if (
        !coupon.active ||
        (coupon.startsAt && now < coupon.startsAt) ||
        (coupon.endsAt && now > coupon.endsAt) ||
        (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) ||
        subtotal < coupon.minimumCents
      )
        return Response.json(
          { error: "Este cupom não está disponível para o pedido" },
          { status: 400 },
        );
      if (coupon.type === "percent")
        discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.type === "fixed") discount = coupon.value;
      if (coupon.type === "free_shipping") deliveryFee = 0;
      if (coupon.maxDiscountCents != null)
        discount = Math.min(discount, coupon.maxDiscountCents);
      discount = Math.min(discount, subtotal);
    }

    const total = subtotal - discount + deliveryFee;
    const pointsEarned = settings.loyaltyEnabled
      ? Math.max(0, Math.floor(total / 100) * settings.pointsPerReal)
      : 0;
    const orderNumber = `SC${Date.now().toString().slice(-7)}${crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 3)
      .toUpperCase()}`;
    const trackingToken = token();
    const reviewToken = token();
    const referralCode = clean(customer.referralCode, 30).toUpperCase();
    const existingCustomer = await db
      .prepare("SELECT * FROM customers WHERE phone=?")
      .bind(customerPhone)
      .first<Record<string, unknown>>();
    if (referralCode) {
      if (existingCustomer) {
        const priorOrders = await db
          .prepare(
            "SELECT COUNT(*) total FROM orders WHERE customer_phone=? AND status!='cancelled'",
          )
          .bind(customerPhone)
          .first<{ total: number }>();
        if (Number(priorOrders?.total || 0) > 0)
          return Response.json(
            {
              error: "O código de indicação é válido apenas na primeira compra",
            },
            { status: 400 },
          );
      }
      const referrer = await db
        .prepare("SELECT phone FROM customers WHERE referral_code=?")
        .bind(referralCode)
        .first<{ phone: string }>();
      if (!referrer || referrer.phone === customerPhone)
        return Response.json(
          { error: "Código de indicação inválido" },
          { status: 400 },
        );
    }
    const result = await db
      .prepare(
        "INSERT INTO orders(order_number,request_key,status,tracking_token,review_token,customer_name,customer_phone,postal_code,city,state,delivery_type,address,neighborhood,reference,payment_method,change_for_cents,scheduled_for,notes,substitution,coupon_code,subtotal_cents,discount_cents,delivery_fee_cents,total_cents,cost_total_cents,loyalty_points_earned,referral_code,item_count) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .bind(
        orderNumber,
        requestKey || null,
        "whatsapp_pending",
        trackingToken,
        reviewToken,
        clean(customer.name, 100),
        customerPhone,
        postalCode,
        clean(customer.city, 100),
        clean(customer.state, 2).toUpperCase(),
        customer.deliveryType,
        clean(customer.address),
        zone?.id ?? "",
        clean(customer.reference),
        clean(customer.paymentMethod, 80),
        customer.changeFor
          ? Math.round(Number(customer.changeFor.replace(",", ".")) * 100)
          : null,
        clean(customer.scheduledFor, 100) || "Assim que possível",
        clean(customer.notes, 500),
        clean(customer.substitution, 80),
        couponCode || null,
        subtotal,
        discount,
        deliveryFee,
        total,
        costTotal,
        pointsEarned,
        referralCode,
        itemCount,
      )
      .run();
    const orderId = Number(result.meta.last_row_id);
    await db.batch([
      ...items.map((item) =>
        db
          .prepare(
            "INSERT INTO order_items(order_id,product_id,product_name,unit,quantity,quantity_millis,option_id,option_label,substitution,unit_price_cents,unit_cost_cents,category_name,total_cents) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
          )
          .bind(
            orderId,
            item.productId,
            item.productName,
            item.unit,
            Math.max(1, Math.round(item.quantity)),
            item.quantityMillis,
            item.optionId,
            item.optionLabel,
            item.substitution,
            item.unitPriceCents,
            item.unitCostCents,
            item.categoryName,
            item.totalCents,
          ),
      ),
      db
        .prepare(
          "INSERT INTO order_status_history(order_id,status,note) VALUES(?,?,?)",
        )
        .bind(orderId, "whatsapp_pending", "Pedido registrado no site"),
    ]);
    if (coupon)
      await db
        .prepare("UPDATE coupons SET used_count=used_count+1 WHERE code=?")
        .bind(coupon.code)
        .run();

    const ownReferralCode = existingCustomer
      ? String(existingCustomer.referral_code)
      : referral();
    await db
      .prepare(
        "INSERT INTO customers(phone,name,points,lifetime_value_cents,order_count,referral_code,referred_by) VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),lifetime_value_cents=customers.lifetime_value_cents+VALUES(lifetime_value_cents),order_count=customers.order_count+1,referred_by=CASE WHEN customers.referred_by='' THEN VALUES(referred_by) ELSE customers.referred_by END,updated_at=CURRENT_TIMESTAMP",
      )
      .bind(
        customerPhone,
        clean(customer.name, 100),
        0,
        total,
        1,
        ownReferralCode,
        referralCode,
      )
      .run();
    const loyalty = await db
      .prepare("SELECT points FROM customers WHERE phone=?")
      .bind(customerPhone)
      .first<{ points: number }>();

    const trackingUrl = new URL("/acompanhar", request.url);
    trackingUrl.searchParams.set("pedido", orderNumber);
    trackingUrl.searchParams.set("token", trackingToken);
    const deliveryLine =
      customer.deliveryType === "delivery"
        ? `Entrega: ${zone?.name} — ${money(deliveryFee)}`
        : "Retirada na loja";
    const lines = [
      `*PEDIDO ${orderNumber}*`,
      `Olá, ${settings.storeName}! 👋`,
      "",
      ...items.map(
        (item) =>
          `• ${formatQuantity(
            {
              saleMode: item.saleMode,
            },
            item.quantity,
          )} de ${item.productName} (${item.unit}) — ${money(item.totalCents)}\n  Substituição: ${substitutionLabel(item.substitution)}`,
      ),
      "",
      `Subtotal: ${money(subtotal)}`,
      discount ? `Desconto: -${money(discount)}` : "",
      deliveryLine,
      `*TOTAL ESTIMADO: ${money(total)}*`,
      "",
      `*Cliente:* ${clean(customer.name)}`,
      `*Telefone:* ${customerPhone}`,
      customer.deliveryType === "delivery"
        ? `*Endereço:* ${clean(customer.address)} — ${zone?.name}${customer.reference ? ` (${clean(customer.reference)})` : ""}`
        : "*Forma:* Retirada na loja",
      `*Pagamento:* ${clean(customer.paymentMethod)}${customer.changeFor ? ` — troco para R$ ${clean(customer.changeFor)}` : ""}`,
      `*Horário:* ${clean(customer.scheduledFor) || "Assim que possível"}`,
      `*Substituições:* ${clean(customer.substitution)}`,
      customer.notes ? `*Observações:* ${clean(customer.notes)}` : "",
      "",
      `*Acompanhar pedido:* ${trackingUrl.toString()}`,
      pointsEarned
        ? `Você receberá ${pointsEarned} pontos após a conclusão do pedido.`
        : "",
      "Aguardo a confirmação de disponibilidade e do valor final.",
    ].filter(Boolean);
    await db
      .prepare("INSERT INTO metrics(event,session_key,metadata) VALUES(?,?,?)")
      .bind(
        "order_created",
        clean(input.sessionKey, 80) || "anonymous",
        JSON.stringify({ orderNumber, total, itemCount }),
      )
      .run();

    return Response.json(
      {
        ok: true,
        orderNumber,
        trackingToken,
        trackingUrl: trackingUrl.toString(),
        totalCents: total,
        pointsEarned,
        pointsBalance: Number(loyalty?.points || 0),
        referralCode: ownReferralCode,
        pixPayload:
          customer.paymentMethod === "PIX"
            ? buildPixPayload({
                key: settings.pixKey,
                merchantName: settings.pixMerchantName,
                merchantCity: settings.pixMerchantCity,
                amountCents: total,
                txid: orderNumber,
              })
            : "",
        whatsapp: `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível criar o pedido";
    return Response.json({ error: message }, { status: 500 });
  }
}
