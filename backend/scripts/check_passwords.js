const pool = require('../config/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const [rows] = await pool.query("SELECT id, username, email, password_hash, role, mfa_enabled FROM users WHERE username IN ('Notreoblemccmrfip', 'Smirthi', 'Renin')");
    for (const u of rows) {
      const matchAdmin12345 = await bcrypt.compare('Admin@12345', u.password_hash);
      const matchRenin123 = await bcrypt.compare('Renin@123', u.password_hash);
      const matchPassword123 = await bcrypt.compare('password123', u.password_hash);
      console.log(`User: ${u.username} (${u.role}) | Match Admin@12345: ${matchAdmin12345} | Match Renin@123: ${matchRenin123} | Match password123: ${matchPassword123}`);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
