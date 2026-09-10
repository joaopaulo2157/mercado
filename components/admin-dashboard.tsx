"use client";
import Image from "next/image";
import Link from "next/link";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type {
  Banner,
  Category,
  Coupon,
  DeliveryZone,
  HomeContent,
  Product,
  ProductOption,
  StoreNotification,
  StoreSettings,
} from "@/lib/store-types";
import { money } from "@/lib/default-data";
import type { AdminPermission, AdminRole } from "@/lib/admin-auth";
type AdminData = {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  deliveryZones: DeliveryZone[];
  coupons: Coupon[];
  banners: Banner[];
  homeContent: HomeContent;
  notifications: StoreNotification[];
  orders: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  audits: Record<string, unknown>[];
  stats: {
    ordersCount: number;
    revenueCents: number;
    itemsCount: number;
    averageTicketCents: number;
    costCents: number;
    grossProfitCents: number;
    customerCount: number;
    pointsIssued: number;
    pendingReviews: number;
    approvedReviews: number;
    lowStock: number;
    activeProducts: number;
    costConfiguredProducts: number;
  };
  events: Record<string, number>;
  staff: Record<string, unknown>[];
  approvals: Record<string, unknown>[];
  devices: Record<string, unknown>[];
  inventoryHistory: Record<string, unknown>[];
  securitySettings: {
    requireMfa: boolean;
    requireOwnerApproval: boolean;
    newDeviceAlerts: boolean;
    ownerMfaEnabled: boolean;
    updatedBy: string;
    updatedAt: string;
  };
  backups: {
    key: string;
    size: number;
    uploadedAt: string | null;
    reason: string;
    actorEmail: string;
  }[];
  currentRole: AdminRole;
  currentPermissions: AdminPermission[];
  topProducts: Record<string, unknown>[];
};
type Tab =
  | "overview"
  | "products"
  | "bulk"
  | "orders"
  | "reports"
  | "reviews"
  | "customers"
  | "inventory"
  | "categories"
  | "delivery"
  | "coupons"
  | "homepage"
  | "banners"
  | "notifications"
  | "settings"
  | "import"
  | "audit"
  | "team"
  | "security"
  | "approvals"
  | "backups";
type AdminIconName =
  | "dashboard"
  | "products"
  | "bulk"
  | "orders"
  | "reports"
  | "reviews"
  | "customers"
  | "inventory"
  | "categories"
  | "delivery"
  | "coupons"
  | "homepage"
  | "banners"
  | "notifications"
  | "settings"
  | "import"
  | "audit"
  | "team"
  | "security"
  | "approvals"
  | "backups"
  | "menu"
  | "store"
  | "logout"
  | "plus"
  | "scan"
  | "search"
  | "arrow"
  | "revenue"
  | "conversion"
  | "lock"
  | "alert";

const ADMIN_ICON_PATHS: Record<AdminIconName, string[]> = {
  dashboard: ["M4 4h6v6H4z", "M14 4h6v9h-6z", "M4 14h6v6H4z", "M14 17h6v3h-6z"],
  products: ["m4 7 8-4 8 4-8 4z", "M4 7v10l8 4 8-4V7", "M12 11v10"],
  bulk: ["M4 7h10", "M18 7h2", "M14 4v6", "M4 17h2", "M10 17h10", "M6 14v6"],
  orders: ["M6 8h12l1 12H5z", "M9 8V6a3 3 0 0 1 6 0v2"],
  reports: ["M4 20V10", "M10 20V4", "M16 20v-7", "M22 20H2"],
  reviews: ["m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9-5.6 2.9 1.1-6.1-4.5-4.4 6.2-.9z"],
  customers: ["M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M22 20v-1a4 4 0 0 0-3-3.9", "M16 3.1a4 4 0 0 1 0 7.8"],
  inventory: ["M4 9h16v11H4z", "M3 4h18v5H3z", "M9 13h6"],
  categories: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  delivery: ["M3 6h11v10H3z", "M14 10h4l3 3v3h-7z", "M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4", "M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4"],
  coupons: ["M3 7a2 2 0 0 0 0 4v6h18v-6a2 2 0 0 0 0-4z", "M12 7v10", "M15.5 10.5h.01", "M8.5 13.5h.01"],
  homepage: ["M3 4h18v13H3z", "M8 21h8", "M12 17v4"],
  banners: ["M4 5h16v14H4z", "m4 15 3-3 3 3 4-5 6 6", "M9 9h.01"],
  notifications: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4"],
  settings: ["M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7", "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-1.8.2l-.6.4a1.7 1.7 0 0 0-.8 1.6V22h-4v-.2a1.7 1.7 0 0 0-.8-1.6l-.6-.4a1.7 1.7 0 0 0-1.8-.2l-.2.1-2-3.4.1-.1a1.7 1.7 0 0 0 .3-1.9l-.3-.7a1.7 1.7 0 0 0-1.3-1.1H3v-4h.2a1.7 1.7 0 0 0 1.3-1.1l.3-.7a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.4.2.1a1.7 1.7 0 0 0 1.8-.2l.6-.4A1.7 1.7 0 0 0 9.8 1V.8h4V1a1.7 1.7 0 0 0 .8 1.6l.6.4a1.7 1.7 0 0 0 1.8.2l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.9l.3.7a1.7 1.7 0 0 0 1.3 1.1h.2v4h-.2a1.7 1.7 0 0 0-1.3 1.1z"],
  import: ["M8 3v12", "m4 11 4 4 4-4", "M16 21V9", "m-4 4 4-4 4 4"],
  audit: ["M12 3 4 6v5c0 5 3.5 8.4 8 10 4.5-1.6 8-5 8-10V6z", "m9 12 2 2 4-4"],
  team: ["M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M18 8v6", "M15 11h6"],
  security: ["M12 3 4 6v5c0 5 3.5 8.4 8 10 4.5-1.6 8-5 8-10V6z", "M9 12h6", "M12 9v6"],
  approvals: ["M4 4h16v16H4z", "m8 14 2 2 5-6"],
  backups: ["M4 6h16v14H4z", "M7 3h10v3", "M8 11h8", "M8 15h5"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  store: ["M4 10v10h16V10", "M3 4h18l-1 6H4z", "M9 20v-6h6v6"],
  logout: ["M10 17l5-5-5-5", "M15 12H3", "M15 4h5v16h-5"],
  plus: ["M12 5v14", "M5 12h14"],
  scan: ["M4 8V4h4", "M16 4h4v4", "M20 16v4h-4", "M8 20H4v-4", "M7 12h10"],
  search: ["M20 20l-4.4-4.4", "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15"],
  arrow: ["m9 18 6-6-6-6"],
  revenue: ["M12 2v20", "M17 6.5c0-2-2.5-3.5-5-3.5S7 4.5 7 7s2 3.5 5 3.5 5 1 5 3.5-2.5 4-5 4-5-1.5-5-4"],
  conversion: ["M4 17 9 12l4 4 7-9", "M15 7h5v5"],
  lock: ["M5 10h14v11H5z", "M8 10V7a4 4 0 0 1 8 0v3"],
  alert: ["M12 3 2 2 7 14H3L10 5z", "M12 9v4", "M12 17h.01"],
};

function AdminIcon({
  name,
  size = 20,
}: {
  name: AdminIconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ADMIN_ICON_PATHS[name].map((path, index) => (
        <path key={`${name}-${index}`} d={path} />
      ))}
    </svg>
  );
}

type TabDefinition = {
  id: Tab;
  label: string;
  icon: AdminIconName;
  group: "Resumo" | "Vendas" | "Catálogo" | "Conteúdo" | "Sistema";
  description: string;
};

const tabs: TabDefinition[] = [
  { id: "overview", label: "Visão geral", icon: "dashboard", group: "Resumo", description: "Indicadores, prioridades e atalhos da operação." },
  { id: "reports", label: "Relatórios", icon: "reports", group: "Resumo", description: "Receita, margem e desempenho comercial." },
  { id: "orders", label: "Pedidos", icon: "orders", group: "Vendas", description: "Acompanhe cada pedido do WhatsApp à entrega." },
  { id: "customers", label: "Clientes e pontos", icon: "customers", group: "Vendas", description: "Relacionamento, recorrência e Clube Central." },
  { id: "reviews", label: "Avaliações", icon: "reviews", group: "Vendas", description: "Modere as experiências enviadas pelos clientes." },
  { id: "products", label: "Produtos", icon: "products", group: "Catálogo", description: "Cadastre produtos, preços, imagens e ofertas." },
  { id: "bulk", label: "Preços em massa", icon: "bulk", group: "Catálogo", description: "Atualize preços e estoque com segurança." },
  { id: "inventory", label: "Estoque", icon: "inventory", group: "Catálogo", description: "Visualize saldos e itens que precisam de reposição." },
  { id: "categories", label: "Categorias", icon: "categories", group: "Catálogo", description: "Organize os setores exibidos na loja." },
  { id: "delivery", label: "Entregas", icon: "delivery", group: "Catálogo", description: "Configure áreas, taxas e prazos de entrega." },
  { id: "coupons", label: "Cupons", icon: "coupons", group: "Catálogo", description: "Crie condições promocionais para os clientes." },
  { id: "homepage", label: "Página inicial", icon: "homepage", group: "Conteúdo", description: "Gerencie o encarte e a apresentação da loja." },
  { id: "banners", label: "Banners", icon: "banners", group: "Conteúdo", description: "Atualize chamadas e campanhas em destaque." },
  { id: "notifications", label: "Campanhas e alertas", icon: "notifications", group: "Conteúdo", description: "Programe mensagens e avisos promocionais." },
  { id: "settings", label: "Configurações", icon: "settings", group: "Sistema", description: "Dados centrais, atendimento, PIX e preferências." },
  { id: "import", label: "Importar e exportar", icon: "import", group: "Sistema", description: "Importe produtos e mantenha cópias do catálogo." },
  { id: "audit", label: "Auditoria", icon: "audit", group: "Sistema", description: "Consulte o histórico das alterações administrativas." },
  { id: "team", label: "Equipe e acessos", icon: "team", group: "Sistema", description: "Controle perfis e permissões da equipe." },
  { id: "security", label: "Central de segurança", icon: "security", group: "Sistema", description: "Políticas, 2FA e dispositivos administrativos." },
  { id: "approvals", label: "Aprovações", icon: "approvals", group: "Sistema", description: "Revise e execute solicitações de alto impacto." },
  { id: "backups", label: "Backups", icon: "backups", group: "Sistema", description: "Crie cópias e restaure versões do catálogo." },
];

const NAV_GROUPS: TabDefinition["group"][] = [
  "Resumo",
  "Vendas",
  "Catálogo",
  "Conteúdo",
  "Sistema",
];

const ROLE_LABELS: Record<AdminData["currentRole"], string> = {
  owner: "Proprietário",
  manager: "Gerente",
  catalog: "Catálogo",
  orders: "Atendimento",
  inventory: "Estoque",
  marketing: "Marketing",
  finance: "Financeiro",
  auditor: "Auditoria",
};

