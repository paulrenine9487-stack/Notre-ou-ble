const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'resonova_db',
  multipleStatements: true
};

/**
 * Enterprise Ordered Migration Registry
 * Contains the complete versioned sequence of schema, DDL, and data initialization migrations.
 */
const MIGRATIONS_REGISTRY = [
  {
    version: '001',
    name: '001_initial_schema',
    description: 'Initial base database schema and core tables',
    run: async (conn) => {
      const fs = require('fs');
      const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at: ${schemaPath}`);
      }
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await conn.query(schemaSql);
    }
  },
  {
    version: '002',
    name: '002_dashboard_roles',
    description: 'Dashboard analytics, user roles and extended practice session columns',
    run: async () => {
      const runDashboardMigration = require('./migrateDashboard');
      await runDashboardMigration();
    }
  },
  {
    version: '003',
    name: '003_five_stages',
    description: '5-Stage Breath Management learning module structure and stages',
    run: async () => {
      const runFiveStagesMigration = require('./migrateFiveStages');
      await runFiveStagesMigration();
    }
  },
  {
    version: '004',
    name: '004_practice_journal',
    description: 'Practice Journal & Personal Practice Diary schema and links',
    run: async () => {
      const runPracticeJournalMigration = require('./migratePracticeJournal');
      await runPracticeJournalMigration();
    }
  },
  {
    version: '005',
    name: '005_branding_theme',
    description: 'Branding settings with official No Tre(ou)ble palette',
    run: async () => {
      const runBrandingMigration = require('./migrateBranding');
      await runBrandingMigration();
    }
  },
  {
    version: '006',
    name: '006_flip_objectives',
    description: 'Stage 01 interactive 3D flip card objectives',
    run: async () => {
      const runFlipObjectivesMigration = require('./migrateFlipObjectives');
      await runFlipObjectivesMigration();
    }
  },
  {
    version: '007',
    name: '007_part2_song',
    description: 'Stage 03 Part 02 Song Practice module and audio guides',
    run: async () => {
      const runPart2SongMigration = require('./migratePart2Song');
      await runPart2SongMigration();
    }
  },
  {
    version: '008',
    name: '008_stage4_myth_or_fact',
    description: 'Stage 04 Myth or Fact interactive challenge questions and responses',
    run: async () => {
      const runStage4MythOrFactMigration = require('./migrateStage4MythOrFact');
      await runStage4MythOrFactMigration();
    }
  },
  {
    version: '009',
    name: '009_stage4_learning_reflections',
    description: 'Stage 04 Learning reflections pinboard and student sticky notes',
    run: async () => {
      const runStage4LearningReflectionsMigration = require('./migrateStage4LearningReflections');
      await runStage4LearningReflectionsMigration();
    }
  },
  {
    version: '010',
    name: '010_stage5_commitment_and_journal',
    description: 'Stage 05 Practice commitment, learning journal and module completion',
    run: async () => {
      const runStage5CommitmentAndJournalMigration = require('./migrateStage5CommitmentAndJournal');
      await runStage5CommitmentAndJournalMigration();
    }
  },
  {
    version: '011',
    name: '011_security_hardening',
    description: 'Enterprise security audit logs, MFA columns and revoked token schema',
    run: async () => {
      const runSecurityMigration = require('./migrateSecurity');
      await runSecurityMigration();
    }
  },
  {
    version: '012',
    name: '012_refresh_token_rotation',
    description: 'Refresh token rotation and secure session management',
    run: async () => {
      const runTokenRotationMigration = require('./migrateRefreshTokenRotation');
      await runTokenRotationMigration();
    }
  },
  {
    version: '013',
    name: '013_cms_portal_content',
    description: 'Dynamic CMS portal sections, revisions and media asset management',
    run: async () => {
      const runCmsMigration = require('../scripts/migrate_cms');
      await runCmsMigration();
    }
  },
  {
    version: '014',
    name: '014_video_transcripts',
    description: 'Video transcripts and closed-captioning database support',
    run: async () => {
      const runTranscriptsMigration = require('./migrateTranscripts');
      await runTranscriptsMigration();
    }
  }
];

/**
 * Ensure database and schema_migrations tracking table exist
 */
async function ensureDatabaseAndTracker() {
  const rootConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password
  });
  try {
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await rootConn.end();
  }

  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(150) NOT NULL UNIQUE,
        version VARCHAR(50) NOT NULL,
        description VARCHAR(255) DEFAULT NULL,
        checksum VARCHAR(64) DEFAULT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INT DEFAULT 0,
        execution_status ENUM('SUCCESS', 'FAILED') DEFAULT 'SUCCESS'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Baseline detection: If tracker is empty but core tables already exist, mark baseline as completed
    const [existingCount] = await conn.query('SELECT COUNT(*) AS cnt FROM schema_migrations');
    if (existingCount[0].cnt === 0) {
      const [userTable] = await conn.query("SHOW TABLES LIKE 'users'");
      if (userTable.length > 0) {
        // Tables already populated from prior execution; initialize baseline tracking without re-running scripts
        for (const migration of MIGRATIONS_REGISTRY) {
          await conn.query(
            `INSERT IGNORE INTO schema_migrations (migration_name, version, description, execution_time_ms, execution_status)
             VALUES (?, ?, ?, 0, 'SUCCESS')`,
            [migration.name, migration.version, migration.description]
          );
        }
        console.log(`[No Tre(ou)ble Migrations] Established versioned tracking baseline for ${MIGRATIONS_REGISTRY.length} pre-existing migrations.`);
      }
    }
  } finally {
    await conn.end();
  }
}

/**
 * Retrieve list of applied migrations
 */
async function getAppliedMigrations() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [rows] = await conn.query(
      "SELECT migration_name, version, applied_at, execution_time_ms, execution_status FROM schema_migrations WHERE execution_status = 'SUCCESS' ORDER BY id ASC"
    );
    return rows;
  } finally {
    await conn.end();
  }
}

/**
 * Execute pending migrations sequentially
 */
async function runPendingMigrations({ silent = false, isStartup = false } = {}) {
  await ensureDatabaseAndTracker();

  const appliedRows = await getAppliedMigrations();
  const appliedNames = new Set(appliedRows.map((r) => r.migration_name));
  const pending = MIGRATIONS_REGISTRY.filter((m) => !appliedNames.has(m.name));

  if (pending.length === 0) {
    if (isStartup || !silent) {
      console.log(
        `[No Tre(ou)ble Migrations] Database schema is up to date (${MIGRATIONS_REGISTRY.length}/${MIGRATIONS_REGISTRY.length} migrations applied, 0 pending).`
      );
    }
    return {
      appliedCount: 0,
      totalCount: MIGRATIONS_REGISTRY.length,
      pendingCount: 0,
      alreadyApplied: true
    };
  }

  console.log(`[No Tre(ou)ble Migrations] Found ${pending.length} pending migration(s). Executing in sequence...`);

  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    for (const migration of pending) {
      console.log(`[No Tre(ou)ble Migrations] Applying: ${migration.name} (${migration.description})...`);
      const startTime = Date.now();
      try {
        await migration.run(conn);
        const duration = Date.now() - startTime;
        await conn.query(
          `INSERT INTO schema_migrations (migration_name, version, description, execution_time_ms, execution_status)
           VALUES (?, ?, ?, ?, 'SUCCESS')
           ON DUPLICATE KEY UPDATE execution_time_ms = VALUES(execution_time_ms), execution_status = 'SUCCESS'`,
          [migration.name, migration.version, migration.description, duration]
        );
        console.log(`[No Tre(ou)ble Migrations] ✓ Successfully applied ${migration.name} in ${duration}ms`);
      } catch (err) {
        const duration = Date.now() - startTime;
        await conn.query(
          `INSERT INTO schema_migrations (migration_name, version, description, execution_time_ms, execution_status)
           VALUES (?, ?, ?, ?, 'FAILED')
           ON DUPLICATE KEY UPDATE execution_time_ms = VALUES(execution_time_ms), execution_status = 'FAILED'`,
          [migration.name, migration.version, migration.description, duration]
        );
        console.error(`[No Tre(ou)ble Migrations Error] Failed applying ${migration.name}:`, err.message);
        throw err;
      }
    }

    console.log(`[No Tre(ou)ble Migrations] All ${pending.length} pending migrations applied successfully.`);
    return {
      appliedCount: pending.length,
      totalCount: MIGRATIONS_REGISTRY.length,
      pendingCount: 0,
      alreadyApplied: false
    };
  } finally {
    await conn.end();
  }
}

/**
 * Retrieve status of all migrations for CLI & Diagnostics
 */
async function getMigrationStatus() {
  await ensureDatabaseAndTracker();
  const appliedRows = await getAppliedMigrations();
  const appliedMap = new Map(appliedRows.map((r) => [r.migration_name, r]));

  const statusList = MIGRATIONS_REGISTRY.map((m) => {
    const record = appliedMap.get(m.name);
    return {
      version: m.version,
      name: m.name,
      description: m.description,
      status: record ? record.execution_status : 'PENDING',
      appliedAt: record ? record.applied_at : null,
      executionTimeMs: record ? record.execution_time_ms : null
    };
  });

  const appliedCount = statusList.filter((s) => s.status === 'SUCCESS').length;
  const pendingCount = statusList.filter((s) => s.status === 'PENDING').length;

  return {
    total: MIGRATIONS_REGISTRY.length,
    applied: appliedCount,
    pending: pendingCount,
    migrations: statusList
  };
}

module.exports = {
  MIGRATIONS_REGISTRY,
  ensureDatabaseAndTracker,
  runPendingMigrations,
  getMigrationStatus
};
