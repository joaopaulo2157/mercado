import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

type SqlRow = Record<string, unknown>;

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

function databaseConfig() {
  const useSsl = /^(1|true|yes)$/i.test(process.env.DB_SSL ?? "");
  const common = {
    waitForConnections: true,
    connectionLimit: Math.max(1, Number(process.env.DB_CONNECTION_LIMIT || 10)),
    queueLimit: 0,
    charset: "utf8mb4",
    timezone: "Z" as const,
    decimalNumbers: true,
    ssl: useSsl
      ? {
          rejectUnauthorized: !/^(0|false|no)$/i.test(
            process.env.DB_SSL_REJECT_UNAUTHORIZED ?? "true",
          ),
        }
      : undefined,
  };

  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const parsed = new URL(url);
    if (!/^mysql:$/i.test(parsed.protocol)) {
      throw new Error("DATABASE_URL deve utilizar o protocolo mysql://.");
    }
    const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    if (!parsed.hostname || !parsed.username || !database) {
      throw new Error(
        "DATABASE_URL invÃ¡lida. Use mysql://usuario:senha@host:3306/banco.",
      );
    }
    return {
      ...common,
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database,
    };
  }

  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const database = process.env.DB_NAME?.trim();
  if (!host || !user || !database) {
    throw new Error(
      "Banco SQL nÃ£o configurado. Defina DATABASE_URL ou DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME.",
    );
  }

  return {
    ...common,
    host,
    port: Number(process.env.DB_PORT || 3306),
    user,
    password: process.env.DB_PASSWORD ?? "",
    database,
  };
}

let pool: Pool | null = null;

export function getSqlPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(databaseConfig());
  }
  return pool;
}

type SqlBindValue =
  | string
  | number
  | boolean
  | Date
  | Buffer
  | null;

function normalizeParameter(value: unknown): SqlBindValue {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "string") {
    const localDateTime = value.match(
      /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/,
    );
    if (localDateTime) {
      return `${localDateTime[1]} ${localDateTime[2]}:${localDateTime[3] ?? "00"}`;
    }

    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return parsed;
    }

    return value;
  }

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

function normalizeRows<T>(rows: RowDataPacket[]): T[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, normalizeValue(value)]),
    ),
  ) as T[];
}

async function executeOn<T = SqlRow>(
  executor: Pool | PoolConnection,
  query: string,
  params: unknown[],
): Promise<SqlResult<T>> {
  const values: SqlBindValue[] = params.map(normalizeParameter);
  const [raw] = await executor.execute(query, values as any);

  if (Array.isArray(raw)) {
    const results = normalizeRows<T>(raw as RowDataPacket[]);
    return {
      results,
      success: true,
      meta: {
        changes: 0,
        last_row_id: 0,
        rows_read: results.length,
        rows_written: 0,
      },
    };
  }

  const header = raw as ResultSetHeader;
  return {
    results: [],
    success: true,
    meta: {
      changes: Number(header.affectedRows || 0),
      last_row_id: Number(header.insertId || 0),
      rows_read: 0,
      rows_written: Number(header.affectedRows || 0),
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

  async all<T = SqlRow>(): Promise<SqlResult<T>> {
    return executeOn<T>(getSqlPool(), this.query, this.params);
  }

  async first<T = SqlRow>(): Promise<T | null> {
    const result = await this.all<T>();
    return result.results[0] ?? null;
  }

  async run<T = SqlRow>(): Promise<SqlResult<T>> {
    return executeOn<T>(getSqlPool(), this.query, this.params);
  }
}

class SqlDatabaseCompat {
  prepare(query: string) {
    return new SqlPreparedStatement(query);
  }

  async batch<T = SqlRow>(statements: SqlPreparedStatement[]): Promise<SqlResult<T>[]> {
    const connection = await getSqlPool().getConnection();
    try {
      await connection.beginTransaction();
      const results: SqlResult<T>[] = [];
      for (const statement of statements) {
        results.push(
          await executeOn<T>(connection, statement.query, statement.params),
        );
      }
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

let compat: SqlDatabaseCompat | null = null;

export function sqlDatabase() {
  compat ??= new SqlDatabaseCompat();
  return compat;
}


