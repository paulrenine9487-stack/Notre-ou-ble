const pool = require('./db');

async function migrateBranding() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS branding_settings (
      id INT PRIMARY KEY,
      theme_name VARCHAR(100) NOT NULL DEFAULT 'Official No Tre(ou)ble',
      primary_color VARCHAR(20) NOT NULL DEFAULT '#241442',
      secondary_color VARCHAR(20) NOT NULL DEFAULT '#7C3AED',
      accent_bg_color VARCHAR(20) NOT NULL DEFAULT '#F4F0FF',
      main_bg_color VARCHAR(20) NOT NULL DEFAULT '#F8F7FC',
      updated_by INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    INSERT INTO branding_settings (id, theme_name, primary_color, secondary_color, accent_bg_color, main_bg_color)
    VALUES (1, 'Official No Tre(ou)ble', '#241442', '#7C3AED', '#F4F0FF', '#F8F7FC')
    ON DUPLICATE KEY UPDATE id=id
  `);

  console.log('[Migration] Branding settings table initialized successfully with official No Tre(ou)ble palette.');
}

if (require.main === module) {
  migrateBranding()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Branding migration error:', err);
      process.exit(1);
    });
}

module.exports = migrateBranding;
