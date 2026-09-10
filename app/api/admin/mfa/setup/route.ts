import QRCode from "qrcode";
import { can, requireAdminApi } from "@/lib/admin-auth";
import { generateTotpSecret, totpProvisioningUri } from "@/lib/totp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))
  )
    return Response.json({ error: "Origem não permitida" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 16_384)
    return Response.json({ error: "Requisição inválida" }, { status: 413 });

  const auth = await requireAdminApi();
  if (!auth.ok)
    return Response.json({ error: auth.error }, { status: auth.status });
  if (!can(auth.role, "team.manage", auth.permissions))
    return Response.json({ error: "Seu perfil não pode configurar 2FA da equipe" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
  if (!email.includes("@"))
    return Response.json({ error: "Informe o e-mail do membro antes de gerar o 2FA" }, { status: 400 });

  const secret = generateTotpSecret();
  const uri = totpProvisioningUri(secret, email);
  const qrDataUrl = await QRCode.toDataURL(uri, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return Response.json(
    { ok: true, secret, qrDataUrl },
    { headers: { "Cache-Control": "no-store" } },
  );
}
