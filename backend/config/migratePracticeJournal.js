const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runPracticeJournalMigration() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'resonova_db';

  console.log(`[Practice Journal Migration] Connecting to MySQL at ${host}:${port}/${database}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });

  try {
    // 1. Table: practice_reflections
    console.log('[Practice Journal Migration] Ensuring practice_reflections table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS practice_reflections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        practice_type VARCHAR(150) NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 5,
        reflection TEXT NOT NULL,
        practice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        linked_task_id INT NULL,
        session_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (linked_task_id) REFERENCES learning_tasks(id) ON DELETE SET NULL,
        INDEX idx_user_reflections (user_id),
        INDEX idx_practice_date (practice_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Table: practice_diary_tasks
    console.log('[Practice Journal Migration] Ensuring practice_diary_tasks table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS practice_diary_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status ENUM('TODO', 'DOING', 'DONE') NOT NULL DEFAULT 'TODO',
        priority ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
        due_date DATE NULL,
        position INT NOT NULL DEFAULT 0,
        learning_module_id INT NULL,
        learning_stage_id INT NULL,
        learning_task_id INT NULL,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (learning_module_id) REFERENCES learning_modules(id) ON DELETE SET NULL,
        FOREIGN KEY (learning_stage_id) REFERENCES learning_stages(id) ON DELETE SET NULL,
        FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE SET NULL,
        INDEX idx_user_status (user_id, status),
        INDEX idx_user_position (user_id, position)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Table: practice_task_history
    console.log('[Practice Journal Migration] Ensuring practice_task_history table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS practice_task_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        diary_task_id INT NOT NULL,
        user_id INT NOT NULL,
        previous_status VARCHAR(50) NULL,
        new_status VARCHAR(50) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT NULL,
        FOREIGN KEY (diary_task_id) REFERENCES practice_diary_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_diary_task (diary_task_id),
        INDEX idx_history_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Table: learning_task_links
    console.log('[Practice Journal Migration] Ensuring learning_task_links table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_task_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        diary_task_id INT NOT NULL,
        learning_task_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (diary_task_id) REFERENCES practice_diary_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_diary_learning (user_id, diary_task_id, learning_task_id),
        INDEX idx_user_links (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Check if practice_sessions has reflection_id column for clean 1-to-1 linking
    const [cols] = await conn.query("SHOW COLUMNS FROM practice_sessions LIKE 'reflection_id'");
    if (cols.length === 0) {
      console.log("[Practice Journal Migration] Adding reflection_id column to practice_sessions...");
      await conn.query(`ALTER TABLE practice_sessions ADD COLUMN reflection_id INT NULL AFTER task_id`);
    }

    console.log('[Practice Journal Migration] Practice Journal tables and links verified successfully!');
  } catch (error) {
    console.error('[Practice Journal Migration Error]:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  runPracticeJournalMigration()
    .then(() => {
      console.log('Migration execution complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = runPracticeJournalMigration;
