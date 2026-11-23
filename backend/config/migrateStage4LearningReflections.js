const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

async function runStage4LearningReflectionsMigration() {
  console.log('[Stage 4 Learning Reflections Migration] Initializing MySQL tables...');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'resonova_db',
    port: process.env.DB_PORT || 3306
  });

  try {
    // 1. Table student_learning_reflections
    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_learning_reflections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        module_id INT NOT NULL DEFAULT 1,
        stage_id INT NOT NULL DEFAULT 4,
        question_1_answer TEXT NOT NULL,
        question_2_answer TEXT NOT NULL,
        question_3_answer TEXT NOT NULL,
        status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'COMPLETED',
        submitted_at DATETIME NULL,
        updated_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_module_stage (user_id, module_id, stage_id),
        INDEX idx_reflections_user (user_id),
        INDEX idx_reflections_module_stage (module_id, stage_id),
        CONSTRAINT fk_reflections_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migration] Table student_learning_reflections ensured.');

    // 2. Table student_learning_reflection_history (version tracking)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_learning_reflection_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reflection_id INT NOT NULL,
        user_id INT NOT NULL,
        question_1_answer TEXT NOT NULL,
        question_2_answer TEXT NOT NULL,
        question_3_answer TEXT NOT NULL,
        version_number INT NOT NULL DEFAULT 1,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_history_user (user_id),
        INDEX idx_history_reflection (reflection_id),
        CONSTRAINT fk_history_reflection FOREIGN KEY (reflection_id) REFERENCES student_learning_reflections(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migration] Table student_learning_reflection_history ensured.');

    console.log('[Stage 4 Learning Reflections Migration] Migration completed successfully!');
  } finally {
    await conn.end();
  }
}

module.exports = runStage4LearningReflectionsMigration;

if (require.main === module) {
  runStage4LearningReflectionsMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]:', err);
      process.exit(1);
    });
}
