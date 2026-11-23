const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'resonova_db';

const backupDir = path.resolve(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function performBackupAndVerify() {
  console.log('====================================================');
  console.log('  NO TRE(OU)BLE - AUTOMATED BACKUP & DISASTER RECOVERY');
  console.log('  OWASP ASVS / NIST SP 800-53 Verification Procedure');
  console.log('====================================================');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup_${database}_${timestamp}.sql`);

  let srcConn;
  try {
    srcConn = await mysql.createConnection({ host, port, user, password, database });
    console.log(`[Backup] Connected to live database "${database}".`);

    // Fetch all table names
    const [tables] = await srcConn.query('SHOW TABLES');
    const tableKey = Object.keys(tables[0])[0];
    const tableNames = tables.map(row => row[tableKey]);

    console.log(`[Backup] Found ${tableNames.length} tables to protect.`);

    let dumpContent = `-- No Tre(ou)ble Database Backup\n-- Generated: ${new Date().toISOString()}\n-- Source Database: ${database}\n\n`;
    dumpContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    const sourceStats = {};

    for (const tableName of tableNames) {
      // Get CREATE TABLE statement
      const [createTableResult] = await srcConn.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSql = createTableResult[0]['Create Table'];
      dumpContent += `-- Table structure for \`${tableName}\`\nDROP TABLE IF EXISTS \`${tableName}\`;\n${createSql};\n\n`;

      // Get table data
      const [rows] = await srcConn.query(`SELECT * FROM \`${tableName}\``);
      sourceStats[tableName] = rows.length;

      if (rows.length > 0) {
        dumpContent += `-- Data for table \`${tableName}\` (${rows.length} records)\n`;
        for (const row of rows) {
          const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            if (typeof val === 'object') return srcConn.escape(JSON.stringify(val));
            return srcConn.escape(String(val));
          }).join(', ');
          dumpContent += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        dumpContent += '\n';
      }
    }

    dumpContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    fs.writeFileSync(backupFile, dumpContent, 'utf8');
    const fileSizeKb = Math.round(fs.statSync(backupFile).size / 1024);
    console.log(`[Backup Success] Backup saved: ${path.basename(backupFile)} (${fileSizeKb} KB)`);

    // =========================================================================
    // RESTORATION VERIFICATION IN ISOLATED TEST SANDBOX
    // =========================================================================
    console.log('[Verification] Starting automated restoration trial in verification sandbox...');
    const verifyDbName = `resonova_verify_${Date.now()}`;
    let verifyConn;

    try {
      const rootConn = await mysql.createConnection({ host, port, user, password });
      await rootConn.query(`CREATE DATABASE \`${verifyDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await rootConn.end();

      verifyConn = await mysql.createConnection({ host, port, user, password, database: verifyDbName, multipleStatements: true });
      await verifyConn.query(dumpContent);

      // Verify that every table and its record count matches the source
      const [restoredTables] = await verifyConn.query('SHOW TABLES');
      const restoredTableNames = restoredTables.map(row => Object.values(row)[0]);

      let allMatched = true;
      for (const t of tableNames) {
        if (!restoredTableNames.includes(t)) {
          console.error(`[Verification Failure] Table missing in restored database: ${t}`);
          allMatched = false;
        } else {
          const [restoredRows] = await verifyConn.query(`SELECT COUNT(*) as count FROM \`${t}\``);
          if (restoredRows[0].count !== sourceStats[t]) {
            console.error(`[Verification Failure] Record count mismatch in table "${t}": expected ${sourceStats[t]}, got ${restoredRows[0].count}`);
            allMatched = false;
          }
        }
      }

      if (allMatched) {
        console.log(`[Verification Verified] Restoration successful! 100% of ${tableNames.length} tables and data records verified.`);
      } else {
        throw new Error('Restoration integrity check detected mismatches.');
      }
    } finally {
      if (verifyConn) {
        try { await verifyConn.end(); } catch (e) {}
      }
      // Drop the sandbox test database
      const cleanConn = await mysql.createConnection({ host, port, user, password });
      await cleanConn.query(`DROP DATABASE IF EXISTS \`${verifyDbName}\`;`);
      await cleanConn.end();
      console.log(`[Verification] Cleaned up temporary test database "${verifyDbName}".`);
    }

    // Backup retention: keep last 10 backups
    const allBackups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(`backup_${database}_`) && f.endsWith('.sql'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (allBackups.length > 10) {
      for (const old of allBackups.slice(10)) {
        try {
          fs.unlinkSync(path.join(backupDir, old.name));
          console.log(`[Retention] Pruned old backup: ${old.name}`);
        } catch (e) {}
      }
    }

    console.log('====================================================');
    console.log('  BACKUP & RESTORATION VERIFICATION COMPLETED: OK');
    console.log('====================================================');
    return { success: true, backupFile, fileSizeKb };
  } finally {
    if (srcConn) {
      try { await srcConn.end(); } catch (e) {}
    }
  }
}

if (require.main === module) {
  performBackupAndVerify()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Backup Error]:', err);
      process.exit(1);
    });
}

module.exports = performBackupAndVerify;
