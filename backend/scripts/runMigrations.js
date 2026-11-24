#!/usr/bin/env node

/**
 * No Tre(ou)ble - Database Migration CLI
 * Usage:
 *   node scripts/runMigrations.js [migrate|status]
 *   npm run migrate
 *   npm run migrate:status
 */

const { runPendingMigrations, getMigrationStatus } = require('../config/migrationRunner');

async function main() {
  const command = (process.argv[2] || 'migrate').toLowerCase();

  console.log('====================================================');
  console.log('  No Tre(ou)ble - Enterprise Database Migration CLI  ');
  console.log('====================================================');

  if (command === 'status') {
    const status = await getMigrationStatus();

    console.log(`\nMigration Status Summary:`);
    console.log(`Total: ${status.total} | Applied: ${status.applied} | Pending: ${status.pending}\n`);

    console.log(
      'Ver  | Status   | Duration | Applied At               | Migration Name'
    );
    console.log(
      '-----+----------+----------+--------------------------+----------------------------------------'
    );

    for (const m of status.migrations) {
      const ver = m.version.padEnd(4, ' ');
      const stat = m.status === 'SUCCESS' ? '✓ APPLIED'.padEnd(8, ' ') : 'PENDING  ';
      const dur = m.executionTimeMs !== null ? `${m.executionTimeMs}ms`.padStart(8, ' ') : '     -  ';
      const appliedAt = m.appliedAt
        ? new Date(m.appliedAt).toISOString().replace('T', ' ').substring(0, 19).padEnd(24, ' ')
        : '           -            ';
      console.log(`${ver} | ${stat} | ${dur} | ${appliedAt} | ${m.name}`);
    }

    console.log(
      '-----+----------+----------+--------------------------+----------------------------------------\n'
    );

    if (status.pending > 0) {
      console.log(`Notice: ${status.pending} pending migration(s). Run "npm run migrate" to apply.`);
    } else {
      console.log('Database is completely up to date.');
    }
  } else if (command === 'migrate') {
    const result = await runPendingMigrations({ silent: false, isStartup: false });
    if (result.alreadyApplied) {
      console.log('\nNothing to migrate. Database is already up to date.');
    } else {
      console.log(`\nSuccessfully applied ${result.appliedCount} pending migration(s).`);
    }
  } else {
    console.error(`Unknown command: "${command}". Available commands: "migrate", "status"`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('\n[Migration CLI Error]:', err.message);
  process.exit(1);
});
