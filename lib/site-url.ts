const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

function withProtocol(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function publicSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (configured) {
    try {
      return trimTrailingSlash(new URL(withProtocol(configured)).origin);
    } catch {}
  }

  return "http://localhost:3000";
}

export function absoluteSiteUrl(path = "/") {
  const base = publicSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
