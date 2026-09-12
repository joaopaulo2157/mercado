import { Pool, type PoolClient, type QueryResultRow } from "pg";

type SqlRow = Record<string, unknown>;
type SqlParameter = string | number | bigint | boolean | Date | null | Buffer | Uint8Array;

type SqlMeta = {
  changes: number;
  last_row_id: number;
  rows_read: number;
  rows_written: number;
};

export type SqlResult<T = SqlRow> = {
  results: T[];
  success: true;
  meta: SqlMeta;
};

function connectionString() {
  const url = (process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || "").trim();
  if (!url) {
    throw new Error(
      "Supabase não configurado. Defina DATABASE_URL com a Connection String PostgreSQL do Supabase.",
    );
  }
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error("DATABASE_URL deve utilizar postgres:// ou postgresql://.");
  }
  return url;
}

let pool: Pool | null = null;

export function getSqlPool(): Pool {
  if (!pool) {
    const url = connectionString();
    const parsed = new URL(url);
    const sslRequired = /supabase\.(co|com)$/i.test(parsed.hostname) || /pooler\.supabase\.com$/i.test(parsed.hostname);
    pool = new Pool({
      connectionString: url,
      max: Math.max(1, Number(process.env.DB_CONNECTION_LIMIT || 5)),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

function normalizeParameter(value: unknown): SqlParameter {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (["string", "number", "bigint", "boolean"].includes(typeof value)) return value as SqlParameter;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function normalizeRows<T>(rows: QueryResultRow[]): T[] {
  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeValue(value)])),
  ) as T[];
}

function pgQuery(query: string) {
  let index = 0;
  return query.replace(/\?/g, () => `$${++index}`).replace(/`([^`]+)`/g, '"$1"');
}

async function executeOn<T = SqlRow>(
  executor: Pool | PoolClient,
  query: string,
  params: unknown[],
): Promise<SqlResult<T>> {
  const values = params.map(normalizeParameter);
  const result = await executor.query(pgQuery(query), values);
  const results = normalizeRows<T>(result.rows);
  const rowCount = Number(result.rowCount || 0);
  const first = result.rows[0] as Record<string, unknown> | undefined;
  return {
    results,
    success: true,
    meta: {
      changes: rowCount,
      last_row_id: Number(first?.id || 0),
      rows_read: results.length,
      rows_written: /^(INSERT|UPDATE|DELETE)/i.test(query.trim()) ? rowCount : 0,
    },
  };
}

export class SqlPreparedStatement {
  readonly query: string;
  readonly params: unknown[];
  constructor(query: string, params: unknown[] = []) {
    this.query = query;
    this.params = params;
  }
  bind(...values: unknown[]) {
    return new SqlPreparedStatement(this.query, values);
  }
  async all<T = SqlRow>() {
    return executeOn<T>(getSqlPool(), this.query, this.params);
  }
  async first<T = SqlRow>() {
    const result = await this.all<T>();
    return result.results[0] ?? null;
  }
  async run<T = SqlRow>() {
    return executeOn<T>(getSqlPool(), this.query, this.params);
  }
}

class SqlDatabaseCompat {
  prepare(query: string) {
    return new SqlPreparedStatement(query);
  }
  async batch<T = SqlRow>(statements: SqlPreparedStatement[]) {
    const client = await getSqlPool().connect();
    try {
      await client.query("BEGIN");
      const results: SqlResult<T>[] = [];
      for (const statement of statements) {
        results.push(await executeOn<T>(client, statement.query, statement.params));
      }
      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

let compat: SqlDatabaseCompat | null = null;
export function sqlDatabase() {
  compat ??= new SqlDatabaseCompat();
  return compat;
}
