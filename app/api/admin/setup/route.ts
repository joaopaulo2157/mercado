import { randomUUID } from "node:crypto";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "@/app/chatgpt-auth";
import { adminIsConfigured } from "@/lib/admin-auth";
import { hashAdminPassword } from "@/lib/admin-password";
import { database } from "@/lib/database";
import { ensureV5SecuritySchema } from "@/lib/v5-schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function fail(request: Request, message: string) {
  const url = new URL("/admin/setup", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
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
    return NextResponse.json({ error: "Banco indisponível" }, { status: 503 });

  if (await adminIsConfigured()) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const name = String(form.get("name") || "").trim().slice(0, 120);
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 180);
  const password = String(form.get("password") || "").slice(0, 256);
  const confirmPassword = String(form.get("confirmPassword") || "").slice(0, 256);

  if (name.length < 2) return fail(request, "Informe seu nome.");
  if (!email.includes("@")) return fail(request, "Informe um e-mail válido.");
  if (password !== confirmPassword) return fail(request, "As senhas não coincidem.");

  let credentials: { hash: string; salt: string };
  try {
    credentials = hashAdminPassword(password);
  } catch (error) {
    return fail(request, error instanceof Error ? error.message : "Senha inválida.");
  }

  // Segunda verificação reduz risco de duas criações simultâneas.
  if (await adminIsConfigured()) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const id = `owner-${randomUUID()}`;
  try {
    await database()
      .prepare(
        "INSERT INTO staff(id,email,name,role,permissions_json,mfa_required,active,password_hash,password_salt,password_updated_at,created_at,updated_at) VALUES(?,?,?,?,?,0,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
      )
      .bind(id, email, name, "owner", "[]", credentials.hash, credentials.salt)
      .run();
  } catch (error) {
    console.error("admin-setup-failed", error);
    return fail(request, "Não foi possível criar o administrador. Verifique a conexão com o Supabase.");
  }

  const token = await createAdminSessionToken(email, id);
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
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
