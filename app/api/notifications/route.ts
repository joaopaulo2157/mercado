import { database } from "@/lib/database";

export async function GET() {
  try {
    const rows = await database()
      .prepare(
        "SELECT id,title,body,url,active,published_at,expires_at FROM store_notifications WHERE active=1 AND (published_at IS NULL OR published_at<=CURRENT_TIMESTAMP) AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP) ORDER BY COALESCE(published_at,created_at) DESC LIMIT 10",
      )
      .all<Record<string, unknown>>();
    return Response.json(
      rows.results.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        body: String(row.body),
        url: String(row.url || "/#ofertas"),
        active: Number(row.active) === 1,
        publishedAt: row.published_at ? String(row.published_at) : null,
        expiresAt: row.expires_at ? String(row.expires_at) : null,
      })),
      {
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
      },
    );
  } catch {
    return Response.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
