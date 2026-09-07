"use client";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Fragment,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  LazyMotion,
  m,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import type {
  Banner,
  CatalogPayload,
  Cart,
  CartOptions,
  CheckoutCustomer,
  DeliveryZone,
  HomeContent,
  ItemSubstitution,
  ItemSubstitutions,
  OrderHistoryEntry,
  Product,
  PublicReview,
  ShoppingList,
} from "@/lib/store-types";
import { money } from "@/lib/default-data";
import {
  changeProductQuantity,
  formatQuantity,
  optionSummary,
  productOldPrice,
  productPrice,
  productSearchScore,
  selectedOption,
} from "@/lib/commerce";
const loadMotionFeatures = () =>
  import("@/components/motion-features").then((module) => module.default);
const PixQr = dynamic(() => import("@/components/pix-qr"), { ssr: false });

type OrderSuccess = {
  orderNumber: string;
  trackingToken: string;
  trackingUrl: string;
  totalCents: number;
  pointsEarned: number;
  pointsBalance: number;
  referralCode: string;
  pixPayload: string;
  whatsapp: string;
};
type IconName =
  | "home"
  | "grid"
  | "search"
  | "cart"
  | "menu"
  | "plus"
  | "minus"
  | "close"
  | "arrow"
  | "whatsapp"
  | "truck"
  | "shield"
  | "clock"
  | "pin"
  | "heart"
  | "share"
  | "bell"
  | "star"
  | "spark"
  | "user"
  | "coupon";
