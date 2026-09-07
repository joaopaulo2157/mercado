import { DEFAULT_CATALOG } from "@/lib/default-data";
import { loadCatalog } from "@/lib/database";
export const dynamic="force-dynamic";
export async function GET(){try{return Response.json(await loadCatalog(),{headers:{"Cache-Control":"public, max-age=30, stale-while-revalidate=120"}})}catch(error){console.error("catalog-fallback",error);return Response.json({...DEFAULT_CATALOG,source:"fallback"},{headers:{"Cache-Control":"no-store"}})}}
