const pool = require('./db');

async function migrateStage5CommitmentAndJournal() {
  try {
    console.log('[Stage 5 Migration] Initializing MySQL tables for Practice Commitment, Learning Journal & Module Completion...');

    // 1. student_practice_commitments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_practice_commitments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        module_id INT DEFAULT 1,
        minutes_per_session INT NOT NULL DEFAULT 10,
        sessions_per_week INT NOT NULL DEFAULT 4,
        weekly_minutes INT NOT NULL DEFAULT 40,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_spc_user (user_id),
        INDEX idx_spc_module (module_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migration] Table student_practice_commitments ensured.');

    // 2. student_commitment_activities
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_commitment_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        commitment_id INT NOT NULL,
        user_id INT NOT NULL,
        activity_key VARCHAR(100) NOT NULL,
        activity_title VARCHAR(255) NOT NULL,
        duration_label VARCHAR(100),
        repetitions_label VARCHAR(100),
        is_selected BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sca_commitment (commitment_id),
        INDEX idx_sca_user (user_id),
        INDEX idx_sca_act (activity_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migration] Table student_commitment_activities ensured.');

    // 3. student_practice_sessions (Kanban Sessions)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_practice_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        commitment_id INT NULL,
        session_number INT NOT NULL,
        session_title VARCHAR(255) NOT NULL,
        activity VARCHAR(255) NULL,
        planned_duration INT NOT NULL DEFAULT 10,
        actual_duration INT NULL,
        scheduled_date DATE NULL,
        week_identifier VARCHAR(50) NULL,
        status ENUM('planned', 'practising', 'done') NOT NULL DEFAULT 'planned',
        notes TEXT NULL,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sps_user (user_id),
        INDEX idx_sps_status (status),
        INDEX idx_sps_commitment (commitment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migration] Table student_practice_sessions ensured.');

    // 4. student_practice_activity_completions (Tracking 6 Practice Checklist Items)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_practice_activity_completions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        module_id INT DEFAULT 1,
        activity_key VARCHAR(100) NOT NULL,
        completion_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'completed',
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_mod_act (user_id, module_id, activity_key),
        INDEX idx_spac_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migration] Table student_practice_activity_completions ensured.');

    // 5. student_module_progress (Module 1 Completion and Unlock State)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_module_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        module_id INT DEFAULT 1,
        stage_id INT NULL,
        completion_status VARCHAR(50) DEFAULT 'IN_PROGRESS',
        completion_percentage DECIMAL(5,2) DEFAULT 0,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_mod (user_id, module_id),
        INDEX idx_smp_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migration] Table student_module_progress ensured.');

    console.log('[Stage 5 Migration] All Stage 5 tables migrated successfully!');
  } catch (err) {
    console.error('[Stage 5 Migration] Error running migration:', err);
    throw err;
  }
}

module.exports = migrateStage5CommitmentAndJournal;

if (require.main === module) {
  migrateStage5CommitmentAndJournal()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
