import { database } from "@/lib/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const configured = (value: string | undefined) => Boolean(value?.trim());

export async function GET() {
  const env = {
    database:
      configured(process.env.DATABASE_URL) ||
      (configured(process.env.DB_HOST) &&
        configured(process.env.DB_USER) &&
        configured(process.env.DB_NAME)),
    adminEmails: configured(process.env.ADMIN_EMAILS),
    adminPassword: configured(process.env.ADMIN_PASSWORD),
    sessionSecret:
      configured(process.env.ADMIN_SESSION_SECRET) &&
      String(process.env.ADMIN_SESSION_SECRET).length >= 32,
    authMode:
      String(process.env.AUTH_MODE || "local").toLowerCase() === "chatgpt"
        ? "chatgpt"
        : "local",
  };

  let databaseOk = false;
  let databaseError = "";

  if (env.database) {
    try {
      await database().prepare("SELECT 1 AS ok").first<{ ok: number }>();
      databaseOk = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message.slice(0, 180) : "Falha de conexão";
    }
  }

  const ready =
    databaseOk &&
    env.adminEmails &&
    (env.authMode === "chatgpt" || (env.adminPassword && env.sessionSecret));

  return Response.json(
    {
      ok: ready,
      service: "sc-supermercado-central",
      runtime: "nextjs-node",
      database: { configured: env.database, connected: databaseOk },
      admin: {
        authMode: env.authMode,
        emailsConfigured: env.adminEmails,
        passwordConfigured: env.adminPassword,
        sessionSecretConfigured: env.sessionSecret,
      },
      error: databaseError || undefined,
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
