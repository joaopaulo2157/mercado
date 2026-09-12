import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { database } from "@/lib/database";

export type ChatGPTUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

export const ADMIN_SESSION_COOKIE = "sc_admin_session";
const SESSION_HOURS = 12;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSessionToken(email: string, staffId: string) {
  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
  await database()
    .prepare(
      "INSERT INTO admin_sessions(token_hash,staff_id,email,expires_at,last_seen_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)",
    )
    .bind(hash, staffId, email.trim().toLowerCase(), expiresAt)
    .run();
  return token;
}

export async function verifyAdminSessionToken(token: string) {
  if (!token) return null;
  const hash = tokenHash(token);
  const row = await database()
    .prepare(
      "SELECT s.staff_id,s.email,st.name FROM admin_sessions s JOIN staff st ON st.id=s.staff_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP AND st.active=1 LIMIT 1",
    )
    .bind(hash)
    .first<{ staff_id: string; email: string; name: string }>();
  if (!row) return null;
  await database()
    .prepare("UPDATE admin_sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE token_hash=?")
    .bind(hash)
    .run()
    .catch(() => {});
  return row;
}

export async function deleteAdminSessionToken(token: string) {
  if (!token) return;
  await database()
    .prepare("DELETE FROM admin_sessions WHERE token_hash=?")
    .bind(tokenHash(token))
    .run()
    .catch(() => {});
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "";
  const session = await verifyAdminSessionToken(token);
  if (!session) return null;
  return {
    displayName: session.name || session.email,
    email: session.email,
    fullName: session.name || null,
  };
}

export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string) {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `/admin/login?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/") {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
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
  if (["/admin/login", "/admin/setup", "/api/admin/session", "/api/admin/setup"].includes(url.pathname)) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