function Icon({
  name,
  size = 22,
  fill = "none",
}: {
  name: IconName;
  size?: number;
  fill?: string;
}) {
  const p: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    whatsapp: (
      <>
        <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.2A8.5 8.5 0 1 1 21 11.5Z" />
        <path d="M8.2 8.5c.6 2.7 2.6 4.7 5.3 5.3l1.5-1.5" />
      </>
    ),
    truck: (
      <>
        <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    shield: (
      <path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Zm-3 9 2 2 4-4" />
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    star: (
      <path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8l3-6Z" />
    ),
    spark: (
      <path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Zm14-1 .8 2.2 2.2.8-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    coupon: (
      <>
        <path d="M3 8a2 2 0 0 0 0 4v5h18v-5a2 2 0 0 0 0-4V3H3v5Z" />
        <path d="M13 6h.01M11 14h.01M15 10l-4 4" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {p[name]}
    </svg>
  );
}
function CheckoutJourney({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div className="checkout-journey" aria-label={`Etapa ${active} de 3`}>
      {[
        [1, "Carrinho"],
        [2, "Entrega"],
        [3, "WhatsApp"],
      ].map(([step, label]) => (
        <span
          key={label}
          className={
            Number(step) < active
              ? "active complete"
              : Number(step) === active
                ? "active current"
                : ""
          }
          aria-current={Number(step) === active ? "step" : undefined}
        >
          <b>{step}</b>
          <small>{label}</small>
        </span>
      ))}
    </div>
  );
}
const emptyCustomer: CheckoutCustomer = {
  name: "",
  phone: "",
  deliveryType: "delivery",
  postalCode: "",
  city: "",
  state: "",
  address: "",
  neighborhood: "",
  reference: "",
  paymentMethod: "PIX",
  changeFor: "",
  scheduledFor: "Assim que possível",
  notes: "",
  substitution: "Confirmar antes de substituir",
  couponCode: "",
  referralCode: "",
};
const STORAGE = {
  cart: "sc-central-cart:v3",
  options: "sc-cart-options:v1",
  substitutions: "sc-item-substitutions:v1",
  favorites: "sc-favorites:v2",
  recent: "sc-recent:v2",
  listOwner: "sc-list-owner:v1",
} as const;
const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
const getSession = () => {
  try {
    let id = localStorage.getItem("sc-session");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("sc-session", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
};
const launchProductFlight = (
  source: HTMLElement,
  productName: string,
) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const sourceImage = source
    .closest(".product-card")
    ?.querySelector("img") as HTMLImageElement | null;
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>("[data-cart-target]"),
  );
  const visibleTargets = targets.filter((item) => item.offsetParent !== null);
  const target =
    (window.innerWidth <= 640
      ? visibleTargets[visibleTargets.length - 1]
      : visibleTargets[0]) || targets[0];
  if (!sourceImage || !target) return;
  const from = sourceImage.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const flyer = sourceImage.cloneNode(true) as HTMLImageElement;
  flyer.alt = "";
  flyer.setAttribute("aria-hidden", "true");
  flyer.title = `${productName} adicionado ao carrinho`;
  Object.assign(flyer.style, {
    position: "fixed",
    left: `${from.left + from.width / 2 - 35}px`,
    top: `${from.top + from.height / 2 - 35}px`,
    width: "70px",
    height: "70px",
    objectFit: "cover",
    borderRadius: "18px",
    border: "3px solid #fff",
    boxShadow: "0 18px 45px rgba(7, 53, 143, .3)",
    pointerEvents: "none",
    zIndex: "240",
  });
  document.body.appendChild(flyer);
  const animation = flyer.animate(
    [
      { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
      { transform: "translate3d(0,-45px,0) scale(1.08)", opacity: 1, offset: 0.28 },
      {
        transform: `translate3d(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px, 0) scale(.18) rotate(14deg)`,
        opacity: 0.2,
      },
    ],
    { duration: 780, easing: "cubic-bezier(.16,1,.3,1)" },
  );
  animation.onfinish = () => flyer.remove();
  animation.oncancel = () => flyer.remove();
};
export default function Storefront({
  initialCatalog,
}: {
  initialCatalog: CatalogPayload;
}) {
  const [catalog, setCatalog] = useState(initialCatalog),
    [cart, setCart] = useState<Cart>({}),
    [cartOptions, setCartOptions] = useState<CartOptions>({}),
    [itemSubstitutions, setItemSubstitutions] =
      useState<ItemSubstitutions>({}),
    [favorites, setFavorites] = useState<string[]>([]),
    [recent, setRecent] = useState<string[]>([]),
    [cartOpen, setCartOpen] = useState(false),
    [checkoutOpen, setCheckoutOpen] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [category, setCategory] = useState("Todos"),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("featured"),
    [toast, setToast] = useState(""),
    [customer, setCustomer] = useState(emptyCustomer),
    [submitting, setSubmitting] = useState(false),
    [checkoutError, setCheckoutError] = useState(""),
    [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null),
    [installPrompt, setInstallPrompt] = useState<Event | null>(null),
    [selected, setSelected] = useState<Product | null>(null),
    [showFavorites, setShowFavorites] = useState(false),
    [lastOrder, setLastOrder] = useState<{
      orderNumber: string;
      cart: Cart;
      options?: CartOptions;
      substitutions?: ItemSubstitutions;
    } | null>(null),
    [savedLists, setSavedLists] = useState<ShoppingList[]>([]),
    [listOwnerToken, setListOwnerToken] = useState(""),
    [listName, setListName] = useState("Compra do mês"),
    [listsOpen, setListsOpen] = useState(false),
    [listsBusy, setListsBusy] = useState(false),
    [reviews, setReviews] = useState<PublicReview[]>([]),
    [showRecovery, setShowRecovery] = useState(false),
    [loaded, setLoaded] = useState(false),
    [headerCompact, setHeaderCompact] = useState(false),
    [activeSection, setActiveSection] = useState("inicio"),
    [storeOpen, setStoreOpen] = useState<boolean | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderRequestKey = useRef("");
  const catalogSearchRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 30,
    mass: 0.35,
  });
  const notify = (message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2500);
  };
  const loadSavedLists = async (ownerToken: string) => {
    try {
      const response = await fetch(
        `/api/lists?token=${encodeURIComponent(ownerToken)}`,
      );
      const rows = await response.json();
      if (response.ok && Array.isArray(rows)) setSavedLists(rows);
    } catch {}
  };
  const goToCatalog = (nextCategory = "Todos", focusSearch = false) => {
    setCategory(nextCategory);
    setShowFavorites(false);
    setMenuOpen(false);
    document.getElementById("ofertas")?.scrollIntoView({ behavior: "smooth" });
    if (focusSearch)
      window.setTimeout(() => catalogSearchRef.current?.focus(), 520);
  };
  const track = (event: string, productId?: string, metadata: unknown = {}) => {
    try {
      fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          productId,
          sessionKey: getSession(),
          metadata,
        }),
        keepalive: true,
      });
    } catch {}
  };
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const legacyCart = readStorage<Cart>("sc-central-cart", {});
        const savedCart = readStorage<Cart>(STORAGE.cart, legacyCart);
        setCart(savedCart);
        setCartOptions(readStorage<CartOptions>(STORAGE.options, {}));
        setItemSubstitutions(
          readStorage<ItemSubstitutions>(STORAGE.substitutions, {}),
        );
        setFavorites(
          readStorage<string[]>(
            STORAGE.favorites,
            readStorage<string[]>("sc-favorites", []),
          ),
        );
        setRecent(
          readStorage<string[]>(
            STORAGE.recent,
            readStorage<string[]>("sc-recent", []),
          ),
        );
        setLastOrder(
          readStorage("sc-last-order", null),
        );
        let ownerToken = localStorage.getItem(STORAGE.listOwner) || "";
        if (!ownerToken) {
          ownerToken = crypto.randomUUID();
          localStorage.setItem(STORAGE.listOwner, ownerToken);
        }
        setListOwnerToken(ownerToken);
        void loadSavedLists(ownerToken);
        const savedAt = Number(localStorage.getItem("sc-cart-updated-at") || 0);
        if (Object.keys(savedCart).length && savedAt) {
          const hours = Math.max(
            1,
            initialCatalog.settings.abandonedCartHours || 24,
          );
          setShowRecovery(Date.now() - savedAt >= hours * 60 * 60 * 1000);
        }
      } catch {}
      setLoaded(true);
    });
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        if (data.products?.length) {
          setCatalog(data);
          const previous = localStorage.getItem("sc-last-announcement");
          if (
            previous &&
            previous !== data.settings?.announcement &&
            "Notification" in window &&
            Notification.permission === "granted"
          )
            new Notification("Nova oferta no Supermercado Central", {
              body: data.settings.announcement,
              icon: "/assets/logo-central-vertical.png",
            });
          if (data.settings?.announcement)
            localStorage.setItem(
              "sc-last-announcement",
              data.settings.announcement,
            );
        }
      })
      .catch(() => {});
    fetch("/api/reviews")
      .then((response) => response.json())
      .then((items) => Array.isArray(items) && setReviews(items))
      .catch(() => {});
    fetch("/api/notifications")
      .then((response) => response.json())
      .then((campaigns) => {
        const latest = Array.isArray(campaigns) ? campaigns[0] : null;
        if (!latest || !("Notification" in window)) return;
        const seen = localStorage.getItem("sc-last-campaign:v1");
        if (seen === latest.id || Notification.permission !== "granted") return;
        navigator.serviceWorker?.ready
          .then((registration) =>
            registration.showNotification(latest.title, {
              body: latest.body,
              icon: "/assets/logo-central-vertical.png",
              badge: "/assets/logo-central-vertical.png",
              data: { url: latest.url || "/#ofertas" },
            }),
          )
          .then(() => localStorage.setItem("sc-last-campaign:v1", latest.id))
          .catch(() => {});
      })
      .catch(() => {});
    track("page_view");
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
    const revealItems = document.querySelectorAll(
      ".departments,.combo-banner,.section-heading,.product-card,.recent-section,.whatsapp-section",
    );
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -35px" },
    );
    revealItems.forEach((item) => {
      item.classList.add("reveal-target");
      observer.observe(item);
    });
    const install = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", install);
    return () => {
      window.removeEventListener("beforeinstallprompt", install);
      observer.disconnect();
    };
  }, [initialCatalog.settings.abandonedCartHours]);
  useEffect(() => {
    const updateStoreStatus = () => {
      const parts = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Maceio",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(new Date());
      const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
      const minute = Number(
        parts.find((part) => part.type === "minute")?.value || 0,
      );
      const currentMinutes = hour * 60 + minute;
      setStoreOpen(currentMinutes >= 7 * 60 + 30 && currentMinutes < 21 * 60);
    };
    let frame = 0;
    const updateScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setHeaderCompact(window.scrollY > 72);
        const sections = ["inicio", "setores", "ofertas", "descobrir", "loja"];
        let current = "inicio";
        sections.forEach((id) => {
          const element = document.getElementById(id);
          if (element && element.getBoundingClientRect().top <= 170) current = id;
        });
        setActiveSection(current);
      });
    };
    updateStoreStatus();
    updateScroll();
    const statusTimer = window.setInterval(updateStoreStatus, 60_000);
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      window.clearInterval(statusTimer);
      window.removeEventListener("scroll", updateScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    if (loaded) {
      writeStorage(STORAGE.cart, cart);
      localStorage.setItem("sc-cart-updated-at", String(new Date().getTime()));
    }
  }, [cart, loaded]);
  useEffect(() => {
    if (loaded) writeStorage(STORAGE.options, cartOptions);
  }, [cartOptions, loaded]);
  useEffect(() => {
    if (loaded) writeStorage(STORAGE.substitutions, itemSubstitutions);
  }, [itemSubstitutions, loaded]);
  useEffect(() => {
    if (loaded) writeStorage(STORAGE.favorites, favorites);
  }, [favorites, loaded]);
  useEffect(() => {
    if (loaded) writeStorage(STORAGE.recent, recent);
  }, [recent, loaded]);
  const deferredQuery = useDeferredValue(query);
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const productMap = useMemo(
    () => new Map(catalog.products.map((product) => [product.id, product])),
    [catalog.products],
  );
  const comboProducts = useMemo(() => {
    const preferredNames = ["arroz", "feij", "caf"];
    const chosen = preferredNames
      .map((name) =>
        catalog.products.find((product) =>
          product.name.toLowerCase().includes(name),
        ),
      )
      .filter((product): product is Product => Boolean(product));
    const candidates = [
      ...chosen,
      ...catalog.products.filter(
        (product) =>
          product.featured && !chosen.some((item) => item.id === product.id),
      ),
      ...catalog.products.filter(
        (product) => !chosen.some((item) => item.id === product.id),
      ),
    ];
    return [
      ...new Map(candidates.map((product) => [product.id, product])).values(),
    ].slice(0, 3);
  }, [catalog.products]);
  const recommendations = useMemo(() => {
    const signals = [
      ...Object.keys(cart),
      ...recent.slice(0, 5),
      ...favorites.slice(0, 5),
    ]
      .map((id) => productMap.get(id))
      .filter((product): product is Product => Boolean(product));
    const categoryScore = new Map<string, number>();
    signals.forEach((product) =>
      categoryScore.set(
        product.categoryId,
        (categoryScore.get(product.categoryId) || 0) + 1,
      ),
    );
    return catalog.products
      .filter((product) => !cart[product.id])
      .sort(
        (a, b) =>
          (categoryScore.get(b.categoryId) || 0) -
            (categoryScore.get(a.categoryId) || 0) ||
          Number(b.featured) - Number(a.featured),
      )
      .slice(0, 5);
  }, [cart, recent, favorites, catalog.products, productMap]);
  const visible = useMemo(() => {
    const normalizedQuery = deferredQuery.trim();
    return catalog.products
        .map((product) => ({
          product,
          score: productSearchScore(product, normalizedQuery),
        }))
        .filter(({ product: p, score }) => {
          const cat =
            category === "Todos" ||
            (category === "Ofertas"
              ? !!p.oldPriceCents ||
                p.options.some((option) => !!option.oldPriceCents)
              : p.categoryId === category);
          return cat && score > 0 && (!showFavorites || favoriteSet.has(p.id));
        })
        .sort((a, b) =>
          sort === "price-asc"
            ? productPrice(a.product, cartOptions[a.product.id]) -
              productPrice(b.product, cartOptions[b.product.id])
            : sort === "price-desc"
              ? productPrice(b.product, cartOptions[b.product.id]) -
                productPrice(a.product, cartOptions[a.product.id])
              : sort === "name"
                ? a.product.name.localeCompare(b.product.name)
                : normalizedQuery
                  ? b.score - a.score
                  : Number(b.product.featured) - Number(a.product.featured),
        )
        .map(({ product }) => product);
  }, [
      catalog.products,
      category,
      deferredQuery,
      sort,
      showFavorites,
      favoriteSet,
      cartOptions,
    ]);
  const searchSuggestions = useMemo(
    () =>
      deferredQuery.trim().length < 2
        ? []
        : catalog.products
            .map((product) => ({
              product,
              score: productSearchScore(product, deferredQuery),
            }))
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((item) => item.product),
    [catalog.products, deferredQuery],
  );
  const count = Object.values(cart).filter((quantity) => quantity > 0).length,
    subtotal = catalog.products.reduce(
      (s, p) =>
        s +
        Math.round(
          productPrice(p, cartOptions[p.id]) * (cart[p.id] || 0),
        ),
      0,
    ),
    zone = catalog.deliveryZones.find((z) => z.id === customer.neighborhood),
    delivery =
      customer.deliveryType === "delivery" && zone
        ? zone.freeShippingCents > 0 && subtotal >= zone.freeShippingCents
          ? 0
          : zone.feeCents
        : 0,
    total = subtotal + delivery,
    minimum = Math.max(
      catalog.settings.minimumOrderCents,
      zone?.minimumOrderCents || 0,
    ),
    progress = Math.min(100, minimum ? (subtotal / minimum) * 100 : 100);
  const change = (id: string, delta: number) => {
    const product = productMap.get(id);
    if (!product) return;
    const nextQuantity = changeProductQuantity(product, cart[id] || 0, delta);
    setCart((c) => {
      const next = { ...c, [id]: nextQuantity };
      if (!nextQuantity) {
        delete next[id];
      }
      return next;
    });
    if (!nextQuantity) {
      setCartOptions((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setItemSubstitutions((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
    track(delta > 0 ? "cart_add" : "cart_remove", id);
  };
  const add = (p: Product) => {
    if (p.options.length && !cartOptions[p.id])
      setCartOptions((current) => ({
        ...current,
        [p.id]: p.options[0].id,
      }));
    if (!itemSubstitutions[p.id])
      setItemSubstitutions((current) => ({
        ...current,
        [p.id]: "confirm",
      }));
    change(p.id, 1);
    notify(`${p.name} foi para o carrinho`);
  };
  const changeOption = (product: Product, optionId: string) => {
    setCartOptions((current) => ({ ...current, [product.id]: optionId }));
    notify(`${product.name}: opção atualizada`);
  };
  const changeSubstitution = (id: string, value: ItemSubstitution) =>
    setItemSubstitutions((current) => ({ ...current, [id]: value }));
  const toggleFavorite = (p: Product) => {
    const adding = !favoriteSet.has(p.id);
    setFavorites((f) =>
      adding ? [...f, p.id] : f.filter((id) => id !== p.id),
    );
    track("favorite", p.id, { adding });
    notify(adding ? "Produto salvo nos favoritos" : "Removido dos favoritos");
  };
  const view = (p: Product) => {
    setSelected(p);
    setRecent((r) => [p.id, ...r.filter((id) => id !== p.id)].slice(0, 8));
    track("product_view", p.id);
  };
  const share = async (p: Product) => {
    const url = `${location.origin}/produto/${p.slug}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: p.name,
          text: `Confira ${p.name} no Supermercado Central`,
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        notify("Link copiado");
      }
      track("share_product", p.id);
    } catch {}
  };
  const install = async () => {
    const prompt = installPrompt as Event & {
      prompt?: () => Promise<void>;
      userChoice?: Promise<{ outcome: string }>;
    };
    if (prompt?.prompt) {
      await prompt.prompt();
      setInstallPrompt(null);
      track("install_pwa");
    } else
      notify("No celular, use “Adicionar à tela inicial” no menu do navegador");
  };
  const enableNotifications = async () => {
    if (!("Notification" in window))
      return notify("Notificações não são compatíveis com este navegador");
    const result = await Notification.requestPermission();
    if (result === "granted") {
      new Notification("Supermercado Central", {
        body: "Pronto! Você poderá acompanhar novas ofertas.",
        icon: "/assets/logo-central-vertical.png",
      });
      track("notification_opt_in");
      notify("Alertas de ofertas ativados");
    } else notify("Permissão de notificações não concedida");
  };
  const combo = () => {
    setCart((current) => {
      const next = { ...current };
      comboProducts.forEach((product) => {
        next[product.id] = changeProductQuantity(
          product,
          next[product.id] || 0,
          1,
        );
      });
      return next;
    });
    setCartOptions((current) => ({
      ...current,
      ...Object.fromEntries(
        comboProducts
          .filter((product) => product.options[0])
          .map((product) => [product.id, product.options[0].id]),
      ),
    }));
    notify("Combo do mês adicionado ao carrinho");
  };
  const repeatLastOrder = () => {
    if (!lastOrder?.cart) return;
    setCart(lastOrder.cart);
    setCartOptions(lastOrder.options || {});
    setItemSubstitutions(lastOrder.substitutions || {});
    setCartOpen(true);
    notify(`Pedido ${lastOrder.orderNumber} recuperado no carrinho`);
  };
  const saveShoppingList = async () => {
    if (!listOwnerToken || !count) return;
    setListsBusy(true);
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerToken: listOwnerToken,
          name: listName,
          cart,
          options: cartOptions,
          substitutions: itemSubstitutions,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar");
      await loadSavedLists(listOwnerToken);
      setListsOpen(true);
      track("shopping_list_save", undefined, { products: count });
      notify("Lista salva com sucesso");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erro ao salvar lista");
    } finally {
      setListsBusy(false);
    }
  };
  const restoreShoppingList = (list: ShoppingList) => {
    setCart(list.cart);
    setCartOptions(list.options);
    setItemSubstitutions(list.substitutions);
    setListsOpen(false);
    setCartOpen(true);
    track("shopping_list_restore", undefined, { listId: list.id });
    notify(`Lista “${list.name}” adicionada ao carrinho`);
  };
  const deleteShoppingList = async (list: ShoppingList) => {
    if (!listOwnerToken) return;
    setListsBusy(true);
    try {
      const response = await fetch("/api/lists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerToken: listOwnerToken, id: list.id }),
      });
      if (!response.ok) throw new Error("Não foi possível excluir a lista");
      await loadSavedLists(listOwnerToken);
      notify("Lista excluída");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erro ao excluir lista");
    } finally {
      setListsBusy(false);
    }
  };
  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCheckoutError("");
    track("checkout_start");
    if (!orderRequestKey.current) orderRequestKey.current = crypto.randomUUID();
    const whatsappWindow = window.open("about:blank", "_blank");
    try {
      const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart,
            cartOptions,
            itemSubstitutions,
            customer,
            sessionKey: getSession(),
            requestKey: orderRequestKey.current,
          }),
        }),
        data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Não foi possível finalizar");
      track("whatsapp_click", undefined, { orderNumber: data.orderNumber });
      const historyEntry: OrderHistoryEntry = {
        orderNumber: data.orderNumber,
        trackingToken: data.trackingToken,
        createdAt: new Date().toISOString(),
        totalCents: data.totalCents,
        status: "whatsapp_pending",
        cart,
        options: cartOptions,
        substitutions: itemSubstitutions,
      };
      localStorage.setItem("sc-last-order", JSON.stringify(historyEntry));
      const history = JSON.parse(
        localStorage.getItem("sc-order-history-v2") || "[]",
      ) as OrderHistoryEntry[];
      localStorage.setItem(
        "sc-order-history-v2",
        JSON.stringify(
          [
            historyEntry,
            ...history.filter(
              (entry) => entry.orderNumber !== historyEntry.orderNumber,
            ),
          ].slice(0, 10),
        ),
      );
      setLastOrder({
        orderNumber: data.orderNumber,
        cart,
        options: cartOptions,
        substitutions: itemSubstitutions,
      });
      if (whatsappWindow) whatsappWindow.location.href = data.whatsapp;
      else window.open(data.whatsapp, "_blank", "noopener,noreferrer");
      setOrderSuccess(data as OrderSuccess);
      setCart({});
      setCartOptions({});
      setItemSubstitutions({});
      orderRequestKey.current = "";
      setCheckoutOpen(false);
      setCartOpen(false);
      notify(`Pedido ${data.orderNumber} criado!`);
    } catch (error) {
      whatsappWindow?.close();
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Não foi possível finalizar o pedido",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const activeBanner = (catalog.banners.find((b) => b.active) || {
    title: "Até 30% OFF",
    subtitle: "Ofertas da semana",
  }) as Banner;
  const whatsappContactUrl = `https://wa.me/${catalog.settings.whatsapp}`;
  const contactPhone =
    catalog.settings.phone || `+${catalog.settings.whatsapp}`;
  const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    catalog.settings.address,
  )}&output=embed`;
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <main className="storefront motion-ready">
        <m.div
          className="scroll-progress"
          style={{ scaleX: smoothScrollProgress }}
          aria-hidden="true"
        />
        <div className="promo-bar">
          <span>⚡ {catalog.settings.announcement}</span>
          <p>Economize hoje em produtos selecionados</p>
          <a href="#ofertas">
            Ver ofertas <Icon name="arrow" size={15} />
          </a>
        </div>
        <AnimatePresence>
          {showRecovery && count > 0 ? (
            <m.aside
              className="cart-recovery"
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <span>🛒</span>
              <div>
                <b>Sua lista continua aqui</b>
                <small>
                  Você deixou {count} {count === 1 ? "item" : "itens"} no
                  carrinho.
                </small>
              </div>
              <button
                onClick={() => {
                  setShowRecovery(false);
                  setCartOpen(true);
                }}
              >
                Retomar compra
              </button>
              <button
                className="recovery-close"
                aria-label="Fechar aviso"
                onClick={() => setShowRecovery(false)}
              >
                ×
              </button>
            </m.aside>
          ) : null}
        </AnimatePresence>
        <header className={headerCompact ? "header compact" : "header"}>
          <Link href="/" className="brand">
            <Image
              src="/assets/sc-supermercado-central-oficial.png"
              alt="Logomarca oficial do Supermercado Central"
              width={310}
              height={115}
              priority
              unoptimized
            />
          </Link>
          <nav
            className={menuOpen ? "nav open" : "nav"}
            aria-label="Navegação principal"
          >
            <a
              href="#ofertas"
              className={activeSection === "ofertas" ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              Ofertas
            </a>
            <div className="nav-categories">
              <button
                type="button"
                aria-haspopup="menu"
                className={activeSection === "setores" ? "active" : ""}
              >
                Setores <Icon name="arrow" size={14} />
              </button>
              <div className="category-menu" role="menu">
                {catalog.categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => goToCatalog(item.id)}
                  >
                    <span>{item.icon}</span>
                    <b>{item.name}</b>
                  </button>
                ))}
              </div>
            </div>
            <a
              href="#descobrir"
              className={activeSection === "descobrir" ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              Em movimento
            </a>
            <a
              href="#loja"
              className={activeSection === "loja" ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              Nossa loja
            </a>
            <Link href="/acompanhar">Acompanhar</Link>
            <Link href="/meus-pedidos" className="nav-mobile-only">
              Meus pedidos
            </Link>
          </nav>
          <div className="header-actions">
            <Link
              href="/meus-pedidos"
              className="icon-action account-action"
              aria-label="Meus pedidos"
            >
              <Icon name="user" />
            </Link>
            <button
              className="icon-action"
              onClick={() => setShowFavorites(!showFavorites)}
              aria-label="Favoritos"
            >
              <Icon
                name="heart"
                fill={showFavorites ? "currentColor" : "none"}
              />
              {favorites.length > 0 && <small>{favorites.length}</small>}
            </button>
            <button
              className="menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              <Icon name="menu" />
            </button>
            <button
              className="cart-button"
              onClick={() => setCartOpen(true)}
              data-cart-target
            >
              <Icon name="cart" />
              <span>Meu carrinho</span>
              <AnimatePresence mode="popLayout">
                {count > 0 ? (
                  <m.b
                    key={count}
                    initial={reduceMotion ? false : { scale: 0.35, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.35, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  >
                    {count}
                  </m.b>
                ) : null}
              </AnimatePresence>
            </button>
          </div>
        </header>
        <section className="hero" id="inicio">
          <div className="hero-shape one" />
          <div className="hero-shape two" />
          <m.div
            className="hero-content"
            initial={reduceMotion ? false : { opacity: 0, x: -44 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <m.div
              className={storeOpen ? "hero-status open" : "hero-status"}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.45 }}
            >
              <i />
              <b>
                {storeOpen === null
                  ? "Horário de hoje"
                  : storeOpen
                    ? "Aberto agora"
                    : "Fechado agora"}
              </b>
              <span>07h30 às 21h</span>
            </m.div>
            <m.span
              className="eyebrow"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <i /> Qualidade e economia todo dia
            </m.span>
            <m.h1
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.65 }}
            >
              Seu mercado
              <br />
              <em>mais perto</em> de você.
            </m.h1>
            <m.p
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55 }}
            >
              Produtos fresquinhos, preços que cabem no bolso e a facilidade de
              pedir tudo pelo WhatsApp.
            </m.p>
            <m.form
              className="hero-search"
              onSubmit={(event) => {
                event.preventDefault();
                goToCatalog("Todos");
                track("search", undefined, {
                  query: query.slice(0, 60),
                  source: "hero",
                });
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Icon name="search" size={21} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="O que você procura hoje?"
                aria-label="Buscar produtos no catálogo"
              />
              <button type="submit">Buscar</button>
            </m.form>
            <SearchSuggestions
              products={searchSuggestions}
              onSelect={(product) => {
                setQuery("");
                view(product);
              }}
            />
            <m.div
              className="hero-ctas"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.5 }}
            >
              <m.a
                className="primary-btn"
                href="#ofertas"
                whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Comprar agora <Icon name="arrow" size={18} />
              </m.a>
              <m.button
                className="secondary-btn"
                onClick={lastOrder?.cart ? repeatLastOrder : install}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon name={lastOrder?.cart ? "clock" : "spark"} size={19} />{" "}
                {lastOrder?.cart
                  ? "Repetir última compra"
                  : "Instalar aplicativo"}
              </m.button>
            </m.div>
            <m.div
              className="hero-proof"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.48, duration: 0.55 }}
            >
              {["Compra fácil", "Atendimento rápido", "Pedido registrado"].map(
                (label, index) => (
                  <m.span
                    key={label}
                    initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.52 + index * 0.08 }}
                  >
                    ✓ {label}
                  </m.span>
                ),
              )}
            </m.div>
            <m.a
              href="#setores"
              className="scroll-cue"
              animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span /> Role para descobrir
            </m.a>
          </m.div>
          <HeroMotionVisual
            bannerTitle={activeBanner.title}
            products={catalog.products}
            reduceMotion={Boolean(reduceMotion)}
          />
        </section>
        <m.section
          className="benefits"
          id="facilidades"
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.09 } },
          }}
        >
          {[
            ["truck", "Entrega na sua casa", "Taxa calculada por bairro"],
            ["shield", "Compra segura", "Pedido registrado"],
            ["clock", "Atendimento rápido", "Finalize pelo WhatsApp"],
            ["coupon", "Cupom BEMVINDO10", "10% na primeira compra"],
          ].map((x) => (
            <m.article
              key={x[1]}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
              whileHover={reduceMotion ? undefined : { y: -5 }}
            >
              <span>
                <Icon name={x[0] as IconName} />
              </span>
              <div>
                <strong>{x[1]}</strong>
                <small>{x[2]}</small>
              </div>
            </m.article>
          ))}
        </m.section>
        <m.section
          className="departments"
          id="setores"
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65 }}
        >
          <div className="section-kicker">Explore por setor</div>
          <div className="department-track">
            {catalog.categories.map((c) => (
              <m.button
                key={c.id}
                onClick={() => goToCatalog(c.id)}
                whileHover={reduceMotion ? undefined : { y: -7, scale: 1.025 }}
                whileTap={{ scale: 0.96 }}
              >
                <span>{c.icon}</span>
                <b>{c.name}</b>
                <small>Ver produtos</small>
              </m.button>
            ))}
          </div>
        </m.section>
        <section className="shop-section" id="ofertas">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <i /> Catálogo atualizado
              </span>
              <h2>
                {showFavorites
                  ? "Seus produtos favoritos."
                  : "Ofertas que valem a pena."}
              </h2>
            </div>
            <p>
              Escolha, adicione ao carrinho e envie seu pedido. Simples assim.
            </p>
          </div>
          <div className="shop-tools">
            <div className="categories">
              <button
                className={category === "Todos" ? "active" : ""}
                onClick={() => setCategory("Todos")}
              >
                Todos
              </button>
              <button
                className={category === "Ofertas" ? "active" : ""}
                onClick={() => setCategory("Ofertas")}
              >
                Ofertas
              </button>
              {catalog.categories.map((c) => (
                <button
                  key={c.id}
                  className={category === c.id ? "active" : ""}
                  onClick={() => setCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="tool-right">
              <label className="search">
                <Icon name="search" size={19} />
                <input
                  ref={catalogSearchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    track("search", undefined, {
                      query: e.target.value.slice(0, 60),
                    });
                  }}
                  placeholder="Buscar produto ou SKU..."
                />
              </label>
              <SearchSuggestions
                compact
                products={searchSuggestions}
                onSelect={(product) => {
                  setQuery("");
                  view(product);
                }}
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Ordenar produtos"
              >
                <option value="featured">Destaques</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="name">Nome A–Z</option>
              </select>
            </div>
          </div>
          <div className="products-grid">
            <AnimatePresence mode="popLayout">
              {visible.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  quantity={cart[p.id] || 0}
                  optionId={cartOptions[p.id]}
                  favorite={favoriteSet.has(p.id)}
                  index={i}
                  reduceMotion={Boolean(reduceMotion)}
                  onAdd={() => add(p)}
                  onChange={(n) => change(p.id, n)}
                  onFavorite={() => toggleFavorite(p)}
                  onView={() => view(p)}
                  onShare={() => share(p)}
                />
              ))}
            </AnimatePresence>
          </div>
          {!visible.length && (
            <div className="empty">
              <span>🔎</span>
              <h3>
                {showFavorites
                  ? "Você ainda não salvou produtos"
                  : "Nenhum produto encontrado"}
              </h3>
              <p>Explore o catálogo ou escolha outra categoria.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("Todos");
                  setShowFavorites(false);
                }}
              >
                Ver todos os produtos
              </button>
            </div>
          )}
        </section>
        <FlashOffers
          title={catalog.settings.flashOfferTitle}
          products={catalog.products}
          reduceMotion={Boolean(reduceMotion)}
          onAdd={add}
          onView={view}
        />
        {catalog.homeContent.flyerActive ? (
          <WeeklyFlyer
            content={catalog.homeContent}
            products={catalog.products}
            reduceMotion={Boolean(reduceMotion)}
            onAdd={add}
            onView={view}
          />
        ) : null}
        <MotionSpotlight
          products={catalog.products}
          onAdd={add}
          onView={view}
        />
        <m.section
          className="combo-banner"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 34 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <m.div
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16, duration: 0.55 }}
          >
            <span>COMBO DO MÊS</span>
            <h2>
              O básico da despensa
              <br />
              com economia de verdade.
            </h2>
            <p>
              {comboProducts.map((product) => product.name).join(" + ")} em um
              clique.
            </p>
            <m.button
              onClick={combo}
              whileHover={reduceMotion ? undefined : { scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.96 }}
            >
              Adicionar combo <Icon name="plus" size={17} />
            </m.button>
          </m.div>
          <div className="combo-products">
            {comboProducts.map((product, index) => (
              <Fragment key={product.id}>
                {index > 0 ? <b>+</b> : null}
                <m.span
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: index % 2 ? [0, 9, 0] : [0, -9, 0] }
                  }
                  transition={{
                    duration: 3.2 + index * 0.2,
                    repeat: Infinity,
                    delay: index * 0.15,
                  }}
                >
                  {product.name.split(" ")[0]}
                </m.span>
              </Fragment>
            ))}
          </div>
        </m.section>
        {recent.length > 0 && (
          <m.section
            className="recent-section"
            initial={reduceMotion ? false : { opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div>
              <span className="eyebrow">
                <i /> Continue de onde parou
              </span>
              <h2>Vistos recentemente</h2>
            </div>
            <div className="recent-track">
              {recent
                .map((id) => productMap.get(id))
                .filter(Boolean)
                .map((p) => (
                  <m.button
                    key={p!.id}
                    onClick={() => view(p!)}
                    whileHover={
                      reduceMotion ? undefined : { y: -5, scale: 1.02 }
                    }
                    whileTap={{ scale: 0.97 }}
                  >
                    <Image
                      src={p!.imageUrl}
                      alt=""
                      width={64}
                      height={64}
                      unoptimized
                    />
                    <span>
                      <b>{p!.name}</b>
                      <small>{money(p!.priceCents)}</small>
                    </span>
                  </m.button>
                ))}
            </div>
          </m.section>
        )}
        <RecommendationRail
          products={recommendations}
          reduceMotion={Boolean(reduceMotion)}
          onAdd={add}
          onView={view}
        />
        {reviews.length > 0 ? (
          <ReviewsSection
            reviews={reviews}
            reduceMotion={Boolean(reduceMotion)}
          />
        ) : null}
        <InstitutionalGallery
          content={catalog.homeContent}
          reduceMotion={Boolean(reduceMotion)}
          mapsUrl={catalog.settings.mapsUrl}
          whatsappUrl={whatsappContactUrl}
        />
        <m.section
          className="whatsapp-section"
          initial={reduceMotion ? false : { opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7 }}
        >
          <m.div
            initial={reduceMotion ? false : { opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <span className="eyebrow light">
              <i /> Do carrinho para o atendimento
            </span>
            <h2>
              Terminou sua lista?
              <br />A gente cuida do resto.
            </h2>
            <p>
              Seu pedido recebe número de identificação e fica registrado.
              Depois, você fala com nossa equipe no WhatsApp para confirmar
              disponibilidade, entrega e pagamento.
            </p>
            <div className="section-actions">
              <button className="white-btn" onClick={() => setCartOpen(true)}>
                <Icon name="cart" /> Abrir meu carrinho{" "}
                <Icon name="arrow" size={18} />
              </button>
              <button className="outline-light" onClick={enableNotifications}>
                <Icon name="bell" /> Alertas de ofertas
              </button>
            </div>
            <a
              className="whatsapp-direct-link"
              href={whatsappContactUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                track("whatsapp_click", undefined, { source: "home_contact" })
              }
            >
              <Icon name="whatsapp" size={18} /> Falar agora: {contactPhone}
            </a>
          </m.div>
          <m.div
            className="phone"
            initial={reduceMotion ? false : { opacity: 0, x: 36, rotate: 3 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            whileHover={reduceMotion ? undefined : { y: -8, rotate: -1 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="phone-top">
              <span>
                <Icon name="whatsapp" />
              </span>
              <div>
                <strong>Supermercado Central</strong>
                <small>{contactPhone}</small>
              </div>
            </div>
            <div className="message">
              *PEDIDO SC12345678*
              <br />
              <br />• 2x Arroz Branco
              <br />• 1x Feijão Carioca
              <br />• 2x Leite Integral
              <br />
              <br />
              <b>Total estimado: R$ 65,95</b>
              <br />
              <br />
              Entrega, pagamento e observações já preenchidos ✓
            </div>
            <m.div
              className="typing"
              animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.25, repeat: Infinity }}
            >
              ● ● ●
            </m.div>
          </m.div>
        </m.section>
        <m.section
          className="store-location"
          id="loja"
          initial={reduceMotion ? false : { opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.22 }}
          transition={{ duration: 0.7 }}
        >
          <div className="store-map">
            <iframe
              src={mapsEmbedUrl}
              title="Localização do Supermercado Central em São José da Tapera"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <span>
              <Icon name="pin" size={17} /> Localização real
            </span>
          </div>
          <div className="store-location-copy">
            <span className="eyebrow">
              <i /> O supermercado de São José da Tapera
            </span>
            <h2>No coração da cidade, perto da sua família.</h2>
            <p>
              Visite nossa unidade ou monte sua lista pelo site. Nossa equipe
              confirma tudo com você pelo WhatsApp.
            </p>
            <div className="store-info-grid">
              <article>
                <Icon name="clock" />
                <span>
                  <small>Funcionamento</small>
                  <b>Todos os dias · {catalog.settings.hours}</b>
                </span>
              </article>
              <article>
                <Icon name="pin" />
                <span>
                  <small>Endereço</small>
                  <b>{catalog.settings.address}</b>
                </span>
              </article>
            </div>
            <div className="store-location-actions">
              <a
                href={catalog.settings.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="pin" size={18} /> Traçar rota
              </a>
              <a href={whatsappContactUrl} target="_blank" rel="noreferrer">
                <Icon name="whatsapp" size={18} /> Falar com a loja
              </a>
            </div>
          </div>
        </m.section>
        <FaqSection reduceMotion={Boolean(reduceMotion)} />
        <m.footer
          id="contato"
          className="premium-footer"
          initial={reduceMotion ? false : { opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="footer-glow one" aria-hidden="true" />
          <div className="footer-glow two" aria-hidden="true" />
          <div className="footer-shell">
            <m.section
              className="footer-cta"
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ delay: 0.08, duration: 0.6 }}
            >
              <div>
                <span>COMPRA RÁPIDA E ATENDIMENTO HUMANO</span>
                <h2>Sua lista pronta em poucos minutos.</h2>
                <p>
                  Escolha os produtos e confirme tudo diretamente com nossa
                  equipe pelo WhatsApp.
                </p>
              </div>
              <div className="footer-cta-actions">
                <button type="button" onClick={() => setCartOpen(true)}>
                  <Icon name="cart" size={19} /> Abrir meu carrinho
                </button>
                <a
                  href={whatsappContactUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    track("whatsapp_click", undefined, {
                      source: "footer_cta",
                    })
                  }
                >
                  <Icon name="whatsapp" size={19} /> Falar com a loja
                </a>
              </div>
            </m.section>

            <div className="footer-grid">
              <div className="footer-brand-column">
                <div className="footer-logo-panel">
                  <div className="footer-brand-lockup">
                    <Image
                      src="/assets/sc-supermercado-central-oficial.png"
                      alt="Logomarca oficial do Supermercado Central"
                      width={1536}
                      height={1024}
                      sizes="(max-width:640px) 250px, 290px"
                      unoptimized
                    />
                  </div>
                </div>
                <p>
                  Preço baixo, variedade e carinho no atendimento. O
                  supermercado da sua família, agora também no seu celular.
                </p>
                <div className="footer-trust-badges">
                  <span>✓ Atendimento local</span>
                  <span>✓ Pedido registrado</span>
                </div>
              </div>

              <nav className="footer-nav-column" aria-label="Links de compras">
                <span>COMPRAS</span>
                <h3>Facilidades</h3>
                <Link href="/acompanhar">
                  Acompanhar pedido <Icon name="arrow" size={14} />
                </Link>
                <Link href="/meus-pedidos">
                  Meus pedidos <Icon name="arrow" size={14} />
                </Link>
                <Link href="/entrega-e-retirada">
                  Entrega e retirada <Icon name="arrow" size={14} />
                </Link>
                <Link href="/trocas-e-cancelamentos">
                  Trocas e cancelamentos <Icon name="arrow" size={14} />
                </Link>
              </nav>

              <nav
                className="footer-nav-column"
                aria-label="Links institucionais"
              >
                <span>INSTITUCIONAL</span>
                <h3>Informações</h3>
                <Link href="/termos">
                  Termos de uso <Icon name="arrow" size={14} />
                </Link>
                <Link href="/privacidade">
                  Privacidade e LGPD <Icon name="arrow" size={14} />
                </Link>
                <a href="#duvidas">
                  Dúvidas frequentes <Icon name="arrow" size={14} />
                </a>
                <button type="button" onClick={install}>
                  Instalar aplicativo <Icon name="arrow" size={14} />
                </button>
                <Link href="/admin">
                  Painel administrativo <Icon name="arrow" size={14} />
                </Link>
              </nav>

              <div className="footer-contact-column">
                <span>FALE COM A GENTE</span>
                <h3>Estamos por perto</h3>
                <div className="footer-contact-card">
                  <i>
                    <Icon name="clock" size={19} />
                  </i>
                  <div>
                    <small>Horário de atendimento</small>
                    <b>Todos os dias · {catalog.settings.hours}</b>
                  </div>
                </div>
                <a
                  className="footer-contact-card"
                  href={catalog.settings.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <i>
                    <Icon name="pin" size={19} />
                  </i>
                  <div>
                    <small>Onde estamos</small>
                    <b>{catalog.settings.address}</b>
                  </div>
                </a>
                <a
                  className="footer-contact-card whatsapp"
                  href={whatsappContactUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    track("whatsapp_click", undefined, { source: "footer" })
                  }
                >
                  <i>
                    <Icon name="whatsapp" size={19} />
                  </i>
                  <div>
                    <small>WhatsApp</small>
                    <b>{contactPhone}</b>
                  </div>
                </a>
              </div>
            </div>

            <div className="footer-bottom">
              <span>© 2026 Supermercado Central. Todos os direitos reservados.</span>
              <span className="footer-local-signature">
                <Icon name="pin" size={14} /> São José da Tapera · Alagoas
              </span>
              <span className="developer-credit">
                Desenvolvimento do site: <b>AlfaTech</b>
              </span>
            </div>
          </div>
        </m.footer>
        <nav className="mobile-dock" aria-label="Navegação rápida">
          <a href="#inicio" className={activeSection === "inicio" ? "active" : ""}>
            <Icon name="home" size={20} />
            <span>Início</span>
          </a>
          <button type="button" onClick={() => goToCatalog("Todos")}>
            <Icon name="grid" size={20} />
            <span>Setores</span>
          </button>
          <button
            type="button"
            className="mobile-search-action"
            onClick={() => goToCatalog("Todos", true)}
          >
            <Icon name="search" size={22} />
            <span>Buscar</span>
          </button>
          <Link href="/meus-pedidos">
            <Icon name="user" size={20} />
            <span>Pedidos</span>
          </Link>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            data-cart-target
          >
            <Icon name="cart" size={20} />
            <span>Carrinho</span>
            {count > 0 ? <b>{count}</b> : null}
          </button>
        </nav>
        <m.button
          className="floating-cart"
          onClick={() => setCartOpen(true)}
          aria-label="Abrir carrinho"
          data-cart-target
          whileTap={{ scale: 0.9 }}
          animate={
            count > 0 && !reduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }
          }
          transition={{ duration: 0.34 }}
        >
          <Icon name="cart" />
          {count > 0 ? <b>{count}</b> : null}
        </m.button>
        <AnimatePresence>
          {cartOpen && (
            <>
              <m.button
                key="cart-overlay"
                className="cart-overlay"
                onClick={() => setCartOpen(false)}
                aria-label="Fechar carrinho"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <m.aside
                key="cart-drawer"
                className="cart-drawer"
                initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
              >
                <div className="cart-head">
                  <div>
                    <span>Seu pedido</span>
                    <h2>
                      Meu carrinho{" "}
                      <small>
                        {count} {count === 1 ? "item" : "itens"}
                      </small>
                    </h2>
                  </div>
                  <button onClick={() => setCartOpen(false)}>
                    <Icon name="close" />
                  </button>
                </div>
                <CheckoutJourney active={1} />
                <div className="cart-list-tools">
                  <button
                    type="button"
                    className={listsOpen ? "active" : ""}
                    onClick={() => setListsOpen((open) => !open)}
                  >
                    <Icon name="star" size={17} /> Minhas listas
                    {savedLists.length ? <b>{savedLists.length}</b> : null}
                  </button>
                  {count > 0 ? (
                    <div>
                      <input
                        value={listName}
                        maxLength={70}
                        onChange={(event) => setListName(event.target.value)}
                        aria-label="Nome da lista de compras"
                      />
                      <button
                        type="button"
                        onClick={() => void saveShoppingList()}
                        disabled={listsBusy || !listName.trim()}
                      >
                        {listsBusy ? "Salvando..." : "Salvar lista atual"}
                      </button>
                    </div>
                  ) : null}
                </div>
                {listsOpen ? (
                  <SavedListsPanel
                    lists={savedLists}
                    busy={listsBusy}
                    restore={restoreShoppingList}
                    remove={deleteShoppingList}
                  />
                ) : null}
                <div className="cart-items">
                  {!count ? (
                    <div className="cart-empty">
                      <div>
                        <Icon name="cart" size={38} />
                      </div>
                      <h3>Seu carrinho está vazio</h3>
                      <p>Adicione produtos e eles aparecerão aqui.</p>
                      <button onClick={() => setCartOpen(false)}>
                        Explorar ofertas
                      </button>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {catalog.products
                        .filter((p) => cart[p.id])
                        .map((p) => (
                          <m.article
                            layout
                            className="cart-item"
                            key={p.id}
                            initial={
                              reduceMotion ? false : { opacity: 0, x: 22 }
                            }
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 22 }}
                          >
                            <div className="cart-thumb">
                              <Image
                                src={p.imageUrl}
                                alt=""
                                fill
                                sizes="72px"
                                unoptimized
                              />
                            </div>
                            <div className="cart-item-copy">
                              <strong>{p.name}</strong>
                              <small>{optionSummary(p, cartOptions)}</small>
                              <span>
                                {money(
                                  Math.round(
                                    productPrice(p, cartOptions[p.id]) *
                                      cart[p.id],
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="qty">
                              <button onClick={() => change(p.id, -1)}>
                                <Icon name="minus" size={14} />
                              </button>
                              <m.b
                                key={cart[p.id]}
                                initial={reduceMotion ? false : { scale: 0.6 }}
                                animate={{ scale: 1 }}
                              >
                                {formatQuantity(p, cart[p.id])}
                              </m.b>
                              <button onClick={() => change(p.id, 1)}>
                                <Icon name="plus" size={14} />
                              </button>
                            </div>
                            {p.options.length ? (
                              <label className="cart-line-option">
                                Tamanho
                                <select
                                  value={
                                    cartOptions[p.id] ||
                                    selectedOption(p)?.id ||
                                    ""
                                  }
                                  onChange={(event) =>
                                    changeOption(p, event.target.value)
                                  }
                                >
                                  {p.options.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.label} — {money(option.priceCents)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : null}
                            <label className="cart-line-substitution">
                              Se faltar
                              <select
                                value={itemSubstitutions[p.id] || "confirm"}
                                onChange={(event) =>
                                  changeSubstitution(
                                    p.id,
                                    event.target.value as ItemSubstitution,
                                  )
                                }
                              >
                                <option value="confirm">Confirmar antes</option>
                                <option value="similar">Produto similar</option>
                                <option value="none">Não substituir</option>
                              </select>
                            </label>
                          </m.article>
                        ))}
                    </AnimatePresence>
                  )}
                </div>
                {count > 0 && (
                  <m.div
                    className="cart-footer"
                    initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                  >
                    <div className="minimum">
                      <m.div
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 160,
                          damping: 24,
                        }}
                      />
                    </div>
                    <small>
                      {subtotal < minimum
                        ? `Faltam ${money(minimum - subtotal)} para o pedido mínimo.`
                        : "Pedido mínimo atingido ✓"}
                    </small>
                    <div className="summary">
                      <span>Subtotal</span>
                      <b>{money(subtotal)}</b>
                    </div>
                    <div className="cart-delivery-preview">
                      <Icon name="truck" size={18} />
                      <span>
                        <small>Previsão de entrega</small>
                        <b>
                          {zone?.eta || "Calculada ao selecionar sua área"}
                        </b>
                      </span>
                    </div>
                    <button
                      className="checkout"
                      disabled={subtotal < minimum}
                      onClick={() => {
                        if (
                          !catalog.settings.allowDelivery &&
                          catalog.settings.allowPickup
                        )
                          setCustomer((current) => ({
                            ...current,
                            deliveryType: "pickup",
                          }));
                        setCartOpen(false);
                        setCheckoutOpen(true);
                      }}
                    >
                      <Icon name="arrow" /> Continuar: entrega e identificação
                    </button>
                    <button
                      className="clear"
                      onClick={() => {
                        setCart({});
                        setCartOptions({});
                        setItemSubstitutions({});
                      }}
                    >
                      Limpar carrinho
                    </button>
                  </m.div>
                )}
              </m.aside>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {checkoutOpen && (
            <CheckoutModal
              customer={customer}
              setCustomer={setCustomer}
              zones={catalog.deliveryZones}
              allowDelivery={catalog.settings.allowDelivery}
              allowPickup={catalog.settings.allowPickup}
              subtotal={subtotal}
              delivery={delivery}
              total={total}
              error={checkoutError}
              submitting={submitting}
              onClose={() => setCheckoutOpen(false)}
              onSubmit={submitOrder}
            />
          )}
          {selected && (
            <ProductQuickView
              product={selected}
              favorite={favoriteSet.has(selected.id)}
              onClose={() => setSelected(null)}
              onAdd={() => add(selected)}
              onFavorite={() => toggleFavorite(selected)}
              onShare={() => share(selected)}
            />
          )}
          {orderSuccess && (
            <OrderSuccessModal
              order={orderSuccess}
              onClose={() => setOrderSuccess(null)}
              notify={notify}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {toast && (
            <m.div
              className="toast"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 28, scale: 0.94 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
            >
              <span>✓</span>
              {toast}
            </m.div>
          )}
        </AnimatePresence>
      </main>
    </LazyMotion>
  );
}

function FlashOffers({
  title,
  products,
  reduceMotion,
  onAdd,
  onView,
}: {
  title: string;
  products: Product[];
  reduceMotion: boolean;
  onAdd: (product: Product) => void;
  onView: (product: Product) => void;
}) {
  const offers = useMemo(
    () => products.filter((product) => product.oldPriceCents).slice(0, 3),
    [products],
  );
  const [clock, setClock] = useState({ now: 0, target: 0 });
  useEffect(() => {
    const updateClock = () => {
      const current = new Date();
      const currentTime = current.getTime();
      const futureEnds = offers
        .map((product) =>
          product.offerEnd ? new Date(product.offerEnd).getTime() : 0,
        )
        .filter((time) => time > currentTime);
      if (!futureEnds.length) current.setHours(23, 59, 59, 999);
      setClock({
        now: currentTime,
        target: futureEnds.length ? Math.min(...futureEnds) : current.getTime(),
      });
    };
    const kickoff = setTimeout(updateClock, 0);
    const interval = setInterval(updateClock, 1_000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [offers]);
  if (!offers.length) return null;
  const remaining = clock.now ? Math.max(0, clock.target - clock.now) : 0;
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return (
    <m.section
      className="flash-offers"
      initial={reduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="flash-heading">
        <div>
          <span>⚡ PREÇOS ESPECIAIS</span>
          <h2>{title}</h2>
          <p>Aproveite os destaques antes que o relógio zere.</p>
        </div>
        <div className="flash-clock" aria-label="Tempo restante da oferta">
          {[
            [hours, "h"],
            [minutes, "min"],
            [seconds, "s"],
          ].map(([value, label]) => (
            <span key={label}>
              <b>{String(value).padStart(2, "0")}</b>
              <small>{label}</small>
            </span>
          ))}
        </div>
      </div>
      <div className="flash-grid">
        {offers.map((product, index) => (
          <m.article
            key={product.id}
            whileHover={reduceMotion ? undefined : { y: -7, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 260, damping: 23 }}
          >
            <button className="flash-product" onClick={() => onView(product)}>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={120}
                height={110}
                unoptimized
              />
              <span>
                <small>{product.categoryName}</small>
                <b>{product.name}</b>
                <del>{money(product.oldPriceCents || 0)}</del>
                <strong>{money(product.priceCents)}</strong>
              </span>
            </button>
            <m.button
              className="flash-add"
              onClick={() => onAdd(product)}
              whileTap={{ scale: 0.94 }}
              animate={
                reduceMotion || index > 0
                  ? undefined
                  : {
                      boxShadow: [
                        "0 0 0 0 #fff0",
                        "0 0 0 8px #fff2",
                        "0 0 0 0 #fff0",
                      ],
                    }
              }
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              <Icon name="plus" size={17} /> Adicionar
            </m.button>
          </m.article>
        ))}
      </div>
    </m.section>
  );
}

function RecommendationRail({
  products,
  reduceMotion,
  onAdd,
  onView,
}: {
  products: Product[];
  reduceMotion: boolean;
  onAdd: (product: Product) => void;
  onView: (product: Product) => void;
}) {
  if (!products.length) return null;
  return (
    <m.section
      className="recommendations"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="recommendation-heading">
        <span className="eyebrow">
          <i /> Seleção inteligente
        </span>
        <h2>Talvez esteja faltando isto na sua lista.</h2>
        <p>Recomendações atualizadas conforme você explora o catálogo.</p>
      </div>
      <div className="recommendation-track">
        {products.map((product) => (
          <m.article
            key={product.id}
            whileHover={reduceMotion ? undefined : { y: -6 }}
          >
            <button onClick={() => onView(product)}>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={86}
                height={86}
                unoptimized
              />
              <span>
                <small>{product.categoryName}</small>
                <b>{product.name}</b>
                <strong>{money(product.priceCents)}</strong>
              </span>
            </button>
            <button
              className="recommendation-add"
              onClick={() => onAdd(product)}
            >
              <Icon name="plus" size={16} />
            </button>
          </m.article>
        ))}
      </div>
    </m.section>
  );
}

function ReviewsSection({
  reviews,
  reduceMotion,
}: {
  reviews: PublicReview[];
  reduceMotion: boolean;
}) {
  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return (
    <m.section
      className="reviews-section"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="reviews-summary">
        <span>AVALIAÇÕES VERIFICADAS</span>
        <strong>{average.toFixed(1).replace(".", ",")}</strong>
        <div>{"★".repeat(Math.round(average))}</div>
        <small>{reviews.length} opiniões de compras concluídas</small>
      </div>
      <div className="reviews-track">
        {reviews.slice(0, 6).map((review) => (
          <article key={review.id}>
            <div>{"★".repeat(review.rating)}</div>
            <p>“{review.comment}”</p>
            <b>{review.customerName}</b>
            <small>
              {new Date(review.createdAt).toLocaleDateString("pt-BR")}
            </small>
          </article>
        ))}
      </div>
    </m.section>
  );
}

function WeeklyFlyer({
  content,
  products,
  reduceMotion,
  onAdd,
  onView,
}: {
  content: HomeContent;
  products: Product[];
  reduceMotion: boolean;
  onAdd: (product: Product) => void;
  onView: (product: Product) => void;
}) {
  const availableProducts = products.filter(
    (product) => product.active && product.stockQuantity > 0,
  );
  const promotionalProducts = availableProducts.filter(
    (product) =>
      Boolean(productOldPrice(product)) ||
      product.options.some((option) => Boolean(option.oldPriceCents)),
  );
  const featuredProducts = availableProducts.filter(
    (product) => product.featured && !promotionalProducts.includes(product),
  );
  const highlights = [...promotionalProducts, ...featuredProducts].slice(0, 3);
  const destination = content.flyerCtaUrl || "#ofertas";
  const externalDestination = destination.startsWith("https://");

  return (
    <m.section
      className={`weekly-flyer ${content.flyerImageUrl ? "has-art" : "auto-flyer"}`}
      aria-labelledby="weekly-flyer-title"
      initial={reduceMotion ? false : { opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="weekly-flyer-copy">
        <span>{content.flyerEyebrow || "ENCARTE DA SEMANA"}</span>
        <h2 id="weekly-flyer-title">{content.flyerTitle}</h2>
        <p>{content.flyerSubtitle}</p>
        <div className="weekly-flyer-actions">
          <a
            href={destination}
            target={externalDestination ? "_blank" : undefined}
            rel={externalDestination ? "noreferrer" : undefined}
          >
            {content.flyerCtaLabel || "Ver ofertas"}
            <Icon name="arrow" size={17} />
          </a>
          <small>Preços e disponibilidade confirmados no atendimento.</small>
        </div>
      </div>

      {content.flyerImageUrl ? (
        <m.div
          className="weekly-flyer-art"
          whileHover={reduceMotion ? undefined : { rotate: -1, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
        >
          <Image
            src={content.flyerImageUrl}
            alt={`Encarte promocional — ${content.flyerTitle}`}
            fill
            sizes="(max-width: 760px) 92vw, 44vw"
            unoptimized
          />
        </m.div>
      ) : (
        <div className="weekly-flyer-products" aria-label="Destaques do encarte">
          {highlights.map((product, index) => {
            const oldPrice = productOldPrice(product);
            return (
              <m.article
                key={product.id}
                className={index === 0 ? "featured" : ""}
                whileHover={reduceMotion ? undefined : { y: -7 }}
              >
                <button
                  type="button"
                  className="weekly-flyer-product"
                  onClick={() => onView(product)}
                  aria-label={`Ver ${product.name}`}
                >
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={150}
                    height={136}
                    unoptimized
                  />
                  <span>
                    <small>{product.categoryName}</small>
                    <b>{product.name}</b>
                    {oldPrice ? <del>{money(oldPrice)}</del> : null}
                    <strong>{money(productPrice(product))}</strong>
                  </span>
                </button>
                <button
                  type="button"
                  className="weekly-flyer-add"
                  onClick={() => onAdd(product)}
                  aria-label={`Adicionar ${product.name} ao carrinho`}
                >
                  <Icon name="plus" size={16} /> Adicionar
                </button>
              </m.article>
            );
          })}
          {!highlights.length ? (
            <div className="weekly-flyer-placeholder">
              <Icon name="spark" size={30} />
              <b>Novas ofertas em preparação</b>
              <span>Confira o catálogo completo enquanto isso.</span>
            </div>
          ) : null}
        </div>
      )}
    </m.section>
  );
}

function InstitutionalGallery({
  content,
  reduceMotion,
  mapsUrl,
  whatsappUrl,
}: {
  content: HomeContent;
  reduceMotion: boolean;
  mapsUrl: string;
  whatsappUrl: string;
}) {
  const photos = [
    {
      url: content.storefrontImageUrl,
      label: "Nossa fachada",
      alt: "Fachada do Supermercado Central",
    },
    {
      url: content.interiorImageUrl,
      label: "Por dentro da loja",
      alt: "Interior do Supermercado Central",
    },
    {
      url: content.teamImageUrl,
      label: "Equipe Central",
      alt: "Equipe do Supermercado Central",
    },
  ].filter((photo) => Boolean(photo.url));

  if (!photos.length) return null;

  return (
    <m.section
      className="institutional-gallery"
      aria-labelledby="institutional-title"
      initial={reduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7 }}
    >
      <div className="institutional-copy">
        <span>{content.aboutEyebrow || "PERTINHO DE VOCÊ"}</span>
        <h2 id="institutional-title">{content.aboutTitle}</h2>
        <p>{content.aboutText}</p>
        <div>
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <Icon name="pin" size={17} /> Como chegar
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" size={17} /> Falar com a equipe
          </a>
        </div>
      </div>
      <div
        className={`institutional-photo-grid photos-${photos.length}`}
        aria-label="Fotos do Supermercado Central"
      >
        {photos.map((photo, index) => (
          <m.figure
            key={photo.label}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: index * 0.09, duration: 0.55 }}
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(max-width: 760px) 88vw, 28vw"
              unoptimized
            />
            <figcaption>{photo.label}</figcaption>
          </m.figure>
        ))}
      </div>
    </m.section>
  );
}

const FAQ_ITEMS = [
  {
    question: "Como a compra é finalizada?",
    answer:
      "Você monta o carrinho, informa os dados de entrega ou retirada e registra o pedido. Em seguida, o WhatsApp abre com o resumo para nossa equipe confirmar disponibilidade, pagamento e demais detalhes.",
  },
  {
    question: "Como funciona a compra de produtos por peso?",
    answer:
      "O carrinho mostra um valor estimado conforme a quantidade escolhida. O valor final é confirmado pela equipe depois da pesagem real do produto.",
  },
  {
    question: "Posso escolher como substituir um item?",
    answer:
      "Sim. No carrinho, você pode pedir confirmação antes da troca, autorizar um produto similar ou informar que não deseja substituição.",
  },
  {
    question: "Qual é a taxa e o prazo de entrega?",
    answer:
      "A taxa, o pedido mínimo e a previsão aparecem conforme a área escolhida. A equipe confirma o prazo atualizado durante o atendimento no WhatsApp.",
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer:
      "As opções disponíveis aparecem durante a compra e podem incluir PIX, dinheiro e cartões. A forma escolhida é confirmada pelo atendente antes da finalização.",
  },
  {
    question: "Consigo salvar ou repetir uma compra?",
    answer:
      "Sim. Você pode criar listas, consultar pedidos anteriores e adicionar novamente os itens disponíveis para ganhar tempo na próxima compra.",
  },
] as const;

function FaqSection({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <m.section
      id="duvidas"
      className="faq-section"
      aria-labelledby="faq-title"
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.68 }}
    >
      <div className="faq-heading">
        <span>COMPRA SEM DÚVIDAS</span>
        <h2 id="faq-title">Perguntas frequentes</h2>
        <p>
          Entenda os principais passos antes de montar sua lista. Se precisar,
          nossa equipe continua o atendimento pelo WhatsApp.
        </p>
      </div>
      <div className="faq-list">
        {FAQ_ITEMS.map((item, index) => (
          <details key={item.question} open={index === 0}>
            <summary>
              <span>{item.question}</span>
              <i aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </m.section>
  );
}

function OrderSuccessModal({
  order,
  onClose,
  notify,
}: {
  order: OrderSuccess;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const copy = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);
    notify(message);
  };
  return (
    <m.div
      className="modal-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <m.button
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Fechar confirmação"
      />
      <m.section
        className="order-success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 22, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        <button className="success-close" onClick={onClose} aria-label="Fechar">
          <Icon name="close" />
        </button>
        <CheckoutJourney active={3} />
        <m.div
          className="success-check"
          initial={{ scale: 0.4, rotate: -18 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 19 }}
        >
          ✓
        </m.div>
        <span>PEDIDO REGISTRADO</span>
        <h2 id="success-title">Tudo certo por aqui!</h2>
        <p>
          O pedido <b>{order.orderNumber}</b> foi enviado para o atendimento. O
          valor estimado é <strong>{money(order.totalCents)}</strong>.
        </p>
        <div className="success-actions">
          <a href={order.whatsapp} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" /> Continuar no WhatsApp
          </a>
          <a href={order.trackingUrl}>
            <Icon name="truck" /> Acompanhar pedido
          </a>
        </div>
        {order.pixPayload ? (
          <div className="pix-success">
            <div>
              <span>PIX COPIA E COLA</span>
              <h3>Pague com o valor exato</h3>
              <p>
                Use o QR Code ou copie o código. Confirme o pagamento com o
                atendente antes de encerrar a conversa.
              </p>
              <button
                onClick={() =>
                  void copy(order.pixPayload, "Código PIX copiado com sucesso")
                }
              >
                Copiar código PIX
              </button>
            </div>
            <PixQr payload={order.pixPayload} />
          </div>
        ) : null}
        {order.pointsEarned > 0 ? (
          <div className="loyalty-success">
            <span>★</span>
            <div>
              <b>+{order.pointsEarned} pontos após a conclusão</b>
              <small>Saldo atual: {order.pointsBalance} pontos</small>
            </div>
          </div>
        ) : null}
        {order.referralCode ? (
          <button
            className="referral-success"
            onClick={() =>
              void copy(
                order.referralCode,
                "Código de indicação copiado com sucesso",
              )
            }
          >
            <span>Seu código de indicação</span>
            <b>{order.referralCode}</b>
            <small>Toque para copiar</small>
          </button>
        ) : null}
      </m.section>
    </m.div>
  );
}

function HeroMotionVisual({
  bannerTitle,
  products,
  reduceMotion,
}: {
  bannerTitle: string;
  products: Product[];
  reduceMotion: boolean;
}) {
  const visualRef = useRef<HTMLDivElement>(null);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const smoothTiltX = useSpring(tiltX, { stiffness: 180, damping: 22 });
  const smoothTiltY = useSpring(tiltY, { stiffness: 180, damping: 22 });
  const { scrollYProgress } = useScroll({
    target: visualRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 105]);
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const slides = useMemo(
    () => [
      {
        id: "supermercado",
        src: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=90",
        alt: "Corredor moderno de supermercado",
        kicker: "Oferta da semana",
        title: bannerTitle,
      },
      ...products
        .filter((product) => product.featured)
        .slice(0, 2)
        .map((product) => ({
          id: product.id,
          src: product.imageUrl,
          alt: product.name,
          kicker: product.categoryName,
          title: `${product.name} · ${money(product.priceCents)}`,
        })),
    ],
    [bannerTitle, products],
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const safeActiveSlide = activeSlide % slides.length;
  const currentSlide = slides[safeActiveSlide];
  useEffect(() => {
    if (reduceMotion || slides.length < 2) return;
    const interval = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % slides.length),
      4_600,
    );
    return () => window.clearInterval(interval);
  }, [reduceMotion, slides.length]);
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - rect.left) / rect.width - 0.5;
    const vertical = (event.clientY - rect.top) / rect.height - 0.5;
    tiltY.set(horizontal * 9);
    tiltX.set(vertical * -9);
  };
  const reset = () => {
    tiltX.set(0);
    tiltY.set(0);
  };
  return (
    <m.div
      ref={visualRef}
      className="hero-visual"
      initial={reduceMotion ? false : { opacity: 0, x: 48, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.85, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        y: reduceMotion ? 0 : parallaxY,
        scale: reduceMotion ? 1 : parallaxScale,
      }}
    >
      <m.div
        className="image-card motion-tilt-card"
        onPointerMove={move}
        onPointerLeave={reset}
        style={{
          rotateX: reduceMotion ? 0 : smoothTiltX,
          rotateY: reduceMotion ? 0 : smoothTiltY,
          transformPerspective: 1200,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={currentSlide.id}
            className="hero-slide"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={currentSlide.src}
              alt={currentSlide.alt}
              fill
              sizes="(max-width:900px) 90vw,48vw"
              priority={safeActiveSlide === 0}
              unoptimized
            />
          </m.div>
        </AnimatePresence>
        <m.div
          className="hero-brand-mark"
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.9 }}
          animate={
            reduceMotion
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 1, y: [0, -5, 0], scale: 1 }
          }
          transition={
            reduceMotion
              ? { duration: 0.45 }
              : {
                  opacity: { duration: 0.55, delay: 0.42 },
                  scale: { duration: 0.65, delay: 0.42 },
                  y: {
                    duration: 4.8,
                    delay: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }
          }
          aria-hidden="true"
        >
          <Image
            src="/assets/sc-supermercado-central-oficial.png"
            alt=""
            width={1536}
            height={1024}
            sizes="(max-width:640px) 210px, 320px"
            unoptimized
          />
        </m.div>
        <m.div
          className="floating-card price motion-float"
          animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <small>{currentSlide.kicker}</small>
          <strong>{currentSlide.title}</strong>
        </m.div>
        <m.div
          className="floating-card delivery motion-float"
          animate={reduceMotion ? undefined : { y: [0, 11, 0] }}
          transition={{
            duration: 5.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.45,
          }}
        >
          <span>
            <Icon name="truck" />
          </span>
          <div>
            <strong>Entrega rápida</strong>
            <small>Consulte sua região</small>
          </div>
        </m.div>
        <m.div
          className="motion-orbit"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          aria-hidden="true"
        >
          <i />
        </m.div>
        <div className="hero-slide-dots" aria-label="Destaques do supermercado">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              className={safeActiveSlide === index ? "active" : ""}
              onClick={() => setActiveSlide(index)}
              aria-label={`Mostrar destaque ${index + 1}: ${slide.alt}`}
              aria-current={safeActiveSlide === index ? "true" : undefined}
            />
          ))}
        </div>
      </m.div>
    </m.div>
  );
}
function MotionSpotlight({
  products,
  onAdd,
  onView,
}: {
  products: Product[];
  onAdd: (product: Product) => void;
  onView: (product: Product) => void;
}) {
  const reduceMotion = useReducedMotion();
  const items = useMemo(() => {
    const featured = products.filter((product) => product.featured);
    const remainder = products.filter((product) => !product.featured);
    return [...featured, ...remainder].slice(0, 3);
  }, [products]);
  const [active, setActive] = useState(0);
  const current = items[active] || items[0];
  if (!current) return null;
  return (
    <section className="motion-showcase" id="descobrir">
      <m.header
        className="motion-showcase-heading"
        initial={reduceMotion ? false : { opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.65 }}
      >
        <span>UMA EXPERIÊNCIA EM MOVIMENTO</span>
        <h2>
          Desça a página.
          <br />A oferta acompanha você.
        </h2>
        <p>
          Produtos em destaque ganham vida conforme a navegação, sem tirar o
          foco da compra.
        </p>
      </m.header>
      <div className="motion-showcase-layout">
        <div className="motion-sticky-stage">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={current.id}
              className="motion-product-stage"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.92, rotate: -2 }
              }
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.05, rotate: 2 }
              }
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={current.imageUrl}
                alt={current.name}
                fill
                sizes="(max-width:900px) 92vw,45vw"
                unoptimized
              />
              <div className="motion-stage-shade" />
              <span className="motion-stage-index">
                0{active + 1} / 0{items.length}
              </span>
              {current.badge ? (
                <span className="motion-stage-badge">{current.badge}</span>
              ) : null}
              <div className="motion-stage-copy">
                <small>{current.categoryName}</small>
                <strong>{current.name}</strong>
                <b>{money(current.priceCents)}</b>
              </div>
            </m.div>
          </AnimatePresence>
        </div>
        <div className="motion-product-steps">
          {items.map((product, index) => (
            <m.article
              key={product.id}
              className={
                active === index ? "motion-step active" : "motion-step"
              }
              onViewportEnter={() => setActive(index)}
              viewport={{ amount: 0.62 }}
              initial={reduceMotion ? false : { opacity: 0, x: 34 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: index * 0.06 }}
            >
              <span>0{index + 1}</span>
              <small>{product.categoryName}</small>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div>
                <strong>{money(product.priceCents)}</strong>
                <m.button
                  onClick={() => onAdd(product)}
                  whileTap={{ scale: 0.92 }}
                >
                  <Icon name="plus" size={17} /> Adicionar
                </m.button>
                <button
                  className="motion-detail"
                  onClick={() => onView(product)}
                >
                  Detalhes <Icon name="arrow" size={15} />
                </button>
              </div>
            </m.article>
          ))}
        </div>
      </div>
    </section>
  );
}
function SavedListsPanel({
  lists,
  busy,
  restore,
  remove,
}: {
  lists: ShoppingList[];
  busy: boolean;
  restore: (list: ShoppingList) => void;
  remove: (list: ShoppingList) => Promise<void>;
}) {
  return (
    <section className="saved-lists-panel" aria-label="Listas de compras salvas">
      <header>
        <div>
          <span>COMPRAS RECORRENTES</span>
          <h3>Suas listas salvas</h3>
        </div>
        <small>{lists.length}/25</small>
      </header>
      {lists.length ? (
        <div>
          {lists.map((list) => (
            <article key={list.id}>
              <span>★</span>
              <div>
                <b>{list.name}</b>
                <small>
                  {Object.keys(list.cart).length} produtos · atualizada em{" "}
                  {new Date(list.updatedAt).toLocaleDateString("pt-BR")}
                </small>
              </div>
              <button type="button" onClick={() => restore(list)}>
                Usar lista
              </button>
              <button
                type="button"
                aria-label={`Excluir lista ${list.name}`}
                disabled={busy}
                onClick={() => void remove(list)}
              >
                ×
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p>Salve o carrinho atual para repetir sua feira quando quiser.</p>
      )}
    </section>
  );
}

function SearchSuggestions({
  products,
  onSelect,
  compact = false,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
  compact?: boolean;
}) {
  if (!products.length) return null;
  return (
    <div
      className={compact ? "search-suggestions compact" : "search-suggestions"}
      role="listbox"
      aria-label="Sugestões de produtos"
    >
      {products.map((product) => (
        <button
          type="button"
          key={product.id}
          onClick={() => onSelect(product)}
          role="option"
          aria-selected="false"
        >
          <Image
            src={product.imageUrl}
            alt=""
            width={44}
            height={44}
            unoptimized
          />
          <span>
            <b>{product.name}</b>
            <small>
              {product.brand ? `${product.brand} · ` : ""}
              {product.categoryName}
            </small>
          </span>
          <strong>{money(productPrice(product))}</strong>
        </button>
      ))}
    </div>
  );
}

function ProductCard({
  product: p,
  quantity,
  optionId,
  favorite,
  index,
  reduceMotion,
  onAdd,
  onChange,
  onFavorite,
  onView,
  onShare,
}: {
  product: Product;
  quantity: number;
  optionId?: string;
  favorite: boolean;
  index: number;
  reduceMotion: boolean;
  onAdd: () => void;
  onChange: (n: number) => void;
  onFavorite: () => void;
  onView: () => void;
  onShare: () => void;
}) {
  const currentPrice = productPrice(p, optionId);
  const previousPrice = productOldPrice(p, optionId);
  const discount = previousPrice
    ? Math.round((1 - currentPrice / previousPrice) * 100)
    : 0;
  return (
    <m.article
      layout
      className="product-card"
      initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
      transition={{
        layout: { type: "spring", stiffness: 280, damping: 28 },
        opacity: { duration: 0.28, delay: Math.min(index, 5) * 0.035 },
        y: { duration: 0.42, delay: Math.min(index, 5) * 0.035 },
      }}
      whileHover={reduceMotion ? undefined : { y: -9 }}
    >
      <div className="product-image">
        <button
          className="image-click"
          onClick={onView}
          aria-label={`Ver ${p.name}`}
        >
          <Image
            src={p.imageUrl}
            alt={p.name}
            fill
            sizes="(max-width:720px) 50vw, (max-width:1180px) 33vw, 25vw"
            unoptimized
          />
        </button>
        {p.badge && <span className="badge">{p.badge}</span>}
        <div className="card-actions">
          <button
            onClick={onFavorite}
            className={favorite ? "favorite active" : "favorite"}
            aria-label="Favoritar"
          >
            <Icon
              name="heart"
              size={17}
              fill={favorite ? "currentColor" : "none"}
            />
          </button>
          <button onClick={onShare} aria-label="Compartilhar">
            <Icon name="share" size={16} />
          </button>
        </div>
      </div>
      <div className="product-info">
        <small>{p.categoryName}</small>
        <button className="product-name" onClick={onView}>
          <h3>{p.name}</h3>
        </button>
        <p>
          {p.saleMode === "weight" ? "Venda por peso" : p.unit} · Estoque{" "}
          {p.stockQuantity > 10 ? "disponível" : "limitado"}
        </p>
        {p.options.length > 1 ? (
          <small className="product-options-badge">
            {p.options.length} tamanhos disponíveis
          </small>
        ) : null}
        <div className="product-bottom">
          <div className="price-block">
            {previousPrice && <del>{money(previousPrice)}</del>}
            <strong>{money(currentPrice)}</strong>
            {p.saleMode === "weight" ? <small>por kg</small> : null}
            {discount > 0 ? (
              <small className="discount-inline">Economize {discount}%</small>
            ) : null}
          </div>
          {quantity ? (
            <div className="qty">
              <button onClick={() => onChange(-1)}>
                <Icon name="minus" size={15} />
              </button>
              <AnimatePresence mode="wait" initial={false}>
                <m.b
                  key={quantity}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.55 }}
                  transition={{ duration: 0.16 }}
                >
                  {formatQuantity(p, quantity)}
                </m.b>
              </AnimatePresence>
              <button onClick={() => onChange(1)}>
                <Icon name="plus" size={15} />
              </button>
            </div>
          ) : (
            <button
              className="add-text"
              onClick={(event) => {
                launchProductFlight(event.currentTarget, p.name);
                onAdd();
              }}
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </m.article>
  );
}
function CheckoutModal({
  customer,
  setCustomer,
  zones,
  allowDelivery,
  allowPickup,
  subtotal,
  delivery,
  total,
  error,
  submitting,
  onClose,
  onSubmit,
}: {
  customer: CheckoutCustomer;
  setCustomer: React.Dispatch<React.SetStateAction<CheckoutCustomer>>;
  zones: DeliveryZone[];
  allowDelivery: boolean;
  allowPickup: boolean;
  subtotal: number;
  delivery: number;
  total: number;
  error: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [cepStatus, setCepStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [cepMessage, setCepMessage] = useState("");
  const lastCep = useRef("");
  const field = (key: keyof CheckoutCustomer, value: string) =>
    setCustomer((c) => ({ ...c, [key]: value }));
  const lookupCep = async () => {
    const cep = customer.postalCode.replace(/\D/g, "");
    if (cep.length !== 8) {
      setCepStatus("error");
      setCepMessage("Digite os 8 números do CEP.");
      return;
    }
    if (lastCep.current === cep && cepStatus === "success") return;
    setCepStatus("loading");
    setCepMessage("Consultando endereço...");
    try {
      const response = await fetch(`/api/cep/${cep}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "CEP não encontrado");
      const normalize = (value: string) =>
        value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      const matchedZone = zones.find((zone) => {
        const zoneName = normalize(zone.name);
        const neighborhood = normalize(String(data.neighborhood || ""));
        return zoneName === neighborhood || neighborhood.includes(zoneName);
      });
      setCustomer((current) => ({
        ...current,
        postalCode: String(data.cep || current.postalCode),
        city: String(data.city || current.city),
        state: String(data.state || current.state),
        address:
          [data.street, data.neighborhood].filter(Boolean).join(", ") ||
          current.address,
        neighborhood: matchedZone?.id || current.neighborhood,
      }));
      lastCep.current = cep;
      setCepStatus("success");
      setCepMessage(
        matchedZone
          ? `Endereço localizado e área “${matchedZone.name}” selecionada.`
          : "Endereço localizado. Selecione sua área de entrega.",
      );
    } catch (lookupError) {
      setCepStatus("error");
      setCepMessage(
        lookupError instanceof Error
          ? lookupError.message
          : "Preencha o endereço manualmente.",
      );
    }
  };
  return (
    <m.div
      className="modal-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <m.button
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Fechar identificação"
      />
      <m.form
        className="checkout-modal"
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        initial={{ opacity: 0, y: 34, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="modal-title">
          <div>
            <span>ÚLTIMA ETAPA</span>
            <h2 id="checkout-title">Identificação e entrega</h2>
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <CheckoutJourney active={2} />
        <div className="checkout-grid">
          <label>
            Nome completo
            <input
              required
              value={customer.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder="Como devemos chamar você?"
            />
          </label>
          <label>
            WhatsApp
            <input
              required
              inputMode="tel"
              value={customer.phone}
              onChange={(e) => field("phone", e.target.value)}
              placeholder="(82) 99999-9999"
            />
          </label>
          <label>
            Recebimento
            <select
              value={customer.deliveryType}
              onChange={(e) => field("deliveryType", e.target.value)}
            >
              {allowDelivery && (
                <option value="delivery">Entrega em casa</option>
              )}
              {allowPickup && <option value="pickup">Retirada na loja</option>}
            </select>
          </label>
          {customer.deliveryType === "delivery" && (
            <>
              <label>
                CEP
                <span className="cep-field">
                  <input
                    required
                    inputMode="numeric"
                    value={customer.postalCode}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 8);
                      field(
                        "postalCode",
                        digits.length > 5
                          ? `${digits.slice(0, 5)}-${digits.slice(5)}`
                          : digits,
                      );
                      setCepStatus("idle");
                    }}
                    onBlur={() => void lookupCep()}
                    placeholder="00000-000"
                  />
                  <button
                    type="button"
                    onClick={() => void lookupCep()}
                    disabled={cepStatus === "loading"}
                  >
                    {cepStatus === "loading" ? "Buscando..." : "Buscar"}
                  </button>
                </span>
                {cepMessage ? (
                  <small className={`cep-message ${cepStatus}`}>
                    {cepMessage}
                  </small>
                ) : null}
              </label>
              <label>
                Bairro / área
                <select
                  required
                  value={customer.neighborhood}
                  onChange={(e) => field("neighborhood", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} — {money(z.feeCents)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="full">
                Endereço completo
                <input
                  required
                  value={customer.address}
                  onChange={(e) => field("address", e.target.value)}
                  placeholder="Rua, número e complemento"
                />
              </label>
              <label>
                Cidade
                <input
                  required
                  value={customer.city}
                  onChange={(e) => field("city", e.target.value)}
                  placeholder="Sua cidade"
                />
              </label>
              <label>
                Estado
                <input
                  required
                  maxLength={2}
                  value={customer.state}
                  onChange={(e) => field("state", e.target.value.toUpperCase())}
                  placeholder="UF"
                />
              </label>
              <label className="full">
                Ponto de referência
                <input
                  value={customer.reference}
                  onChange={(e) => field("reference", e.target.value)}
                  placeholder="Próximo a..."
                />
              </label>
            </>
          )}
          <label>
            Forma de pagamento
            <select
              value={customer.paymentMethod}
              onChange={(e) => field("paymentMethod", e.target.value)}
            >
              <option>PIX</option>
              <option>Dinheiro</option>
              <option>Cartão de débito</option>
              <option>Cartão de crédito</option>
            </select>
          </label>
          {customer.paymentMethod === "Dinheiro" && (
            <label>
              Troco para
              <input
                inputMode="decimal"
                value={customer.changeFor}
                onChange={(e) => field("changeFor", e.target.value)}
                placeholder="Ex.: 100,00"
              />
            </label>
          )}
          <label>
            Horário
            <select
              value={customer.scheduledFor}
              onChange={(e) => field("scheduledFor", e.target.value)}
            >
              <option>Assim que possível</option>
              <option>Manhã</option>
              <option>Tarde</option>
              <option>Noite</option>
            </select>
          </label>
          <label>
            Substituições
            <select
              value={customer.substitution}
              onChange={(e) => field("substitution", e.target.value)}
            >
              <option>Confirmar antes de substituir</option>
              <option>Pode substituir por similar</option>
              <option>Não substituir</option>
            </select>
          </label>
          <label className="full">
            Cupom
            <input
              value={customer.couponCode}
              onChange={(e) =>
                field("couponCode", e.target.value.toUpperCase())
              }
              placeholder="Ex.: BEMVINDO10"
            />
          </label>
          <label className="full">
            Código de indicação (opcional)
            <input
              value={customer.referralCode}
              onChange={(e) =>
                field("referralCode", e.target.value.toUpperCase())
              }
              placeholder="Ex.: SCAMIGO12"
            />
          </label>
          <label className="full">
            Observações
            <textarea
              value={customer.notes}
              onChange={(e) => field("notes", e.target.value)}
              placeholder="Preferências, corte da carne, maturação das frutas..."
            />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="checkout-sticky-summary">
          <div className="checkout-total">
            <div>
              <span>Produtos</span>
              <b>{money(subtotal)}</b>
            </div>
            <div>
              <span>Entrega</span>
              <b>
                {customer.deliveryType === "pickup"
                  ? "Retirada"
                  : money(delivery)}
              </b>
            </div>
            <div className="grand">
              <span>Total estimado</span>
              <b>{money(total)}</b>
            </div>
          </div>
          <button className="checkout submit" disabled={submitting}>
            {submitting ? (
              "Registrando pedido..."
            ) : (
              <>
                <Icon name="whatsapp" /> Registrar e abrir WhatsApp
              </>
            )}
          </button>
          <small className="checkout-note">
            Os valores e a disponibilidade serão confirmados pela equipe.
          </small>
        </div>
      </m.form>
    </m.div>
  );
}
function ProductQuickView({
  product: p,
  favorite,
  onClose,
  onAdd,
  onFavorite,
  onShare,
}: {
  product: Product;
  favorite: boolean;
  onClose: () => void;
  onAdd: () => void;
  onFavorite: () => void;
  onShare: () => void;
}) {
  return (
    <m.div
      className="modal-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <m.button
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Fechar detalhes do produto"
      />
      <m.article
        className="quick-view"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`quick-view-${p.id}`}
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 29 }}
      >
        <button className="quick-close" onClick={onClose}>
          <Icon name="close" />
        </button>
        <div className="quick-image">
          <Image
            src={p.imageUrl}
            alt={p.name}
            fill
            sizes="(max-width:700px) 90vw,45vw"
            unoptimized
          />
          {p.badge && <span className="badge">{p.badge}</span>}
        </div>
        <div className="quick-copy">
          <span>
            {p.categoryName} · {p.sku}
          </span>
          <h2 id={`quick-view-${p.id}`}>{p.name}</h2>
          <p>{p.description}</p>
          <small>
            {p.unit} · {p.stockQuantity} disponíveis
          </small>
          <div className="quick-price">
            {p.oldPriceCents && <del>{money(p.oldPriceCents)}</del>}
            <strong>{money(p.priceCents)}</strong>
          </div>
          <button className="primary-btn" onClick={onAdd}>
            <Icon name="cart" /> Adicionar ao carrinho
          </button>
          <div className="quick-tools">
            <button onClick={onFavorite}>
              <Icon name="heart" fill={favorite ? "currentColor" : "none"} />{" "}
              {favorite ? "Salvo" : "Favoritar"}
            </button>
            <button onClick={onShare}>
              <Icon name="share" /> Compartilhar
            </button>
            <Link href={`/produto/${p.slug}`}>
              Ver página completa <Icon name="arrow" size={15} />
            </Link>
          </div>
        </div>
      </m.article>
    </m.div>
  );
}
