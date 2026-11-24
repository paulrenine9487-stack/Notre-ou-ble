const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const pool = require('../config/db');
const { closeRedis } = require('../utils/redisClient');

async function main() {
  const PORT = 5000;
  const server = app.listen(PORT, async () => {
    console.log(`[Test Harness] Server listening on http://127.0.0.1:${PORT}`);
    
    // Give initialization 1.5 seconds to settle
    await new Promise(r => setTimeout(r, 1500));

    try {
      // Require and run the reliability suite
      const testSuitePath = path.join(__dirname, 'test_gateway_and_reliability_suite.js');
      // Execute the test file using a child process in this session
      const { execSync } = require('child_process');
      const output = execSync(`node "${testSuitePath}"`, { encoding: 'utf8', stdio: 'pipe' });
      console.log(output);
      console.log('[Test Harness] Test suite execution completed successfully.');
    } catch (err) {
      if (err.stdout) console.log(err.stdout);
      if (err.stderr) console.error(err.stderr);
      console.error('[Test Harness] Test suite reported failures.');
      process.exitCode = 1;
    } finally {
      server.close(async () => {
        try {
          await pool.end();
          await closeRedis();
        } catch (_) {}
        process.exit(process.exitCode || 0);
      });
    }
  });

  server.on('error', (err) => {
    console.error('[Test Harness] Server failed to start on port 5000:', err.message);
    process.exit(1);
  });
}

main();
