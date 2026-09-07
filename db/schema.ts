import {
  boolean,
  customType,
  datetime,
  decimal,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

const idText = (name: string) => varchar(name, { length: 80 });
const shortText = (name: string) => varchar(name, { length: 255 });
const dateTime = (name: string) => datetime(name, { mode: "string" });
const longText = customType<{ data: string }>({ dataType: () => "longtext" });
const mediumBlob = customType<{ data: Uint8Array }>({ dataType: () => "mediumblob" });
const createdAt = () => timestamp("created_at", { mode: "string" }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { mode: "string" }).notNull().defaultNow();

export const categories = mysqlTable("categories", {
  id: idText("id").primaryKey(),
  name: shortText("name").notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  icon: varchar("icon", { length: 32 }).notNull().default("🛒"),
  sortOrder: int("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const products = mysqlTable("products", {
  id: idText("id").primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  barcode: varchar("barcode", { length: 100 }).notNull().default(""),
  brand: varchar("brand", { length: 160 }).notNull().default(""),
  name: shortText("name").notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  description: text("description").notNull(),
  categoryId: idText("category_id").notNull(),
  priceCents: int("price_cents").notNull(),
  oldPriceCents: int("old_price_cents"),
  costCents: int("cost_cents").notNull().default(0),
  unit: varchar("unit", { length: 80 }).notNull(),
  saleMode: varchar("sale_mode", { length: 20 }).notNull().default("unit"),
  quantityStepMillis: int("quantity_step_millis").notNull().default(1000),
  minimumQuantityMillis: int("minimum_quantity_millis").notNull().default(1000),
  optionsJson: text("options_json").notNull(),
  imageUrl: text("image_url").notNull(),
  badge: varchar("badge", { length: 100 }).notNull().default(""),
  stockQuantity: decimal("stock_quantity", { precision: 12, scale: 3 }).notNull().default("0.000"),
  minStock: decimal("min_stock", { precision: 12, scale: 3 }).notNull().default("5.000"),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  offerStart: dateTime("offer_start"),
  offerEnd: dateTime("offer_end"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const storeSettings = mysqlTable("store_settings", {
  id: int("id").primaryKey().default(1),
  storeName: shortText("store_name").notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).notNull().default("5500000000000"),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  address: text("address").notNull(),
  mapsUrl: text("maps_url").notNull(),
  hours: varchar("hours", { length: 180 }).notNull().default("Seg–Sáb: 7h às 20h"),
  paymentMethods: varchar("payment_methods", { length: 255 }).notNull().default("PIX, Dinheiro, Cartão"),
  pixKey: varchar("pix_key", { length: 255 }).notNull().default(""),
  pixMerchantName: varchar("pix_merchant_name", { length: 25 }).notNull().default("SUPERMERCADO CENTRAL"),
  pixMerchantCity: varchar("pix_merchant_city", { length: 15 }).notNull().default("MACEIO"),
  minimumOrderCents: int("minimum_order_cents").notNull().default(3000),
  allowPickup: boolean("allow_pickup").notNull().default(true),
  allowDelivery: boolean("allow_delivery").notNull().default(true),
  substitutionPolicy: varchar("substitution_policy", { length: 40 }).notNull().default("confirm"),
  announcement: text("announcement").notNull(),
  loyaltyEnabled: boolean("loyalty_enabled").notNull().default(true),
  pointsPerReal: int("points_per_real").notNull().default(1),
  reviewEnabled: boolean("review_enabled").notNull().default(true),
  flashOfferTitle: varchar("flash_offer_title", { length: 180 }).notNull().default("Oferta-relâmpago"),
  abandonedCartHours: int("abandoned_cart_hours").notNull().default(24),
  updatedAt: updatedAt(),
});

export const deliveryZones = mysqlTable("delivery_zones", {
  id: idText("id").primaryKey(),
  name: shortText("name").notNull(),
  feeCents: int("fee_cents").notNull().default(0),
  minimumOrderCents: int("minimum_order_cents").notNull().default(0),
  freeShippingCents: int("free_shipping_cents").notNull().default(0),
  eta: varchar("eta", { length: 80 }).notNull().default("40–70 min"),
  active: boolean("active").notNull().default(true),
  updatedAt: updatedAt(),
});

export const coupons = mysqlTable("coupons", {
  code: varchar("code", { length: 80 }).primaryKey(),
  type: varchar("type", { length: 30 }).notNull(),
  value: int("value").notNull(),
  maxDiscountCents: int("max_discount_cents"),
  minimumCents: int("minimum_cents").notNull().default(0),
  startsAt: dateTime("starts_at"),
  endsAt: dateTime("ends_at"),
  usageLimit: int("usage_limit").notNull().default(0),
  usedCount: int("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const banners = mysqlTable("banners", {
  id: idText("id").primaryKey(),
  title: shortText("title").notNull(),
  subtitle: text("subtitle").notNull(),
  imageUrl: text("image_url").notNull(),
  ctaLabel: varchar("cta_label", { length: 120 }).notNull().default("Ver ofertas"),
  ctaUrl: text("cta_url").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const homeContent = mysqlTable("home_content", {
  id: int("id").primaryKey().default(1),
  aboutEyebrow: varchar("about_eyebrow", { length: 180 }).notNull().default("PERTINHO DE VOCÊ"),
  aboutTitle: text("about_title").notNull(),
  aboutText: text("about_text").notNull(),
  storefrontImageUrl: text("storefront_image_url").notNull(),
  interiorImageUrl: text("interior_image_url").notNull(),
  teamImageUrl: text("team_image_url").notNull(),
  flyerEyebrow: varchar("flyer_eyebrow", { length: 180 }).notNull().default("ENCARTE DA SEMANA"),
  flyerTitle: text("flyer_title").notNull(),
  flyerSubtitle: text("flyer_subtitle").notNull(),
  flyerImageUrl: text("flyer_image_url").notNull(),
  flyerCtaLabel: varchar("flyer_cta_label", { length: 180 }).notNull().default("Ver todas as ofertas"),
  flyerCtaUrl: text("flyer_cta_url").notNull(),
  flyerStartsAt: dateTime("flyer_starts_at"),
  flyerEndsAt: dateTime("flyer_ends_at"),
  flyerActive: boolean("flyer_active").notNull().default(true),
  updatedAt: updatedAt(),
});

export const orders = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  orderNumber: varchar("order_number", { length: 80 }).notNull().unique(),
  requestKey: varchar("request_key", { length: 120 }).unique(),
  status: varchar("status", { length: 50 }).notNull().default("whatsapp_pending"),
  trackingToken: varchar("tracking_token", { length: 80 }).unique(),
  reviewToken: varchar("review_token", { length: 80 }).unique(),
  stockCommitted: boolean("stock_committed").notNull().default(false),
  customerName: shortText("customer_name").notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
  postalCode: varchar("postal_code", { length: 16 }).notNull().default(""),
  city: varchar("city", { length: 120 }).notNull().default(""),
  state: varchar("state", { length: 8 }).notNull().default(""),
  deliveryType: varchar("delivery_type", { length: 30 }).notNull(),
  address: text("address").notNull(),
  neighborhood: varchar("neighborhood", { length: 160 }).notNull().default(""),
  reference: text("reference").notNull(),
  paymentMethod: varchar("payment_method", { length: 80 }).notNull(),
  changeForCents: int("change_for_cents"),
  scheduledFor: varchar("scheduled_for", { length: 160 }).notNull().default("Assim que possível"),
  notes: text("notes").notNull(),
  substitution: varchar("substitution", { length: 40 }).notNull().default("confirm"),
  couponCode: varchar("coupon_code", { length: 80 }),
  subtotalCents: int("subtotal_cents").notNull(),
  discountCents: int("discount_cents").notNull().default(0),
  deliveryFeeCents: int("delivery_fee_cents").notNull().default(0),
  totalCents: int("total_cents").notNull(),
  costTotalCents: int("cost_total_cents").notNull().default(0),
  loyaltyPointsEarned: int("loyalty_points_earned").notNull().default(0),
  loyaltyCommitted: boolean("loyalty_committed").notNull().default(false),
  referralBonusCommitted: boolean("referral_bonus_committed").notNull().default(false),
  referralCode: varchar("referral_code", { length: 80 }).notNull().default(""),
  itemCount: int("item_count").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("order_id").notNull(),
  productId: idText("product_id").notNull(),
  productName: shortText("product_name").notNull(),
  unit: varchar("unit", { length: 80 }).notNull(),
  quantity: int("quantity").notNull(),
  quantityMillis: int("quantity_millis").notNull().default(1000),
  optionId: idText("option_id").notNull().default(""),
  optionLabel: varchar("option_label", { length: 160 }).notNull().default(""),
  substitution: varchar("substitution", { length: 40 }).notNull().default("confirm"),
  unitPriceCents: int("unit_price_cents").notNull(),
  unitCostCents: int("unit_cost_cents").notNull().default(0),
  categoryName: varchar("category_name", { length: 160 }).notNull().default(""),
  totalCents: int("total_cents").notNull(),
});

export const shoppingLists = mysqlTable(
  "shopping_lists",
  {
    id: idText("id").primaryKey(),
    ownerToken: varchar("owner_token", { length: 120 }).notNull(),
    name: shortText("name").notNull(),
    itemsJson: text("items_json").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("shopping_lists_owner_token_idx").on(table.ownerToken)],
);

export const storeNotifications = mysqlTable(
  "store_notifications",
  {
    id: idText("id").primaryKey(),
    title: shortText("title").notNull(),
    body: text("body").notNull(),
    url: text("url").notNull(),
    active: boolean("active").notNull().default(true),
    publishedAt: dateTime("published_at"),
    expiresAt: dateTime("expires_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("store_notifications_schedule_idx").on(
      table.active,
      table.publishedAt,
      table.expiresAt,
    ),
  ],
);

export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  name: shortText("name").notNull(),
  points: int("points").notNull().default(0),
  lifetimeValueCents: int("lifetime_value_cents").notNull().default(0),
  orderCount: int("order_count").notNull().default(0),
  referralCode: varchar("referral_code", { length: 80 }).notNull().unique(),
  referredBy: varchar("referred_by", { length: 80 }).notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const reviews = mysqlTable("reviews", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("order_id").notNull().unique(),
  productId: idText("product_id"),
  customerName: shortText("customer_name").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const orderStatusHistory = mysqlTable("order_status_history", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("order_id").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  note: text("note").notNull(),
  createdAt: createdAt(),
});

export const metrics = mysqlTable("metrics", {
  id: int("id").primaryKey().autoincrement(),
  event: varchar("event", { length: 80 }).notNull(),
  productId: idText("product_id"),
  sessionKey: varchar("session_key", { length: 120 }).notNull().default("anonymous"),
  metadata: text("metadata").notNull(),
  createdAt: createdAt(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").primaryKey().autoincrement(),
  actorEmail: varchar("actor_email", { length: 255 }).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  entity: varchar("entity", { length: 120 }).notNull(),
  entityId: varchar("entity_id", { length: 120 }).notNull().default(""),
  details: text("details").notNull(),
  createdAt: createdAt(),
});

export const staff = mysqlTable("staff", {
  id: idText("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: shortText("name").notNull().default(""),
  role: varchar("role", { length: 40 }).notNull().default("manager"),
  permissionsJson: text("permissions_json").notNull(),
  mfaRequired: boolean("mfa_required").notNull().default(true),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const securitySettings = mysqlTable("security_settings", {
  id: int("id").primaryKey().default(1),
  requireMfa: boolean("require_mfa").notNull().default(true),
  requireOwnerApproval: boolean("require_owner_approval").notNull().default(true),
  newDeviceAlerts: boolean("new_device_alerts").notNull().default(true),
  updatedBy: varchar("updated_by", { length: 255 }).notNull().default("system"),
  updatedAt: updatedAt(),
});

export const adminApprovals = mysqlTable(
  "admin_approvals",
  {
    id: idText("id").primaryKey(),
    action: varchar("action", { length: 160 }).notNull(),
    payloadJson: text("payload_json").notNull(),
    payloadHash: varchar("payload_hash", { length: 128 }).notNull(),
    summary: text("summary").notNull(),
    requestedBy: varchar("requested_by", { length: 255 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("pending"),
    reviewedBy: varchar("reviewed_by", { length: 255 }),
    reviewedAt: dateTime("reviewed_at"),
    executedAt: dateTime("executed_at"),
    createdAt: createdAt(),
    expiresAt: dateTime("expires_at").notNull(),
  },
  (table) => [
    index("admin_approvals_status_idx").on(table.status, table.createdAt),
    index("admin_approvals_requester_idx").on(table.requestedBy, table.createdAt),
  ],
);

export const adminDevices = mysqlTable(
  "admin_devices",
  {
    id: varchar("id", { length: 80 }).primaryKey(),
    actorEmail: varchar("actor_email", { length: 255 }).notNull(),
    label: varchar("label", { length: 180 }).notNull(),
    userAgent: text("user_agent").notNull(),
    firstSeenAt: timestamp("first_seen_at", { mode: "string" }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => [index("admin_devices_actor_idx").on(table.actorEmail)],
);

export const inventoryMovements = mysqlTable(
  "inventory_movements",
  {
    id: int("id").primaryKey().autoincrement(),
    productId: idText("product_id").notNull(),
    movementType: varchar("movement_type", { length: 80 }).notNull(),
    quantityDeltaMillis: int("quantity_delta_millis").notNull(),
    previousQuantityMillis: int("previous_quantity_millis").notNull(),
    newQuantityMillis: int("new_quantity_millis").notNull(),
    reason: varchar("reason", { length: 255 }).notNull().default(""),
    referenceType: varchar("reference_type", { length: 80 }).notNull().default("manual"),
    referenceId: varchar("reference_id", { length: 120 }).notNull().default(""),
    actorEmail: varchar("actor_email", { length: 255 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("inventory_movements_product_idx").on(table.productId, table.createdAt),
  ],
);


export const mediaFiles = mysqlTable(
  "media_files",
  {
    key: varchar("key", { length: 190 }).primaryKey(),
    contentType: varchar("content_type", { length: 120 }).notNull(),
    dataBlob: mediumBlob("data_blob").notNull(),
    sizeBytes: int("size_bytes").notNull(),
    uploadedBy: varchar("uploaded_by", { length: 255 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("media_files_created_idx").on(table.createdAt)],
);

export const catalogBackups = mysqlTable(
  "catalog_backups",
  {
    key: varchar("key", { length: 190 }).primaryKey(),
    dataJson: longText("data_json").notNull(),
    sizeBytes: int("size_bytes").notNull(),
    reason: varchar("reason", { length: 255 }).notNull().default("backup automático"),
    actorEmail: varchar("actor_email", { length: 255 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("catalog_backups_created_idx").on(table.createdAt)],
);
