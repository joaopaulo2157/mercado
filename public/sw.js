const CACHE = "sc-central-v5-public";
const ASSET_CACHE = "sc-central-v5-assets";
const OFFLINE = "/offline";
const CACHEABLE_PAGES = new Set([
  "/privacidade",
  "/termos",
  "/entrega-e-retirada",
  "/trocas-e-cancelamentos",
]);

const SHELL = [
  OFFLINE,
  ...CACHEABLE_PAGES,
  "/assets/sc-supermercado-central-oficial.png",
  "/assets/logo-central-vertical.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/og.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![CACHE, ASSET_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function privatePath(pathname) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/acompanhar") ||
    pathname.startsWith("/meus-pedidos")
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || privatePath(url.pathname)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && CACHEABLE_PAGES.has(url.pathname)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          if (CACHEABLE_PAGES.has(url.pathname)) {
            const cached = await caches.match(event.request);
            if (cached) return cached;
          }
          return caches.match(OFFLINE);
        }),
    );
    return;
  }

  if (["style", "script", "image", "font"].includes(event.request.destination)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const network = fetch(event.request)
          .then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "Supermercado Central", body: "Tem oferta nova esperando por você.", url: "/#ofertas" };
  try {
    data = { ...data, ...(event.data?.json?.() || {}) };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/#ofertas" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
