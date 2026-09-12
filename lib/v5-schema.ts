import { database } from "@/lib/database";
let completed = false;
export async function ensureV5SecuritySchema() {
  if (completed) return true;
  try {
    await database().prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash VARCHAR(64) PRIMARY KEY,
      staff_id VARCHAR(255) NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ NOT NULL
    )`).run();
    await database().prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (
      subject_hash VARCHAR(64) PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      locked_until TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).run();
    completed = true;
    return true;
  } catch (error) {
    console.warn("security-schema-unavailable", error);
    return false;
  }
}
