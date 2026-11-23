const pool = require('./db');

async function migrateSecurity() {
  console.log('[Security Migration] Initializing enterprise security tables & schema updates...');

  // 1. Ensure security_audit_logs table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS security_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      username VARCHAR(100) NULL,
      action VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
      ip_address VARCHAR(45) NULL,
      user_agent VARCHAR(255) NULL,
      details JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_user (user_id),
      INDEX idx_audit_action (action),
      INDEX idx_audit_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[Security Migration] security_audit_logs table ensured.');

  // 2. Ensure revoked_tokens table exists for secure logout & session revocation
  await pool.query(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      user_id INT NULL,
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_revoked_hash (token_hash),
      INDEX idx_revoked_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[Security Migration] revoked_tokens table ensured.');

  // 3. Add MFA & Account Security columns to users table safely if not already present
  const columnsToAdd = [
    { name: 'mfa_enabled', def: 'BOOLEAN NOT NULL DEFAULT FALSE' },
    { name: 'mfa_secret', def: 'VARCHAR(255) NULL' },
    { name: 'mfa_backup_codes', def: 'JSON NULL' },
    { name: 'failed_login_attempts', def: 'INT NOT NULL DEFAULT 0' },
    { name: 'account_locked_until', def: 'TIMESTAMP NULL' },
    { name: 'last_login_at', def: 'TIMESTAMP NULL' },
    { name: 'last_login_ip', def: 'VARCHAR(45) NULL' }
  ];

  for (const col of columnsToAdd) {
    try {
      const [existing] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = ?
      `, [col.name]);

      if (existing.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
        console.log(`[Security Migration] Added column ${col.name} to users table.`);
      }
    } catch (err) {
      console.warn(`[Security Migration Warning] Could not add column ${col.name}:`, err.message);
    }
  }

  // 4. Clean up any expired revoked tokens periodically
  await pool.query(`DELETE FROM revoked_tokens WHERE expires_at < NOW()`).catch(() => {});

  console.log('[Security Migration] Security schema migration completed successfully.');
}

if (require.main === module) {
  migrateSecurity()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Security Migration Error]:', err);
      process.exit(1);
    });
}

module.exports = migrateSecurity;
