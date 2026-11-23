const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function initDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'resonova_db';

  console.log(`[No Tre(ou)ble DB Init] Connecting to MySQL server at ${host}:${port}...`);

  let rootConn;
  try {
    rootConn = await mysql.createConnection({ host, port, user, password });
    console.log('[No Tre(ou)ble DB Init] Connected to MySQL. Ensuring database exists...');
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    const dbConn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });
    console.log(`[No Tre(ou)ble DB Init] Connected to database "${database}". Applying schema...`);

    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await dbConn.query(schemaSql);
    console.log('[No Tre(ou)ble DB Init] Schema and seed data successfully initialized.');
    await dbConn.end();

    // Run dashboard & role migrations
    const runDashboardMigration = require('./migrateDashboard');
    await runDashboardMigration();

    // Run 5-Stage Breath Management Learning Module migration
    const runFiveStagesMigration = require('./migrateFiveStages');
    await runFiveStagesMigration();

    // Run Practice Journal & Personal Practice Diary migration
    const runPracticeJournalMigration = require('./migratePracticeJournal');
    await runPracticeJournalMigration();

    // Run Branding Theme migration
    const runBrandingMigration = require('./migrateBranding');
    await runBrandingMigration();

    // Run Stage 01 Interactive 3D Flip Card Objectives migration
    const runFlipObjectivesMigration = require('./migrateFlipObjectives');
    await runFlipObjectivesMigration();

    // Run Stage 03 Part 02 Song Practice Module migration
    const runPart2SongMigration = require('./migratePart2Song');
    await runPart2SongMigration();

    // Run Stage 04 Myth or Fact Redesign migration
    const runStage4MythOrFactMigration = require('./migrateStage4MythOrFact');
    await runStage4MythOrFactMigration();

    // Run Stage 04 Learning Reflections Pinboard migration
    const runStage4LearningReflectionsMigration = require('./migrateStage4LearningReflections');
    await runStage4LearningReflectionsMigration();

    // Run Stage 05 Practice Commitment, Learning Journal & Module Completion migration
    const runStage5CommitmentAndJournalMigration = require('./migrateStage5CommitmentAndJournal');
    await runStage5CommitmentAndJournalMigration();

    // Run Enterprise Security Schema Hardening migration
    const runSecurityMigration = require('./migrateSecurity');
    await runSecurityMigration();

    // Run Refresh Token Rotation schema migration
    const runTokenRotationMigration = require('./migrateRefreshTokenRotation');
    await runTokenRotationMigration();

    // Run Dynamic Portal Content Management System (CMS) migration
    const runCmsMigration = require('../scripts/migrate_cms');
    await runCmsMigration();

    // Run Video Transcripts migration
    const runTranscriptsMigration = require('./migrateTranscripts');
    await runTranscriptsMigration();

    return true;
  } catch (error) {
    console.error('[No Tre(ou)ble DB Init Error]:', error.message);
    if (rootConn) {
      try { await rootConn.end(); } catch (e) {}
    }
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

