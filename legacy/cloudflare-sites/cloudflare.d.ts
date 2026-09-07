declare module "cloudflare:workers" {
  export const env: Record<string, unknown>;
}
interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: { last_row_id?: number | bigint; [key: string]: unknown };
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{
    results: T[];
    success: boolean;
    meta: Record<string, unknown>;
  }>;
  run<T = unknown>(): Promise<D1Result<T>>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}
interface R2ObjectBody {
  body: ReadableStream;
  httpEtag: string;
  text(): Promise<string>;
  writeHttpMetadata(headers: Headers): void;
}
interface R2ListedObject {
  key: string;
  size: number;
  uploaded?: Date;
  customMetadata?: Record<string, string>;
}
interface R2PutOptions {
  httpMetadata?: { contentType?: string; cacheControl?: string };
  customMetadata?: Record<string, string>;
}
interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream,
    options?: R2PutOptions,
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  list(options?: {
    prefix?: string;
    limit?: number;
    include?: ("httpMetadata" | "customMetadata")[];
  }): Promise<{ objects: R2ListedObject[] }>;
}
interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
