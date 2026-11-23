const pool = require('../config/db');
const bcrypt = require('bcryptjs');

(async () => {
  const [rows] = await pool.query("SELECT id, username, password_hash FROM users WHERE username = 'Renin'");
  if (rows.length === 0) { console.log('Renin not found'); process.exit(0); }
  const u = rows[0];
  const list = ['Renin', 'Renin123', 'Renin@123', 'renin123', 'admin', 'Admin@123', 'Admin@12345', '123456', '12345678', 'password', 'notreoble'];
  for (const p of list) {
    if (await bcrypt.compare(p, u.password_hash)) {
      console.log('MATCH FOUND FOR RENIN:', p);
    }
  }
  process.exit(0);
})();
