const path = require('path');
const dotenv = require('dotenv');
const { runPendingMigrations } = require('./migrationRunner');

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Initializes database and applies any pending migrations using versioned migrationRunner
 */
async function initDatabase() {
  try {
    const result = await runPendingMigrations({ isStartup: true });
    return result;
  } catch (error) {
    console.error('[No Tre(ou)ble DB Init Error]:', error.message);
    throw error;
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = initDatabase;
