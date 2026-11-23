-- NO TRE(O)BLE Database Schema
-- Breath Management and Vocal Training Web Portal

CREATE DATABASE IF NOT EXISTS resonova_db;
USE resonova_db;

-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  gender VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  vocal_trainer_name VARCHAR(150) NULL,
  password_hash VARCHAR(255) NOT NULL,
  selected_musical_goal VARCHAR(255) NULL,
  role ENUM('USER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: user_music_preferences
CREATE TABLE IF NOT EXISTS user_music_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  music_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_music (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: practice_sessions
CREATE TABLE IF NOT EXISTS practice_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_type VARCHAR(100) NOT NULL,
  exercise_name VARCHAR(150) NULL,
  start_time TIMESTAMP NULL,
  end_time TIMESTAMP NULL,
  duration_minutes INT NOT NULL DEFAULT 0,
  completion_status VARCHAR(50) NOT NULL DEFAULT 'completed',
  notes TEXT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_practice (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3b: user_practice_goals
CREATE TABLE IF NOT EXISTS user_practice_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  weekly_target_minutes INT NOT NULL DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_goal (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3c: learning_modules
CREATE TABLE IF NOT EXISTS learning_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  module_order INT NOT NULL DEFAULT 1,
  status ENUM('IN_PROGRESS', 'NEXT_MODULE', 'COMING_SOON') DEFAULT 'COMING_SOON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3d: learning_activities
CREATE TABLE IF NOT EXISTS learning_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  activity_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3e: user_learning_progress
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3f: user_song_practice
CREATE TABLE IF NOT EXISTS user_song_practice (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  song_title VARCHAR(255) NOT NULL,
  language VARCHAR(100) NULL,
  song_type VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3g: song_practice_phrases
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3h: admin_audit_logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  target_type VARCHAR(100) NULL,
  target_id INT NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: lessons
CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  video_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: user_lesson_progress
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  completion_status VARCHAR(50) NOT NULL DEFAULT 'completed',
  completed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_lesson (user_id, lesson_id),
  INDEX idx_user_progress (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 6: password_resets (Workflow for secure password reset)
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed initial lessons covering the 6 core vocal & breath modules
INSERT INTO lessons (title, description, category, video_url)
SELECT * FROM (
  SELECT 
    'Anatomy of Diaphragm & Rib Expansion' AS title, 
    'Understand the biological mechanics of diaphragmatic descent, lower abdominal relaxation, and 360-degree intercostal rib cage expansion.' AS description, 
    'Breath Management Fundamentals' AS category, 
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ' AS video_url
  UNION ALL
  SELECT 
    'Eliminating Clavicular Breathing' AS title, 
    'Identify and stop shallow shoulder and chest breathing to unlock deep, unhindered breath reserves for singing.' AS description, 
    'Breath Management Fundamentals' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Appoggio Technique & Balanced Airflow' AS title, 
    'Master the traditional Italian appoggio method: leaning on the breath to sustain consistent tone and pitch stability.' AS description, 
    'Breathing Techniques' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Box Breathing (4-4-4-4) for Vocalists' AS title, 
    'Regulate autonomic nervous system state and build breath pacing discipline through controlled 4-phase breathing cycles.' AS description, 
    'Breathing Techniques' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Balanced Vocal Onset & Pressure' AS title, 
    'Coordinate vocal fold adduction with gentle breath initiation without hard glottal attacks or breathy leakage.' AS description, 
    'Vocal Control' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Messa di Voce (Dynamic Volume Swells)' AS title, 
    'Sing a single note from pianissimo to fortissimo and back while maintaining vocal timbre, resonance, and stable breath.' AS description, 
    'Vocal Control' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Intercostal Muscle Stamina & Resistance' AS title, 
    'Isolate and condition the respiratory muscles to prevent premature air expulsion during dramatic vocal phrases.' AS description, 
    'Vocal Strength' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Subglottic Pressure Regulation for High Notes' AS title, 
    'Safely increase subglottic air pressure without throat tension, enabling powerful high registers and clean resonance.' AS description, 
    'Vocal Strength' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Phrase Mapping & Breath Markers' AS title, 
    'Annotate musical scores and lyrics to systematically map micro-breaths, catch-breaths, and deep replenishment marks.' AS description, 
    'Singing Practice' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Staccato Pulses vs Legato Streaming' AS title, 
    'Contrast quick diaphragmatic pulses for fast rhythmic runs against smooth, uninterrupted breath streams for long legato lines.' AS description, 
    'Singing Practice' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Stage Adrenaline & Heart Rate Calming' AS title, 
    'Deploy specialized physiological sigh techniques backstage to neutralize adrenaline tremors and voice shakiness.' AS description, 
    'Performance Preparation' AS category, 
    NULL AS video_url
  UNION ALL
  SELECT 
    'Dynamic Movement & Active Breath Support' AS title, 
    'Maintain lower core breath support while walking, dancing, holding a microphone, and interacting with audiences on stage.' AS description, 
    'Performance Preparation' AS category, 
    NULL AS video_url
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM lessons LIMIT 1);

-- ============================================================================
-- GAGNÉ'S NINE EVENTS OF INSTRUCTION & TASK MANAGEMENT SCHEMA
-- ============================================================================

-- Table 7: learning_stages
CREATE TABLE IF NOT EXISTS learning_stages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  stage_number INT NOT NULL,
  stage_title VARCHAR(255) NOT NULL,
  stage_subtitle VARCHAR(255) NULL,
  stage_description TEXT NOT NULL,
  stage_content LONGTEXT NULL,
  stage_order INT NOT NULL DEFAULT 1,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_module_stage (module_id, stage_number),
  FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 8: learning_tasks
CREATE TABLE IF NOT EXISTS learning_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stage_id INT NOT NULL,
  task_title VARCHAR(255) NOT NULL,
  task_description TEXT NOT NULL,
  task_instructions TEXT NULL,
  learning_materials LONGTEXT NULL,
  task_type VARCHAR(50) NOT NULL,
  maximum_marks INT NOT NULL DEFAULT 100,
  passing_marks INT NOT NULL DEFAULT 60,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  task_order INT NOT NULL DEFAULT 1,
  time_limit_minutes INT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 9: user_learning_enrollments
CREATE TABLE IF NOT EXISTS user_learning_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  module_id INT NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  current_stage_id INT NULL,
  completion_status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_enrollment (user_id, module_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 10: user_stage_progress
CREATE TABLE IF NOT EXISTS user_stage_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stage_id INT NOT NULL,
  completion_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_stage (user_id, stage_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 11: user_task_assignments
CREATE TABLE IF NOT EXISTS user_task_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_id INT NOT NULL,
  assignment_status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  submitted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_task (user_id, task_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 12: user_task_submissions
CREATE TABLE IF NOT EXISTS user_task_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_id INT NOT NULL,
  submission_type VARCHAR(50) NOT NULL,
  text_response TEXT NULL,
  quiz_answers JSON NULL,
  file_reference VARCHAR(500) NULL,
  original_file_name VARCHAR(255) NULL,
  file_size_bytes INT NULL,
  mime_type VARCHAR(100) NULL,
  duration_seconds INT NULL,
  metadata JSON NULL,
  submission_version INT NOT NULL DEFAULT 1,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 13: task_assessments
CREATE TABLE IF NOT EXISTS task_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  maximum_marks INT NOT NULL DEFAULT 100,
  marks_awarded INT NULL,
  percentage DECIMAL(5,2) NULL,
  feedback TEXT NULL,
  improvement_suggestions TEXT NULL,
  assessment_status VARCHAR(50) NOT NULL DEFAULT 'AWAITING_REVIEW',
  assessed_by INT NULL,
  assessed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES user_task_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

