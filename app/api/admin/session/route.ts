import {
  ADMIN_SESSION_COOKIE,
  adminAuthMode,
  configuredAdminEmails,
  createAdminSessionToken,
  safeRelativeReturnPath,
  verifyAdminPassword,
} from "@/app/chatgpt-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function clearSession(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeRelativeReturnPath(url.searchParams.get("return_to") || "/");
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  if (url.searchParams.get("logout") === "1") clearSession(response);
  return response;
}

export async function POST(request: Request) {
  if (adminAuthMode() !== "local")
    return NextResponse.json({ error: "Login local desativado" }, { status: 403 });

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });

  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const returnTo = safeRelativeReturnPath(String(form.get("returnTo") || "/admin"));

  const allowed = configuredAdminEmails().includes(email);
  if (!allowed || !verifyAdminPassword(password)) {
    const failed = new URL("/admin/login", request.url);
    failed.searchParams.set("error", "1");
    failed.searchParams.set("return_to", returnTo);
    if (email) failed.searchParams.set("email", email);
    return NextResponse.redirect(failed, 303);
  }

  const token = createAdminSessionToken(email);
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
