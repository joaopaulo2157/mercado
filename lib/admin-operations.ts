import { database } from "@/lib/database";

type Row = Record<string, unknown>;

export type BackupSummary = {
  key: string;
  size: number;
  uploadedAt: string | null;
  reason: string;
  actorEmail: string;
};

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function deviceLabel(userAgent: string) {
  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Navegador";
  const system = userAgent.includes("Android")
    ? "Android"
    : userAgent.includes("iPhone") || userAgent.includes("iPad")
      ? "iOS"
      : userAgent.includes("Windows")
        ? "Windows"
        : userAgent.includes("Mac OS")
          ? "macOS"
          : userAgent.includes("Linux")
            ? "Linux"
            : "dispositivo desconhecido";
  return `${browser} em ${system}`;
}

export async function touchAdminDevice(request: Request, actorEmail: string) {
  const userAgent = String(request.headers.get("user-agent") || "").slice(
    0,
    500,
  );
  const id = (await sha256(`${actorEmail.toLowerCase()}|${userAgent}`)).slice(
    0,
    40,
  );
  await database()
    .prepare(
      "INSERT INTO admin_devices(id,actor_email,label,user_agent,last_seen_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET last_seen_at=CURRENT_TIMESTAMP,label=EXCLUDED.label,user_agent=EXCLUDED.user_agent",
    )
    .bind(id, actorEmail.toLowerCase(), deviceLabel(userAgent), userAgent)
    .run();
  return id;
}

export async function listCatalogBackups(): Promise<BackupSummary[]> {
  const rows = await database()
    .prepare(
      "SELECT `key`,size_bytes,created_at,reason,actor_email FROM catalog_backups ORDER BY created_at DESC LIMIT 30",
    )
    .all<{
      key: string;
      size_bytes: number;
      created_at: string;
      reason: string;
      actor_email: string;
    }>();
  return rows.results.map((item) => ({
    key: String(item.key),
    size: Number(item.size_bytes || 0),
    uploadedAt: item.created_at ? String(item.created_at) : null,
    reason: String(item.reason || "backup automático"),
    actorEmail: String(item.actor_email || "sistema"),
  }));
}

export async function saveCatalogBackup(
  data: unknown,
  actorEmail: string,
  reason = "backup automático",
  key?: string,
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const objectKey = key || `backups/catalog-${timestamp}.json`;
  const json = JSON.stringify(data, null, 2);
  await database()
    .prepare(
      "INSERT INTO catalog_backups(`key`,data_json,size_bytes,reason,actor_email) VALUES(?,?,?,?,?) ON CONFLICT (`key`) DO UPDATE SET data_json=EXCLUDED.data_json,size_bytes=EXCLUDED.size_bytes,reason=EXCLUDED.reason,actor_email=EXCLUDED.actor_email,created_at=CURRENT_TIMESTAMP",
    )
    .bind(
      objectKey,
      json,
      Buffer.byteLength(json, "utf8"),
      reason.slice(0, 255),
      actorEmail.slice(0, 255),
    )
    .run();
  return objectKey;
}

export async function readCatalogBackup(key: string) {
  if (!/^backups\/[a-zA-Z0-9._-]+\.json$/.test(key))
    throw new Error("Backup inválido");
  const row = await database()
    .prepare("SELECT data_json FROM catalog_backups WHERE `key`=? LIMIT 1")
    .bind(key)
    .first<{ data_json: string }>();
  if (!row) throw new Error("Backup não encontrado");
  const parsed = JSON.parse(String(row.data_json)) as Row;
  if (!Array.isArray(parsed.products))
    throw new Error("O arquivo não contém um catálogo restaurável");
  return parsed;
}

export async function recordInventoryMovement(input: {
  productId: string;
  movementType: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  actorEmail: string;
}) {
  const previous = Math.round(input.previousQuantity * 1000);
  const next = Math.round(input.newQuantity * 1000);
  if (previous === next) return;
  await database()
    .prepare(
      "INSERT INTO inventory_movements(product_id,movement_type,quantity_delta_millis,previous_quantity_millis,new_quantity_millis,reason,reference_type,reference_id,actor_email) VALUES(?,?,?,?,?,?,?,?,?)",
    )
    .bind(
      input.productId,
      input.movementType,
      next - previous,
      previous,
      next,
      input.reason.slice(0, 240),
      input.referenceType || "manual",
      input.referenceId || "",
      input.actorEmail,
    )
    .run();
}
