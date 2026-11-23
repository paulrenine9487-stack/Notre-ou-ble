const pool = require('../config/db');
(async () => {
  try {
    const [cols] = await pool.query('DESCRIBE learning_modules');
    console.log('COLS:', cols.map(c => c.Field));
    const [rows] = await pool.query('SELECT * FROM learning_modules ORDER BY module_number');
    console.log('MODULES:', JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();


