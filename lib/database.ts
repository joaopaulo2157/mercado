import { sqlDatabase } from "./sql-database";
import type {
  Banner,
  CatalogPayload,
  Category,
  Coupon,
  DeliveryZone,
  HomeContent,
  Product,
  StoreSettings,
} from "./store-types";
import { parseProductOptions } from "./commerce";

type SqlRow = Record<string, unknown>;
/**
 * Compatibilidade com a antiga API D1. As rotas existentes continuam usando
 * database().prepare().bind().all()/first()/run(), mas o motor agora é PostgreSQL/Supabase.
 */
export function database() {
  return sqlDatabase();
}
const bool = (v: unknown) => Number(v) === 1;
const text = (v: unknown) => String(v ?? "");
const num = (v: unknown) => Number(v ?? 0);
const nullableText = (v: unknown) => (v == null ? null : String(v));
const nullableNum = (v: unknown) => (v == null ? null : Number(v));
export function mapProduct(r: SqlRow): Product {
  return {
    id: text(r.id),
    sku: text(r.sku),
    barcode: text(r.barcode),
    brand: text(r.brand),
    name: text(r.name),
    slug: text(r.slug),
    description: text(r.description),
    categoryId: text(r.category_id),
    categoryName: text(r.category_name),
    priceCents: num(r.price_cents),
    oldPriceCents: nullableNum(r.old_price_cents),
    costCents: num(r.cost_cents),
    unit: text(r.unit),
    saleMode: text(r.sale_mode) === "weight" ? "weight" : "unit",
    quantityStep: Math.max(0.001, num(r.quantity_step_millis) / 1000 || 1),
    minimumQuantity: Math.max(
      0.001,
      num(r.minimum_quantity_millis) / 1000 || 1,
    ),
    options: parseProductOptions(r.options_json),
    imageUrl: text(r.image_url),
    badge: text(r.badge),
    stockQuantity: num(r.stock_quantity),
    minStock: num(r.min_stock),
    active: bool(r.active),
    featured: bool(r.featured),
    offerStart: nullableText(r.offer_start),
    offerEnd: nullableText(r.offer_end),
  };
}

export function applyOfferSchedule(product: Product, now = new Date().toISOString()): Product {
  const outside =
    (product.offerStart && now < product.offerStart) ||
    (product.offerEnd && now > product.offerEnd);
  return outside && product.oldPriceCents
    ? {
        ...product,
        priceCents: product.oldPriceCents,
        oldPriceCents: null,
        badge: product.badge.toLowerCase().includes("oferta") ? "" : product.badge,
      }
    : product;
}

