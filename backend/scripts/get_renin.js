const pool = require('../config/db');
(async () => {
  const [r] = await pool.query('SELECT id, username, email, role, password_hash FROM users WHERE id = 3');
  console.log(r);
  process.exit(0);
})();
