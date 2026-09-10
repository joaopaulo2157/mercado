import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type ChatGPTUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_FULL_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";
const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";
const CHATGPT_SIGN_IN_PATH = "/signin-with-chatgpt";
const CHATGPT_SIGN_OUT_PATH = "/signout-with-chatgpt";
const CALLBACK_PATH = "/callback";
export const ADMIN_SESSION_COOKIE = "sc_admin_session";
const SESSION_HOURS = 12;

type SessionPayload = {
  email: string;
  exp: number;
};

const authMode = () =>
  String(process.env.AUTH_MODE || "local")
    .trim()
    .toLowerCase();

export function configuredAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function sessionSecret() {
  return String(process.env.ADMIN_SESSION_SECRET || "");
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  const secret = sessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createAdminSessionToken(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!sessionSecret())
    throw new Error(
      "Defina ADMIN_SESSION_SECRET antes de usar o login administrativo.",
    );
  const payload: SessionPayload = {
    email: normalized,
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSessionToken(token: string): SessionPayload | null {
  const [encoded, signature, ...extra] = token.split(".");
  if (!encoded || !signature || extra.length || !sessionSecret()) return null;
  const expected = sign(encoded);
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    const email = String(payload.email || "").trim().toLowerCase();
    if (!email || !Number.isFinite(payload.exp) || payload.exp <= Date.now())
      return null;
    return { email, exp: payload.exp };
  } catch {
    return null;
  }
}

export function verifyAdminPassword(password: string) {
  const expected = String(process.env.ADMIN_PASSWORD || "");
  if (!expected) return false;
  const left = createHash("sha256").update(password).digest("hex");
  const right = createHash("sha256").update(expected).digest("hex");
  return safeEqual(left, right);
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  // Mantém compatibilidade com o ambiente ChatGPT/Sites quando esses cabeçalhos
  // forem injetados pelo provedor.
  const requestHeaders = await headers();
  const emailFromHeader = requestHeaders.get(USER_EMAIL_HEADER);
  if (emailFromHeader) {
    const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
    const fullName =
      encodedFullName &&
      requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
        ? safeDecodeURIComponent(encodedFullName)
        : null;
    return {
      displayName: fullName ?? emailFromHeader,
      email: emailFromHeader.trim().toLowerCase(),
      fullName,
    };
  }

  // Em hospedagens comuns, usa sessão HttpOnly assinada pelo próprio projeto.
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? verifyAdminSessionToken(token) : null;
  if (!session) return null;
  return {
    displayName: session.email,
    email: session.email,
    fullName: null,
  };
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  if (authMode() === "chatgpt")
    return `${CHATGPT_SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
  return `/admin/login?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  if (authMode() === "chatgpt")
    return `${CHATGPT_SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
  return `/api/admin/session?logout=1&return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === CHATGPT_SIGN_IN_PATH ||
    pathname === CHATGPT_SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH ||
    pathname === "/admin/login" ||
    pathname === "/api/admin/session"
  );
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