export function mapCategory(r: SqlRow): Category {
  return {
    id: text(r.id),
    name: text(r.name),
    slug: text(r.slug),
    icon: text(r.icon),
    sortOrder: num(r.sort_order),
    active: bool(r.active),
  };
}
export function mapZone(r: SqlRow): DeliveryZone {
  return {
    id: text(r.id),
    name: text(r.name),
    feeCents: num(r.fee_cents),
    minimumOrderCents: num(r.minimum_order_cents),
    freeShippingCents: num(r.free_shipping_cents),
    eta: text(r.eta),
    active: bool(r.active),
  };
}
export function mapBanner(r: SqlRow): Banner {
  return {
    id: text(r.id),
    title: text(r.title),
    subtitle: text(r.subtitle),
    imageUrl: text(r.image_url),
    ctaLabel: text(r.cta_label),
    ctaUrl: text(r.cta_url),
    active: bool(r.active),
    sortOrder: num(r.sort_order),
  };
}
export function mapCoupon(r: SqlRow): Coupon {
  return {
    code: text(r.code),
    type: text(r.type) as Coupon["type"],
    value: num(r.value),
    maxDiscountCents: nullableNum(r.max_discount_cents),
    minimumCents: num(r.minimum_cents),
    startsAt: nullableText(r.starts_at),
    endsAt: nullableText(r.ends_at),
    usageLimit: num(r.usage_limit),
    usedCount: num(r.used_count),
    active: bool(r.active),
  };
}
export function mapSettings(r: SqlRow): StoreSettings {
  return {
    storeName: text(r.store_name),
    whatsapp: text(r.whatsapp),
    phone: text(r.phone),
    address: text(r.address),
    mapsUrl: text(r.maps_url),
    hours: text(r.hours),
    paymentMethods: text(r.payment_methods),
    pixKey: text(r.pix_key),
    pixMerchantName: text(r.pix_merchant_name),
    pixMerchantCity: text(r.pix_merchant_city),
    minimumOrderCents: num(r.minimum_order_cents),
    allowPickup: bool(r.allow_pickup),
    allowDelivery: bool(r.allow_delivery),
    substitutionPolicy: text(r.substitution_policy),
    announcement: text(r.announcement),
    loyaltyEnabled: bool(r.loyalty_enabled),
    pointsPerReal: num(r.points_per_real),
    reviewEnabled: bool(r.review_enabled),
    flashOfferTitle: text(r.flash_offer_title),
    abandonedCartHours: num(r.abandoned_cart_hours),
  };
}
export function mapHomeContent(
  r: SqlRow,
  respectSchedule = false,
): HomeContent {
  const now = new Date().toISOString();
  const startsAt = nullableText(r.flyer_starts_at);
  const endsAt = nullableText(r.flyer_ends_at);
  const withinSchedule =
    (!startsAt || now >= startsAt) && (!endsAt || now <= endsAt);
  return {
    aboutEyebrow: text(r.about_eyebrow),
    aboutTitle: text(r.about_title),
    aboutText: text(r.about_text),
    storefrontImageUrl: text(r.storefront_image_url),
    interiorImageUrl: text(r.interior_image_url),
    teamImageUrl: text(r.team_image_url),
    flyerEyebrow: text(r.flyer_eyebrow),
    flyerTitle: text(r.flyer_title),
    flyerSubtitle: text(r.flyer_subtitle),
    flyerImageUrl: text(r.flyer_image_url),
    flyerCtaLabel: text(r.flyer_cta_label),
    flyerCtaUrl: text(r.flyer_cta_url),
    flyerStartsAt: startsAt,
    flyerEndsAt: endsAt,
    flyerActive:
      bool(r.flyer_active) && (!respectSchedule || withinSchedule),
  };
}
export async function loadCatalog(): Promise<CatalogPayload> {
  const db = database();
  const [p, c, s, z, b, h] = await Promise.all([
    db
      .prepare(
        "SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.active=1 AND p.stock_quantity>0 ORDER BY p.featured DESC,p.name",
      )
      .all<SqlRow>(),
    db
      .prepare(
        "SELECT * FROM categories WHERE active=1 ORDER BY sort_order,name",
      )
      .all<SqlRow>(),
    db.prepare("SELECT * FROM store_settings WHERE id=1").first<SqlRow>(),
    db
      .prepare("SELECT * FROM delivery_zones WHERE active=1 ORDER BY name")
      .all<SqlRow>(),
    db
      .prepare("SELECT * FROM banners WHERE active=1 ORDER BY sort_order")
      .all<SqlRow>(),
    db.prepare("SELECT * FROM home_content WHERE id=1").first<SqlRow>(),
  ]);
  if (!s || !h) throw new Error("Configuração da loja não encontrada");
  const now = new Date().toISOString();
  const products = p.results.map(mapProduct).map((product) => applyOfferSchedule(product, now));
  return {
    products,
    categories: c.results.map(mapCategory),
    settings: mapSettings(s),
    deliveryZones: z.results.map(mapZone),
    banners: b.results.map(mapBanner),
    homeContent: mapHomeContent(h, true),
  };
}
export async function audit(
  actorEmail: string,
  action: string,
  entity: string,
  entityId: string,
  details: unknown = {},
) {
  await database()
    .prepare(
      "INSERT INTO audit_logs(actor_email,action,entity,entity_id,details) VALUES(?,?,?,?,?)",
    )
    .bind(actorEmail, action, entity, entityId, JSON.stringify(details))
    .run();
}
