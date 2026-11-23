const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runDashboardMigration() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'resonova_db';

  console.log(`[Migration] Connecting to MySQL at ${host}:${port}/${database}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });

  try {
    // 1. Add 'role' column to users if not exists
    const [userCols] = await conn.query("SHOW COLUMNS FROM users LIKE 'role'");
    if (userCols.length === 0) {
      console.log("[Migration] Adding 'role' column to users table...");
      await conn.query(`ALTER TABLE users ADD COLUMN role ENUM('USER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'USER' AFTER selected_musical_goal`);
    }

    // 2. Add extended columns to practice_sessions if not exist
    const [practiceCols] = await conn.query("SHOW COLUMNS FROM practice_sessions LIKE 'exercise_name'");
    if (practiceCols.length === 0) {
      console.log("[Migration] Adding extended columns to practice_sessions...");
      await conn.query(`
        ALTER TABLE practice_sessions 
        ADD COLUMN exercise_name VARCHAR(150) NULL AFTER session_type,
        ADD COLUMN start_time TIMESTAMP NULL AFTER exercise_name,
        ADD COLUMN end_time TIMESTAMP NULL AFTER start_time,
        ADD COLUMN completion_status VARCHAR(50) NOT NULL DEFAULT 'completed' AFTER duration_minutes,
        ADD COLUMN notes TEXT NULL AFTER completion_status,
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER notes
      `);
    }

    // 3. Create user_practice_goals table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_practice_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        weekly_target_minutes INT NOT NULL DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_goal (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. Create learning_modules table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        module_order INT NOT NULL DEFAULT 1,
        status ENUM('IN_PROGRESS', 'NEXT_MODULE', 'COMING_SOON') DEFAULT 'COMING_SOON',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 5. Create learning_activities table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        activity_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 6. Create user_learning_progress table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_learning_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        activity_id INT NOT NULL,
        completion_status VARCHAR(50) NOT NULL DEFAULT 'completed',
        completed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (activity_id) REFERENCES learning_activities(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_activity (user_id, activity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 7. Create user_song_practice table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_song_practice (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        song_title VARCHAR(255) NOT NULL,
        language VARCHAR(100) NULL,
        song_type VARCHAR(100) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 8. Create song_practice_phrases table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS song_practice_phrases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        song_practice_id INT NOT NULL,
        phrase_number INT NOT NULL,
        phrase_text TEXT NOT NULL,
        inhale_position VARCHAR(100) NOT NULL DEFAULT 'Before phrase',
        exhale_guidance VARCHAR(100) NOT NULL DEFAULT 'Controlled sustained exhale',
        practice_notes TEXT NULL,
        completion_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (song_practice_id) REFERENCES user_song_practice(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 9. Create admin_audit_logs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        action VARCHAR(255) NOT NULL,
        target_type VARCHAR(100) NULL,
        target_id INT NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Check learning_modules
    const [modules] = await conn.query('SELECT id, title FROM learning_modules WHERE module_order = 1 LIMIT 1');
    let breathModuleId;
    if (modules.length === 0) {
      console.log('[Migration] Seeding learning modules...');
      const [mRes] = await conn.query(`
        INSERT INTO learning_modules (title, description, module_order, status) VALUES
        ('Breath Management', 'Build awareness of airflow, coordinate breath with sound, and plan phrases with confidence.', 1, 'IN_PROGRESS'),
        ('Pitch & Intonation', 'Develop pitch accuracy, micro-tuning awareness, and effortless vocal range expansion.', 2, 'NEXT_MODULE'),
        ('Vocal Resonance', 'Explore pharyngeal and sinus resonance for rich vocal tone without throat strain.', 3, 'COMING_SOON')
      `);
      breathModuleId = mRes.insertId;
    } else {
      breathModuleId = modules[0].id;
    }

    // Seed 9 activities for Module 1 (Breath Management) if empty
    const [actCount] = await conn.query('SELECT COUNT(*) AS count FROM learning_activities WHERE module_id = ?', [breathModuleId]);
    if (actCount[0].count === 0) {
      console.log('[Migration] Seeding 9 learning events for Breath Management module...');
      const activities = [
        ['Diaphragmatic Awakening & Lower Core Release', 'Feel the 3D descent of the diaphragm and relax the abdominal wall on inhalation.', 1],
        ['360-Degree Intercostal Expansion', 'Expand the lateral and posterior lower ribcage without lifting the collarbones.', 2],
        ['Eliminating Clavicular Breathing', 'De-condition shoulder tension and shallow upper chest breathing habits.', 3],
        ['Appoggio Foundations: Leaning on the Breath', 'Balance inhalatory and exhalatory muscle engagement for sustained airflow.', 4],
        ['Box Breathing (4-4-4-4) Rhythm & Control', 'Master pacing, autonomic nervous system regulation, and composure under pressure.', 5],
        ['Subglottic Pressure Regulation & Clean Onset', 'Prevent glottic shock or breathy leakage at the inception of vocal sound.', 6],
        ['Messa di Voce Dynamic Airflow Swells', 'Control steady air volume from pianissimo swell to fortissimo and back.', 7],
        ['Phrase Mapping: Breath Points in Songs', 'Mark catch-breaths and deep breath pauses on real musical lyrics.', 8],
        ['Legato Streaming vs Staccato Diaphragmatic Pulses', 'Contrast sustained smooth airstream against quick rhythmic diaphragmatic pulses.', 9]
      ];

      for (const [title, desc, order] of activities) {
        await conn.query(
          'INSERT INTO learning_activities (module_id, title, description, activity_order) VALUES (?, ?, ?, ?)',
          [breathModuleId, title, desc, order]
        );
      }
    }

    // Seed default practice goals for existing users if missing
    await conn.query(`
      INSERT IGNORE INTO user_practice_goals (user_id, weekly_target_minutes)
      SELECT id, 60 FROM users
    `);

    // Provision required SuperAdmin and Admin accounts
    const salt = await bcrypt.genSalt(10);

    // 1. Superadmin: Notreoblemccmrfip / notreoblesinger
    const [superRows] = await conn.query("SELECT id FROM users WHERE LOWER(username) = 'notreoblemccmrfip' OR LOWER(email) = 'notreoblemccmrfip@notreoble.com'");
    const superHash = await bcrypt.hash('notreoblesinger', salt);
    if (superRows.length === 0) {
      await conn.query(`
        INSERT INTO users (username, gender, email, phone, vocal_trainer_name, password_hash, selected_musical_goal, role)
        VALUES ('Notreoblemccmrfip', 'Other', 'notreoblemccmrfip@notreoble.com', '+919876543211', 'Master Superadmin', ?, 'Platform Administrator', 'SUPERADMIN')
      `, [superHash]);
    } else {
      await conn.query("UPDATE users SET username = 'Notreoblemccmrfip', password_hash = ?, role = 'SUPERADMIN' WHERE id = ?", [superHash, superRows[0].id]);
    }

    // 2. Admin: Smirthi / smirthi1234
    const [adminRows] = await conn.query("SELECT id FROM users WHERE LOWER(username) = 'smirthi' OR LOWER(email) = 'smirthi@notreoble.com'");
    const adminHash = await bcrypt.hash('smirthi1234', salt);
    if (adminRows.length === 0) {
      await conn.query(`
        INSERT INTO users (username, gender, email, phone, vocal_trainer_name, password_hash, selected_musical_goal, role)
        VALUES ('Smirthi', 'Female', 'smirthi@notreoble.com', '+919876543212', 'Vocal Instructor Smirthi', ?, 'Vocal Pedagogy Trainer', 'ADMIN')
      `, [adminHash]);
    } else {
      await conn.query("UPDATE users SET username = 'Smirthi', password_hash = ?, role = 'ADMIN' WHERE id = ?", [adminHash, adminRows[0].id]);
    }

    console.log('[Migration] All database tables, modules, goals, and admin accounts migrated successfully!');
  } catch (err) {
    console.error('[Migration Error]:', err);
    throw err;
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  runDashboardMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runDashboardMigration;