const TAB_PERMISSIONS: Record<Tab, AdminPermission> = {
  overview: "dashboard.view",
  products: "catalog.manage",
  bulk: "catalog.manage",
  orders: "orders.manage",
  reports: "reports.view",
  reviews: "orders.manage",
  customers: "orders.manage",
  inventory: "inventory.manage",
  categories: "catalog.manage",
  delivery: "settings.manage",
  coupons: "marketing.manage",
  homepage: "marketing.manage",
  banners: "marketing.manage",
  notifications: "marketing.manage",
  settings: "settings.manage",
  import: "catalog.manage",
  audit: "audit.view",
  team: "team.manage",
  security: "security.manage",
  approvals: "dashboard.view",
  backups: "backups.manage",
};
const tabIsAvailable = (data: AdminData, id: Tab) => {
  if (data.currentRole === "owner") return true;
  return data.currentPermissions.includes(TAB_PERMISSIONS[id]);
};
const blankProduct: Partial<Product> = {
  name: "",
  sku: "",
  barcode: "",
  brand: "",
  slug: "",
  description: "",
  categoryId: "",
  priceCents: 0,
  oldPriceCents: null,
  costCents: 0,
  unit: "Unidade",
  saleMode: "unit",
  quantityStep: 1,
  minimumQuantity: 1,
  options: [],
  imageUrl: "",
  badge: "",
  stockQuantity: 0,
  minStock: 5,
  active: true,
  featured: false,
  offerStart: null,
  offerEnd: null,
};
export default function AdminDashboard({
  user,
  signOutPath,
}: {
  user: { email: string; name: string };
  signOutPath: string;
}) {
  const [data, setData] = useState<AdminData | null>(null),
    [tab, setTab] = useState<Tab>("overview"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [product, setProduct] = useState<Partial<Product> | null>(null),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [scannerOpen, setScannerOpen] = useState(false),
    [alertsOpen, setAlertsOpen] = useState(false);
  const load = () => {
    setLoading(true);
    fetch("/api/admin")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setData(j);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);
  const post = async (
    action: string,
    payload: unknown,
    approvalId?: string,
  ) => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, data: payload, approvalId }),
        }),
        j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setData(j.data);
      setToast(
        String(
          j.message ||
            (j.approvalQueued
              ? "Ação enviada para aprovação"
              : "Alteração salva com sucesso"),
        ),
      );
      setTimeout(() => setToast(""), 2200);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const products = useMemo(
    () =>
      data?.products.filter((p) =>
        `${p.name} ${p.brand} ${p.sku} ${p.barcode}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ) || [],
    [data, query],
  );
  const operationAlerts = useMemo(() => {
    if (!data) return [] as { id: string; title: string; detail: string; tab: Tab }[];
    const alerts: { id: string; title: string; detail: string; tab: Tab }[] = [];
    const pendingApprovals = data.approvals.filter(
      (approval) => String(approval.status) === "pending",
    ).length;
    const pendingOrders = data.orders.filter((order) =>
      ["whatsapp_pending", "confirmed", "preparing"].includes(
        String(order.status),
      ),
    ).length;
    const pendingReviews = data.reviews.filter(
      (review) => String(review.status) === "pending",
    ).length;
    const recentDevices = data.securitySettings.newDeviceAlerts
      ? data.devices.filter(
          (device) => Number(device.is_recent) === 1,
        ).length
      : 0;
    if (pendingApprovals)
      alerts.push({
        id: "approvals",
        title: `${pendingApprovals} aprovação${pendingApprovals > 1 ? "ões" : ""} pendente${pendingApprovals > 1 ? "s" : ""}`,
        detail: "Ações críticas aguardam revisão.",
        tab: "approvals",
      });
    if (data.stats.lowStock)
      alerts.push({
        id: "stock",
        title: `${data.stats.lowStock} item${data.stats.lowStock > 1 ? "s" : ""} com estoque baixo`,
        detail: "Revise os níveis mínimos de reposição.",
        tab: "inventory",
      });
    if (pendingOrders)
      alerts.push({
        id: "orders",
        title: `${pendingOrders} pedido${pendingOrders > 1 ? "s" : ""} em andamento`,
        detail: "Acompanhe a fila operacional.",
        tab: "orders",
      });
    if (pendingReviews)
      alerts.push({
        id: "reviews",
        title: `${pendingReviews} avaliação${pendingReviews > 1 ? "ões" : ""} para moderar`,
        detail: "Há experiências aguardando análise.",
        tab: "reviews",
      });
    if (recentDevices)
      alerts.push({
        id: "devices",
        title: `${recentDevices} dispositivo${recentDevices > 1 ? "s" : ""} recente${recentDevices > 1 ? "s" : ""}`,
        detail: "Confira a atividade administrativa.",
        tab: "security",
      });
    return alerts.filter((alert) => tabIsAvailable(data, alert.tab));
  }, [data]);
  if (loading)
    return (
      <main className="admin-loading">
        <div />
        <p>Preparando o painel...</p>
      </main>
    );
  if (!data)
    return (
      <main className="admin-loading">
        <h1>Não foi possível abrir o painel</h1>
        <p>{error}</p>
        <button onClick={load}>Tentar novamente</button>
      </main>
    );
  const visibleTabs = tabs.filter(({ id }) =>
    tabIsAvailable(data, id),
  );
  const currentTab =
    tabs.find((item) => item.id === tab) || tabs[0];
  const canManageCatalog = data.currentPermissions.includes("catalog.manage");
  const setSettings = (
    key: keyof StoreSettings,
    value: string | number | boolean,
  ) =>
    setData((d) =>
      d ? { ...d, settings: { ...d.settings, [key]: value } } : d,
    );
  return (
    <main className="admin-app">
      {mobileNav ? (
        <button
          type="button"
          className="admin-nav-overlay"
          onClick={() => setMobileNav(false)}
          aria-label="Fechar menu administrativo"
        />
      ) : null}
      <aside
        id="admin-navigation"
        className={mobileNav ? "admin-sidebar open" : "admin-sidebar"}
      >
        <div className="admin-brand">
          <div className="admin-brand-logo">
            <Image
              src="/assets/sc-supermercado-central-oficial.png"
              alt="Supermercado Central"
              width={1536}
              height={1024}
              priority
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileNav(false)}
            aria-label="Fechar navegação"
          >
            ×
          </button>
        </div>
        <div className="admin-workspace-label">
          <span>SC</span>
          <div>
            <b>Central Administrativo</b>
            <small>Gestão integrada da loja</small>
          </div>
        </div>
        <nav aria-label="Seções administrativas">
          {NAV_GROUPS.map((group) => {
            const items = visibleTabs.filter((item) => item.group === group);
            if (!items.length) return null;
            return (
              <section className="admin-nav-group" key={group}>
                <span>{group}</span>
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={tab === item.id ? "active" : ""}
                    onClick={() => {
                      setTab(item.id);
                      setMobileNav(false);
                    }}
                    aria-current={tab === item.id ? "page" : undefined}
                  >
                    <i>
                      <AdminIcon name={item.icon} size={18} />
                    </i>
                    <span>{item.label}</span>
                    {item.id === "orders" && data.stats.ordersCount > 0 ? (
                      <small>{data.stats.ordersCount}</small>
                    ) : null}
                  </button>
                ))}
              </section>
            );
          })}
        </nav>
        <div className="admin-private-status">
          <i>
            <AdminIcon name="lock" size={15} />
          </i>
          <div>
            <b>Acesso privado</b>
            <small>Somente equipe autorizada</small>
          </div>
        </div>
        <div className="side-bottom">
          <Link href="/">
            <AdminIcon name="store" size={16} />
            Abrir loja
          </Link>
          <a href={signOutPath}>
            <AdminIcon name="logout" size={16} />
            Sair
          </a>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-header">
          <button
            type="button"
            className="admin-menu"
            onClick={() => setMobileNav(true)}
            aria-label="Abrir menu administrativo"
            aria-controls="admin-navigation"
            aria-expanded={mobileNav}
          >
            <AdminIcon name="menu" size={21} />
          </button>
          <div className="admin-heading">
            <span>ÁREA ADMINISTRATIVA · {ROLE_LABELS[data.currentRole]}</span>
            <h1>{currentTab.label}</h1>
            <p>{currentTab.description}</p>
          </div>
          <div className="admin-header-actions">
            <div className="admin-alert-center">
              <button
                type="button"
                className="admin-alert-trigger"
                onClick={() => setAlertsOpen((open) => !open)}
                aria-label="Abrir central de alertas"
                aria-expanded={alertsOpen}
              >
                <AdminIcon name="notifications" size={18} />
                {operationAlerts.length ? (
                  <span>{operationAlerts.length}</span>
                ) : null}
              </button>
              {alertsOpen ? (
                <div className="admin-alert-popover">
                  <header>
                    <div>
                      <span>CENTRAL DE OPERAÇÕES</span>
                      <b>Alertas que pedem atenção</b>
                    </div>
                    <small>{operationAlerts.length} agora</small>
                  </header>
                  <div>
                    {operationAlerts.length ? (
                      operationAlerts.map((alert) => (
                        <button
                          type="button"
                          key={alert.id}
                          onClick={() => {
                            setTab(alert.tab);
                            setAlertsOpen(false);
                          }}
                        >
                          <i>
                            <AdminIcon name="alert" size={16} />
                          </i>
                          <span>
                            <b>{alert.title}</b>
                            <small>{alert.detail}</small>
                          </span>
                          <AdminIcon name="arrow" size={15} />
                        </button>
                      ))
                    ) : (
                      <p>Operação em dia. Nenhum alerta pendente.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <Link className="admin-view-store" href="/">
              <AdminIcon name="store" size={17} />
              <span>Ver loja</span>
            </Link>
            {canManageCatalog ? (
              <button
                type="button"
                className="admin-create-product"
                onClick={() => {
                  setTab("products");
                  setProduct(blankProduct);
                }}
              >
                <AdminIcon name="plus" size={17} />
                <span>Novo produto</span>
              </button>
            ) : null}
            <div className="admin-user">
              <span>{user.name.slice(0, 1).toUpperCase()}</span>
              <div>
                <b>{user.name}</b>
                <small>{ROLE_LABELS[data.currentRole]}</small>
              </div>
            </div>
          </div>
        </header>
        {error && (
          <div className="admin-error">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}
        <div className="admin-content">
          {tab === "overview" && <Overview data={data} setTab={setTab} />}{" "}
          {tab === "products" && (
            <Products
              products={products}
              query={query}
              setQuery={setQuery}
              edit={(p) => setProduct(p)}
              add={() => setProduct(blankProduct)}
              scan={() => setScannerOpen(true)}
              toggle={(p) =>
                post("toggleProduct", { id: p.id, active: !p.active })
              }
            />
          )}{" "}
          {tab === "bulk" && (
            <BulkProductEditor
              products={data.products}
              busy={busy}
              apply={(payload) => post("bulkUpdateProducts", payload)}
            />
          )}{" "}
          {tab === "orders" && (
            <Orders
              orders={data.orders}
              update={(id, status) => post("orderStatus", { id, status })}
            />
          )}{" "}
          {tab === "reports" && <Reports data={data} />}{" "}
          {tab === "reviews" && (
            <Reviews
              rows={data.reviews}
              update={(id, status) => post("reviewStatus", { id, status })}
            />
          )}{" "}
          {tab === "customers" && <Customers rows={data.customers} />}{" "}
          {tab === "inventory" && (
            <Inventory
              products={data.products}
              history={data.inventoryHistory}
              edit={(p) => setProduct(p)}
              adjust={(value) => post("adjustInventory", value)}
              busy={busy}
            />
          )}{" "}
          {tab === "categories" && (
            <SimpleManager
              title="Categorias"
              button="Nova categoria"
              rows={data.categories.map((c) => ({
                id: c.id,
                title: `${c.icon} ${c.name}`,
                subtitle: `Ordem ${c.sortOrder} · ${c.active ? "Ativa" : "Inativa"}`,
                raw: c,
              }))}
              fields={["name", "icon", "sortOrder", "active"]}
              labels={["Nome", "Ícone", "Ordem", "Ativa"]}
              defaults={{ name: "", icon: "🛒", sortOrder: 0, active: true }}
              save={(v) => post("saveCategory", v)}
            />
          )}{" "}
          {tab === "delivery" && (
            <SimpleManager
              title="Áreas de entrega"
              button="Nova área"
              rows={data.deliveryZones.map((z) => ({
                id: z.id,
                title: z.name,
                subtitle: `${money(z.feeCents)} · grátis acima de ${money(z.freeShippingCents)} · ${z.eta}`,
                raw: z,
              }))}
              fields={[
                "name",
                "feeCents",
                "minimumOrderCents",
                "freeShippingCents",
                "eta",
                "active",
              ]}
              labels={[
                "Nome",
                "Taxa (centavos)",
                "Pedido mínimo (centavos)",
                "Frete grátis (centavos)",
                "Prazo",
                "Ativa",
              ]}
              defaults={{
                name: "",
                feeCents: 0,
                minimumOrderCents: 0,
                freeShippingCents: 0,
                eta: "40–70 min",
                active: true,
              }}
              save={(v) => post("saveZone", v)}
            />
          )}{" "}
          {tab === "coupons" && (
            <SimpleManager
              title="Cupons promocionais"
              button="Novo cupom"
              rows={data.coupons.map((c) => ({
                id: c.code,
                title: c.code,
                subtitle: `${c.type} · valor ${c.value} · usado ${c.usedCount}x`,
                raw: c,
              }))}
              fields={[
                "code",
                "type",
                "value",
                "maxDiscountCents",
                "minimumCents",
                "usageLimit",
                "startsAt",
                "endsAt",
                "active",
              ]}
              labels={[
                "Código",
                "Tipo (percent/fixed/free_shipping)",
                "Valor",
                "Desconto máximo (centavos)",
                "Pedido mínimo (centavos)",
                "Limite de usos",
                "Início ISO",
                "Fim ISO",
                "Ativo",
              ]}
              defaults={{
                code: "",
                type: "percent",
                value: 10,
                maxDiscountCents: 2000,
                minimumCents: 5000,
                usageLimit: 0,
                startsAt: "",
                endsAt: "",
                active: true,
              }}
              save={(v) => post("saveCoupon", v)}
            />
          )}{" "}
          {tab === "homepage" && (
            <HomeContentManager
              content={data.homeContent}
              busy={busy}
              save={(value) => post("saveHomeContent", value)}
            />
          )}{" "}
          {tab === "banners" && (
            <SimpleManager
              title="Banners e campanhas"
              button="Novo banner"
              rows={data.banners.map((b) => ({
                id: b.id,
                title: b.title,
                subtitle: b.subtitle,
                raw: b,
              }))}
              fields={[
                "title",
                "subtitle",
                "imageUrl",
                "ctaLabel",
                "ctaUrl",
                "sortOrder",
                "active",
              ]}
              labels={[
                "Título",
                "Subtítulo",
                "Imagem",
                "Texto do botão",
                "Destino",
                "Ordem",
                "Ativo",
              ]}
              defaults={{
                title: "",
                subtitle: "",
                imageUrl: "",
                ctaLabel: "Ver ofertas",
                ctaUrl: "#ofertas",
                sortOrder: 0,
                active: true,
              }}
              save={(v) => post("saveBanner", v)}
            />
          )}{" "}
          {tab === "notifications" && (
            <SimpleManager
              title="Campanhas e alertas"
              button="Novo alerta"
              rows={data.notifications.map((notification) => ({
                id: notification.id,
                title: notification.title,
                subtitle: `${notification.active ? "Ativo" : "Inativo"} · ${notification.body}`,
                raw: notification as unknown as Record<string, unknown>,
              }))}
              fields={[
                "title",
                "body",
                "url",
                "publishedAt",
                "expiresAt",
                "active",
              ]}
              labels={[
                "Título",
                "Mensagem",
                "Destino",
                "Publicar em (ISO)",
                "Expirar em (ISO)",
                "Ativo",
              ]}
              defaults={{
                title: "Oferta nova no Central",
                body: "Confira as ofertas selecionadas desta semana.",
                url: "/#ofertas",
                publishedAt: new Date().toISOString(),
                expiresAt: "",
                active: true,
              }}
              save={(value) => post("saveNotification", value)}
            />
          )}{" "}
          {tab === "settings" && (
            <Settings
              settings={data.settings}
              set={setSettings}
              save={() => post("saveSettings", data.settings)}
              busy={busy}
            />
          )}{" "}
          {tab === "import" && (
            <ImportExport
              products={data.products}
              importRows={(rows) => post("bulkImport", rows)}
            />
          )}{" "}
          {tab === "audit" && <Audit rows={data.audits} />}
          {tab === "team" && (
            <TeamAccessManager
              rows={data.staff}
              requireMfa={data.securitySettings.requireMfa}
              busy={busy}
              save={(value) => post("saveStaff", value)}
            />
          )}
          {tab === "security" && (
            <SecurityCenter
              key={data.securitySettings.updatedAt}
              settings={data.securitySettings}
              devices={data.devices}
              currentEmail={user.email}
              busy={busy}
              save={(value) => post("saveSecuritySettings", value)}
              forget={(id) => post("forgetDevice", { id })}
            />
          )}
          {tab === "approvals" && (
            <ApprovalsCenter
              rows={data.approvals}
              owner={data.currentRole === "owner"}
              currentEmail={user.email}
              busy={busy}
              decide={(id, status) =>
                post("approvalDecision", { id, status })
              }
              execute={(row) => {
                try {
                  return post(
                    String(row.action),
                    JSON.parse(String(row.payload_json || "{}")),
                    String(row.id),
                  );
                } catch {
                  setError("A solicitação possui dados inválidos");
                  return Promise.resolve(false);
                }
              }}
            />
          )}
          {tab === "backups" && (
            <BackupsCenter
              rows={data.backups}
              busy={busy}
              create={() => post("createBackup", {})}
              restore={(key) => post("restoreBackup", { key })}
            />
          )}
        </div>
      </section>
      {product && (
        <ProductEditor
          product={product}
          categories={data.categories}
          busy={busy}
          close={() => setProduct(null)}
          save={async (p) => {
            if (await post("saveProduct", p)) setProduct(null);
          }}
        />
      )}
      {scannerOpen ? (
        <BarcodeScanner
          close={() => setScannerOpen(false)}
          detected={(barcode) => {
            const found = data.products.find(
              (item) =>
                item.barcode === barcode ||
                item.options.some((option) => option.barcode === barcode),
            );
            setProduct(found || { ...blankProduct, barcode });
            setScannerOpen(false);
            setTab("products");
          }}
        />
      ) : null}
      {toast ? (
        <div className="admin-toast" role="status" aria-live="polite">
          <span>✓</span>
          <div>
            <b>Operação registrada</b>
            <small>{toast}</small>
          </div>
        </div>
      ) : null}
    </main>
  );
}
function Overview({
  data,
  setTab,
}: {
  data: AdminData;
  setTab: (t: Tab) => void;
}) {
  const views = data.events.page_view || 0,
    carts = data.events.cart_add || 0,
    orders = data.events.order_created || 0;
  const activeOrders = data.orders.filter(
    (order) =>
      !["completed", "cancelled"].includes(String(order.status || "")),
  ).length;
  const quickActions: { tab: Tab; label: string; icon: AdminIconName }[] = [
    { tab: "orders", label: "Ver pedidos", icon: "orders" },
    { tab: "inventory", label: "Repor estoque", icon: "inventory" },
    { tab: "coupons", label: "Criar cupom", icon: "coupons" },
    { tab: "homepage", label: "Editar página inicial", icon: "homepage" },
    { tab: "settings", label: "Dados da loja", icon: "settings" },
    { tab: "reports", label: "Ver relatórios", icon: "reports" },
    { tab: "reviews", label: "Moderar avaliações", icon: "reviews" },
  ];
  const visibleQuickActions = quickActions.filter((action) =>
    tabIsAvailable(data, action.tab),
  );
  const primaryTab: Tab = data.currentPermissions.includes("catalog.manage")
    ? "products"
    : visibleQuickActions[0]?.tab || "overview";
  const secondaryTab: Tab =
    visibleQuickActions.find((action) => action.tab !== primaryTab)?.tab ||
    primaryTab;
  const primaryDefinition = tabs.find((item) => item.id === primaryTab);
  const secondaryDefinition = tabs.find((item) => item.id === secondaryTab);
  return (
    <>
      <div className="welcome">
        <div className="welcome-copy">
          <span>PAINEL OPERACIONAL</span>
          <h2>Bom trabalho! A loja está sob controle.</h2>
          <p>
            Acompanhe pedidos, estoque e comportamento dos clientes em um só
            lugar.
          </p>
          <div className="welcome-signals">
            <span>
              <i className="online" /> Ambiente privado
            </span>
            <span>
              <AdminIcon name="orders" size={14} /> {activeOrders} pedidos em
              andamento
            </span>
            <span>
              <AdminIcon name="alert" size={14} /> {data.stats.lowStock} itens
              pedem atenção
            </span>
          </div>
        </div>
        <div className="welcome-actions">
          {secondaryTab !== primaryTab ? (
            <button
              type="button"
              className="secondary"
              onClick={() => setTab(secondaryTab)}
            >
              <AdminIcon name={secondaryDefinition?.icon || "dashboard"} size={17} />
              Abrir {secondaryDefinition?.label.toLowerCase() || "painel"}
            </button>
          ) : null}
          <button type="button" onClick={() => setTab(primaryTab)}>
            <AdminIcon name={primaryDefinition?.icon || "dashboard"} size={17} />
            Abrir {primaryDefinition?.label.toLowerCase() || "painel"}
          </button>
        </div>
      </div>
      <div className="stat-grid">
        <Stat
          icon="orders"
          tone="blue"
          label="Pedidos em 30 dias"
          value={String(data.stats.ordersCount)}
          hint="Pedidos registrados"
        />
        <Stat
          icon="revenue"
          tone="green"
          label="Valor movimentado"
          value={money(data.stats.revenueCents)}
          hint="Total estimado"
        />
        <Stat
          icon="products"
          tone={data.stats.lowStock ? "red" : "blue"}
          label="Produtos ativos"
          value={String(data.stats.activeProducts)}
          hint={`${data.stats.lowStock} com estoque baixo`}
        />
        <Stat
          icon="conversion"
          tone="violet"
          label="Conversão"
          value={views ? `${Math.round((orders / views) * 100)}%` : "0%"}
          hint={`${orders} pedidos / ${views} visitas`}
        />
      </div>
      <OperationsChecklist data={data} setTab={setTab} />
      <div className="admin-panels">
        <article>
          <div className="panel-title">
            <h3>Funil de compra</h3>
            <small>Últimos 30 dias</small>
          </div>
          {[
            ["Visitas", views, 100],
            ["Adições ao carrinho", carts, views ? (carts / views) * 100 : 0],
            [
              "Checkouts",
              data.events.checkout_start || 0,
              views ? ((data.events.checkout_start || 0) / views) * 100 : 0,
            ],
            ["Pedidos", orders, views ? (orders / views) * 100 : 0],
          ].map(([l, v, p]) => (
            <div className="funnel" key={String(l)}>
              <span>{l}</span>
              <div>
                <i style={{ width: `${Math.min(100, Number(p))}%` }} />
              </div>
              <b>{v}</b>
            </div>
          ))}
        </article>
        <article>
          <div className="panel-title">
            <h3>Atalhos</h3>
            <small>Ações frequentes</small>
          </div>
          <div className="quick-admin">
            {visibleQuickActions.map((action) => (
              <button
                type="button"
                key={action.tab}
                onClick={() => setTab(action.tab)}
              >
                <i>
                  <AdminIcon name={action.icon} size={20} />
                </i>
                <span>{action.label}</span>
                <AdminIcon name="arrow" size={14} />
              </button>
            ))}
          </div>
        </article>
        <article>
          <div className="panel-title">
            <h3>Produtos mais adicionados</h3>
            <small>Últimos 30 dias</small>
          </div>
          <div className="ranking-list">
            {data.topProducts.length ? (
              data.topProducts.map((item, index) => (
                <div key={String(item.product_id)}>
                  <span>{index + 1}</span>
                  <b>{String(item.name || "Produto removido")}</b>
                  <small>{String(item.total)} adições</small>
                </div>
              ))
            ) : (
              <p className="ranking-empty">
                Os dados aparecerão conforme os clientes usarem o catálogo.
              </p>
            )}
          </div>
        </article>
      </div>
    </>
  );
}
function OperationsChecklist({
  data,
  setTab,
}: {
  data: AdminData;
  setTab: (tab: Tab) => void;
}) {
  const activeProducts = data.products.filter((product) => product.active);
  const checks: { label: string; ok: boolean; tab: Tab; hint: string }[] = [
    {
      label: "Contato e WhatsApp",
      ok: data.settings.whatsapp.replace(/\D/g, "").length >= 12,
      tab: "settings",
      hint: "Número usado no fechamento dos pedidos",
    },
    {
      label: "Endereço e horários",
      ok:
        data.settings.address.length > 20 &&
        !data.settings.address.toLowerCase().includes("configure"),
      tab: "settings",
      hint: "Informações exibidas na loja e no rodapé",
    },
    {
      label: "Catálogo ativo",
      ok: activeProducts.length >= 10,
      tab: "products",
      hint: `${activeProducts.length} produtos disponíveis`,
    },
    {
      label: "Preços e estoque",
      ok: activeProducts.every(
        (product) => product.priceCents > 0 && product.stockQuantity > 0,
      ),
      tab: "bulk",
      hint: "Nenhum produto ativo sem preço ou saldo",
    },
    {
      label: "Áreas de entrega",
      ok: data.deliveryZones.some((zone) => zone.active),
      tab: "delivery",
      hint: `${data.deliveryZones.filter((zone) => zone.active).length} áreas ativas`,
    },
    {
      label: "PIX configurado",
      ok: Boolean(data.settings.pixKey.trim()),
      tab: "settings",
      hint: "Necessário para gerar QR Code de pagamento",
    },
    {
      label: "Códigos de barras",
      ok:
        activeProducts.length > 0 &&
        activeProducts.filter((product) => product.barcode).length >=
          Math.ceil(activeProducts.length * 0.5),
      tab: "products",
      hint: `${activeProducts.filter((product) => product.barcode).length}/${activeProducts.length} cadastrados`,
    },
    {
      label: "Fotos reais da loja",
      ok:
        [
          data.homeContent.storefrontImageUrl,
          data.homeContent.interiorImageUrl,
          data.homeContent.teamImageUrl,
        ].filter(Boolean).length === 3,
      tab: "homepage",
      hint: `${[
        data.homeContent.storefrontImageUrl,
        data.homeContent.interiorImageUrl,
        data.homeContent.teamImageUrl,
      ].filter(Boolean).length}/3 imagens enviadas`,
    },
    {
      label: "Encarte semanal",
      ok:
        data.homeContent.flyerActive &&
        Boolean(data.homeContent.flyerTitle.trim()),
      tab: "homepage",
      hint: data.homeContent.flyerImageUrl
        ? "Arte do encarte configurada"
        : "Usando ofertas automáticas do catálogo",
    },
  ];
  const visibleChecks = checks.filter((check) =>
    tabIsAvailable(data, check.tab),
  );
  const completed = visibleChecks.filter((check) => check.ok).length;
  const score = visibleChecks.length
    ? Math.round((completed / visibleChecks.length) * 100)
    : 100;
  return (
    <section className="operations-checklist">
      <header>
        <div>
          <span>PRONTIDÃO OPERACIONAL</span>
          <h2>Checklist antes de liberar ao público</h2>
        </div>
        <strong>{score}%</strong>
      </header>
      <div className="operations-progress">
        <i style={{ width: `${score}%` }} />
      </div>
      <div className="operations-grid">
        {visibleChecks.map((check) => (
          <button key={check.label} onClick={() => setTab(check.tab)}>
            <span className={check.ok ? "ok" : "pending"}>
              {check.ok ? "✓" : "!"}
            </span>
            <div>
              <b>{check.label}</b>
              <small>{check.hint}</small>
            </div>
            <i>
              <AdminIcon name="arrow" size={14} />
            </i>
          </button>
        ))}
      </div>
    </section>
  );
}
function Stat({
  label,
  value,
  hint,
  icon = "dashboard",
  tone = "blue",
}: {
  label: string;
  value: string;
  hint: string;
  icon?: AdminIconName;
  tone?: "blue" | "green" | "red" | "violet";
}) {
  return (
    <article className={`stat ${tone}`}>
      <div className="stat-top">
        <i>
          <AdminIcon name={icon} size={18} />
        </i>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <div className="stat-footer">
        <small>{hint}</small>
        <span aria-hidden="true">↗</span>
      </div>
    </article>
  );
}

function AdminSectionHeader({
  eyebrow,
  title,
  description,
  icon,
  count,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: AdminIconName;
  count?: string;
  children?: ReactNode;
}) {
  return (
    <header className="admin-section-header">
      <div className="admin-section-title">
        <i>
          <AdminIcon name={icon} size={21} />
        </i>
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="admin-section-actions">
        {count ? <strong>{count}</strong> : null}
        {children}
      </div>
    </header>
  );
}

function Products({
  products,
  query,
  setQuery,
  edit,
  add,
  scan,
  toggle,
}: {
  products: Product[];
  query: string;
  setQuery: (v: string) => void;
  edit: (p: Product) => void;
  add: () => void;
  scan: () => void;
  toggle: (p: Product) => void;
}) {
  return (
    <section className="admin-section-stack">
      <AdminSectionHeader
        eyebrow="GESTÃO DO CATÁLOGO"
        title="Produtos"
        description="Gerencie informações, preços, disponibilidade e imagens do catálogo."
        icon="products"
        count={`${products.length} encontrados`}
      >
        <button type="button" className="secondary" onClick={scan}>
          <AdminIcon name="scan" size={17} /> Ler código
        </button>
        <button type="button" onClick={add}>
          <AdminIcon name="plus" size={17} /> Novo produto
        </button>
      </AdminSectionHeader>
      <div className="content-tools">
        <label className="admin-search-field">
          <AdminIcon name="search" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, marca, SKU ou código de barras..."
            aria-label="Buscar produtos"
          />
        </label>
        <small>Resultados atualizados enquanto você digita</small>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length ? (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <Image
                        src={p.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                      />
                      <span>
                        <b>{p.name}</b>
                        <small>
                          {p.sku}
                          {p.brand ? ` · ${p.brand}` : ""}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td>{p.categoryName}</td>
                  <td>
                    <b>{money(p.priceCents)}</b>
                  </td>
                  <td>
                    <span
                      className={
                        p.stockQuantity <= p.minStock ? "stock low" : "stock"
                      }
                    >
                      {p.saleMode === "weight"
                        ? `${p.stockQuantity} kg`
                        : p.stockQuantity}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={p.active ? "status active" : "status"}
                      onClick={() => toggle(p)}
                    >
                      {p.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="edit"
                      onClick={() => edit(p)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="table-empty">
                    Nenhum produto corresponde à busca atual.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function BulkProductEditor({
  products,
  busy,
  apply,
}: {
  products: Product[];
  busy: boolean;
  apply: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [operation, setOperation] = useState("price_percent");
  const [value, setValue] = useState("0");
  const visible = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.brand} ${product.sku} ${product.barcode}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [products, query],
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const submit = async () => {
    if (
      await apply({
        ids: selected,
        operation,
        value: Number(value || 0),
      })
    )
      setSelected([]);
  };
  return (
    <section className="bulk-editor">
      <header>
        <div>
          <span>EDIÇÃO SEGURA EM MASSA</span>
          <h2>Preços, estoque e disponibilidade</h2>
          <p>
            Selecione os produtos, escolha a operação e aplique uma única
            atualização organizada.
          </p>
        </div>
        <strong>{selected.length} selecionados</strong>
      </header>
      <div className="bulk-actions">
        <label>
          Operação
          <select
            value={operation}
            onChange={(event) => setOperation(event.target.value)}
          >
            <option value="price_percent">Ajustar preço em %</option>
            <option value="price_set">Definir preço em R$</option>
            <option value="stock_delta">Somar/remover estoque</option>
            <option value="stock_set">Definir estoque</option>
            <option value="activate">Ativar produtos</option>
            <option value="deactivate">Desativar produtos</option>
          </select>
        </label>
        {!['activate', 'deactivate'].includes(operation) ? (
          <label>
            Valor
            <input
              type="number"
              step={
                operation === "price_set" || operation.startsWith("stock_")
                  ? "0.01"
                  : "1"
              }
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
        ) : null}
        <button disabled={busy || !selected.length} onClick={() => void submit()}>
          {busy ? "Aplicando..." : "Aplicar atualização"}
        </button>
      </div>
      <div className="bulk-filter">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, marca, SKU ou código..."
        />
        <button
          onClick={() =>
            setSelected(
              visible.every((product) => selectedSet.has(product.id))
                ? selected.filter(
                    (id) => !visible.some((product) => product.id === id),
                  )
                : Array.from(
                    new Set([...selected, ...visible.map((product) => product.id)]),
                  ),
            )
          }
        >
          {visible.every((product) => selectedSet.has(product.id))
            ? "Desmarcar visíveis"
            : "Selecionar visíveis"}
        </button>
      </div>
      <div className="bulk-product-grid">
        {visible.map((product) => (
          <button
            key={product.id}
            className={selectedSet.has(product.id) ? "selected" : ""}
            onClick={() => toggle(product.id)}
          >
            <span>{selectedSet.has(product.id) ? "✓" : ""}</span>
            <Image
              src={product.imageUrl}
              alt=""
              width={52}
              height={52}
              unoptimized
            />
            <div>
              <b>{product.name}</b>
              <small>{product.sku}</small>
            </div>
            <strong>{money(product.priceCents)}</strong>
            <small>
              {product.stockQuantity.toLocaleString("pt-BR", {
                maximumFractionDigits: 3,
              })}{" "}
              {product.saleMode === "weight" ? "kg" : "em estoque"}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

function BarcodeScanner({
  close,
  detected,
}: {
  close: () => void;
  detected: (barcode: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectedRef = useRef(detected);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState("Iniciando a câmera...");

  useEffect(() => {
    detectedRef.current = detected;
  }, [detected]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let cancelled = false;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!videoRef.current || cancelled) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const Detector = (
          window as unknown as {
            BarcodeDetector?: new (options?: {
              formats?: string[];
            }) => BarcodeDetectorInstance;
          }
        ).BarcodeDetector;
        if (!Detector) {
          setStatus(
            "A câmera está ativa. Neste navegador, digite o código abaixo.",
          );
          return;
        }
        const detector = new Detector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });
        setStatus("Aponte a câmera para o código de barras do produto.");
        timer = window.setInterval(async () => {
          if (!videoRef.current || cancelled) return;
          try {
            const [result] = await detector.detect(videoRef.current);
            const value = result?.rawValue.replace(/\D/g, "");
            if (value) {
              cancelled = true;
              detectedRef.current(value);
            }
          } catch {}
        }, 500);
      } catch {
        setStatus(
          "Não foi possível usar a câmera. Digite o código manualmente.",
        );
      }
    };
    void start();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="editor-overlay scanner-overlay">
      <button className="editor-backdrop" onClick={close} />
      <section className="barcode-scanner" role="dialog" aria-modal="true">
        <header>
          <div>
            <span>CADASTRO RÁPIDO</span>
            <h2>Leitor de código de barras</h2>
          </div>
          <button onClick={close}>×</button>
        </header>
        <div className="scanner-camera">
          <video ref={videoRef} muted playsInline />
          <i />
          <span />
        </div>
        <p>{status}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = manual.replace(/\D/g, "");
            if (value.length >= 6) detected(value);
          }}
        >
          <input
            inputMode="numeric"
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder="Digite o código manualmente"
          />
          <button disabled={manual.replace(/\D/g, "").length < 6}>
            Usar código
          </button>
        </form>
      </section>
    </div>
  );
}

function Orders({
  orders,
  update,
}: {
  orders: Record<string, unknown>[];
  update: (id: string, status: string) => void;
}) {
  const statuses = [
    ["whatsapp_pending", "Aguardando", "notifications"],
    ["confirmed", "Confirmado", "audit"],
    ["preparing", "Separação", "inventory"],
    ["out_for_delivery", "Em entrega", "delivery"],
    ["completed", "Concluído", "reviews"],
    ["cancelled", "Cancelado", "alert"],
  ] as const;
  const quantityLabel = (item: Record<string, unknown>) => {
    const millis = Number(item.quantity_millis || 0);
    const quantity = millis > 0 ? millis / 1000 : Number(item.quantity || 0);
    const unit = String(item.unit || "");
    if (quantity % 1 !== 0 || /kg|peso/i.test(unit))
      return `${quantity.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg`;
    return `${quantity}x`;
  };
  return (
    <section className="orders-kanban-shell">
      <header>
        <div>
          <span>FLUXO DE ATENDIMENTO</span>
          <h2>Pedidos em tempo real</h2>
        </div>
        <p>Arraste os cartões entre as colunas para atualizar o andamento.</p>
      </header>
      {orders.length ? (
        <div className="orders-kanban">
          {statuses.map(([status, label, icon]) => {
            const rows = orders.filter((order) => order.status === status);
            return (
              <section
                key={status}
                className={`kanban-column ${status}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData("text/order-id");
                  if (id) update(id, status);
                }}
              >
                <header>
                  <span>
                    <AdminIcon name={icon} size={15} />
                  </span>
                  <b>{label}</b>
                  <small>{rows.length}</small>
                </header>
                <div>
                  {rows.map((order) => (
                    <article
                      key={String(order.id)}
                      draggable
                      onDragStart={(event) =>
                        event.dataTransfer.setData(
                          "text/order-id",
                          String(order.id),
                        )
                      }
                    >
                      <div className="kanban-order-top">
                        <span>{String(order.order_number)}</span>
                        <strong>{money(Number(order.total_cents))}</strong>
                      </div>
                      <h3>{String(order.customer_name)}</h3>
                      <small>
                        {String(order.customer_phone)} ·{" "}
                        {new Date(String(order.created_at)).toLocaleString(
                          "pt-BR",
                          { dateStyle: "short", timeStyle: "short" },
                        )}
                      </small>
                      <div className="kanban-tags">
                        <span>{String(order.item_count)} produtos</span>
                        <span>
                          {String(order.delivery_type) === "delivery"
                            ? "Entrega"
                            : "Retirada"}
                        </span>
                      </div>
                      <details>
                        <summary>Ver pedido completo</summary>
                        <p>
                          {String(order.delivery_type) === "delivery"
                            ? `${String(order.address)} — ${String(order.neighborhood)}`
                            : "Retirada na loja"}
                        </p>
                        <p>
                          {String(order.payment_method)} ·{" "}
                          {String(order.scheduled_for)}
                        </p>
                        <div className="admin-order-items">
                          {(Array.isArray(order.items) ? order.items : []).map(
                            (item: Record<string, unknown>) => (
                              <div key={String(item.id)}>
                                <span>
                                  {quantityLabel(item)}{" "}
                                  {String(item.product_name)}
                                  {item.option_label
                                    ? ` · ${String(item.option_label)}`
                                    : ""}
                                </span>
                                <b>{money(Number(item.total_cents))}</b>
                                {item.substitution ? (
                                  <small>
                                    {String(item.substitution) === "similar"
                                      ? "Pode substituir"
                                      : String(item.substitution) === "none"
                                        ? "Não substituir"
                                        : "Confirmar substituição"}
                                  </small>
                                ) : null}
                              </div>
                            ),
                          )}
                        </div>
                        <Link
                          className="print-order-link"
                          href={`/admin/pedidos/${String(order.id)}/imprimir`}
                          target="_blank"
                        >
                          Imprimir separação ↗
                        </Link>
                      </details>
                      <select
                        value={String(order.status)}
                        onChange={(event) =>
                          update(String(order.id), event.target.value)
                        }
                        aria-label={`Atualizar pedido ${String(order.order_number)}`}
                      >
                        {statuses.map(([value, text]) => (
                          <option key={value} value={value}>
                            {text}
                          </option>
                        ))}
                      </select>
                    </article>
                  ))}
                  {!rows.length ? <p>Solte um pedido aqui</p> : null}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="blank-state">Nenhum pedido registrado ainda.</div>
      )}
    </section>
  );
}

