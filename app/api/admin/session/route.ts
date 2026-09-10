import {
  ADMIN_SESSION_COOKIE,
  configuredAdminEmails,
  createAdminSessionToken,
  safeRelativeReturnPath,
  verifyAdminPassword,
} from "@/app/chatgpt-auth";
import {
  adminLoginStatus,
  clearAdminLoginFailures,
  registerFailedAdminLogin,
} from "@/lib/admin-login-security";
import { NextResponse } from "next/server";
import { database } from "@/lib/database";
import { verifyAdminPasswordHash } from "@/lib/admin-password";
import { adminTotpConfigured, verifyAdminTotp, verifyTotp } from "@/lib/totp";
import { decryptTotpSecret } from "@/lib/admin-mfa";
import { ensureV5SecuritySchema } from "@/lib/v5-schema";

export const runtime = "nodejs";

function clearSession(response: NextResponse) {
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
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  if (url.searchParams.get("logout") === "1") clearSession(response);
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

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_384)
    return NextResponse.json({ error: "Requisição inválida" }, { status: 413 });

  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 255);
  const password = String(form.get("password") || "").slice(0, 512);
  const totp = String(form.get("totp") || "");
  const returnTo = safeRelativeReturnPath(String(form.get("returnTo") || "/admin"));

  const rate = await adminLoginStatus(email || "unknown", request);
  if (rate.blocked) {
    const response = redirectLoginFailure(request, returnTo, email, "locked");
    response.headers.set("Retry-After", String(Math.max(1, rate.retryAfterSeconds)));
    return response;
  }

  const ownerAuthenticated =
    configuredAdminEmails().includes(email) && verifyAdminPassword(password);
  let staffAuthenticated = false;
  let staffMfaSecret = "";
  let staffMfaRequired = false;
  let staffMfaMissing = false;
  if (!ownerAuthenticated && email) {
    try {
      await ensureV5SecuritySchema();
      const staff = await database()
        .prepare(
          "SELECT password_hash,password_salt,mfa_required,totp_enabled,totp_secret_enc,(SELECT require_mfa FROM security_settings WHERE id=1) AS global_mfa FROM staff WHERE lower(email)=? AND active=1 LIMIT 1",
        )
        .bind(email)
        .first<{
          password_hash: string;
          password_salt: string;
          mfa_required: number;
          totp_enabled: number;
          totp_secret_enc: string;
          global_mfa: number;
        }>();
      staffAuthenticated = Boolean(
        staff &&
          verifyAdminPasswordHash(
            password,
            String(staff.password_salt || ""),
            String(staff.password_hash || ""),
          ),
      );
      if (staffAuthenticated && staff) {
        const policyRequiresMfa =
          Number(staff.mfa_required || 0) === 1 || Number(staff.global_mfa || 0) === 1;
        const hasMfa =
          Number(staff.totp_enabled || 0) === 1 && Boolean(staff.totp_secret_enc);
        staffMfaMissing = policyRequiresMfa && !hasMfa;
        staffMfaRequired = policyRequiresMfa && hasMfa;
        if (staffMfaRequired)
          staffMfaSecret = decryptTotpSecret(String(staff.totp_secret_enc || ""));
      }
    } catch (error) {
      console.warn("staff-local-login-unavailable", error);
    }
  }

  if (!ownerAuthenticated && !staffAuthenticated) {
    await registerFailedAdminLogin(email || "unknown", request);
    return redirectLoginFailure(request, returnTo, email, "invalid");
  }

  if (staffAuthenticated && staffMfaMissing) {
    return redirectLoginFailure(request, returnTo, email, "mfa_setup");
  }
  if (ownerAuthenticated && adminTotpConfigured() && !verifyAdminTotp(totp)) {
    await registerFailedAdminLogin(email || "unknown", request);
    return redirectLoginFailure(request, returnTo, email, "mfa");
  }
  if (staffAuthenticated && staffMfaRequired && !verifyTotp(staffMfaSecret, totp)) {
    await registerFailedAdminLogin(email || "unknown", request);
    return redirectLoginFailure(request, returnTo, email, "mfa");
  }

  await clearAdminLoginFailures(email, request);
  const token = createAdminSessionToken(email);
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
