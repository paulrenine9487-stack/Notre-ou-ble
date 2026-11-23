const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runLearningStagesMigration() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'resonova_db';

  console.log(`[Migration] Setting up Learning Module & Task Management in ${database}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });

  try {
    // 0. Ensure uploads/audio directory exists
    const uploadsDir = path.resolve(__dirname, '../uploads/audio');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`[Migration] Created audio uploads directory: ${uploadsDir}`);
    }

    // 1. Ensure module_code column in learning_modules
    const [modCols] = await conn.query("SHOW COLUMNS FROM learning_modules LIKE 'module_code'");
    if (modCols.length === 0) {
      console.log("[Migration] Adding module_code column to learning_modules...");
      await conn.query("ALTER TABLE learning_modules ADD COLUMN module_code VARCHAR(50) NOT NULL DEFAULT 'MOD-01' AFTER description");
    }

    // 2. Ensure Module 01 has exact requested title, description, code, and status
    const [existingMod1] = await conn.query("SELECT id FROM learning_modules WHERE module_order = 1 OR module_code = 'MOD-01' LIMIT 1");
    let moduleId;
    if (existingMod1.length > 0) {
      moduleId = existingMod1[0].id;
      await conn.query(`
        UPDATE learning_modules
        SET title = 'Breathe. Support. Sing.',
            description = 'Breath management isn\\'t about taking the biggest breath or holding a note for the longest time. It\\'s about coordinating comfortable breathing with the musical phrase.',
            module_code = 'MOD-01',
            status = 'IN_PROGRESS',
            module_order = 1
        WHERE id = ?
      `, [moduleId]);
    } else {
      const [insertMod] = await conn.query(`
        INSERT INTO learning_modules (title, description, module_code, module_order, status)
        VALUES ('Breathe. Support. Sing.', 'Breath management isn\\'t about taking the biggest breath or holding a note for the longest time. It\\'s about coordinating comfortable breathing with the musical phrase.', 'MOD-01', 1, 'IN_PROGRESS')
      `);
      moduleId = insertMod.insertId;
    }

    // 3. Create learning_stages table
    await conn.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. Create learning_tasks table
    await conn.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 5. Create user_learning_enrollments table
    await conn.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 6. Create user_stage_progress table
    await conn.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 7. Create user_task_assignments table
    await conn.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 8. Create user_task_submissions table
    await conn.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 9. Create task_assessments table
    await conn.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 10. Update practice_sessions columns
    const [sessTaskCol] = await conn.query("SHOW COLUMNS FROM practice_sessions LIKE 'task_id'");
    if (sessTaskCol.length === 0) {
      console.log("[Migration] Adding task_id & duration_seconds to practice_sessions...");
      await conn.query("ALTER TABLE practice_sessions ADD COLUMN task_id INT NULL AFTER user_id");
      await conn.query("ALTER TABLE practice_sessions ADD COLUMN duration_seconds INT NOT NULL DEFAULT 0 AFTER duration_minutes");
      await conn.query("ALTER TABLE practice_sessions ADD COLUMN session_status VARCHAR(50) NOT NULL DEFAULT 'completed' AFTER duration_seconds");
    }

    // 11. Seed Gagné's Nine Events of Instruction for Module 01
    const gagneStages = [
      {
        num: 1,
        title: 'Gain Attention',
        subtitle: 'Get curious',
        desc: 'Awaken your auditory perception and discover how breath coordination directly influences vocal tone stability.',
        content: `### Welcome to Stage 01: Gain Attention
Get curious about how your body breathes when you are not thinking about singing versus when you prepare to sing.
Notice the difference between a high, tight chest breath and an expansive, relaxed diaphragmatic breath.

**Key Observation:**
When singers strain for high notes or run out of air mid-phrase, it is rarely due to low lung capacity. It is almost always a coordination issue between inhalation relaxation and steady airflow resistance.`,
        task: {
          title: 'Natural Breath Perception & Reflection',
          desc: 'Observe your resting breath pattern versus your singing preparation.',
          instructions: 'Place one hand on your chest and one on your navel. Take 3 silent, gentle breaths through your nose and mouth. Write a brief reflection describing which hand moved first and how relaxed your shoulders remained.',
          materials: 'Audio Guide: Observing the Silent Inhalation (1 min 30 sec)',
          type: 'written',
          maxMarks: 10,
          passMarks: 6,
          timeLimit: 10
        }
      },
      {
        num: 2,
        title: 'Inform Objectives',
        subtitle: 'Set your goal',
        desc: 'Clarify the physiological targets of diaphragmatic expansion and set personal vocal endurance goals.',
        content: `### Welcome to Stage 02: Inform Objectives
By the end of this foundational module, you will be able to:
1. Initiate a silent 360° diaphragmatic inhalation in under 2 seconds without shoulder elevation.
2. Maintain steady subglottic breath pressure during sustained phonation.
3. Mark and execute breath breaks naturally within real song lyrics without breaking musical momentum.`,
        task: {
          title: 'Personal Breath Management Milestones',
          desc: 'Define your vocal goals and target phrase endurance benchmarks.',
          instructions: 'Identify one song in your current repertoire where you frequently run out of breath or feel vocal fatigue. State the song title and your primary vocal goal for this module.',
          materials: 'Syllabus Benchmark Chart & Target Phrase Metrics',
          type: 'written',
          maxMarks: 20,
          passMarks: 12,
          timeLimit: 15
        }
      },
      {
        num: 3,
        title: 'Stimulate Recall',
        subtitle: 'Remember',
        desc: 'Recall prior speaking and singing experiences, identifying clavicular (chest) tension versus low abdominal release.',
        content: `### Welcome to Stage 03: Stimulate Recall
Think about everyday physical acts: yawning, laughing from the belly, or sleeping deeply. During all of these, your body naturally uses diaphragmatic breathing without conscious effort.

**Diagnostic Insight:**
Tension enters when we believe we must "pull in" massive amounts of air before singing. Remembering natural relaxation triggers allows effortless airflow.`,
        task: {
          title: 'Breathing Habits Diagnostic Quiz',
          desc: 'Complete this quick 3-question diagnostic self-check.',
          instructions: 'Answer the diagnostic questions regarding where you feel breath movement and how your shoulders react.',
          materials: 'Diagnostic Rubric: Clavicular vs Diaphragmatic Indicators',
          type: 'quiz',
          maxMarks: 20,
          passMarks: 12,
          timeLimit: 10
        }
      },
      {
        num: 4,
        title: 'Present Content',
        subtitle: 'Understand',
        desc: 'Understand the core respiratory physiology: the thoracic diaphragm, intercostal engagement, and subglottic air pressure.',
        content: `### Welcome to Stage 04: Present Content
#### The Physiology of Breath Management
1. **The Diaphragm:** A dome-shaped muscle separating the chest from the abdomen. On inhalation, it contracts downward, creating negative pressure that draws air into the lungs.
2. **The Intercostals:** Muscles between the ribs that expand the rib cage outward 360°.
3. **Appoggio Support:** The Italian vocal technique of maintaining ribcage expansion during exhalation to resist sudden lung collapse and prevent vocal fold slamming.`,
        task: {
          title: 'Appoggio & Respiratory Mechanics Reading Task',
          desc: 'Read the physiological breakdown and confirm your comprehension of appoggio support.',
          instructions: 'Read the core content above and confirm your understanding of diaphragmatic descent and intercostal recoil resistance.',
          materials: 'Anatomical Diagrams: Diaphragm Descent & Intercostal Engagement',
          type: 'reading',
          maxMarks: 20,
          passMarks: 14,
          timeLimit: 15
        }
      },
      {
        num: 5,
        title: 'Provide Learning Guidance',
        subtitle: 'Get guidance',
        desc: 'Follow structured step-by-step guidance on 360° lower rib expansion, silent catch-breaths, and controlled exhalation.',
        content: `### Welcome to Stage 05: Provide Learning Guidance
#### 3-Step Guided Breathing Protocol
- **Step 1 - The Release:** Soften the lower abdominal wall before inhaling. Do not suck in your stomach.
- **Step 2 - The 360° Expansion:** Allow the breath to expand the sides and lower back. Imagine a ring expanding evenly around your waist.
- **Step 3 - The Controlled Stream:** Hiss gently on an unvoiced "Sss" sound, keeping the lower ribs expanded for as long as comfortable.`,
        task: {
          title: 'Guided 360° Diaphragmatic Breathwork Practice',
          desc: 'Practice the 3-step expansion protocol using the interactive breathing guide.',
          instructions: 'Follow the pacing bubble below. Complete at least 4 cycles of 4-second inhalation, 2-second suspension, and 6-second controlled hiss.',
          materials: 'Interactive Visual Breath Pacer & Sensation Checkpoint Guide',
          type: 'breathing_exercise',
          maxMarks: 25,
          passMarks: 15,
          timeLimit: 15
        }
      },
      {
        num: 6,
        title: 'Elicit Performance',
        subtitle: 'Your turn',
        desc: 'Engage in active practice: execute measured timed breathing drills and sustain steady unconstricted phonation.',
        content: `### Welcome to Stage 06: Elicit Performance
Now it is your turn to actively practice and log your active breathing endurance.
Use the integrated practice timer to log your drill. The system will record your exact practice duration directly into your practice journal and update your dashboard stats.`,
        task: {
          title: 'Timed Respiratory Endurance Drill',
          desc: 'Execute a timed practice session of at least 3 minutes using the practice timer.',
          instructions: 'Click Start Practice below. Sustain smooth, controlled breathing cycles for at least 3 minutes. When finished, click Save Session to log your performance to MySQL.',
          materials: 'Drill Protocol: Sustained Legato Airflow Resistance',
          type: 'timed_practice',
          maxMarks: 25,
          passMarks: 15,
          timeLimit: 20
        }
      },
      {
        num: 7,
        title: 'Provide Feedback',
        subtitle: 'Fine-tune',
        desc: 'Receive immediate sensory feedback checklists and instructor feedback to fine-tune physical support.',
        content: `### Welcome to Stage 07: Provide Feedback
Self-assessment and teacher observation ensure you do not practice tension into your muscle memory.
Review the common tension indicators below:
- **Tension Sign 1:** Jaw or tongue gripping during inhalation.
- **Tension Sign 2:** Upper chest rising before the lower ribs expand.
- **Tension Sign 3:** Pushing air out too hard at the start of a note.`,
        task: {
          title: 'Vocal Support Self-Evaluation & Reflection',
          desc: 'Submit your sensory evaluation for instructor review and calibration.',
          instructions: 'Reflect on your physical sensations during the timed drill. Did you notice any jaw, neck, or shoulder tension? Enter your notes below for teacher review.',
          materials: 'Self-Correction Checklist & Tension Detection Guide',
          type: 'written',
          maxMarks: 20,
          passMarks: 12,
          timeLimit: 15
        }
      },
      {
        num: 8,
        title: 'Assess Performance',
        subtitle: 'Show what you know',
        desc: 'Map breathing marks across actual song phrases and submit an audio recording of your vocal execution for evaluation.',
        content: `### Welcome to Stage 08: Assess Performance
#### Practical Song-Based Breath Application
Singing is the true test of breath management. In this stage, you will:
1. Choose or enter a song and divide it into clear musical phrases.
2. Mark the inhalation points (deep diaphragmatic breaths vs. quick catch-breaths).
3. Record or upload an audio clip of you singing the phrase with your mapped breathing.
4. Submit your audio for formal teacher review and grading.`,
        task: {
          title: 'Song Phrase Breath Mapping & Audio Recording Submission',
          desc: 'Map your song phrases and submit your audio demonstration for teacher assessment.',
          instructions: 'Use the phrase mapper below to enter a song and mark breath positions. Then either record directly in your browser or upload an MP3/WAV/M4A/WebM file. Click Submit for Review when ready.',
          materials: 'Song Phrase Breathing Rubric & Audio Recording Guidelines',
          type: 'audio_submission',
          maxMarks: 50,
          passMarks: 35,
          timeLimit: 30
        }
      },
      {
        num: 9,
        title: 'Enhance Retention & Transfer',
        subtitle: 'Keep it going',
        desc: 'Integrate acquired breathing habits into daily vocal warm-ups and diverse musical repertoire.',
        content: `### Welcome to Stage 09: Enhance Retention & Transfer
Congratulations on reaching the final stage of Vocal Foundations!
Breath management is not a one-time exercise; it is an automatic habit that strengthens with consistent daily practice. Transfer these mechanics into your daily singing routine so they become second nature on stage.`,
        task: {
          title: 'Daily Repertoire Transfer & Practice Plan',
          desc: 'Formulate your ongoing daily vocal warm-up and repertoire maintenance plan.',
          instructions: 'Outline a 10-minute daily breathing warm-up schedule you will use before your singing practice sessions.',
          materials: 'Long-term Habit Tracker & Daily Routine Template',
          type: 'written',
          maxMarks: 10,
          passMarks: 6,
          timeLimit: 15
        }
      }
    ];

    console.log(`[Migration] Seeding 9 Gagné stages for module id ${moduleId}...`);
    for (const stageData of gagneStages) {
      const [existingStage] = await conn.query(
        "SELECT id FROM learning_stages WHERE module_id = ? AND stage_number = ?",
        [moduleId, stageData.num]
      );

      let stageId;
      if (existingStage.length > 0) {
        stageId = existingStage[0].id;
        await conn.query(`
          UPDATE learning_stages
          SET stage_title = ?, stage_subtitle = ?, stage_description = ?, stage_content = ?, stage_order = ?
          WHERE id = ?
        `, [stageData.title, stageData.subtitle, stageData.desc, stageData.content, stageData.num, stageId]);
      } else {
        const [insertStage] = await conn.query(`
          INSERT INTO learning_stages (module_id, stage_number, stage_title, stage_subtitle, stage_description, stage_content, stage_order, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        `, [moduleId, stageData.num, stageData.title, stageData.subtitle, stageData.desc, stageData.content, stageData.num]);
        stageId = insertStage.insertId;
      }

      // Seed corresponding task for this stage
      const [existingTask] = await conn.query(
        "SELECT id FROM learning_tasks WHERE stage_id = ? LIMIT 1",
        [stageId]
      );

      if (existingTask.length === 0) {
        await conn.query(`
          INSERT INTO learning_tasks (
            stage_id, task_title, task_description, task_instructions, 
            learning_materials, task_type, maximum_marks, passing_marks, 
            is_required, task_order, time_limit_minutes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, 1, ?, 'ACTIVE')
        `, [
          stageId,
          stageData.task.title,
          stageData.task.desc,
          stageData.task.instructions,
          stageData.task.materials,
          stageData.task.type,
          stageData.task.maxMarks,
          stageData.task.passMarks,
          stageData.task.timeLimit
        ]);
      } else {
        await conn.query(`
          UPDATE learning_tasks
          SET task_title = ?, task_description = ?, task_instructions = ?,
              learning_materials = ?, task_type = ?, maximum_marks = ?, passing_marks = ?,
              time_limit_minutes = ?
          WHERE id = ?
        `, [
          stageData.task.title,
          stageData.task.desc,
          stageData.task.instructions,
          stageData.task.materials,
          stageData.task.type,
          stageData.task.maxMarks,
          stageData.task.passMarks,
          stageData.task.timeLimit,
          existingTask[0].id
        ]);
      }
    }

    console.log("[Migration] Learning Stages & Tasks successfully configured and seeded.");
    await conn.end();
    return true;
  } catch (err) {
    console.error("[Migration Error in runLearningStagesMigration]:", err);
    await conn.end();
    throw err;
  }
}

if (require.main === module) {
  runLearningStagesMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runLearningStagesMigration;
