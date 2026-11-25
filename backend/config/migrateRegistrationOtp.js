const pool = require('./db');

async function migrateRegistrationOtp() {
  console.log('[Registration OTP Migration] Initializing email OTP verification schema & updates...');

  // 1. Ensure email_verification_otps table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      email VARCHAR(150) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      max_attempts INT NOT NULL DEFAULT 5,
      is_used TINYINT(1) NOT NULL DEFAULT 0,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_expires (email, expires_at),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[Registration OTP Migration] email_verification_otps table ensured.');

  // 2. Ensure phone column in users allows NULL
  try {
    await pool.query('ALTER TABLE users MODIFY COLUMN phone VARCHAR(20) NULL DEFAULT NULL');
    console.log('[Registration OTP Migration] users.phone confirmed NULLABLE.');
  } catch (err) {
    console.warn('[Registration OTP Migration Warning] Error modifying phone column:', err.message);
  }

  // 3. Ensure is_email_verified column exists in users and defaults to 0 for new records
  try {
    const [existingVerifiedCol] = await pool.query(`
      SELECT COLUMN_NAME, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'is_email_verified'
    `);

    if (existingVerifiedCol.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN is_email_verified TINYINT(1) NOT NULL DEFAULT 0');
      // For any existing users prior to this migration, mark them verified
      await pool.query('UPDATE users SET is_email_verified = 1 WHERE is_email_verified = 0');
      console.log('[Registration OTP Migration] Added is_email_verified column to users.');
    } else {
      // Modify default to 0 for upcoming registrations, without altering existing verified users
      await pool.query('ALTER TABLE users MODIFY COLUMN is_email_verified TINYINT(1) NOT NULL DEFAULT 0');
      console.log('[Registration OTP Migration] users.is_email_verified default updated to 0.');
    }
  } catch (err) {
    console.warn('[Registration OTP Migration Warning] is_email_verified column update:', err.message);
  }

  // 4. Ensure email_verified_at column exists in users
  try {
    const [existingVerifiedAtCol] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'email_verified_at'
    `);

    if (existingVerifiedAtCol.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL');
      await pool.query('UPDATE users SET email_verified_at = created_at WHERE is_email_verified = 1 AND email_verified_at IS NULL');
      console.log('[Registration OTP Migration] Added email_verified_at column to users.');
    }
  } catch (err) {
    console.warn('[Registration OTP Migration Warning] email_verified_at column check:', err.message);
  }

  console.log('[Registration OTP Migration] Registration OTP migration completed successfully.');
}

if (require.main === module) {
  migrateRegistrationOtp()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Registration OTP Migration Error]:', err);
      process.exit(1);
    });
}

module.exports = migrateRegistrationOtp;
