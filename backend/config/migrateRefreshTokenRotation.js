const pool = require('./db');

async function migrateRefreshTokenRotation() {
  console.log('[Token Rotation Migration] Ensuring refresh_tokens table exists...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      family_id VARCHAR(64) NOT NULL,
      is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      replaced_by_hash VARCHAR(64) NULL,
      INDEX idx_refresh_user (user_id),
      INDEX idx_refresh_family (family_id),
      INDEX idx_refresh_hash (token_hash),
      INDEX idx_refresh_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Clean expired refresh tokens
  await pool.query(`DELETE FROM refresh_tokens WHERE expires_at < NOW()`).catch(() => {});

  console.log('[Token Rotation Migration] refresh_tokens table verified successfully.');
}

if (require.main === module) {
  migrateRefreshTokenRotation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Token Rotation Migration Error]:', err);
      process.exit(1);
    });
}

module.exports = migrateRefreshTokenRotation;
