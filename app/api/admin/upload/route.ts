import { can, requireAdminApi } from "@/lib/admin-auth";
import { audit, database } from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Origem não permitida" }, { status: 403 });

  const auth = await requireAdminApi();
  if (!auth.ok)
    return Response.json({ error: auth.error }, { status: auth.status });

  if (
    !can(auth.role, "catalog", auth.permissions) &&
    !can(auth.role, "marketing.manage", auth.permissions)
  )
    return Response.json(
      { error: "Seu perfil não pode enviar imagens do site" },
      { status: 403 },
    );

  try {
    const form = await request.formData();
    const file = form.get("file");
    const requestedScope = String(form.get("scope") || "products");
    const scope = requestedScope === "homepage" ? "homepage" : "products";

    if (!(file instanceof File))
      return Response.json({ error: "Selecione uma imagem" }, { status: 400 });
    if (file.size > 6 * 1024 * 1024)
      return Response.json(
        { error: "A imagem deve ter no máximo 6 MB" },
        { status: 413 },
      );
    if (
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.type,
      )
    )
      return Response.json(
        { error: "Formato de imagem não permitido" },
        { status: 415 },
      );

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const key = `${scope}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    await database()
      .prepare(
        "INSERT INTO media_files(`key`,content_type,data_blob,size_bytes,uploaded_by) VALUES(?,?,?,?,?)",
      )
      .bind(key, file.type, bytes, bytes.byteLength, auth.user.email)
      .run();

    await audit(auth.user.email, "upload", `${scope}_image`, key, {
      size: file.size,
      type: file.type,
      storage: "mysql",
    });

    return Response.json({
      ok: true,
      url: `/media/${key
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/")}`,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha no upload" },
      { status: 500 },
    );
  }
}
