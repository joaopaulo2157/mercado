import { database } from "@/lib/database";

let completed = false;
let inFlight: Promise<boolean> | null = null;

async function columnExists(name: string) {
  const row = await database()
    .prepare(`SHOW COLUMNS FROM staff LIKE ?`)
    .bind(name)
    .first<Record<string, unknown>>();
  return Boolean(row);
}

async function migrate() {
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

    const columns: Array<[string, string]> = [
      ["password_hash", "ALTER TABLE staff ADD COLUMN password_hash VARCHAR(128) NOT NULL DEFAULT '' AFTER permissions_json"],
      ["password_salt", "ALTER TABLE staff ADD COLUMN password_salt VARCHAR(64) NOT NULL DEFAULT '' AFTER password_hash"],
      ["password_updated_at", "ALTER TABLE staff ADD COLUMN password_updated_at DATETIME NULL AFTER password_salt"],
      ["totp_secret_enc", "ALTER TABLE staff ADD COLUMN totp_secret_enc VARCHAR(512) NOT NULL DEFAULT '' AFTER password_updated_at"],
      ["totp_enabled", "ALTER TABLE staff ADD COLUMN totp_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER totp_secret_enc"],
    ];

    for (const [name, ddl] of columns) {
      if (!(await columnExists(name))) await database().prepare(ddl).run();
    }

    completed = true;
    return true;
  } catch (error) {
    console.warn("v5-security-schema-migration-needed", error);
    return false;
  }
}

export async function ensureV5SecuritySchema() {
  if (completed) return true;
  inFlight ??= migrate().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
