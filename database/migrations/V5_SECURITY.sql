-- SC SUPERMERCADO CENTRAL V5 - MIGRACAO DE SEGURANCA
-- Execute este arquivo uma vez em bancos que vieram da V4.

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  subject_hash VARCHAR(64) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  first_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_until DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subject_hash),
  KEY admin_login_attempts_locked_idx (locked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @db_name = DATABASE();

SET @sql = (
  SELECT IF(COUNT(*)=0,
    'ALTER TABLE staff ADD COLUMN password_hash VARCHAR(128) NOT NULL DEFAULT '''' AFTER permissions_json',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='staff' AND COLUMN_NAME='password_hash'
);
PREPARE sc_stmt FROM @sql; EXECUTE sc_stmt; DEALLOCATE PREPARE sc_stmt;

SET @sql = (
  SELECT IF(COUNT(*)=0,
    'ALTER TABLE staff ADD COLUMN password_salt VARCHAR(64) NOT NULL DEFAULT '''' AFTER password_hash',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='staff' AND COLUMN_NAME='password_salt'
);
PREPARE sc_stmt FROM @sql; EXECUTE sc_stmt; DEALLOCATE PREPARE sc_stmt;

SET @sql = (
  SELECT IF(COUNT(*)=0,
    'ALTER TABLE staff ADD COLUMN password_updated_at DATETIME NULL AFTER password_salt',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='staff' AND COLUMN_NAME='password_updated_at'
);
PREPARE sc_stmt FROM @sql; EXECUTE sc_stmt; DEALLOCATE PREPARE sc_stmt;

SET @sql = (
  SELECT IF(COUNT(*)=0,
    'ALTER TABLE staff ADD COLUMN totp_secret_enc VARCHAR(512) NOT NULL DEFAULT '''' AFTER password_updated_at',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='staff' AND COLUMN_NAME='totp_secret_enc'
);
PREPARE sc_stmt FROM @sql; EXECUTE sc_stmt; DEALLOCATE PREPARE sc_stmt;

SET @sql = (
  SELECT IF(COUNT(*)=0,
    'ALTER TABLE staff ADD COLUMN totp_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER totp_secret_enc',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='staff' AND COLUMN_NAME='totp_enabled'
);
PREPARE sc_stmt FROM @sql; EXECUTE sc_stmt; DEALLOCATE PREPARE sc_stmt;
