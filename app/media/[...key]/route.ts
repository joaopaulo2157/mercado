import { database } from "@/lib/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const storageKey = key.join("/");
  if (!storageKey || storageKey.length > 190)
    return new Response("Not found", { status: 404 });

  const object = await database()
    .prepare(
      "SELECT content_type,data_blob,size_bytes FROM media_files WHERE `key`=? LIMIT 1",
    )
    .bind(storageKey)
    .first<{
      content_type: string;
      data_blob: Uint8Array;
      size_bytes: number;
    }>();

  if (!object) return new Response("Not found", { status: 404 });

  const bytes =
    object.data_blob instanceof Uint8Array
      ? object.data_blob
      : new Uint8Array(object.data_blob as ArrayBuffer);

  // Next.js 16 / TypeScript 5.9 require a BodyInit whose backing buffer is
  // explicitly an ArrayBuffer. MySQL can expose BLOB values as Buffer/Uint8Array
  // backed by ArrayBufferLike, so copy the bytes into a plain ArrayBuffer first.
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);

  return new Response(body, {
    headers: {
      "Content-Type": String(object.content_type || "application/octet-stream"),
      "Content-Length": String(object.size_bytes || body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