function Reports({ data }: { data: AdminData }) {
  const categorySales = new Map<
    string,
    { revenue: number; cost: number; quantity: number }
  >();
  data.orders.forEach((order) => {
    if (String(order.status) === "cancelled") return;
    (Array.isArray(order.items) ? order.items : []).forEach(
      (item: Record<string, unknown>) => {
        const category = String(item.category_name || "Sem categoria");
        const current = categorySales.get(category) || {
          revenue: 0,
          cost: 0,
          quantity: 0,
        };
        current.revenue += Number(item.total_cents || 0);
        const quantity = Number(item.quantity_millis || 0)
          ? Number(item.quantity_millis) / 1000
          : Number(item.quantity || 0);
        current.cost += Number(item.unit_cost_cents || 0) * quantity;
        current.quantity += quantity;
        categorySales.set(category, current);
      },
    );
  });
  const ranking = [...categorySales.entries()].sort(
    (a, b) => b[1].revenue - a[1].revenue,
  );
  const maximum = Math.max(1, ...ranking.map(([, value]) => value.revenue));
  const marginRate = data.stats.revenueCents
    ? Math.round((data.stats.grossProfitCents / data.stats.revenueCents) * 100)
    : 0;
  return (
    <>
      <div className="report-intro">
        <div>
          <span>ÚLTIMOS 30 DIAS</span>
          <h2>Receita, margem e comportamento em uma visão.</h2>
          <p>
            Os valores consideram pedidos não cancelados e os custos informados
            no cadastro de produtos.
          </p>
          {data.stats.costConfiguredProducts < data.stats.activeProducts ? (
            <small>
              Atenção: {data.stats.costConfiguredProducts} de{" "}
              {data.stats.activeProducts} produtos ativos possuem custo
              preenchido. Complete o cadastro para uma margem mais precisa.
            </small>
          ) : null}
        </div>
      </div>
      <div className="report-stat-grid">
        <Stat
          label="Ticket médio"
          value={money(data.stats.averageTicketCents)}
          hint={`${data.stats.ordersCount} pedidos no período`}
        />
        <Stat
          label="Custo estimado"
          value={money(data.stats.costCents)}
          hint="Soma do custo dos itens"
        />
        <Stat
          label="Margem bruta estimada"
          value={money(data.stats.grossProfitCents)}
          hint={`${marginRate}% sobre o valor movimentado`}
        />
        <Stat
          label="Pontos emitidos"
          value={String(data.stats.pointsIssued)}
          hint="Creditados em pedidos concluídos"
        />
      </div>
      <div className="report-panels">
        <article>
          <div className="panel-title">
            <h3>Vendas por categoria</h3>
            <small>Pedidos recentes carregados</small>
          </div>
          <div className="category-sales">
            {ranking.length ? (
              ranking.map(([category, value]) => (
                <div key={category}>
                  <span>{category}</span>
                  <div>
                    <i
                      style={{ width: `${(value.revenue / maximum) * 100}%` }}
                    />
                  </div>
                  <b>{money(value.revenue)}</b>
                  <small>
                    {value.quantity.toLocaleString("pt-BR", {
                      maximumFractionDigits: 3,
                    })}{" "}
                    em quantidade · margem{" "}
                    {money(value.revenue - value.cost)}
                  </small>
                </div>
              ))
            ) : (
              <p className="ranking-empty">
                Ainda não há vendas para comparar.
              </p>
            )}
          </div>
        </article>
        <article>
          <div className="panel-title">
            <h3>Relacionamento</h3>
            <small>Base acumulada</small>
          </div>
          <div className="relationship-numbers">
            <div>
              <strong>{data.stats.customerCount}</strong>
              <span>clientes identificados</span>
            </div>
            <div>
              <strong>{data.stats.approvedReviews}</strong>
              <span>avaliações publicadas</span>
            </div>
            <div>
              <strong>{data.stats.pendingReviews}</strong>
              <span>aguardando moderação</span>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}

function Reviews({
  rows,
  update,
}: {
  rows: Record<string, unknown>[];
  update: (id: string, status: string) => void;
}) {
  return (
    <section className="admin-section-stack">
      <AdminSectionHeader
        eyebrow="REPUTAÇÃO DA LOJA"
        title="Avaliações verificadas"
        description="Aprove, rejeite e acompanhe os relatos de compras concluídas."
        icon="reviews"
        count={`${rows.length} avaliações`}
      />
      <div className="review-admin-list">
        {rows.length ? (
          rows.map((review) => (
            <article key={String(review.id)}>
              <div className="review-admin-stars">
                {"★".repeat(Number(review.rating))}
              </div>
              <blockquote>“{String(review.comment)}”</blockquote>
              <div className="review-admin-meta">
                <span>
                  <b>{String(review.customer_name)}</b>
                  <small>
                    Pedido {String(review.order_number)} ·{" "}
                    {new Date(String(review.created_at)).toLocaleDateString(
                      "pt-BR",
                    )}
                  </small>
                </span>
                <select
                  value={String(review.status)}
                  onChange={(event) =>
                    update(String(review.id), event.target.value)
                  }
                  aria-label={`Moderar avaliação de ${String(review.customer_name)}`}
                >
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovada</option>
                  <option value="rejected">Rejeitada</option>
                </select>
              </div>
            </article>
          ))
        ) : (
          <div className="blank-state">Nenhuma avaliação recebida ainda.</div>
        )}
      </div>
    </section>
  );
}

function Customers({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <section className="admin-section-stack">
      <AdminSectionHeader
        eyebrow="RELACIONAMENTO"
        title="Clientes e Clube Central"
        description="Consulte histórico, valor acumulado, pontos e indicações."
        icon="customers"
        count={`${rows.length} clientes`}
      />
      <div className="table-wrap customer-table">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>WhatsApp</th>
              <th>Pedidos</th>
              <th>Valor acumulado</th>
              <th>Pontos</th>
              <th>Indicação</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((customer) => (
                <tr key={String(customer.id)}>
                  <td>
                    <b>{String(customer.name)}</b>
                  </td>
                  <td>{String(customer.phone)}</td>
                  <td>{String(customer.order_count)}</td>
                  <td>{money(Number(customer.lifetime_value_cents))}</td>
                  <td>
                    <span className="points-pill">
                      {String(customer.points)} pts
                    </span>
                  </td>
                  <td>
                    <code>{String(customer.referral_code)}</code>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="table-empty">
                    Os clientes aparecerão após os primeiros pedidos.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Inventory({
  products,
  history,
  edit,
  adjust,
  busy,
}: {
  products: Product[];
  history: Record<string, unknown>[];
  edit: (p: Product) => void;
  adjust: (value: Record<string, unknown>) => Promise<boolean>;
  busy: boolean;
}) {
  const [productId, setProductId] = useState(products[0]?.id || ""),
    [delta, setDelta] = useState(""),
    [movementType, setMovementType] = useState("restock"),
    [reason, setReason] = useState("");
  const lowStock = products.filter(
    (product) => product.stockQuantity <= product.minStock,
  ).length;
  return (
    <section className="admin-section-stack">
      <AdminSectionHeader
        eyebrow="CONTROLE DE SALDO"
        title="Estoque"
        description="Os produtos com menor saldo aparecem primeiro para agilizar a reposição."
        icon="inventory"
        count={`${lowStock} em atenção`}
      />
      <div className="inventory-control-grid">
        <form
          className="inventory-adjust-card"
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              await adjust({
                productId,
                delta: Number(delta),
                movementType,
                reason,
              })
            ) {
              setDelta("");
              setReason("");
            }
          }}
        >
          <div className="control-card-heading">
            <span>AJUSTE RÁPIDO</span>
            <h3>Registrar entrada ou saída</h3>
            <p>Todo ajuste gera um evento rastreável no histórico.</p>
          </div>
          <label>
            Produto
            <select
              required
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.stockQuantity} em estoque
                </option>
              ))}
            </select>
          </label>
          <div className="inventory-adjust-row">
            <label>
              Tipo
              <select
                value={movementType}
                onChange={(event) => setMovementType(event.target.value)}
              >
                <option value="restock">Reposição</option>
                <option value="loss">Perda ou avaria</option>
                <option value="return">Devolução</option>
                <option value="adjustment">Correção manual</option>
              </select>
            </label>
            <label>
              Quantidade (+ ou −)
              <input
                required
                type="number"
                step="0.001"
                value={delta}
                onChange={(event) => setDelta(event.target.value)}
                placeholder="Ex.: 12 ou -2"
              />
            </label>
          </div>
          <label>
            Motivo
            <input
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ex.: recebimento do fornecedor"
            />
          </label>
          <button className="save-settings" disabled={busy || !products.length}>
            {busy ? "Registrando..." : "Registrar movimentação"}
          </button>
        </form>
        <article className="inventory-health-card">
          <span>SAÚDE DO ESTOQUE</span>
          <strong>{products.length - lowStock}</strong>
          <b>itens acima do mínimo</b>
          <div>
            <i style={{ width: `${products.length ? ((products.length - lowStock) / products.length) * 100 : 0}%` }} />
          </div>
          <small>
            {lowStock
              ? `${lowStock} produtos ainda precisam de atenção.`
              : "Todos os produtos estão dentro do nível planejado."}
          </small>
        </article>
      </div>
      <div className="inventory-grid">
        {products.length ? (
          products
            .slice()
            .sort((a, b) => a.stockQuantity - b.stockQuantity)
            .map((p) => (
              <article
                key={p.id}
                className={p.stockQuantity <= p.minStock ? "critical" : ""}
              >
                <Image
                  src={p.imageUrl}
                  alt=""
                  width={55}
                  height={55}
                  unoptimized
                />
                <div>
                  <b>{p.name}</b>
                  <small>
                    Mínimo: {p.minStock}
                    {p.saleMode === "weight" ? " kg" : ""}
                  </small>
                  <strong>
                    {p.stockQuantity.toLocaleString("pt-BR", {
                      maximumFractionDigits: 3,
                    })}{" "}
                    {p.saleMode === "weight" ? "kg" : "un."}
                  </strong>
                </div>
                <button type="button" onClick={() => edit(p)}>
                  Atualizar
                </button>
              </article>
            ))
        ) : (
          <div className="blank-state">Nenhum produto no estoque.</div>
        )}
      </div>
      <section className="inventory-history-card">
        <header>
          <div>
            <span>RASTREABILIDADE</span>
            <h3>Movimentações recentes</h3>
          </div>
          <small>{history.length} registros</small>
        </header>
        <div className="admin-table-shell">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Movimento</th>
                <th>Antes → depois</th>
                <th>Motivo</th>
                <th>Responsável</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {history.length ? (
                history.slice(0, 60).map((row) => {
                  const deltaValue = Number(row.quantity_delta_millis) / 1000;
                  return (
                    <tr key={String(row.id)}>
                      <td>
                        <b>{String(row.product_name || row.product_id)}</b>
                        <small>{String(row.sku || "")}</small>
                      </td>
                      <td>
                        <span
                          className={
                            deltaValue >= 0
                              ? "movement-pill positive"
                              : "movement-pill negative"
                          }
                        >
                          {deltaValue > 0 ? "+" : ""}
                          {deltaValue.toLocaleString("pt-BR", {
                            maximumFractionDigits: 3,
                          })}
                        </span>
                      </td>
                      <td>
                        {(Number(row.previous_quantity_millis) / 1000).toLocaleString("pt-BR")} →{" "}
                        {(Number(row.new_quantity_millis) / 1000).toLocaleString("pt-BR")}
                      </td>
                      <td>{String(row.reason || row.movement_type)}</td>
                      <td>{String(row.actor_email)}</td>
                      <td>{new Date(String(row.created_at)).toLocaleString("pt-BR")}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty">
                      As novas movimentações aparecerão aqui.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
type HomeImageKey =
  | "storefrontImageUrl"
  | "interiorImageUrl"
  | "teamImageUrl"
  | "flyerImageUrl";

function HomeImageEditor({
  label,
  hint,
  value,
  uploading,
  upload,
  clear,
}: {
  label: string;
  hint: string;
  value: string;
  uploading: boolean;
  upload: (file: File) => void;
  clear: () => void;
}) {
  return (
    <article className="home-image-editor">
      <div className="home-image-preview">
        {value ? (
          <Image src={value} alt={label} fill sizes="280px" unoptimized />
        ) : (
          <span>Adicionar foto</span>
        )}
      </div>
      <div>
        <b>{label}</b>
        <small>{hint}</small>
        <label>
          {uploading ? "Enviando..." : value ? "Trocar imagem" : "Enviar imagem"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.target.value = "";
            }}
          />
        </label>
        {value ? (
          <button type="button" onClick={clear}>
            Remover
          </button>
        ) : null}
      </div>
    </article>
  );
}

function HomeContentManager({
  content,
  busy,
  save,
}: {
  content: HomeContent;
  busy: boolean;
  save: (value: HomeContent) => Promise<boolean>;
}) {
  const [form, setForm] = useState(content);
  const [uploading, setUploading] = useState<HomeImageKey | null>(null);
  const [message, setMessage] = useState("");
  const set = <K extends keyof HomeContent>(
    key: K,
    value: HomeContent[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  const upload = async (key: HomeImageKey, file: File) => {
    setUploading(key);
    setMessage("");
    const body = new FormData();
    body.append("file", file);
    body.append("scope", "homepage");
    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao enviar imagem");
      set(key, String(data.url));
      setMessage("Imagem enviada. Salve as alterações para publicar.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível enviar a imagem",
      );
    } finally {
      setUploading(null);
    }
  };
  return (
    <section className="home-content-manager">
      <header>
        <div>
          <span>CONTEÚDO DA INDEX</span>
          <h2>Encarte e apresentação da loja</h2>
          <p>
            Atualize o encarte semanal e publique fotos reais da unidade sem
            precisar alterar o site.
          </p>
        </div>
        <Link href="/" target="_blank">
          Ver página inicial ↗
        </Link>
      </header>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await save(form);
        }}
      >
        <article className="home-content-card">
          <div className="home-content-heading">
            <span>01</span>
            <div>
              <h3>Encarte da semana</h3>
              <p>
                Sem uma arte enviada, o site monta o encarte automaticamente
                com os produtos em promoção.
              </p>
            </div>
          </div>
          <div className="home-fields-grid">
            <label>
              Chamada curta
              <input
                value={form.flyerEyebrow}
                onChange={(event) => set("flyerEyebrow", event.target.value)}
              />
            </label>
            <label>
              Título
              <input
                required
                value={form.flyerTitle}
                onChange={(event) => set("flyerTitle", event.target.value)}
              />
            </label>
            <label className="full">
              Texto de apoio
              <textarea
                value={form.flyerSubtitle}
                onChange={(event) => set("flyerSubtitle", event.target.value)}
              />
            </label>
            <label>
              Texto do botão
              <input
                value={form.flyerCtaLabel}
                onChange={(event) => set("flyerCtaLabel", event.target.value)}
              />
            </label>
            <label>
              Destino do botão
              <input
                value={form.flyerCtaUrl}
                onChange={(event) => set("flyerCtaUrl", event.target.value)}
                placeholder="#ofertas"
              />
            </label>
            <label>
              Início da campanha
              <input
                type="datetime-local"
                value={form.flyerStartsAt?.slice(0, 16) || ""}
                onChange={(event) =>
                  set(
                    "flyerStartsAt",
                    event.target.value
                      ? new Date(event.target.value).toISOString()
                      : null,
                  )
                }
              />
            </label>
            <label>
              Encerramento
              <input
                type="datetime-local"
                value={form.flyerEndsAt?.slice(0, 16) || ""}
                onChange={(event) =>
                  set(
                    "flyerEndsAt",
                    event.target.value
                      ? new Date(event.target.value).toISOString()
                      : null,
                  )
                }
              />
            </label>
            <label className="home-toggle full">
              <input
                type="checkbox"
                checked={form.flyerActive}
                onChange={(event) => set("flyerActive", event.target.checked)}
              />
              Exibir encarte na página inicial
            </label>
          </div>
          <HomeImageEditor
            label="Arte do encarte"
            hint="Recomendado: imagem vertical ou quadrada, legível no celular."
            value={form.flyerImageUrl}
            uploading={uploading === "flyerImageUrl"}
            upload={(file) => void upload("flyerImageUrl", file)}
            clear={() => set("flyerImageUrl", "")}
          />
        </article>

        <article className="home-content-card">
          <div className="home-content-heading">
            <span>02</span>
            <div>
              <h3>Conheça o Supermercado Central</h3>
              <p>
                A seção institucional só apresenta as fotos como reais depois
                que elas forem enviadas pelo painel.
              </p>
            </div>
          </div>
          <div className="home-fields-grid">
            <label>
              Chamada curta
              <input
                value={form.aboutEyebrow}
                onChange={(event) => set("aboutEyebrow", event.target.value)}
              />
            </label>
            <label>
              Título
              <input
                required
                value={form.aboutTitle}
                onChange={(event) => set("aboutTitle", event.target.value)}
              />
            </label>
            <label className="full">
              Apresentação
              <textarea
                value={form.aboutText}
                onChange={(event) => set("aboutText", event.target.value)}
              />
            </label>
          </div>
          <div className="home-gallery-editor">
            <HomeImageEditor
              label="Fachada da loja"
              hint="Foto horizontal mostrando a entrada e a marca."
              value={form.storefrontImageUrl}
              uploading={uploading === "storefrontImageUrl"}
              upload={(file) => void upload("storefrontImageUrl", file)}
              clear={() => set("storefrontImageUrl", "")}
            />
            <HomeImageEditor
              label="Interior da loja"
              hint="Foto dos corredores, hortifruti ou área de atendimento."
              value={form.interiorImageUrl}
              uploading={uploading === "interiorImageUrl"}
              upload={(file) => void upload("interiorImageUrl", file)}
              clear={() => set("interiorImageUrl", "")}
            />
            <HomeImageEditor
              label="Equipe Central"
              hint="Foto autorizada da equipe para reforçar o atendimento humano."
              value={form.teamImageUrl}
              uploading={uploading === "teamImageUrl"}
              upload={(file) => void upload("teamImageUrl", file)}
              clear={() => set("teamImageUrl", "")}
            />
          </div>
        </article>
        {message ? <p className="home-content-message">{message}</p> : null}
        <button
          className="save-settings home-content-save"
          disabled={busy || Boolean(uploading)}
        >
          {busy ? "Salvando..." : "Salvar conteúdo da página inicial"}
        </button>
      </form>
    </section>
  );
}

function SimpleManager({
  title,
  button,
  rows,
  fields,
  labels,
  defaults,
  save,
}: {
  title: string;
  button: string;
  rows: {
    id: string;
    title: string;
    subtitle: string;
    raw: Record<string, unknown>;
  }[];
  fields: string[];
  labels: string[];
  defaults: Record<string, unknown>;
  save: (v: Record<string, unknown>) => Promise<boolean>;
}) {
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const managerIcon: AdminIconName = title.toLowerCase().includes("categoria")
    ? "categories"
    : title.toLowerCase().includes("entrega")
      ? "delivery"
      : title.toLowerCase().includes("cupom")
        ? "coupons"
        : title.toLowerCase().includes("banner")
          ? "banners"
          : title.toLowerCase().includes("alerta")
            ? "notifications"
            : title.toLowerCase().includes("equipe")
              ? "team"
              : "settings";
  return (
    <section className="admin-section-stack">
      <AdminSectionHeader
        eyebrow="ORGANIZAÇÃO E CONTROLE"
        title={title}
        description="Mantenha esta área atualizada para refletir corretamente na experiência da loja."
        icon={managerIcon}
        count={`${rows.length} registros`}
      >
        <button type="button" onClick={() => setForm(defaults)}>
          <AdminIcon name="plus" size={17} /> {button}
        </button>
      </AdminSectionHeader>
      <div className="manager-list">
        {rows.length ? (
          rows.map((r) => (
            <article key={r.id}>
              <div>
                <b>{r.title}</b>
                <small>{r.subtitle}</small>
              </div>
              <button type="button" onClick={() => setForm(r.raw)}>
                Editar
              </button>
            </article>
          ))
        ) : (
          <div className="blank-state">Nenhum registro cadastrado.</div>
        )}
      </div>
      {form && (
        <div className="editor-overlay">
          <button className="editor-backdrop" onClick={() => setForm(null)} />
          <form
            className="simple-editor"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await save(form)) setForm(null);
            }}
          >
            <header>
              <h2>{button}</h2>
              <button type="button" onClick={() => setForm(null)}>
                ×
              </button>
            </header>
            {fields.map((field, i) => (
              <label key={field}>
                {labels[i]}
                {typeof form[field] === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(form[field])}
                    onChange={(e) =>
                      setForm({ ...form, [field]: e.target.checked })
                    }
                  />
                ) : (
                  <input
                    value={String(form[field] ?? "")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field]:
                          e.target.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                )}
              </label>
            ))}
            <button className="save" disabled={false}>
              Salvar
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
function Settings({
  settings,
  set,
  save,
  busy,
}: {
  settings: StoreSettings;
  set: (k: keyof StoreSettings, v: string | number | boolean) => void;
  save: () => void;
  busy: boolean;
}) {
  return (
    <div className="settings-form">
      <div className="settings-intro">
        <span>CONFIGURAÇÃO CENTRAL</span>
        <h2>Dados usados em toda a loja</h2>
        <p>
          Altere uma vez e o site, o checkout e o WhatsApp serão atualizados
          juntos.
        </p>
      </div>
      <div className="settings-grid">
        <Field
          label="Nome da loja"
          value={settings.storeName}
          change={(v) => set("storeName", v)}
        />
        <Field
          label="WhatsApp com DDI e DDD"
          value={settings.whatsapp}
          change={(v) => set("whatsapp", v)}
        />
        <Field
          label="Telefone"
          value={settings.phone}
          change={(v) => set("phone", v)}
        />
        <Field
          label="Horários"
          value={settings.hours}
          change={(v) => set("hours", v)}
        />
        <Field
          label="Endereço"
          value={settings.address}
          change={(v) => set("address", v)}
          full
        />
        <Field
          label="Link do Google Maps"
          value={settings.mapsUrl}
          change={(v) => set("mapsUrl", v)}
          full
        />
        <Field
          label="Formas de pagamento"
          value={settings.paymentMethods}
          change={(v) => set("paymentMethods", v)}
          full
        />
        <Field
          label="Chave PIX"
          value={settings.pixKey}
          change={(v) => set("pixKey", v)}
        />
        <Field
          label="Nome do recebedor PIX"
          value={settings.pixMerchantName}
          change={(v) => set("pixMerchantName", v)}
        />
        <Field
          label="Cidade do recebedor PIX"
          value={settings.pixMerchantCity}
          change={(v) => set("pixMerchantCity", v)}
        />
        <Field
          label="Pedido mínimo em centavos"
          value={String(settings.minimumOrderCents)}
          change={(v) => set("minimumOrderCents", Number(v))}
        />
        <Field
          label="Aviso no topo"
          value={settings.announcement}
          change={(v) => set("announcement", v)}
          full
        />
        <Field
          label="Título das ofertas-relâmpago"
          value={settings.flashOfferTitle}
          change={(v) => set("flashOfferTitle", v)}
        />
        <Field
          label="Horas para lembrar carrinho"
          value={String(settings.abandonedCartHours)}
          change={(v) => set("abandonedCartHours", Number(v))}
        />
        <Field
          label="Pontos por real concluído"
          value={String(settings.pointsPerReal)}
          change={(v) => set("pointsPerReal", Number(v))}
        />
        <Field
          label="Política padrão de substituição"
          value={settings.substitutionPolicy}
          change={(v) => set("substitutionPolicy", v)}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={settings.allowDelivery}
            onChange={(e) => set("allowDelivery", e.target.checked)}
          />{" "}
          Permitir entrega
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.allowPickup}
            onChange={(e) => set("allowPickup", e.target.checked)}
          />{" "}
          Permitir retirada
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.loyaltyEnabled}
            onChange={(e) => set("loyaltyEnabled", e.target.checked)}
          />{" "}
          Ativar Clube Central
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.reviewEnabled}
            onChange={(e) => set("reviewEnabled", e.target.checked)}
          />{" "}
          Permitir avaliações verificadas
        </label>
      </div>
      <button className="save-settings" onClick={save} disabled={busy}>
        {busy ? "Salvando..." : "Salvar configurações"}
      </button>
    </div>
  );
}
function Field({
  label,
  value,
  change,
  full = false,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  full?: boolean;
}) {
  return (
    <label className={full ? "full" : ""}>
      {label}
      <input value={value} onChange={(e) => change(e.target.value)} />
    </label>
  );
}
function ImportExport({
  products,
  importRows,
}: {
  products: Product[];
  importRows: (rows: Record<string, unknown>[]) => Promise<boolean>;
}) {
  const [fileName, setFileName] = useState(""),
    [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const parse = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result),
        lines = text.split(/\r?\n/).filter(Boolean),
        headers = lines[0].split(/[;,]/).map((h) => h.trim());
      setRows(
        lines
          .slice(1)
          .map((line) =>
            Object.fromEntries(
              line.split(/[;,]/).map((v, i) => [headers[i], v.trim()]),
            ),
          ),
      );
    };
    reader.readAsText(file);
  };
  const exportCsv = () => {
    const headers = [
        "sku",
        "nome",
        "marca",
        "codigo_barras",
        "categoria",
        "preco",
        "unidade",
        "modo_venda",
        "passo",
        "minimo",
        "estoque",
        "imagem",
      ],
      lines = products.map((p) =>
        [
          p.sku,
          p.name,
          p.brand,
          p.barcode,
          p.categoryId,
          (p.priceCents / 100).toFixed(2),
          p.unit,
          p.saleMode,
          p.quantityStep,
          p.minimumQuantity,
          p.stockQuantity,
          p.imageUrl,
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(","),
      ),
      blob = new Blob([[headers.join(","), ...lines].join("\n")], {
        type: "text/csv",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "produtos-supermercado-central.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportJson = () => {
    const blob = new Blob(
        [
          JSON.stringify(
            { exportedAt: new Date().toISOString(), products },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "backup-catalogo-supermercado-central.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="import-grid">
      <article>
        <span>IMPORTAÇÃO EM MASSA</span>
        <h2>Atualize produtos por CSV</h2>
        <p>
          Colunas aceitas: sku, nome, marca, código de barras, categoria, preço,
          unidade, modo de venda, passo, mínimo, estoque, imagem e destaque.
        </p>
        <label className="drop-file">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])}
          />
          <b>Selecionar arquivo CSV</b>
          <small>{fileName || "Até 1.000 produtos por importação"}</small>
        </label>
        {rows.length > 0 && (
          <button className="save-settings" onClick={() => importRows(rows)}>
            Importar {rows.length} produtos
          </button>
        )}
      </article>
      <article>
        <span>BACKUP DO CATÁLOGO</span>
        <h2>Exporte os dados atuais</h2>
        <p>
          Um backup diário é mantido automaticamente após alterações. Você
          também pode baixar cópias locais.
        </p>
        <button className="export" onClick={exportCsv}>
          Baixar catálogo CSV
        </button>
        <button className="export secondary" onClick={exportJson}>
          Baixar backup JSON
        </button>
      </article>
    </div>
  );
}

const STAFF_ROLES: { value: Exclude<AdminRole, "owner">; label: string; description: string }[] = [
  { value: "manager", label: "Gerente", description: "Operação ampla, sem segurança e equipe." },
  { value: "catalog", label: "Catálogo", description: "Produtos, preços, estoque e conteúdo." },
  { value: "orders", label: "Atendimento", description: "Pedidos, clientes e avaliações." },
  { value: "inventory", label: "Estoquista", description: "Produtos e movimentações de estoque." },
  { value: "marketing", label: "Marketing", description: "Campanhas, banners, cupons e página inicial." },
  { value: "finance", label: "Financeiro", description: "Indicadores comerciais e relatórios." },
  { value: "auditor", label: "Auditor", description: "Relatórios e histórico em modo de consulta." },
];

const PERMISSION_OPTIONS: { value: AdminPermission; label: string }[] = [
  { value: "orders.manage", label: "Gerenciar pedidos e clientes" },
  { value: "catalog.manage", label: "Gerenciar catálogo e preços" },
  { value: "inventory.manage", label: "Ajustar e auditar estoque" },
  { value: "marketing.manage", label: "Publicar campanhas e conteúdo" },
  { value: "settings.manage", label: "Alterar configurações da loja" },
  { value: "reports.view", label: "Visualizar relatórios financeiros" },
  { value: "audit.view", label: "Consultar trilha de auditoria" },
  { value: "backups.manage", label: "Criar e restaurar backups" },
  { value: "team.manage", label: "Gerenciar acessos da equipe" },
  { value: "security.manage", label: "Administrar segurança e aprovações" },
];

const parsePermissionList = (value: unknown): AdminPermission[] => {
  try {
    const parsed = Array.isArray(value)
      ? value
      : JSON.parse(String(value || "[]"));
    return Array.isArray(parsed)
      ? parsed.filter((permission): permission is AdminPermission =>
          PERMISSION_OPTIONS.some((item) => item.value === permission),
        )
      : [];
  } catch {
    return [];
  }
};

function TeamAccessManager({
  rows,
  requireMfa,
  busy,
  save,
}: {
  rows: Record<string, unknown>[];
  requireMfa: boolean;
  busy: boolean;
  save: (value: Record<string, unknown>) => Promise<boolean>;
}) {
  const [editor, setEditor] = useState<Record<string, unknown> | null>(null);
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const editorOpen = Boolean(editor);
  useEffect(() => {
    if (!editorOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditor(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [editorOpen]);
  const openEditor = (member?: Record<string, unknown>) => {
    setMfaSetup(null);
    setMfaError("");
    setEditor(
      member
        ? {
            ...member,
            permissions: parsePermissionList(member.permissions_json),
            mfaRequired: requireMfa || Number(member.mfa_required ?? 1) === 1,
            totpEnabled: Number(member.totp_enabled ?? 0) === 1,
            active: Number(member.active ?? 1) === 1,
            password: "",
            totpSecret: "",
          }
        : {
            name: "",
            email: "",
            role: "manager",
            permissions: [],
            mfaRequired: true,
            totpEnabled: false,
            active: true,
            password: "",
            totpSecret: "",
          },
    );
  };
  const generateMfaSetup = async () => {
    const email = String(editor?.email || "").trim();
    if (!email.includes("@")) return;
    setMfaBusy(true);
    setMfaError("");
    try {
      const response = await fetch("/api/admin/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao gerar 2FA");
      setMfaSetup({ secret: result.secret, qrDataUrl: result.qrDataUrl });
      setEditor((current) =>
        current
          ? { ...current, mfaRequired: true, totpSecret: result.secret }
          : current,
      );
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : "Falha ao gerar 2FA");
    } finally {
      setMfaBusy(false);
    }
  };
  return (
    <section className="admin-section-stack">
      <AdminSectionHeader
        eyebrow="ACESSO POR NÍVEL"
        title="Equipe e permissões"
        description="Combine um perfil-base com acessos adicionais para cada função da loja."
        icon="team"
        count={`${rows.filter((row) => Number(row.active) === 1).length} acessos ativos`}
      >
        <button type="button" onClick={() => openEditor()}>
          <AdminIcon name="plus" size={16} /> Novo acesso
        </button>
      </AdminSectionHeader>
      <div className="team-access-grid">
        {rows.length ? (
          rows.map((member) => {
            const role = STAFF_ROLES.find(
              (item) => item.value === String(member.role),
            );
            const permissions = parsePermissionList(member.permissions_json);
            return (
              <article key={String(member.id)}>
                <header>
                  <span>{String(member.name || member.email).slice(0, 1).toUpperCase()}</span>
                  <div>
                    <b>{String(member.name || "Sem nome")}</b>
                    <small>{String(member.email)}</small>
                  </div>
                  <i className={Number(member.active) === 1 ? "active" : ""}>
                    {Number(member.active) === 1 ? "Ativo" : "Inativo"}
                  </i>
                </header>
                <div className="team-role-line">
                  <strong>{role?.label || String(member.role)}</strong>
                  <span>
                    {requireMfa || Number(member.mfa_required ?? 1) === 1
                      ? Number(member.totp_enabled ?? 0) === 1
                        ? "2FA ativo"
                        : "2FA pendente"
                      : "2FA opcional"}
                  </span>
                </div>
                <p>{role?.description || "Perfil personalizado da equipe."}</p>
                <footer>
                  <small>
                    {permissions.length
                      ? `+ ${permissions.length} permissões adicionais`
                      : "Permissões padrão do perfil"}
                  </small>
                  <button type="button" onClick={() => openEditor(member)}>
                    Editar acesso
                  </button>
                </footer>
              </article>
            );
          })
        ) : (
          <div className="blank-state">Nenhum acesso adicional cadastrado.</div>
        )}
      </div>
      {editor && typeof document !== "undefined"
        ? createPortal(
        <div
          className="access-editor-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="access-editor-title"
        >
          <button
            type="button"
            className="editor-backdrop"
            onClick={() => setEditor(null)}
            aria-label="Fechar editor de acesso"
          />
          <form
            className="access-editor"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await save(editor)) setEditor(null);
            }}
          >
            <header>
              <div>
                <span>CONTROLE DE ACESSO</span>
                <h2 id="access-editor-title">
                  {editor.id ? "Editar membro" : "Novo membro"}
                </h2>
              </div>
              <button type="button" onClick={() => setEditor(null)}>
                ×
              </button>
            </header>
            <div className="access-editor-grid">
              <label>
                Nome
                <input
                  required
                  value={String(editor.name || "")}
                  onChange={(event) =>
                    setEditor({ ...editor, name: event.target.value })
                  }
                />
              </label>
              <label>
                E-mail de acesso
                <input
                  required
                  type="email"
                  value={String(editor.email || "")}
                  onChange={(event) =>
                    setEditor({ ...editor, email: event.target.value })
                  }
                />
              </label>
              <label className="full">
                {editor.id ? "Nova senha (opcional)" : "Senha inicial"}
                <input
                  type="password"
                  minLength={12}
                  required={!editor.id}
                  autoComplete="new-password"
                  value={String(editor.password || "")}
                  onChange={(event) =>
                    setEditor({ ...editor, password: event.target.value })
                  }
                  placeholder={editor.id ? "Deixe em branco para manter a senha atual" : "Mínimo de 12 caracteres"}
                />
                <small>Use maiúsculas, minúsculas e números. Cada membro entra com a própria senha.</small>
              </label>
              <label className="full">
                Perfil-base
                <select
                  value={String(editor.role || "manager")}
                  onChange={(event) =>
                    setEditor({ ...editor, role: event.target.value })
                  }
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} — {role.description}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset className="permission-fieldset">
              <legend>Permissões adicionais</legend>
              <p>
                O perfil-base já concede o necessário para a função. Marque
                apenas responsabilidades extras.
              </p>
              <div>
                {PERMISSION_OPTIONS.map((permission) => {
                  const selected = parsePermissionList(editor.permissions);
                  return (
                    <label key={permission.value}>
                      <input
                        type="checkbox"
                        checked={selected.includes(permission.value)}
                        onChange={(event) =>
                          setEditor({
                            ...editor,
                            permissions: event.target.checked
                              ? [...selected, permission.value]
                              : selected.filter(
                                  (item) => item !== permission.value,
                                ),
                          })
                        }
                      />
                      <span>{permission.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="access-policy-row">
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(editor.mfaRequired)}
                  disabled={requireMfa}
                  onChange={(event) =>
                    setEditor({ ...editor, mfaRequired: event.target.checked })
                  }
                />
                <span>
                  <b>Exigir 2FA na conta</b>
                  <small>{requireMfa ? "Obrigatório pela política global de segurança." : "Validação TOTP real no login administrativo."}</small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(editor.active)}
                  onChange={(event) =>
                    setEditor({ ...editor, active: event.target.checked })
                  }
                />
                <span>
                  <b>Acesso ativo</b>
                  <small>Desative para bloquear o painel imediatamente.</small>
                </span>
              </label>
            </div>
            {Boolean(editor.mfaRequired) && (
              <div className="mfa-setup-box">
                <div>
                  <b>Autenticador em duas etapas</b>
                  <small>
                    {Boolean(editor.totpEnabled) && !mfaSetup
                      ? "Este acesso já possui 2FA configurado. Gere uma nova chave somente para substituir a atual."
                      : "Gere a chave, escaneie o QR Code no aplicativo autenticador e salve o acesso."}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={generateMfaSetup}
                  disabled={mfaBusy || !String(editor.email || "").includes("@")}
                >
                  {mfaBusy
                    ? "Gerando..."
                    : Boolean(editor.totpEnabled)
                      ? "Regenerar 2FA"
                      : "Gerar 2FA"}
                </button>
                {mfaError && <p className="mfa-setup-error">{mfaError}</p>}
                {mfaSetup && (
                  <div className="mfa-setup-result">
                    <Image
                      src={mfaSetup.qrDataUrl}
                      alt="QR Code para configurar o autenticador"
                      width={190}
                      height={190}
                      unoptimized
                    />
                    <div>
                      <span>Chave manual</span>
                      <code>{mfaSetup.secret}</code>
                      <small>Guarde esta chave em local seguro. Ela não será exibida novamente depois de salvar.</small>
                    </div>
                  </div>
                )}
              </div>
            )}
            <footer>
              <button type="button" onClick={() => setEditor(null)}>
                Cancelar
              </button>
              <button className="save" disabled={busy}>
                {busy ? "Salvando..." : "Salvar acesso"}
              </button>
            </footer>
          </form>
        </div>,
        document.body,
      )
        : null}
    </section>
  );
}

function SecurityCenter({
  settings,
  devices,
  currentEmail,
  busy,
  save,
  forget,
}: {
  settings: AdminData["securitySettings"];
  devices: Record<string, unknown>[];
  currentEmail: string;
  busy: boolean;
  save: (value: Record<string, unknown>) => Promise<boolean>;
  forget: (id: string) => Promise<boolean>;
}) {
  const [policy, setPolicy] = useState(settings);
  const policyItems: {
    key: "requireMfa" | "requireOwnerApproval" | "newDeviceAlerts";
    title: string;
    text: string;
  }[] = [
    {
      key: "requireMfa",
      title: "2FA obrigatório",
      text: "Formaliza o segundo fator como requisito para toda a equipe.",
    },
    {
      key: "requireOwnerApproval",
      title: "Dupla aprovação",
      text: "Protege alterações em massa e configurações sensíveis.",
    },
    {
      key: "newDeviceAlerts",
      title: "Alerta de novo dispositivo",
      text: "Destaca acessos recentes na central de operações.",
    },
  ];
  return (
    <section className="admin-section-stack">
      <div className={`owner-mfa-status ${settings.ownerMfaEnabled ? "active" : "warning"}`}>
        <AdminIcon name="security" size={20} />
        <div>
          <b>{settings.ownerMfaEnabled ? "2FA do proprietário ativo" : "2FA do proprietário ainda não ativado"}</b>
          <small>{settings.ownerMfaEnabled ? "A conta proprietária exige código TOTP no login." : "Defina ADMIN_TOTP_SECRET na hospedagem para proteger também a conta proprietária."}</small>
        </div>
      </div>
      <AdminSectionHeader
        eyebrow="PROTEÇÃO EM CAMADAS"
        title="Central de segurança"
        description="Políticas administrativas, identidade e atividade de dispositivos em um só lugar."
        icon="security"
        count={`${devices.length} dispositivos registrados`}
      />
      <div className="security-score-card">
        <div>
          <span>POSTURA DE SEGURANÇA</span>
          <strong>
            {[policy.requireMfa, policy.requireOwnerApproval, policy.newDeviceAlerts].filter(Boolean).length}/3
          </strong>
          <b>proteções ativas</b>
        </div>
        <p>
          O login local usa credenciais individuais e o 2FA TOTP é validado no
          servidor da loja. Permissões e ações sensíveis continuam protegidas
          por função e trilha de auditoria.
        </p>
        <i>
          <AdminIcon name="lock" size={24} />
        </i>
      </div>
      <div className="security-policy-grid">
        {policyItems.map((item) => (
          <label key={item.key} className={policy[item.key] ? "active" : ""}>
            <span>
              <AdminIcon name={item.key === "requireMfa" ? "lock" : item.key === "requireOwnerApproval" ? "approvals" : "notifications"} size={19} />
            </span>
            <div>
              <b>{item.title}</b>
              <small>{item.text}</small>
            </div>
            <input
              type="checkbox"
              checked={policy[item.key]}
              onChange={(event) =>
                setPolicy({ ...policy, [item.key]: event.target.checked })
              }
            />
          </label>
        ))}
      </div>
      <div className="security-save-row">
        <small>
          Última revisão: {policy.updatedAt ? new Date(policy.updatedAt).toLocaleString("pt-BR") : "agora"}
        </small>
        <button
          type="button"
          className="save-settings"
          disabled={busy}
          onClick={() => save(policy)}
        >
          {busy ? "Salvando..." : "Salvar políticas"}
        </button>
      </div>
      <section className="device-list-card">
        <header>
          <div>
            <span>ATIVIDADE DE ACESSO</span>
            <h3>Dispositivos administrativos</h3>
          </div>
          <small>Sessões administrativas registradas pelo painel</small>
        </header>
        <div>
          {devices.length ? (
            devices.map((device) => {
              const isCurrent =
                String(device.actor_email).toLowerCase() ===
                currentEmail.toLowerCase();
              return (
                <article key={String(device.id)}>
                  <i>
                    <AdminIcon name="dashboard" size={18} />
                  </i>
                  <div>
                    <b>{String(device.label)}</b>
                    <small>
                      {String(device.actor_email)} · visto em{" "}
                      {new Date(String(device.last_seen_at)).toLocaleString("pt-BR")}
                    </small>
                  </div>
                  {isCurrent ? <span>Seu acesso</span> : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => forget(String(device.id))}
                  >
                    Esquecer registro
                  </button>
                </article>
              );
            })
          ) : (
            <div className="blank-state">Nenhum dispositivo registrado.</div>
          )}
        </div>
      </section>
    </section>
  );
}

function ApprovalsCenter({
  rows,
  owner,
  currentEmail,
  busy,
  decide,
  execute,
}: {
  rows: Record<string, unknown>[];
  owner: boolean;
  currentEmail: string;
  busy: boolean;
  decide: (id: string, status: "approved" | "rejected") => Promise<boolean>;
  execute: (row: Record<string, unknown>) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState("pending");
  const visible = rows.filter(
    (row) => filter === "all" || String(row.status) === filter,
  );
  const statusLabel: Record<string, string> = {
    pending: "Aguardando",
    approved: "Aprovada",
    rejected: "Recusada",
    executed: "Executada",
  };
  return (
    <section className="admin-section-stack">
      <AdminSectionHeader
        eyebrow="DUPLO CONTROLE"
        title="Aprovações de alto impacto"
        description="Alterações sensíveis só avançam após revisão do proprietário."
        icon="approvals"
        count={`${rows.filter((row) => String(row.status) === "pending").length} pendentes`}
      />
      <div className="approval-filter">
        {[
          ["pending", "Pendentes"],
          ["approved", "Aprovadas"],
          ["executed", "Executadas"],
          ["rejected", "Recusadas"],
          ["all", "Todas"],
        ].map(([value, label]) => (
          <button
            type="button"
            className={filter === value ? "active" : ""}
            key={value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="approval-list">
        {visible.length ? (
          visible.map((row) => {
            const status = String(row.status);
            const isRequester =
              String(row.requested_by).toLowerCase() ===
              currentEmail.toLowerCase();
            return (
              <article key={String(row.id)} className={`status-${status}`}>
                <i>
                  <AdminIcon name="approvals" size={20} />
                </i>
                <div className="approval-copy">
                  <header>
                    <span>{statusLabel[status] || status}</span>
                    <small>
                      {new Date(String(row.created_at)).toLocaleString("pt-BR")}
                    </small>
                  </header>
                  <h3>{String(row.summary || row.action)}</h3>
                  <p>
                    Solicitado por <b>{String(row.requested_by)}</b> · expira em{" "}
                    {new Date(String(row.expires_at)).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="approval-actions">
                  {owner && status === "pending" ? (
                    <>
                      <button
                        type="button"
                        className="reject"
                        disabled={busy}
                        onClick={() => decide(String(row.id), "rejected")}
                      >
                        Recusar
                      </button>
                      <button
                        type="button"
                        className="approve"
                        disabled={busy}
                        onClick={() => decide(String(row.id), "approved")}
                      >
                        Aprovar
                      </button>
                    </>
                  ) : null}
                  {isRequester && status === "approved" ? (
                    <button
                      type="button"
                      className="execute"
                      disabled={busy}
                      onClick={() => execute(row)}
                    >
                      Executar agora
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="blank-state">Nenhuma solicitação nesta situação.</div>
        )}
      </div>
    </section>
  );
}

function BackupsCenter({
  rows,
  busy,
  create,
  restore,
}: {
  rows: AdminData["backups"];
  busy: boolean;
  create: () => Promise<boolean>;
  restore: (key: string) => Promise<boolean>;
}) {
  return (
    <section className="admin-section-stack">
      <AdminSectionHeader
        eyebrow="CONTINUIDADE DA OPERAÇÃO"
        title="Backups e restauração"
        description="Crie pontos de recuperação e reverta preços, estoque e dados dos produtos."
        icon="backups"
        count={`${rows.length} cópias disponíveis`}
      >
        <button type="button" disabled={busy} onClick={create}>
          <AdminIcon name="plus" size={16} /> Criar backup agora
        </button>
      </AdminSectionHeader>
      <div className="backup-notice">
        <AdminIcon name="lock" size={19} />
        <div>
          <b>Restauração protegida</b>
          <p>
            Antes de restaurar uma versão, o sistema cria automaticamente uma
            cópia de segurança do estado atual.
          </p>
        </div>
      </div>
      <div className="backup-timeline">
        {rows.length ? (
          rows.map((backup, index) => (
            <article key={backup.key}>
              <div className="backup-marker">
                <span>{index === 0 ? "ATUAL" : index + 1}</span>
              </div>
              <div className="backup-copy">
                <header>
                  <h3>
                    {backup.uploadedAt
                      ? new Date(backup.uploadedAt).toLocaleString("pt-BR")
                      : backup.key.replace("backups/", "")}
                  </h3>
                  <span>{(backup.size / 1024).toFixed(1)} KB</span>
                </header>
                <p>{backup.reason}</p>
                <small>
                  Criado por {backup.actorEmail} · {backup.key}
                </small>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Restaurar este catálogo? Uma cópia do estado atual será criada antes da alteração.",
                    )
                  )
                    void restore(backup.key);
                }}
              >
                Restaurar catálogo
              </button>
            </article>
          ))
        ) : (
          <div className="blank-state">
            Crie o primeiro ponto de recuperação do catálogo.
          </div>
        )}
      </div>
    </section>
  );
}

function Audit({ rows }: { rows: Record<string, unknown>[] }) {
  const [search, setSearch] = useState(""),
    [actionFilter, setActionFilter] = useState("all");
  const actions = useMemo(
    () => Array.from(new Set(rows.map((row) => String(row.action)))).sort(),
    [rows],
  );
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (actionFilter !== "all" && String(row.action) !== actionFilter)
        return false;
      if (!normalized) return true;
      return [
        row.action,
        row.entity,
        row.entity_id,
        row.actor_email,
        row.details,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [actionFilter, rows, search]);
  const exportAudit = () => {
    const lines = filtered.map((row) =>
      [
        row.created_at,
        row.actor_email,
        row.action,
        row.entity,
        row.entity_id,
        row.details,
      ]
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob(
      [
        [
          "data",
          "responsavel",
          "acao",
          "entidade",
          "identificador",
          "detalhes",
        ].join(",") + `\n${lines.join("\n")}`,
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `auditoria-central-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="admin-section-stack">
      <AdminSectionHeader
        eyebrow="SEGURANÇA E RASTREABILIDADE"
        title="Histórico de alterações"
        description="Consulte quem realizou cada ação e quando ela aconteceu."
        icon="audit"
        count={`${filtered.length} de ${rows.length} eventos`}
      />
      <div className="audit-toolbar">
        <label>
          <AdminIcon name="search" size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar responsável, ação ou item"
          />
        </label>
        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          aria-label="Filtrar por ação"
        >
          <option value="all">Todas as ações</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <button type="button" onClick={exportAudit} disabled={!filtered.length}>
          Exportar CSV
        </button>
      </div>
      <div className="audit-list">
        {filtered.length ? (
          filtered.map((r) => (
            <article key={String(r.id)}>
              <span>
                <AdminIcon name="audit" size={15} />
              </span>
              <div>
                <b>
                  {String(r.action)} · {String(r.entity)}
                </b>
                <small>
                  {String(r.actor_email)} ·{" "}
                  {new Date(String(r.created_at)).toLocaleString("pt-BR")}
                </small>
              </div>
              <div className="audit-meta">
                <code>{String(r.entity_id)}</code>
                <small>{String(r.details || "{}").slice(0, 90)}</small>
              </div>
            </article>
          ))
        ) : (
          <div className="blank-state">
            Nenhum evento corresponde aos filtros escolhidos.
          </div>
        )}
      </div>
    </section>
  );
}
const formatOptionsEditor = (options: ProductOption[] = []) =>
  options
    .map((option) =>
      [
        option.id,
        option.label,
        (option.priceCents / 100).toFixed(2),
        option.oldPriceCents ? (option.oldPriceCents / 100).toFixed(2) : "",
        option.barcode,
      ].join(" | "),
    )
    .join("\n");

const parseOptionsEditor = (value: string): ProductOption[] =>
  value
    .split(/\r?\n/)
    .map((line, index) => {
      const [rawId, rawLabel, rawPrice, rawOldPrice, rawBarcode] = line
        .split("|")
        .map((item) => item.trim());
      const label = rawLabel || rawId;
      const priceCents = Math.round(
        Number(String(rawPrice || "0").replace(",", ".")) * 100,
      );
      if (!label || priceCents <= 0) return null;
      return {
        id:
          rawId
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || `opcao-${index + 1}`,
        label,
        priceCents,
        oldPriceCents: rawOldPrice
          ? Math.round(Number(rawOldPrice.replace(",", ".")) * 100)
          : null,
        barcode: String(rawBarcode || "").replace(/\D/g, ""),
      } satisfies ProductOption;
    })
    .filter((option): option is ProductOption => Boolean(option));

function ProductEditor({
  product,
  categories,
  busy,
  close,
  save,
}: {
  product: Partial<Product>;
  categories: Category[];
  busy: boolean;
  close: () => void;
  save: (p: Partial<Product> & { costCents?: number }) => void;
}) {
  const [p, setP] = useState(product),
    [optionsText, setOptionsText] = useState(
      formatOptionsEditor(product.options),
    ),
    [uploading, setUploading] = useState(false);
  const set = (k: string, v: unknown) => setP((x) => ({ ...x, [k]: v }));
  const upload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await fetch("/api/admin/upload", {
          method: "POST",
          body: form,
        }),
        j = await r.json();
      if (!r.ok) throw new Error(j.error);
      set("imageUrl", j.url);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="editor-overlay">
      <button className="editor-backdrop" onClick={close} />
      <form
        className="product-editor"
        onSubmit={(e) => {
          e.preventDefault();
          save({ ...p, options: parseOptionsEditor(optionsText) });
        }}
      >
        <header>
          <div>
            <span>CATÁLOGO</span>
            <h2>{p.id ? "Editar produto" : "Novo produto"}</h2>
          </div>
          <button type="button" onClick={close}>
            ×
          </button>
        </header>
        <div className="product-editor-grid">
          <label>
            Nome
            <input
              required
              value={p.name || ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>
          <label>
            SKU
            <input
              value={p.sku || ""}
              onChange={(e) => set("sku", e.target.value)}
            />
          </label>
          <label>
            Marca
            <input
              value={p.brand || ""}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="Marca do produto"
            />
          </label>
          <label>
            Categoria
            <select
              required
              value={p.categoryId || ""}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              <option value="">Selecione</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unidade
            <input
              required
              value={p.unit || ""}
              onChange={(e) => set("unit", e.target.value)}
            />
          </label>
          <label>
            Forma de venda
            <select
              value={p.saleMode || "unit"}
              onChange={(e) => set("saleMode", e.target.value)}
            >
              <option value="unit">Por unidade</option>
              <option value="weight">Por peso (kg)</option>
            </select>
          </label>
          <label>
            Passo de quantidade
            <input
              type="number"
              min="0.05"
              step="0.05"
              value={p.quantityStep || 1}
              onChange={(e) => set("quantityStep", Number(e.target.value))}
            />
          </label>
          <label>
            Quantidade mínima
            <input
              type="number"
              min="0.05"
              step="0.05"
              value={p.minimumQuantity || 1}
              onChange={(e) => set("minimumQuantity", Number(e.target.value))}
            />
          </label>
          <label>
            Preço (R$)
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={(p.priceCents || 0) / 100}
              onChange={(e) =>
                set("priceCents", Math.round(Number(e.target.value) * 100))
              }
            />
          </label>
          <label>
            Preço anterior (R$)
            <input
              type="number"
              step="0.01"
              value={(p.oldPriceCents || 0) / 100}
              onChange={(e) =>
                set(
                  "oldPriceCents",
                  e.target.value
                    ? Math.round(Number(e.target.value) * 100)
                    : null,
                )
              }
            />
          </label>
          <label>
            Custo do produto (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              value={(p.costCents || 0) / 100}
              onChange={(e) =>
                set("costCents", Math.round(Number(e.target.value) * 100))
              }
            />
          </label>
          <label>
            Estoque
            <input
              type="number"
              min="0"
              step={p.saleMode === "weight" ? "0.01" : "1"}
              value={p.stockQuantity || 0}
              onChange={(e) => set("stockQuantity", Number(e.target.value))}
            />
          </label>
          <label>
            Estoque mínimo
            <input
              type="number"
              min="0"
              step={p.saleMode === "weight" ? "0.01" : "1"}
              value={p.minStock || 5}
              onChange={(e) => set("minStock", Number(e.target.value))}
            />
          </label>
          <label>
            Selo
            <input
              value={p.badge || ""}
              onChange={(e) => set("badge", e.target.value)}
              placeholder="Oferta"
            />
          </label>
          <label>
            Código de barras
            <input
              value={p.barcode || ""}
              onChange={(e) => set("barcode", e.target.value)}
            />
          </label>
          <label>
            Início da oferta
            <input
              type="datetime-local"
              value={p.offerStart ? p.offerStart.slice(0, 16) : ""}
              onChange={(e) =>
                set(
                  "offerStart",
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                )
              }
            />
          </label>
          <label>
            Fim da oferta
            <input
              type="datetime-local"
              value={p.offerEnd ? p.offerEnd.slice(0, 16) : ""}
              onChange={(e) =>
                set(
                  "offerEnd",
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                )
              }
            />
          </label>
          <label className="full">
            Descrição
            <textarea
              value={p.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <label className="full product-options-editor">
            Variações de embalagem e tamanho
            <textarea
              value={optionsText}
              onChange={(event) => setOptionsText(event.target.value)}
              placeholder={"id | Nome da opção | Preço | Preço anterior | Código de barras\n1l | Caixa 1L | 5,49 | 5,99 | 7890000000000"}
            />
            <small>
              Uma opção por linha. Deixe vazio quando o produto não tiver
              variações.
            </small>
          </label>
          <label className="full">
            URL da imagem
            <input
              required
              value={p.imageUrl || ""}
              onChange={(e) => set("imageUrl", e.target.value)}
            />
          </label>
          <label className="upload full">
            Ou envie uma imagem
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <small>
              {uploading
                ? "Enviando..."
                : "PNG, JPG, WEBP ou AVIF · máximo 6 MB"}
            </small>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={p.active ?? true}
              onChange={(e) => set("active", e.target.checked)}
            />{" "}
            Produto ativo
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={p.featured ?? false}
              onChange={(e) => set("featured", e.target.checked)}
            />{" "}
            Produto em destaque
          </label>
        </div>
        {p.imageUrl && (
          <div className="editor-preview">
            <Image
              src={p.imageUrl}
              alt="Prévia"
              width={90}
              height={90}
              unoptimized
            />
          </div>
        )}
        <footer>
          <button type="button" onClick={close}>
            Cancelar
          </button>
          <button className="save" disabled={busy || uploading}>
            {busy ? "Salvando..." : "Salvar produto"}
          </button>
        </footer>
      </form>
    </div>
  );
}
