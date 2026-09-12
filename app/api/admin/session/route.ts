import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  deleteAdminSessionToken,
  safeRelativeReturnPath,
} from "@/app/chatgpt-auth";
import { adminIsConfigured } from "@/lib/admin-auth";
import {
  adminLoginStatus,
  clearAdminLoginFailures,
  registerFailedAdminLogin,
} from "@/lib/admin-login-security";
import { verifyAdminPasswordHash } from "@/lib/admin-password";
import { database } from "@/lib/database";
import { ensureV5SecuritySchema } from "@/lib/v5-schema";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

function redirectLoginFailure(request: Request, returnTo: string, email: string, error: string) {
  const failed = new URL("/admin/login", request.url);
  failed.searchParams.set("error", error);
  failed.searchParams.set("return_to", returnTo);
  if (email) failed.searchParams.set("email", email);
  return NextResponse.redirect(failed, 303);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeRelativeReturnPath(url.searchParams.get("return_to") || "/");
  if (url.searchParams.get("logout") === "1") {
    const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value || "";
    await deleteAdminSessionToken(token);
  }
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  clearSessionCookie(response);
  return response;
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    (origin && origin !== requestUrl.origin) ||
    (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))
  ) {
    return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  }

  if (!(await ensureV5SecuritySchema()))
    return NextResponse.json({ error: "Banco de segurança indisponível" }, { status: 503 });

  if (!(await adminIsConfigured())) {
    return NextResponse.redirect(new URL("/admin/setup", request.url), 303);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_384)
    return NextResponse.json({ error: "Requisição inválida" }, { status: 413 });

  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 255);
  const password = String(form.get("password") || "").slice(0, 256);
  const returnTo = safeRelativeReturnPath(String(form.get("returnTo") || "/admin"));

  const rate = await adminLoginStatus(email || "unknown", request);
  if (rate.blocked) {
    const response = redirectLoginFailure(request, returnTo, email, "locked");
    response.headers.set("Retry-After", String(Math.max(1, rate.retryAfterSeconds)));
    return response;
  }

  const staff = email
    ? await database()
        .prepare(
          "SELECT id,email,name,password_hash,password_salt FROM staff WHERE lower(email)=? AND active=1 LIMIT 1",
        )
        .bind(email)
        .first<{
          id: string;
          email: string;
          name: string;
          password_hash: string;
          password_salt: string;
        }>()
    : null;

  const authenticated = Boolean(
    staff &&
      verifyAdminPasswordHash(
        password,
        String(staff.password_salt || ""),
        String(staff.password_hash || ""),
      ),
  );

  if (!authenticated || !staff) {
    await registerFailedAdminLogin(email || "unknown", request);
    return redirectLoginFailure(request, returnTo, email, "invalid");
  }

  await clearAdminLoginFailures(email, request);
  const token = await createAdminSessionToken(email, String(staff.id));
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
