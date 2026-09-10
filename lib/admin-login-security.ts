import { createHash } from "node:crypto";
import { database } from "@/lib/database";

type AttemptRow = {
  attempts: number;
  first_attempt_at: string | Date;
  locked_until: string | Date | null;
};

type MemoryAttempt = { attempts: number; firstAt: number; lockedUntil: number };

const MAX_ATTEMPTS = Math.max(3, Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS || 5));
const WINDOW_MINUTES = Math.max(5, Number(process.env.ADMIN_LOGIN_WINDOW_MINUTES || 15));
const LOCK_MINUTES = Math.max(5, Number(process.env.ADMIN_LOGIN_LOCK_MINUTES || 15));

const memory = new Map<string, MemoryAttempt>();
let tableReady = false;
let tableUnavailable = false;

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function hashSubject(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function subjectHashes(email: string, request: Request) {
  const normalized = email.trim().toLowerCase() || "unknown";
  const ip = clientIp(request);
  return [hashSubject(`account:${normalized}`), hashSubject(`ip:${ip}`)];
}

async function ensureTable() {
  if (tableReady || tableUnavailable) return tableReady;
  try {
    await database()
      .prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (
        subject_hash VARCHAR(64) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        first_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        locked_until DATETIME NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (subject_hash),
        KEY admin_login_attempts_locked_idx (locked_until)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
      .run();
    await database()
      .prepare("DELETE FROM admin_login_attempts WHERE updated_at<DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)")
      .run()
      .catch(() => {});
    tableReady = true;
  } catch (error) {
    tableUnavailable = true;
    console.warn("admin-login-rate-limit-table-unavailable", error);
  }
  return tableReady;
}

function asMs(value: string | Date | null | undefined) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function memoryStatus(key: string) {
  const current = memory.get(key);
  if (!current) return { blocked: false, retryAfterSeconds: 0 };
  const now = Date.now();
  if (current.lockedUntil > now)
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((current.lockedUntil - now) / 1000),
    };
  if (now - current.firstAt > WINDOW_MINUTES * 60_000) memory.delete(key);
  return { blocked: false, retryAfterSeconds: 0 };
}

export async function adminLoginStatus(email: string, request: Request) {
  const keys = subjectHashes(email, request);
  if (!(await ensureTable())) {
    const statuses = keys.map(memoryStatus);
    const blocked = statuses.filter((item) => item.blocked);
    return blocked.length
      ? {
          blocked: true,
          retryAfterSeconds: Math.max(...blocked.map((item) => item.retryAfterSeconds)),
        }
      : { blocked: false, retryAfterSeconds: 0 };
  }

  let retryAfterSeconds = 0;
  for (const key of keys) {
    const row = await database()
      .prepare("SELECT attempts,first_attempt_at,locked_until FROM admin_login_attempts WHERE subject_hash=?")
      .bind(key)
      .first<AttemptRow>();
    const lockedUntil = asMs(row?.locked_until);
    if (lockedUntil > Date.now())
      retryAfterSeconds = Math.max(
        retryAfterSeconds,
        Math.ceil((lockedUntil - Date.now()) / 1000),
      );
  }
  return { blocked: retryAfterSeconds > 0, retryAfterSeconds };
}

async function registerKeyFailure(key: string, now: number) {
  if (!tableReady) {
    const current = memory.get(key);
    const fresh = !current || now - current.firstAt > WINDOW_MINUTES * 60_000;
    const attempts = fresh ? 1 : current.attempts + 1;
    memory.set(key, {
      attempts,
      firstAt: fresh ? now : current.firstAt,
      lockedUntil: attempts >= MAX_ATTEMPTS ? now + LOCK_MINUTES * 60_000 : 0,
    });
    return;
  }

  const row = await database()
    .prepare("SELECT attempts,first_attempt_at FROM admin_login_attempts WHERE subject_hash=?")
    .bind(key)
    .first<AttemptRow>();
  const fresh = !row || now - asMs(row.first_attempt_at) > WINDOW_MINUTES * 60_000;
  const attempts = fresh ? 1 : Number(row?.attempts || 0) + 1;
  const firstAt = new Date(fresh ? now : asMs(row?.first_attempt_at)).toISOString();
  const lockedUntil =
    attempts >= MAX_ATTEMPTS ? new Date(now + LOCK_MINUTES * 60_000).toISOString() : null;
  await database()
    .prepare(`INSERT INTO admin_login_attempts(subject_hash,attempts,first_attempt_at,locked_until,updated_at)
      VALUES(?,?,?,?,CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE attempts=VALUES(attempts),first_attempt_at=VALUES(first_attempt_at),locked_until=VALUES(locked_until),updated_at=CURRENT_TIMESTAMP`)
    .bind(key, attempts, firstAt, lockedUntil)
    .run();
}

export async function registerFailedAdminLogin(email: string, request: Request) {
  const keys = subjectHashes(email, request);
  await ensureTable();
  const now = Date.now();
  for (const key of keys) await registerKeyFailure(key, now);
}

export async function clearAdminLoginFailures(email: string, request: Request) {
  const keys = subjectHashes(email, request);
  for (const key of keys) memory.delete(key);
  if (!(await ensureTable())) return;
  for (const key of keys)
    await database().prepare("DELETE FROM admin_login_attempts WHERE subject_hash=?").bind(key).run();
}
