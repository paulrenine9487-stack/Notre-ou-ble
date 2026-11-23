/**
 * No Tre(ou)ble - Breathing Practice Levels Migration
 * Creates `breathing_practice_levels` and `student_breathing_sessions` tables.
 * Seeds exact timing configurations for Beginner, Intermediate, and Advanced.
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function migrate() {
  console.log('Connecting to MySQL database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'resonova_db'
  });

  try {
    console.log('[Migration] Creating `breathing_practice_levels` table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS breathing_practice_levels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        level_key VARCHAR(50) NOT NULL UNIQUE,
        level_name VARCHAR(50) NOT NULL,
        daily_practice_duration VARCHAR(50) NOT NULL,
        core_focus TEXT NOT NULL,
        inhale_duration DECIMAL(4,1) NOT NULL,
        inhale_min DECIMAL(4,1) NOT NULL,
        inhale_max DECIMAL(4,1) NOT NULL,
        hold_duration DECIMAL(4,1) NOT NULL,
        hold_min DECIMAL(4,1) NOT NULL,
        hold_max DECIMAL(4,1) NOT NULL,
        exhale_duration DECIMAL(4,1) NOT NULL,
        exhale_min DECIMAL(4,1) NOT NULL,
        exhale_max DECIMAL(4,1) NOT NULL,
        support_pulsed_rhythms BOOLEAN DEFAULT FALSE,
        default_cycles INT DEFAULT 5,
        display_order INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('[Migration] Creating `student_breathing_sessions` table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_breathing_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        level_key VARCHAR(50) NOT NULL,
        inhale_duration DECIMAL(4,1) NOT NULL,
        hold_duration DECIMAL(4,1) NOT NULL,
        exhale_duration DECIMAL(4,1) NOT NULL,
        completed_cycles INT NOT NULL,
        target_cycles INT NOT NULL,
        total_duration_seconds INT NOT NULL,
        completion_status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_level (user_id, level_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed 3 Exact Levels
    const levels = [
      {
        level_key: 'beginner',
        level_name: 'Beginner',
        daily_practice_duration: '5–10 minutes',
        core_focus: 'Eliminating shoulder/chest movement; learning low belly and rib expansion.',
        inhale_duration: 4.0,
        inhale_min: 4.0,
        inhale_max: 4.0,
        hold_duration: 3.0, // Default 3s within 2-4s range
        hold_min: 2.0,
        hold_max: 4.0,
        exhale_duration: 10.0, // Default 10s within 8-12s range
        exhale_min: 8.0,
        exhale_max: 12.0,
        support_pulsed_rhythms: false,
        default_cycles: 5,
        display_order: 1
      },
      {
        level_key: 'intermediate',
        level_name: 'Intermediate',
        daily_practice_duration: '10–15 minutes',
        core_focus: 'Controlling airflow speed without squeezing the throat; keeping ribs expanded while exhaling.',
        inhale_duration: 2.0,
        inhale_min: 2.0,
        inhale_max: 2.0,
        hold_duration: 2.0,
        hold_min: 2.0,
        hold_max: 2.0,
        exhale_duration: 20.0, // Default 20s within 15-25s range
        exhale_min: 15.0,
        exhale_max: 25.0,
        support_pulsed_rhythms: false,
        default_cycles: 5,
        display_order: 2
      },
      {
        level_key: 'advanced',
        level_name: 'Advanced',
        daily_practice_duration: '10–15 minutes',
        core_focus: 'Instant, silent diaphragmatic drop; budgeting air for complex runs and high notes.',
        inhale_duration: 1.0, // Default 1s within 0.5-1s range
        inhale_min: 0.5,
        inhale_max: 1.0,
        hold_duration: 0.0, // 0 seconds (immediate transition)
        hold_min: 0.0,
        hold_max: 0.0,
        exhale_duration: 30.0, // 30+ seconds
        exhale_min: 30.0,
        exhale_max: 60.0,
        support_pulsed_rhythms: true,
        default_cycles: 5,
        display_order: 3
      }
    ];

    for (const lvl of levels) {
      const [existing] = await connection.query(
        'SELECT id FROM breathing_practice_levels WHERE level_key = ?',
        [lvl.level_key]
      );
      if (existing.length === 0) {
        await connection.query(`
          INSERT INTO breathing_practice_levels (
            level_key, level_name, daily_practice_duration, core_focus,
            inhale_duration, inhale_min, inhale_max,
            hold_duration, hold_min, hold_max,
            exhale_duration, exhale_min, exhale_max,
            support_pulsed_rhythms, default_cycles, display_order, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [
          lvl.level_key, lvl.level_name, lvl.daily_practice_duration, lvl.core_focus,
          lvl.inhale_duration, lvl.inhale_min, lvl.inhale_max,
          lvl.hold_duration, lvl.hold_min, lvl.hold_max,
          lvl.exhale_duration, lvl.exhale_min, lvl.exhale_max,
          lvl.support_pulsed_rhythms, lvl.default_cycles, lvl.display_order
        ]);
        console.log(`[OK] Inserted breathing level: ${lvl.level_name}`);
      } else {
        await connection.query(`
          UPDATE breathing_practice_levels SET
            level_name = ?,
            daily_practice_duration = ?,
            core_focus = ?,
            inhale_duration = ?,
            inhale_min = ?,
            inhale_max = ?,
            hold_duration = ?,
            hold_min = ?,
            hold_max = ?,
            exhale_duration = ?,
            exhale_min = ?,
            exhale_max = ?,
            support_pulsed_rhythms = ?,
            default_cycles = ?,
            display_order = ?
          WHERE level_key = ?
        `, [
          lvl.level_name, lvl.daily_practice_duration, lvl.core_focus,
          lvl.inhale_duration, lvl.inhale_min, lvl.inhale_max,
          lvl.hold_duration, lvl.hold_min, lvl.hold_max,
          lvl.exhale_duration, lvl.exhale_min, lvl.exhale_max,
          lvl.support_pulsed_rhythms, lvl.default_cycles, lvl.display_order,
          lvl.level_key
        ]);
        console.log(`[OK] Updated breathing level: ${lvl.level_name}`);
      }
    }

    console.log('[Migration] Breathing practice levels migrated successfully!');
  } catch (err) {
    console.error('[Migration Error]:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = migrate;
