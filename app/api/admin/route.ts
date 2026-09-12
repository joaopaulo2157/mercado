import {
  audit,
  database,
  mapBanner,
  mapCategory,
  mapCoupon,
  mapHomeContent,
  mapProduct,
  mapSettings,
  mapZone,
} from "@/lib/database";
import {
  ALL_ADMIN_PERMISSIONS,
  can,
  permissionsFor,
  requireAdminApi,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin-auth";
import {
  listCatalogBackups,
  readCatalogBackup,
  recordInventoryMovement,
  saveCatalogBackup,
  sha256,
  touchAdminDevice,
} from "@/lib/admin-operations";
import { parseProductOptions } from "@/lib/commerce";
import { hashAdminPassword } from "@/lib/admin-password";
import { ensureV5SecuritySchema } from "@/lib/v5-schema";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;
const str = (v: unknown, max = 500) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const n = (v: unknown) => Math.round(Number(v ?? 0));
const quantity = (v: unknown) =>
  Math.round(Math.max(0, Number(v ?? 0)) * 1000) / 1000;
const b = (v: unknown) => v === true || v === 1 || v === "1";
const slug = (v: unknown) =>
  str(v, 160)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const safeAssetUrl = (value: unknown) => {
  const url = str(value, 1000);
  if (!url) return "";
  if (
    (url.startsWith("/media/") && !url.startsWith("//")) ||
    url.startsWith("https://")
  )
    return url;
  throw new Error("Use uma imagem enviada pelo painel ou uma URL HTTPS");
};
const safeDestination = (value: unknown) => {
  const url = str(value, 300) || "#ofertas";
  if (
    url.startsWith("#") ||
    (url.startsWith("/") && !url.startsWith("//")) ||
    url.startsWith("https://")
  )
    return url;
  return "#ofertas";
};
const ACTION_PERMISSIONS: Record<string, AdminPermission> = {
  saveProduct: "catalog.manage",
  toggleProduct: "catalog.manage",
  deleteProduct: "catalog.manage",
  saveCategory: "catalog.manage",
  saveZone: "settings.manage",
  saveCoupon: "marketing.manage",
  saveBanner: "marketing.manage",
  saveHomeContent: "marketing.manage",
  saveSettings: "settings.manage",
  orderStatus: "orders.manage",
  reviewStatus: "orders.manage",
  bulkImport: "catalog.manage",
  bulkUpdateProducts: "catalog.manage",
  saveNotification: "marketing.manage",
  saveStaff: "team.manage",
  saveSecuritySettings: "security.manage",
  approvalDecision: "security.manage",
  forgetDevice: "security.manage",
  adjustInventory: "inventory.manage",
  createBackup: "backups.manage",
  restoreBackup: "backups.manage",
};
const CRITICAL_ACTIONS = new Set([
  "saveSettings",
  "bulkImport",
  "bulkUpdateProducts",
]);
const approvalSummary = (action: string, data: unknown) => {
  const row = (data || {}) as Row;
  if (action === "saveSettings") return "Alterar dados centrais e pagamento";
  if (action === "bulkImport")
    return `Importar ${Array.isArray(data) ? data.length : 0} produtos`;
  if (action === "bulkUpdateProducts")
    return `Atualização em massa: ${str(row.operation, 40)}`;
  return `Executar ${action}`;
};
async function snapshot() {
  await ensureV5SecuritySchema();
  const db = database();
  const [
    products,
    categories,
    settings,
    zones,
    coupons,
    banners,
    orders,
    orderItems,
    customers,
    reviews,
    audits,
    stats,
    reviewStats,
    events,
    staff,
    topProducts,
    notifications,
    homeContent,
    approvals,
    devices,
    inventoryHistory,
    security,
    backups,
  ] = await Promise.all([
    db
      .prepare(
        "SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.updated_at DESC",
      )
      .all<Row>(),
    db.prepare("SELECT * FROM categories ORDER BY sort_order,name").all<Row>(),
    db.prepare("SELECT * FROM store_settings WHERE id=1").first<Row>(),
    db.prepare("SELECT * FROM delivery_zones ORDER BY name").all<Row>(),
    db.prepare("SELECT * FROM coupons ORDER BY created_at DESC").all<Row>(),
    db.prepare("SELECT * FROM banners ORDER BY sort_order").all<Row>(),
    db
      .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100")
      .all<Row>(),
    db
      .prepare(
        "SELECT * FROM order_items WHERE order_id IN (SELECT id FROM orders ORDER BY created_at DESC LIMIT 100) ORDER BY order_id,id",
      )
      .all<Row>(),
    db
      .prepare(
        "SELECT id,phone,name,points,lifetime_value_cents,order_count,referral_code,referred_by,created_at,updated_at FROM customers ORDER BY updated_at DESC LIMIT 100",
      )
      .all<Row>(),
    db
      .prepare(
        "SELECT r.*,o.order_number FROM reviews r JOIN orders o ON o.id=r.order_id ORDER BY r.created_at DESC LIMIT 100",
      )
      .all<Row>(),
    db
      .prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200")
      .all<Row>(),
    db
      .prepare(
        "SELECT COUNT(*) orders_count,COALESCE(SUM(total_cents),0) revenue_cents,COALESCE(SUM(item_count),0) items_count,COALESCE(SUM(cost_total_cents),0) cost_cents,COALESCE(SUM(subtotal_cents-discount_cents-cost_total_cents),0) gross_profit_cents,COALESCE(AVG(total_cents),0) average_ticket_cents,COALESCE(SUM(CASE WHEN loyalty_committed=1 THEN loyalty_points_earned ELSE 0 END),0) points_issued,(SELECT COUNT(*) FROM customers) customer_count FROM orders WHERE created_at>=CURRENT_TIMESTAMP - INTERVAL '30 days' AND status!='cancelled'",
      )
      .first<Row>(),
    db
      .prepare(
        "SELECT COUNT(*) total,COALESCE(SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END),0) pending,COALESCE(SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END),0) approved FROM reviews",
      )
      .first<Row>(),
    db
      .prepare(
        "SELECT event,COUNT(*) total FROM metrics WHERE created_at>=CURRENT_TIMESTAMP - INTERVAL '30 days' GROUP BY event",
      )
      .all<Row>(),
    db.prepare("SELECT id,email,name,role,permissions_json,active,created_at,updated_at,CASE WHEN password_hash<>'' THEN 1 ELSE 0 END AS has_password FROM staff ORDER BY name,email").all<Row>(),
    db
      .prepare(
        "SELECT m.product_id,p.name,COUNT(*) total FROM metrics m LEFT JOIN products p ON p.id=m.product_id WHERE m.event='cart_add' AND m.created_at>=CURRENT_TIMESTAMP - INTERVAL '30 days' GROUP BY m.product_id,p.name ORDER BY total DESC LIMIT 5",
      )
      .all<Row>(),
    db
      .prepare("SELECT * FROM store_notifications ORDER BY created_at DESC LIMIT 50")
      .all<Row>(),
    db.prepare("SELECT * FROM home_content WHERE id=1").first<Row>(),
    db
      .prepare(
        "SELECT * FROM admin_approvals ORDER BY created_at DESC LIMIT 100",
      )
      .all<Row>(),
    db
      .prepare(
        "SELECT *,CASE WHEN first_seen_at>=CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 1 ELSE 0 END AS is_recent FROM admin_devices ORDER BY last_seen_at DESC LIMIT 50",
      )
      .all<Row>(),
    db
      .prepare(
        "SELECT m.*,p.name AS product_name,p.sku FROM inventory_movements m LEFT JOIN products p ON p.id=m.product_id ORDER BY m.created_at DESC LIMIT 150",
      )
      .all<Row>(),
    db.prepare("SELECT * FROM security_settings WHERE id=1").first<Row>(),
    listCatalogBackups().catch(() => []),
  ]);
  if (!homeContent) throw new Error("Conteúdo da página inicial ausente");
  return {
    products: products.results.map(mapProduct),
    categories: categories.results.map(mapCategory),
    settings: settings ? mapSettings(settings) : null,
    deliveryZones: zones.results.map(mapZone),
    coupons: coupons.results.map(mapCoupon),
    banners: banners.results.map(mapBanner),
    homeContent: mapHomeContent(homeContent),
    orders: orders.results.map((order) => ({
      ...order,
      items: orderItems.results.filter(
        (item) => Number(item.order_id) === Number(order.id),
      ),
    })),
    customers: customers.results,
    reviews: reviews.results,
    audits: audits.results,
    stats: {
      ordersCount: Number(stats?.orders_count ?? 0),
      revenueCents: Number(stats?.revenue_cents ?? 0),
      itemsCount: Number(stats?.items_count ?? 0),
      averageTicketCents: Number(stats?.average_ticket_cents ?? 0),
      costCents: Number(stats?.cost_cents ?? 0),
      grossProfitCents: Number(stats?.gross_profit_cents ?? 0),
      customerCount: Number(stats?.customer_count ?? 0),
      pointsIssued: Number(stats?.points_issued ?? 0),
      pendingReviews: Number(reviewStats?.pending ?? 0),
      approvedReviews: Number(reviewStats?.approved ?? 0),
      lowStock: products.results.filter(
        (r) => Number(r.stock_quantity) <= Number(r.min_stock),
      ).length,
      activeProducts: products.results.filter((r) => Number(r.active) === 1)
        .length,
      costConfiguredProducts: products.results.filter(
        (r) => Number(r.active) === 1 && Number(r.cost_cents) > 0,
      ).length,
    },
    events: Object.fromEntries(
      events.results.map((r) => [String(r.event), Number(r.total)]),
    ),
    staff: staff.results,
    topProducts: topProducts.results,
    notifications: notifications.results.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      body: String(row.body),
      url: String(row.url || "/#ofertas"),
      active: Number(row.active) === 1,
      publishedAt: row.published_at ? String(row.published_at) : null,
      expiresAt: row.expires_at ? String(row.expires_at) : null,
    })),
    approvals: approvals.results,
    devices: devices.results,
    inventoryHistory: inventoryHistory.results,
    securitySettings: {
      requireOwnerApproval:
        Number(security?.require_owner_approval ?? 1) === 1,
      newDeviceAlerts: Number(security?.new_device_alerts ?? 1) === 1,
      updatedBy: String(security?.updated_by || "sistema"),
      updatedAt: String(security?.updated_at || ""),
    },
    backups,
  };
}
type Snapshot = Awaited<ReturnType<typeof snapshot>>;
function snapshotForRole(
  data: Snapshot,
  role: AdminRole,
  permissions: AdminPermission[],
  actorEmail: string,
): Snapshot {
  if (role === "owner") return data;
  const allowed = (permission: AdminPermission) =>
    can(role, permission, permissions);
  const publicSettings = data.settings
    ? { ...data.settings, pixKey: "" }
    : data.settings;
  return {
    ...data,
    products:
      allowed("catalog.manage") || allowed("inventory.manage")
        ? data.products
        : [],
    categories: allowed("catalog.manage") ? data.categories : [],
    settings: allowed("settings.manage") ? data.settings : publicSettings,
    deliveryZones: allowed("settings.manage") ? data.deliveryZones : [],
    coupons: allowed("marketing.manage") ? data.coupons : [],
    banners: allowed("marketing.manage") ? data.banners : [],
    notifications: allowed("marketing.manage") ? data.notifications : [],
    orders: allowed("orders.manage") ? data.orders : [],
    customers: allowed("orders.manage") ? data.customers : [],
    reviews: allowed("orders.manage") ? data.reviews : [],
    audits: allowed("audit.view") ? data.audits : [],
    staff: allowed("team.manage") ? data.staff : [],
    topProducts: allowed("reports.view") ? data.topProducts : [],
    approvals: allowed("security.manage")
      ? data.approvals
      : data.approvals.filter(
          (approval) =>
            String(approval.requested_by).toLowerCase() ===
            actorEmail.toLowerCase(),
        ),
    devices: allowed("security.manage")
      ? data.devices
      : data.devices.filter(
          (device) =>
            String(device.actor_email).toLowerCase() ===
            actorEmail.toLowerCase(),
        ),
    inventoryHistory: allowed("inventory.manage")
      ? data.inventoryHistory
      : [],
    backups: allowed("backups.manage") ? data.backups : [],
  };
}
async function saveDailyBackup(data: unknown, actorEmail: string) {
  const day = new Date().toISOString().slice(0, 10);
  await saveCatalogBackup(
    data,
    actorEmail,
    "backup diário automático",
    `backups/catalog-${day}.json`,
  );
}
export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok)
    return Response.json({ error: auth.error }, { status: auth.status });
  try {
    await touchAdminDevice(request, auth.user.email).catch(() => {});
    return Response.json({
      ...snapshotForRole(
        await snapshot(),
        auth.role,
        auth.permissions,
        auth.user.email,
      ),
      currentRole: auth.role,
      currentPermissions: auth.permissions,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao carregar painel",
      },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))
  )
    return Response.json({ error: "Origem não permitida" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 2_000_000)
    return Response.json(
      { error: "Solicitação muito grande" },
      { status: 413 },
    );
  const auth = await requireAdminApi();
  if (!auth.ok)
    return Response.json({ error: auth.error }, { status: auth.status });
  try {
    const body = (await request.json()) as {
      action?: string;
      data?: Record<string, unknown> | Record<string, unknown>[];
      approvalId?: string;
    };
    const action = str(body.action, 60),
      data = body.data,
      approvalId = str(body.approvalId, 80);
    const db = database();
    if (!data) throw new Error("Dados ausentes");
    const requiredPermission = ACTION_PERMISSIONS[action];
    if (!requiredPermission) throw new Error("Ação administrativa desconhecida");
    if (!can(auth.role, requiredPermission, auth.permissions))
      return Response.json(
        { error: "Seu perfil não pode executar esta ação" },
        { status: 403 },
      );
    let approvalToExecute = "";
    if (auth.role !== "owner" && CRITICAL_ACTIONS.has(action)) {
      const policy = await db
        .prepare(
          "SELECT require_owner_approval FROM security_settings WHERE id=1",
        )
        .first<{ require_owner_approval: number }>();
      if (Number(policy?.require_owner_approval ?? 1) === 1) {
        const payloadJson = JSON.stringify(data);
        const payloadHash = await sha256(`${action}|${payloadJson}`);
        if (approvalId) {
          const approved = await db
            .prepare(
              "SELECT id FROM admin_approvals WHERE id=? AND requested_by=? AND action=? AND payload_hash=? AND status='approved' AND expires_at>CURRENT_TIMESTAMP",
            )
            .bind(
              approvalId,
              auth.user.email.toLowerCase(),
              action,
              payloadHash,
            )
            .first<{ id: string }>();
          if (!approved)
            throw new Error(
              "Esta ação ainda não foi aprovada ou já expirou",
            );
          approvalToExecute = approved.id;
        } else {
          const existing = await db
            .prepare(
              "SELECT id FROM admin_approvals WHERE requested_by=? AND action=? AND payload_hash=? AND status='pending' AND expires_at>CURRENT_TIMESTAMP LIMIT 1",
            )
            .bind(auth.user.email.toLowerCase(), action, payloadHash)
            .first<{ id: string }>();
          const id = existing?.id || crypto.randomUUID();
          if (!existing)
            await db
              .prepare(
                "INSERT INTO admin_approvals(id,action,payload_json,payload_hash,summary,requested_by,expires_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP + INTERVAL '48 hours')",
              )
              .bind(
                id,
                action,
                payloadJson,
                payloadHash,
                approvalSummary(action, data),
                auth.user.email.toLowerCase(),
              )
              .run();
          await audit(auth.user.email, "request_approval", "approval", id, {
            action,
          });
          const queuedSnapshot = await snapshot();
          return Response.json({
            ok: true,
            approvalQueued: true,
            message: "Ação enviada para aprovação do proprietário",
            data: {
              ...snapshotForRole(
                queuedSnapshot,
                auth.role,
                auth.permissions,
                auth.user.email,
              ),
              currentRole: auth.role,
              currentPermissions: auth.permissions,
            },
          });
        }
      }
    }
    if (action === "saveProduct") {
      const d = data as Row,
        id = str(d.id, 80) || crypto.randomUUID(),
        name = str(d.name, 160),
        productSlug = slug(d.slug || name),
        barcode = str(d.barcode, 80),
        saleMode = str(d.saleMode, 20) === "weight" ? "weight" : "unit",
        priceCents = n(d.priceCents),
        options = parseProductOptions(d.options || []),
        quantityStepMillis =
          saleMode === "weight"
            ? Math.max(50, Math.round(Number(d.quantityStep || 0.25) * 1000))
            : 1000,
        minimumQuantityMillis =
          saleMode === "weight"
            ? Math.max(
                quantityStepMillis,
                Math.round(Number(d.minimumQuantity || 0.5) * 1000),
              )
            : 1000;
      if (
        !name ||
        !str(d.categoryId, 80) ||
        !str(d.unit, 80) ||
        !str(d.imageUrl, 1000) ||
        priceCents <= 0
      )
        throw new Error(
          "Preencha nome, categoria, unidade, preço e imagem do produto",
        );
      if (barcode) {
        const duplicateBarcode = await db
          .prepare("SELECT id FROM products WHERE barcode=? AND id!=? LIMIT 1")
          .bind(barcode, id)
          .first<{ id: string }>();
        if (duplicateBarcode)
          throw new Error("Este código de barras já pertence a outro produto");
      }
      const previousProduct = await db
        .prepare("SELECT stock_quantity FROM products WHERE id=?")
        .bind(id)
        .first<{ stock_quantity: number }>();
      await db
        .prepare(
          "INSERT INTO products(id,sku,barcode,brand,name,slug,description,category_id,price_cents,old_price_cents,cost_cents,unit,sale_mode,quantity_step_millis,minimum_quantity_millis,options_json,image_url,badge,stock_quantity,min_stock,active,featured,offer_start,offer_end,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET sku=EXCLUDED.sku,barcode=EXCLUDED.barcode,brand=EXCLUDED.brand,name=EXCLUDED.name,slug=EXCLUDED.slug,description=EXCLUDED.description,category_id=EXCLUDED.category_id,price_cents=EXCLUDED.price_cents,old_price_cents=EXCLUDED.old_price_cents,cost_cents=EXCLUDED.cost_cents,unit=EXCLUDED.unit,sale_mode=EXCLUDED.sale_mode,quantity_step_millis=EXCLUDED.quantity_step_millis,minimum_quantity_millis=EXCLUDED.minimum_quantity_millis,options_json=EXCLUDED.options_json,image_url=EXCLUDED.image_url,badge=EXCLUDED.badge,stock_quantity=EXCLUDED.stock_quantity,min_stock=EXCLUDED.min_stock,active=EXCLUDED.active,featured=EXCLUDED.featured,offer_start=EXCLUDED.offer_start,offer_end=EXCLUDED.offer_end,updated_at=CURRENT_TIMESTAMP",
        )
        .bind(
          id,
          str(d.sku, 80) || `SC-${Date.now()}`,
          barcode,
          str(d.brand, 100),
          name,
          productSlug,
          str(d.description, 1000),
          str(d.categoryId, 80),
          priceCents,
          d.oldPriceCents ? n(d.oldPriceCents) : null,
          n(d.costCents),
          str(d.unit, 80),
          saleMode,
          quantityStepMillis,
          minimumQuantityMillis,
          JSON.stringify(options),
          str(d.imageUrl, 1000),
          str(d.badge, 40),
          quantity(d.stockQuantity),
          quantity(d.minStock) || 5,
          b(d.active) ? 1 : 0,
          b(d.featured) ? 1 : 0,
          str(d.offerStart, 40) || null,
          str(d.offerEnd, 40) || null,
        )
        .run();
      await recordInventoryMovement({
        productId: id,
        movementType: previousProduct ? "adjustment" : "initial",
        previousQuantity: Number(previousProduct?.stock_quantity || 0),
        newQuantity: quantity(d.stockQuantity),
        reason: previousProduct
          ? "Saldo alterado no cadastro do produto"
          : "Estoque inicial do produto",
        referenceType: "product",
        referenceId: id,
        actorEmail: auth.user.email,
      });
      await audit(auth.user.email, "save", "product", id, { name });
    } else if (action === "toggleProduct") {
      const d = data as Row;
      await db
        .prepare(
          "UPDATE products SET active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        )
        .bind(b(d.active) ? 1 : 0, str(d.id, 80))
        .run();
      await audit(auth.user.email, "toggle", "product", str(d.id, 80), {
        active: b(d.active),
      });
    } else if (action === "deleteProduct") {
      const d = data as Row;
      await db
        .prepare(
          "UPDATE products SET active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        )
        .bind(str(d.id, 80))
        .run();
      await audit(auth.user.email, "archive", "product", str(d.id, 80));
    } else if (action === "saveCategory") {
      const d = data as Row,
        id = str(d.id, 80) || slug(d.name) || crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO categories(id,name,slug,icon,sort_order,active,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,slug=EXCLUDED.slug,icon=EXCLUDED.icon,sort_order=EXCLUDED.sort_order,active=EXCLUDED.active,updated_at=CURRENT_TIMESTAMP",
        )
        .bind(
          id,
          str(d.name, 100),
          slug(d.slug || d.name),
          str(d.icon, 12) || "🛒",
          n(d.sortOrder),
          b(d.active) ? 1 : 0,
        )
        .run();
      await audit(auth.user.email, "save", "category", id);
    } else if (action === "saveZone") {
      const d = data as Row,
        id = str(d.id, 80) || slug(d.name) || crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO delivery_zones(id,name,fee_cents,minimum_order_cents,free_shipping_cents,eta,active,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,fee_cents=EXCLUDED.fee_cents,minimum_order_cents=EXCLUDED.minimum_order_cents,free_shipping_cents=EXCLUDED.free_shipping_cents,eta=EXCLUDED.eta,active=EXCLUDED.active,updated_at=CURRENT_TIMESTAMP",
        )
        .bind(
          id,
          str(d.name, 100),
          n(d.feeCents),
          n(d.minimumOrderCents),
          n(d.freeShippingCents),
          str(d.eta, 80),
          b(d.active) ? 1 : 0,
        )
        .run();
      await audit(auth.user.email, "save", "delivery_zone", id);
    } else if (action === "saveCoupon") {
      const d = data as Row,
        code = str(d.code, 40).toUpperCase();
      if (!code) throw new Error("Informe o código do cupom");
      await db
        .prepare(
          "INSERT INTO coupons(code,type,value,max_discount_cents,minimum_cents,starts_at,ends_at,usage_limit,used_count,active) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT (code) DO UPDATE SET type=EXCLUDED.type,value=EXCLUDED.value,max_discount_cents=EXCLUDED.max_discount_cents,minimum_cents=EXCLUDED.minimum_cents,starts_at=EXCLUDED.starts_at,ends_at=EXCLUDED.ends_at,usage_limit=EXCLUDED.usage_limit,active=EXCLUDED.active",
        )
        .bind(
          code,
          str(d.type, 30),
          n(d.value),
          d.maxDiscountCents ? n(d.maxDiscountCents) : null,
          n(d.minimumCents),
          str(d.startsAt, 40) || null,
          str(d.endsAt, 40) || null,
          n(d.usageLimit),
          n(d.usedCount),
          b(d.active) ? 1 : 0,
        )
        .run();
      await audit(auth.user.email, "save", "coupon", code);
    } else if (action === "saveBanner") {
      const d = data as Row,
        id = str(d.id, 80) || crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO banners(id,title,subtitle,image_url,cta_label,cta_url,active,sort_order) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,image_url=EXCLUDED.image_url,cta_label=EXCLUDED.cta_label,cta_url=EXCLUDED.cta_url,active=EXCLUDED.active,sort_order=EXCLUDED.sort_order",
        )
        .bind(
          id,
          str(d.title, 150),
          str(d.subtitle, 240),
          str(d.imageUrl, 1000),
          str(d.ctaLabel, 50),
          str(d.ctaUrl, 300),
          b(d.active) ? 1 : 0,
          n(d.sortOrder),
        )
        .run();
      await audit(auth.user.email, "save", "banner", id);
    } else if (action === "saveHomeContent") {
      const d = data as Row;
      const aboutTitle = str(d.aboutTitle, 180);
      const flyerTitle = str(d.flyerTitle, 180);
      if (!aboutTitle || !flyerTitle)
        throw new Error("Informe os títulos da seção institucional e do encarte");
      await db
        .prepare(
          "INSERT INTO home_content(id,about_eyebrow,about_title,about_text,storefront_image_url,interior_image_url,team_image_url,flyer_eyebrow,flyer_title,flyer_subtitle,flyer_image_url,flyer_cta_label,flyer_cta_url,flyer_starts_at,flyer_ends_at,flyer_active,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET about_eyebrow=EXCLUDED.about_eyebrow,about_title=EXCLUDED.about_title,about_text=EXCLUDED.about_text,storefront_image_url=EXCLUDED.storefront_image_url,interior_image_url=EXCLUDED.interior_image_url,team_image_url=EXCLUDED.team_image_url,flyer_eyebrow=EXCLUDED.flyer_eyebrow,flyer_title=EXCLUDED.flyer_title,flyer_subtitle=EXCLUDED.flyer_subtitle,flyer_image_url=EXCLUDED.flyer_image_url,flyer_cta_label=EXCLUDED.flyer_cta_label,flyer_cta_url=EXCLUDED.flyer_cta_url,flyer_starts_at=EXCLUDED.flyer_starts_at,flyer_ends_at=EXCLUDED.flyer_ends_at,flyer_active=EXCLUDED.flyer_active,updated_at=CURRENT_TIMESTAMP",
        )
        .bind(
          1,
          str(d.aboutEyebrow, 80) || "PERTINHO DE VOCÊ",
          aboutTitle,
          str(d.aboutText, 800),
          safeAssetUrl(d.storefrontImageUrl),
          safeAssetUrl(d.interiorImageUrl),
          safeAssetUrl(d.teamImageUrl),
          str(d.flyerEyebrow, 80) || "ENCARTE DA SEMANA",
          flyerTitle,
          str(d.flyerSubtitle, 500),
          safeAssetUrl(d.flyerImageUrl),
          str(d.flyerCtaLabel, 60) || "Ver todas as ofertas",
          safeDestination(d.flyerCtaUrl),
          str(d.flyerStartsAt, 40) || null,
          str(d.flyerEndsAt, 40) || null,
          b(d.flyerActive) ? 1 : 0,
        )
        .run();
      await audit(auth.user.email, "save", "home_content", "1");
    } else if (action === "saveSettings") {
      const d = data as Row;
      await db
        .prepare(
          "UPDATE store_settings SET store_name=?,whatsapp=?,phone=?,address=?,maps_url=?,hours=?,payment_methods=?,pix_key=?,pix_merchant_name=?,pix_merchant_city=?,minimum_order_cents=?,allow_pickup=?,allow_delivery=?,substitution_policy=?,announcement=?,loyalty_enabled=?,points_per_real=?,review_enabled=?,flash_offer_title=?,abandoned_cart_hours=?,updated_at=CURRENT_TIMESTAMP WHERE id=1",
        )
        .bind(
          str(d.storeName, 150),
          str(d.whatsapp, 20).replace(/\D/g, ""),
          str(d.phone, 30),
          str(d.address, 300),
          str(d.mapsUrl, 1000),
          str(d.hours, 200),
          str(d.paymentMethods, 300),
          str(d.pixKey, 180),
          str(d.pixMerchantName, 25) || "SUPERMERCADO CENTRAL",
          str(d.pixMerchantCity, 15) || "MACEIO",
          n(d.minimumOrderCents),
          b(d.allowPickup) ? 1 : 0,
          b(d.allowDelivery) ? 1 : 0,
          str(d.substitutionPolicy, 80),
          str(d.announcement, 200),
          b(d.loyaltyEnabled) ? 1 : 0,
          Math.max(0, Math.min(100, n(d.pointsPerReal))),
          b(d.reviewEnabled) ? 1 : 0,
          str(d.flashOfferTitle, 120) || "Oferta-relâmpago",
          Math.max(1, Math.min(720, n(d.abandonedCartHours) || 24)),
        )
        .run();
      await audit(auth.user.email, "save", "settings", "1");
    } else if (action === "orderStatus") {
      const d = data as Row,
        id = str(d.id, 30),
        status = str(d.status, 40);
      if (
        ![
          "whatsapp_pending",
          "confirmed",
          "preparing",
          "out_for_delivery",
          "completed",
          "cancelled",
        ].includes(status)
      )
        throw new Error("Status inválido");
      const current = await db
        .prepare(
          "SELECT status,stock_committed,loyalty_committed,referral_bonus_committed,customer_phone,total_cents,loyalty_points_earned,referral_code,coupon_code FROM orders WHERE id=?",
        )
        .bind(id)
        .first<{
          status: string;
          stock_committed: number;
          loyalty_committed: number;
          referral_bonus_committed: number;
          customer_phone: string;
          total_cents: number;
          loyalty_points_earned: number;
          referral_code: string;
          coupon_code: string | null;
        }>();
      if (!current) throw new Error("Pedido não encontrado");
      const items = await db
        .prepare(
          "SELECT oi.product_id,SUM(oi.quantity) quantity,SUM(CASE WHEN oi.quantity_millis>0 THEN oi.quantity_millis ELSE oi.quantity*1000 END) quantity_millis,p.stock_quantity FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=? GROUP BY oi.product_id,p.stock_quantity",
        )
        .bind(id)
        .all<{
          product_id: string;
          quantity: number;
          quantity_millis: number;
          stock_quantity: number;
        }>();
      const itemQuantity = (item: {
        quantity: number;
        quantity_millis: number;
      }) =>
        Number(item.quantity_millis || 0) > 0
          ? Number(item.quantity_millis) / 1000
          : Number(item.quantity || 0);
      if (
        ["confirmed", "preparing", "out_for_delivery", "completed"].includes(
          status,
        ) &&
        Number(current.stock_committed) !== 1
      ) {
        await db.batch(
          items.results.map((item) =>
            db
              .prepare(
                "UPDATE products SET stock_quantity=GREATEST(0,stock_quantity-?),updated_at=CURRENT_TIMESTAMP WHERE id=?",
              )
              .bind(itemQuantity(item), item.product_id),
          ),
        );
        await db
          .prepare("UPDATE orders SET stock_committed=1 WHERE id=?")
          .bind(id)
          .run();
        for (const item of items.results) {
          const previousQuantity = Number(item.stock_quantity || 0);
          await recordInventoryMovement({
            productId: item.product_id,
            movementType: "sale",
            previousQuantity,
            newQuantity: Math.max(0, previousQuantity - itemQuantity(item)),
            reason: `Reserva de estoque do pedido #${id}`,
            referenceType: "order",
            referenceId: id,
            actorEmail: auth.user.email,
          });
        }
      }
      if (status === "cancelled" && Number(current.stock_committed) === 1) {
        await db.batch(
          items.results.map((item) =>
            db
              .prepare(
                "UPDATE products SET stock_quantity=stock_quantity+?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
              )
              .bind(itemQuantity(item), item.product_id),
          ),
        );
        await db
          .prepare("UPDATE orders SET stock_committed=0 WHERE id=?")
          .bind(id)
          .run();
        for (const item of items.results) {
          const previousQuantity = Number(item.stock_quantity || 0);
          await recordInventoryMovement({
            productId: item.product_id,
            movementType: "return",
            previousQuantity,
            newQuantity: previousQuantity + itemQuantity(item),
            reason: `Devolução ao estoque pelo cancelamento do pedido #${id}`,
            referenceType: "order",
            referenceId: id,
            actorEmail: auth.user.email,
          });
        }
      }
      if (status === "completed" && Number(current.loyalty_committed) !== 1) {
        await db
          .prepare(
            "UPDATE customers SET points=points+?,updated_at=CURRENT_TIMESTAMP WHERE phone=?",
          )
          .bind(current.loyalty_points_earned, current.customer_phone)
          .run();
        await db
          .prepare("UPDATE orders SET loyalty_committed=1 WHERE id=?")
          .bind(id)
          .run();
      }
      if (
        status === "completed" &&
        Number(current.referral_bonus_committed) !== 1 &&
        current.referral_code
      ) {
        const referredCustomer = await db
          .prepare(
            "SELECT referred_by,referral_code,(SELECT MIN(o.id) FROM orders o WHERE o.customer_phone=customers.phone AND (o.status!='cancelled' OR o.id=?)) first_order_id FROM customers WHERE phone=?",
          )
          .bind(id, current.customer_phone)
          .first<{
            referred_by: string;
            referral_code: string;
            first_order_id: number;
          }>();
        const validReferral =
          Number(referredCustomer?.first_order_id) === Number(id) &&
          String(referredCustomer?.referred_by || "").toUpperCase() ===
            current.referral_code.toUpperCase() &&
          String(referredCustomer?.referral_code || "").toUpperCase() !==
            current.referral_code.toUpperCase();
        if (validReferral) {
          const rewarded = await db
            .prepare(
              "UPDATE customers SET points=points+50,updated_at=CURRENT_TIMESTAMP WHERE referral_code=?",
            )
            .bind(current.referral_code.toUpperCase())
            .run();
          if (Number(rewarded.meta.changes || 0) > 0)
            await db
              .prepare(
                "UPDATE orders SET referral_bonus_committed=1 WHERE id=?",
              )
              .bind(id)
              .run();
        }
      }
      if (status === "cancelled" && Number(current.loyalty_committed) === 1) {
        await db
          .prepare(
            "UPDATE customers SET points=GREATEST(0,points-?),updated_at=CURRENT_TIMESTAMP WHERE phone=?",
          )
          .bind(current.loyalty_points_earned, current.customer_phone)
          .run();
        await db
          .prepare("UPDATE orders SET loyalty_committed=0 WHERE id=?")
          .bind(id)
          .run();
      }
      if (
        status === "cancelled" &&
        Number(current.referral_bonus_committed) === 1 &&
        current.referral_code
      ) {
        await db
          .prepare(
            "UPDATE customers SET points=GREATEST(0,points-50),updated_at=CURRENT_TIMESTAMP WHERE referral_code=?",
          )
          .bind(current.referral_code.toUpperCase())
          .run();
        await db
          .prepare("UPDATE orders SET referral_bonus_committed=0 WHERE id=?")
          .bind(id)
          .run();
      }
      if (
        status === "cancelled" &&
        current.status !== "cancelled" &&
        current.coupon_code
      )
        await db
          .prepare(
            "UPDATE coupons SET used_count=GREATEST(0,used_count-1) WHERE code=?",
          )
          .bind(current.coupon_code)
          .run();
      if (status === "cancelled" && current.status !== "cancelled")
        await db
          .prepare(
            "UPDATE customers SET lifetime_value_cents=GREATEST(0,lifetime_value_cents-?),order_count=GREATEST(0,order_count-1),updated_at=CURRENT_TIMESTAMP WHERE phone=?",
          )
          .bind(current.total_cents, current.customer_phone)
          .run();
      if (
        current.status === "cancelled" &&
        status !== "cancelled" &&
        current.coupon_code
      )
        await db
          .prepare("UPDATE coupons SET used_count=used_count+1 WHERE code=?")
          .bind(current.coupon_code)
          .run();
      if (current.status === "cancelled" && status !== "cancelled")
        await db
          .prepare(
            "UPDATE customers SET lifetime_value_cents=lifetime_value_cents+?,order_count=order_count+1,updated_at=CURRENT_TIMESTAMP WHERE phone=?",
          )
          .bind(current.total_cents, current.customer_phone)
          .run();
      await db
        .prepare(
          "UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        )
        .bind(status, id)
        .run();
      const statusNotes: Record<string, string> = {
        whatsapp_pending: "Pedido aguardando confirmação no WhatsApp",
        confirmed: "Pedido confirmado pela equipe",
        preparing: "Separação e conferência iniciadas",
        out_for_delivery: "Pedido liberado para entrega",
        completed: "Pedido concluído e pontos processados",
        cancelled: "Pedido cancelado pela equipe",
      };
      if (current.status !== status)
        await db
          .prepare(
            "INSERT INTO order_status_history(order_id,status,note) VALUES(?,?,?)",
          )
          .bind(id, status, statusNotes[status] || "Status atualizado")
          .run();
      await audit(auth.user.email, "status", "order", id, { status });
    } else if (action === "reviewStatus") {
      const d = data as Row;
      const id = str(d.id, 30);
      const status = str(d.status, 20);
      if (!["pending", "approved", "rejected"].includes(status))
        throw new Error("Status de avaliação inválido");
      const result = await db
        .prepare(
          "UPDATE reviews SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        )
        .bind(status, id)
        .run();
      if (Number(result.meta.changes || 0) < 1)
        throw new Error("Avaliação não encontrada");
      await audit(auth.user.email, "moderate", "review", id, { status });
    } else if (action === "bulkImport") {
      if (!Array.isArray(data)) throw new Error("Lista de produtos inválida");
      const rows = data.slice(0, 1000);
      const statements = rows.map((raw, index) => {
        const d = raw as Row,
          name = str(d.name || d.nome, 160),
          id = str(d.id, 80) || crypto.randomUUID();
        if (!name) throw new Error(`Produto sem nome na linha ${index + 2}`);
        return db
          .prepare(
            "INSERT INTO products(id,sku,barcode,brand,name,slug,description,category_id,price_cents,old_price_cents,cost_cents,unit,sale_mode,quantity_step_millis,minimum_quantity_millis,options_json,image_url,badge,stock_quantity,min_stock,active,featured,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET barcode=EXCLUDED.barcode,brand=EXCLUDED.brand,name=EXCLUDED.name,slug=EXCLUDED.slug,description=EXCLUDED.description,category_id=EXCLUDED.category_id,price_cents=EXCLUDED.price_cents,old_price_cents=EXCLUDED.old_price_cents,cost_cents=EXCLUDED.cost_cents,unit=EXCLUDED.unit,sale_mode=EXCLUDED.sale_mode,quantity_step_millis=EXCLUDED.quantity_step_millis,minimum_quantity_millis=EXCLUDED.minimum_quantity_millis,options_json=EXCLUDED.options_json,image_url=EXCLUDED.image_url,badge=EXCLUDED.badge,stock_quantity=EXCLUDED.stock_quantity,min_stock=EXCLUDED.min_stock,active=EXCLUDED.active,featured=EXCLUDED.featured,updated_at=CURRENT_TIMESTAMP",
          )
          .bind(
            id,
            str(d.sku, 80) || `IMP-${Date.now()}-${index}`,
            str(d.barcode || d.codigo_barras, 80),
            str(d.brand || d.marca, 100),
            name,
            slug(d.slug || name),
            str(d.description || d.descricao, 1000),
            str(d.categoryId || d.categoria, 80),
            n(d.priceCents || Math.round(Number(d.preco || 0) * 100)),
            d.oldPriceCents
              ? n(d.oldPriceCents)
              : d.preco_antigo
                ? Math.round(Number(d.preco_antigo) * 100)
                : null,
            n(d.costCents || Math.round(Number(d.custo || 0) * 100)),
            str(d.unit || d.unidade, 80) || "Unidade",
            str(d.saleMode || d.modo_venda, 20) === "weight"
              ? "weight"
              : "unit",
            Math.max(
              1,
              Math.round(Number(d.quantityStep || d.passo || 1) * 1000),
            ),
            Math.max(
              1,
              Math.round(Number(d.minimumQuantity || d.minimo || 1) * 1000),
            ),
            JSON.stringify(parseProductOptions(d.options || [])),
            str(d.imageUrl || d.imagem, 1000) ||
              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80",
            str(d.badge || d.selo, 40),
            quantity(d.stockQuantity ?? d.estoque),
            quantity(d.minStock ?? d.estoque_minimo) || 5,
            d.active === false ? 0 : 1,
            b(d.featured || d.destaque) ? 1 : 0,
          );
      });
      for (let i = 0; i < statements.length; i += 80)
        await db.batch(statements.slice(i, i + 80));
      await audit(auth.user.email, "bulk_import", "product", "", {
        count: rows.length,
      });
    } else if (action === "bulkUpdateProducts") {
      const d = data as Row;
      const ids = Array.isArray(d.ids)
        ? d.ids.map((id) => str(id, 80)).filter(Boolean).slice(0, 500)
        : [];
      const operation = str(d.operation, 40);
      const value = Number(d.value || 0);
      if (!ids.length) throw new Error("Selecione pelo menos um produto");
      const beforeStocks = new Map<string, number>();
      if (operation === "stock_delta" || operation === "stock_set") {
        for (let index = 0; index < ids.length; index += 80) {
          const currentIds = ids.slice(index, index + 80);
          const currentStocks = await db
            .prepare(
              `SELECT id,stock_quantity FROM products WHERE id IN (${currentIds.map(() => "?").join(",")})`,
            )
            .bind(...currentIds)
            .all<{ id: string; stock_quantity: number }>();
          currentStocks.results.forEach((row) =>
            beforeStocks.set(row.id, Number(row.stock_quantity || 0)),
          );
        }
      }
      const statements = ids.map((id) => {
        if (operation === "price_percent")
          return db
            .prepare(
              "UPDATE products SET price_cents=GREATEST(0,CAST(ROUND(price_cents*(100+?)/100.0) AS INTEGER)),updated_at=CURRENT_TIMESTAMP WHERE id=?",
            )
            .bind(Math.max(-99, Math.min(500, value)), id);
        if (operation === "price_set")
          return db
            .prepare(
              "UPDATE products SET price_cents=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
            )
            .bind(Math.max(0, Math.round(value * 100)), id);
        if (operation === "stock_delta")
          return db
            .prepare(
              "UPDATE products SET stock_quantity=GREATEST(0,stock_quantity+?),updated_at=CURRENT_TIMESTAMP WHERE id=?",
            )
            .bind(Math.round(value * 1000) / 1000, id);
        if (operation === "stock_set")
          return db
            .prepare(
              "UPDATE products SET stock_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
            )
            .bind(quantity(value), id);
        if (operation === "activate" || operation === "deactivate")
          return db
            .prepare(
              "UPDATE products SET active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
            )
            .bind(operation === "activate" ? 1 : 0, id);
        throw new Error("Operação em massa inválida");
      });
      for (let index = 0; index < statements.length; index += 80)
        await db.batch(statements.slice(index, index + 80));
      if (operation === "stock_delta" || operation === "stock_set") {
        const movementStatements = ids.flatMap((id) => {
          const previous = beforeStocks.get(id);
          if (previous == null) return [];
          const next =
            operation === "stock_set"
              ? quantity(value)
              : Math.max(0, previous + Math.round(value * 1000) / 1000);
          return [
            db
              .prepare(
                "INSERT INTO inventory_movements(product_id,movement_type,quantity_delta_millis,previous_quantity_millis,new_quantity_millis,reason,reference_type,reference_id,actor_email) VALUES(?,?,?,?,?,?,?,?,?)",
              )
              .bind(
                id,
                "bulk_adjustment",
                Math.round((next - previous) * 1000),
                Math.round(previous * 1000),
                Math.round(next * 1000),
                "Atualização de estoque em massa",
                "bulk",
                approvalToExecute,
                auth.user.email,
              ),
          ];
        });
        for (let index = 0; index < movementStatements.length; index += 80)
          await db.batch(movementStatements.slice(index, index + 80));
      }
      await audit(auth.user.email, "bulk_update", "product", "", {
        count: ids.length,
        operation,
        value,
      });
    } else if (action === "saveNotification") {
      const d = data as Row;
      const id = str(d.id, 80) || crypto.randomUUID();
      const title = str(d.title, 100);
      const body = str(d.body, 260);
      const rawUrl = str(d.url, 300);
      const notificationUrl =
        (rawUrl.startsWith("/") && !rawUrl.startsWith("//")) ||
        rawUrl.startsWith("https://")
          ? rawUrl
          : "/#ofertas";
      if (!title || !body) throw new Error("Informe título e mensagem");
      await db
        .prepare(
          "INSERT INTO store_notifications(id,title,body,url,active,published_at,expires_at,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,url=EXCLUDED.url,active=EXCLUDED.active,published_at=EXCLUDED.published_at,expires_at=EXCLUDED.expires_at,updated_at=CURRENT_TIMESTAMP",
        )
        .bind(
          id,
          title,
          body,
          notificationUrl,
          b(d.active) ? 1 : 0,
          str(d.publishedAt, 40) || null,
          str(d.expiresAt, 40) || null,
        )
        .run();
      await audit(auth.user.email, "save", "notification", id, { title });
    } else if (action === "saveStaff") {
      if (!(await ensureV5SecuritySchema()))
        throw new Error("A migração de segurança V5 precisa ser aplicada no banco antes de salvar acessos");
      const d = data as Row;
      const email = str(d.email, 180).toLowerCase();
      const role = str(d.role, 30);
      if (!email.includes("@")) throw new Error("Informe um e-mail válido");
      if (
        ![
          "manager",
          "catalog",
          "orders",
          "inventory",
          "marketing",
          "finance",
          "auditor",
        ].includes(role)
      )
        throw new Error("Perfil de acesso inválido");
      const permissions = Array.isArray(d.permissions)
        ? d.permissions
            .map((permission) => str(permission, 80))
            .filter((permission) =>
              ALL_ADMIN_PERMISSIONS.includes(
                permission as AdminPermission,
              ),
            )
        : [];
      if (
        auth.role !== "owner" &&
        permissionsFor(role as AdminRole, permissions as AdminPermission[]).some(
          (permission) => !auth.permissions.includes(permission),
        )
      )
        throw new Error(
          "Você não pode conceder permissões superiores ao seu próprio acesso",
        );
      const id = str(d.id, 80) || crypto.randomUUID();
      const password = String(d.password || "");
      const existing = await db
        .prepare("SELECT id,password_hash,password_salt,password_updated_at FROM staff WHERE id=? OR lower(email)=? LIMIT 1")
        .bind(id, email)
        .first<Row>();
      if (!existing && !password)
        throw new Error("Defina uma senha inicial para o novo membro");
      const credentials = password
        ? hashAdminPassword(password)
        : {
            hash: String(existing?.password_hash || ""),
            salt: String(existing?.password_salt || ""),
          };
      await db
        .prepare(
          "INSERT INTO staff(id,email,name,role,permissions_json,password_hash,password_salt,password_updated_at,mfa_required,active,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP,0,?,CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,role=EXCLUDED.role,permissions_json=EXCLUDED.permissions_json,password_updated_at=CASE WHEN EXCLUDED.password_hash<>staff.password_hash THEN CURRENT_TIMESTAMP ELSE staff.password_updated_at END,password_hash=EXCLUDED.password_hash,password_salt=EXCLUDED.password_salt,mfa_required=0,active=EXCLUDED.active,updated_at=CURRENT_TIMESTAMP",
        )
        .bind(
          id,
          email,
          str(d.name, 120),
          role,
          JSON.stringify(permissions),
          credentials.hash,
          credentials.salt,
          b(d.active) ? 1 : 0,
        )
        .run();
      await audit(auth.user.email, "save", "staff", id, {
        email,
        role,
        permissions,
      });
    } else if (action === "saveSecuritySettings") {
      const d = data as Row;
      await db
        .prepare(
          "INSERT INTO security_settings(id,require_mfa,require_owner_approval,new_device_alerts,updated_by,updated_at) VALUES(1,0,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET require_mfa=0,require_owner_approval=EXCLUDED.require_owner_approval,new_device_alerts=EXCLUDED.new_device_alerts,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP",
        )
        .bind(
          b(d.requireOwnerApproval) ? 1 : 0,
          b(d.newDeviceAlerts) ? 1 : 0,
          auth.user.email,
        )
        .run();
      await audit(auth.user.email, "save", "security_settings", "1", {
          requireOwnerApproval: b(d.requireOwnerApproval),
        newDeviceAlerts: b(d.newDeviceAlerts),
      });
    } else if (action === "approvalDecision") {
      if (auth.role !== "owner")
        throw new Error("Somente o proprietário pode aprovar ações críticas");
      const d = data as Row;
      const id = str(d.id, 80);
      const status = str(d.status, 20);
      if (!["approved", "rejected"].includes(status))
        throw new Error("Decisão de aprovação inválida");
      const result = await db
        .prepare(
          "UPDATE admin_approvals SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending' AND expires_at>CURRENT_TIMESTAMP",
        )
        .bind(status, auth.user.email, id)
        .run();
      if (Number(result.meta.changes || 0) < 1)
        throw new Error("Solicitação indisponível ou expirada");
      await audit(auth.user.email, status, "approval", id);
    } else if (action === "forgetDevice") {
      const d = data as Row;
      const id = str(d.id, 80);
      await db.prepare("DELETE FROM admin_devices WHERE id=?").bind(id).run();
      await audit(auth.user.email, "forget", "admin_device", id);
    } else if (action === "adjustInventory") {
      const d = data as Row;
      const productId = str(d.productId, 80);
      const delta = Math.round(Number(d.delta || 0) * 1000) / 1000;
      const movementType = ["restock", "loss", "return", "adjustment"].includes(
        str(d.movementType, 30),
      )
        ? str(d.movementType, 30)
        : "adjustment";
      const reason = str(d.reason, 240);
      if (!productId || !Number.isFinite(delta) || delta === 0 || !reason)
        throw new Error("Informe produto, quantidade e motivo do ajuste");
      const currentProduct = await db
        .prepare("SELECT stock_quantity FROM products WHERE id=?")
        .bind(productId)
        .first<{ stock_quantity: number }>();
      if (!currentProduct) throw new Error("Produto não encontrado");
      const previousQuantity = Number(currentProduct.stock_quantity || 0);
      const newQuantity = Math.max(0, previousQuantity + delta);
      await db
        .prepare(
          "UPDATE products SET stock_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        )
        .bind(newQuantity, productId)
        .run();
      await recordInventoryMovement({
        productId,
        movementType,
        previousQuantity,
        newQuantity,
        reason,
        actorEmail: auth.user.email,
      });
      await audit(auth.user.email, "adjust", "inventory", productId, {
        delta: newQuantity - previousQuantity,
        reason,
      });
    } else if (action === "createBackup") {
      const key = await saveCatalogBackup(
        await snapshot(),
        auth.user.email,
        "backup manual",
      );
      await audit(auth.user.email, "create", "backup", key || "");
    } else if (action === "restoreBackup") {
      const d = data as Row;
      const key = str(d.key, 240);
      const beforeRestore = await snapshot();
      await saveCatalogBackup(
        beforeRestore,
        auth.user.email,
        `cópia de segurança antes de restaurar ${key}`,
      );
      const saved = await readCatalogBackup(key);
      const savedProducts = (saved.products as Row[]).slice(0, 5000);
      const statements = savedProducts
        .filter((product) => str(product.id, 80))
        .map((product) =>
          db
            .prepare(
              "UPDATE products SET sku=?,barcode=?,brand=?,name=?,slug=?,description=?,category_id=?,price_cents=?,old_price_cents=?,cost_cents=?,unit=?,sale_mode=?,quantity_step_millis=?,minimum_quantity_millis=?,options_json=?,image_url=?,badge=?,stock_quantity=?,min_stock=?,active=?,featured=?,offer_start=?,offer_end=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
            )
            .bind(
              str(product.sku, 80),
              str(product.barcode, 80),
              str(product.brand, 100),
              str(product.name, 160),
              slug(product.slug || product.name),
              str(product.description, 1000),
              str(product.categoryId, 80),
              n(product.priceCents),
              product.oldPriceCents == null ? null : n(product.oldPriceCents),
              n(product.costCents),
              str(product.unit, 80),
              str(product.saleMode, 20) === "weight" ? "weight" : "unit",
              Math.max(1, Math.round(Number(product.quantityStep || 1) * 1000)),
              Math.max(
                1,
                Math.round(Number(product.minimumQuantity || 1) * 1000),
              ),
              JSON.stringify(parseProductOptions(product.options || [])),
              safeAssetUrl(product.imageUrl),
              str(product.badge, 40),
              quantity(product.stockQuantity),
              quantity(product.minStock) || 5,
              b(product.active) ? 1 : 0,
              b(product.featured) ? 1 : 0,
              str(product.offerStart, 40) || null,
              str(product.offerEnd, 40) || null,
              str(product.id, 80),
            ),
        );
      for (let index = 0; index < statements.length; index += 60)
        await db.batch(statements.slice(index, index + 60));
      await audit(auth.user.email, "restore", "backup", key, {
        products: statements.length,
      });
    } else throw new Error("Ação administrativa desconhecida");
    if (approvalToExecute)
      await db
        .prepare(
          "UPDATE admin_approvals SET status='executed',executed_at=CURRENT_TIMESTAMP WHERE id=?",
        )
        .bind(approvalToExecute)
        .run();
    const current = await snapshot();
    await saveDailyBackup(current, auth.user.email).catch(() => {});
    return Response.json({
      ok: true,
      message: approvalToExecute
        ? "Ação aprovada executada com sucesso"
        : "Alteração salva com sucesso",
      data: {
        ...snapshotForRole(
          current,
          auth.role,
          auth.permissions,
          auth.user.email,
        ),
        currentRole: auth.role,
        currentPermissions: auth.permissions,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Não foi possível salvar",
      },
      { status: 400 },
    );
  }
}
