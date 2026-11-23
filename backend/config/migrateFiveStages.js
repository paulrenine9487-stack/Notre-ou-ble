const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runFiveStagesMigration() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'resonova_db';

  console.log(`[5-Stage Migration] Connecting to MySQL at ${host}:${port}/${database}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });

  try {
    // 0. Ensure uploads directories exist
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const audioDir = path.resolve(__dirname, '../uploads/audio');
    const videosDir = path.resolve(__dirname, '../uploads/videos');
    for (const dir of [uploadsDir, audioDir, videosDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[5-Stage Migration] Created uploads directory: ${dir}`);
      }
    }

    // 1. Ensure Module 01 in learning_modules
    const [modRows] = await conn.query("SELECT id FROM learning_modules WHERE module_order = 1 OR module_code = 'MOD-01' LIMIT 1");
    let moduleId;
    if (modRows.length > 0) {
      moduleId = modRows[0].id;
      await conn.query(`
        UPDATE learning_modules
        SET title = 'The Hidden Engine: Breath Control & Vocal Stamina',
            description = 'Learn posture, diaphragmatic breathing, breath control and vocal stamina for singing.',
            module_code = 'MOD-01',
            status = 'IN_PROGRESS',
            module_order = 1
        WHERE id = ?
      `, [moduleId]);
    } else {
      const [insertMod] = await conn.query(`
        INSERT INTO learning_modules (title, description, module_code, module_order, status)
        VALUES ('The Hidden Engine: Breath Control & Vocal Stamina', 'Learn posture, diaphragmatic breathing, breath control and vocal stamina for singing.', 'MOD-01', 1, 'IN_PROGRESS')
      `);
      moduleId = insertMod.insertId;
    }

    // 2. Ensure learning_stages has required columns
    // Existing columns: id, module_id, stage_number, stage_title, stage_subtitle, stage_description, stage_content, stage_order, status, created_at, updated_at
    const [stageCols] = await conn.query("SHOW COLUMNS FROM learning_stages");
    const colNames = stageCols.map(c => c.Field);
    if (!colNames.includes('title')) {
      await conn.query("ALTER TABLE learning_stages ADD COLUMN title VARCHAR(255) NULL AFTER stage_number");
    }
    if (!colNames.includes('subtitle')) {
      await conn.query("ALTER TABLE learning_stages ADD COLUMN subtitle VARCHAR(255) NULL AFTER stage_title");
    }
    if (!colNames.includes('description')) {
      await conn.query("ALTER TABLE learning_stages ADD COLUMN description TEXT NULL AFTER stage_subtitle");
    }
    if (!colNames.includes('display_order')) {
      await conn.query("ALTER TABLE learning_stages ADD COLUMN display_order INT NOT NULL DEFAULT 1 AFTER stage_order");
    }
    if (!colNames.includes('is_active')) {
      await conn.query("ALTER TABLE learning_stages ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER status");
    }

    // 3. Define the exact 5 Stages
    const fiveStages = [
      {
        num: 1,
        title: 'Introduction',
        subtitle: 'Get curious',
        description: 'Watch this short video to see why your breath matters when you sing.\nWhen you are ready, press Next.'
      },
      {
        num: 2,
        title: 'What Do You Know?',
        subtitle: 'Remember',
        description: "Before learning new techniques, let's discover what you already know about breathing and singing."
      },
      {
        num: 3,
        title: 'How To Do It',
        subtitle: 'Understand',
        description: 'Understand how airflow and diaphragmatic support work together through video demonstrations, lungs simulation, technique tips, and song practice.'
      },
      {
        num: 4,
        title: "Let's Check Ourselves",
        subtitle: 'Show what you know',
        description: 'Test your breath management knowledge with interactive challenges, complete a written assessment, and record your song performance.'
      },
      {
        num: 5,
        title: 'Keep It Going',
        subtitle: 'Fine-tune',
        description: 'Reflect on your vocal development, share your learning experience feedback, and save your practice summary to your personal Practice Journal.'
      }
    ];

    // Deactivate or remove any stages with stage_number > 5 for this module
    await conn.query("UPDATE learning_stages SET is_active = FALSE, status = 'INACTIVE' WHERE module_id = ? AND stage_number > 5", [moduleId]);

    // Upsert the 5 stages
    const stageMap = {}; // stage_number -> stage_id
    for (const st of fiveStages) {
      const [existingStage] = await conn.query(
        "SELECT id FROM learning_stages WHERE module_id = ? AND stage_number = ?",
        [moduleId, st.num]
      );
      if (existingStage.length > 0) {
        const sId = existingStage[0].id;
        await conn.query(`
          UPDATE learning_stages
          SET stage_title = ?,
              title = ?,
              stage_subtitle = ?,
              subtitle = ?,
              stage_description = ?,
              description = ?,
              stage_order = ?,
              display_order = ?,
              status = 'ACTIVE',
              is_active = TRUE
          WHERE id = ?
        `, [st.title, st.title, st.subtitle, st.subtitle, st.description, st.description, st.num, st.num, sId]);
        stageMap[st.num] = sId;
      } else {
        const [insertRes] = await conn.query(`
          INSERT INTO learning_stages
            (module_id, stage_number, title, stage_title, subtitle, stage_subtitle, description, stage_description, stage_order, display_order, status, is_active)
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', TRUE)
        `, [moduleId, st.num, st.title, st.title, st.subtitle, st.subtitle, st.description, st.description, st.num, st.num]);
        stageMap[st.num] = insertRes.insertId;
      }
    }
    console.log('[5-Stage Migration] 5 Stages upserted:', stageMap);

    // 4. Create learning_stage_content table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_stage_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stage_id INT NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        content_url VARCHAR(500) NULL,
        storage_key VARCHAR(255) NULL,
        content_data LONGTEXT NULL,
        display_order INT NOT NULL DEFAULT 1,
        is_required BOOLEAN NOT NULL DEFAULT TRUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 5. Create learning_objectives table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_objectives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stage_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        display_order INT NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 6. Create recall_questions table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS recall_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stage_id INT NOT NULL,
        question TEXT NOT NULL,
        instructions TEXT NULL,
        display_order INT NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 7. Create recall_answers table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS recall_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT NOT NULL,
        answer TEXT NOT NULL,
        attempt_number INT NOT NULL DEFAULT 1,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES recall_questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 8. Create breathing_tips table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS breathing_tips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stage_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(100) NULL,
        display_order INT NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 9. Create learning_songs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_songs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stage_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NULL,
        description TEXT NULL,
        media_type VARCHAR(50) DEFAULT 'audio',
        media_url VARCHAR(500) NULL,
        storage_key VARCHAR(255) NULL,
        instructions TEXT NULL,
        display_order INT NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 10. Create learning_challenges table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_challenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stage_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        challenge_type VARCHAR(50) NOT NULL,
        total_marks INT NOT NULL DEFAULT 100,
        passing_score INT NOT NULL DEFAULT 60,
        configuration_json LONGTEXT NOT NULL,
        display_order INT NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 11. Create challenge_attempts table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS challenge_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        challenge_id INT NOT NULL,
        attempt_number INT NOT NULL DEFAULT 1,
        answers_json LONGTEXT NOT NULL,
        score INT NOT NULL DEFAULT 0,
        total_marks INT NOT NULL DEFAULT 100,
        percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'COMPLETED',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES learning_challenges(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 12. Create written_assessments table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS written_assessments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        stage_id INT NOT NULL,
        prompt TEXT NULL,
        answer TEXT NOT NULL,
        assessment_score INT NULL,
        reviewer_feedback TEXT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 13. Create student_recordings table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_recordings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        stage_id INT NOT NULL,
        song_id INT NULL,
        storage_key VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        duration_seconds INT NULL,
        comments TEXT NULL,
        attempt_number INT NOT NULL DEFAULT 1,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'SUBMITTED',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES learning_songs(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 14. Create learning_feedback table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        stage_id INT NOT NULL,
        rating INT NOT NULL,
        useful_feedback TEXT NULL,
        difficult_feedback TEXT NULL,
        improvement_suggestions TEXT NULL,
        additional_comments TEXT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 15. Create learning_stage_progress table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_stage_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        stage_id INT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'NOT STARTED',
        progress_percentage DECIMAL(5,2) DEFAULT 0.00,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_stage_prog (user_id, stage_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 16. Create learning_activity_progress table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_activity_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        stage_id INT NOT NULL,
        activity_id VARCHAR(100) NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'COMPLETED',
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_stage_activity (user_id, stage_id, activity_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 17. Create learning_practice_summaries table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS learning_practice_summaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        stage_id INT NOT NULL,
        practice_session_id INT NULL,
        activities_json LONGTEXT NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 0,
        practice_notes TEXT NULL,
        learned_notes TEXT NULL,
        difficulty_notes TEXT NULL,
        next_practice_goal TEXT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES learning_stages(id) ON DELETE CASCADE,
        FOREIGN KEY (practice_session_id) REFERENCES practice_sessions(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ========================================================================
    // SEED INITIAL EDITABLE CONTENT FOR THE 5 STAGES
    // ========================================================================

    const stage1Id = stageMap[1];
    const stage2Id = stageMap[2];
    const stage3Id = stageMap[3];
    const stage4Id = stageMap[4];
    const stage5Id = stageMap[5];

    // Stage 1 Content: Introduction, Intro Video, Vision Board
    const [existingS1Content] = await conn.query("SELECT id FROM learning_stage_content WHERE stage_id = ?", [stage1Id]);
    if (existingS1Content.length === 0) {
      // Intro Text
      await conn.query(`
        INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_data, display_order, is_required, is_active)
        VALUES (?, 'introduction', 'Breath Management',
          'Watch this short video to see why your breath matters when you sing.\nWhen you are ready, press Next.',
          JSON_OBJECT('section_heading', 'FOUNDATIONS OF BREATH CONTROL', 'extra_text', 'Mastering breath management unlocks resonance, eliminates pitch wavering, and allows your voice to soar effortlessly across registers.'),
          1, TRUE, TRUE)
      `, [stage1Id]);

      // Intro Video
      await conn.query(`
        INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_url, display_order, is_required, is_active)
        VALUES (?, 'intro_video', 'Introduction to Breath Management',
          'Watch this visual guide to understand how comfortable diaphragmatic breathing creates effortless vocal support.',
          '/IMG_7993.MP4',
          2, TRUE, TRUE)
      `, [stage1Id]);

      // Vision Board Content
      await conn.query(`
        INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_data, display_order, is_required, is_active)
        VALUES (?, 'vision_board', 'OUR LEARNING VISION',
          'Help every singer develop comfortable breathing habits, controlled airflow and confident musical expression.',
          JSON_OBJECT('board_heading', 'YOUR LEARNING OBJECTIVES'),
          3, TRUE, TRUE)
      `, [stage1Id]);
    }

    // Stage 1 Objectives (5 cards)
    const [existingS1Objectives] = await conn.query("SELECT id FROM learning_objectives WHERE stage_id = ?", [stage1Id]);
    if (existingS1Objectives.length === 0) {
      const objectives = [
        { title: 'Understand the importance of breathing in singing.', desc: 'Discover how breath coordination powers consistent vocal resonance and tone clarity.', order: 1 },
        { title: 'Identify how airflow supports vocal production.', desc: 'Learn to regulate breath pressure at the vocal cords without tightening the throat.', order: 2 },
        { title: 'Understand the relationship between breathing and musical phrasing.', desc: 'Plan natural inhalation marks so songs flow smoothly without gasping.', order: 3 },
        { title: 'Recognise common breathing mistakes.', desc: 'Identify clavicular shoulder breathing, breath holding, and forced exhalation.', order: 4 },
        { title: 'Develop awareness of comfortable breathing.', desc: 'Cultivate relaxed lower-rib expansion and effortless breath management.', order: 5 }
      ];
      for (const obj of objectives) {
        await conn.query(
          "INSERT INTO learning_objectives (stage_id, title, description, display_order, is_active) VALUES (?, ?, ?, ?, TRUE)",
          [stage1Id, obj.title, obj.desc, obj.order]
        );
      }
      console.log('[5-Stage Migration] Seeded 5 Learning Objectives.');
    }

    // Stage 2 Questions (2 Recall Questions)
    const [existingS2Questions] = await conn.query("SELECT id FROM recall_questions WHERE stage_id = ?", [stage2Id]);
    if (existingS2Questions.length === 0) {
      const recallQuestions = [
        { q: 'What words come to mind when you hear breath management ?', inst: 'Type words or keywords that come to mind.', order: 1 },
        { q: 'What would you like to learn from this module?', inst: 'Share what vocal goals or skills you hope to learn.', order: 2 }
      ];
      for (const rq of recallQuestions) {
        await conn.query(
          "INSERT INTO recall_questions (stage_id, question, instructions, display_order, is_active) VALUES (?, ?, ?, ?, TRUE)",
          [stage2Id, rq.q, rq.inst, rq.order]
        );
      }
      console.log('[5-Stage Migration] Seeded 2 Recall Questions.');
    }

    // Stage 3 Content: Teaching Video & Lungs Simulation Placeholder
    const [existingS3Content] = await conn.query("SELECT id FROM learning_stage_content WHERE stage_id = ? AND content_type = 'teaching_video'", [stage3Id]);
    if (existingS3Content.length === 0) {
      await conn.query(`
        INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_url, display_order, is_required, is_active)
        VALUES (?, 'teaching_video', 'Part 1 • How breathing works',
          'Watch the full video before moving to the practice guide',
          '/IMG_7993.MP4',
          1, TRUE, TRUE)
      `, [stage3Id]);

      await conn.query(`
        INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_data, display_order, is_required, is_active)
        VALUES (?, 'lungs_simulation', 'LUNGS SIMULATION PRACTICE',
          'Interactive diaphragmatic breathing simulator placeholder. Practice synchronizing inhalation depth and gradual release.',
          JSON_OBJECT('simulation_version', '1.0-placeholder', 'inhalation_target_seconds', 4, 'exhalation_target_seconds', 8, 'status', 'ready_for_engine'),
          2, FALSE, TRUE)
      `, [stage3Id]);
    }

    // Stage 3 Breathing Tips (5 tips cards)
    const [existingS3Tips] = await conn.query("SELECT id FROM breathing_tips WHERE stage_id = ?", [stage3Id]);
    if (existingS3Tips.length === 0) {
      const tips = [
        { title: 'Keep your shoulders relaxed while breathing', desc: 'Raising your shoulders engages neck tension and blocks deep lung expansion.', icon: 'Feather', order: 1 },
        { title: 'Avoid forcing your inhalation', desc: 'Allow air to enter naturally by opening your lower ribs rather than gasping.', icon: 'Wind', order: 2 },
        { title: 'Maintain comfortable airflow', desc: 'Vocal support is steady air resistance, not clamping or holding your breath.', icon: 'Activity', order: 3 },
        { title: 'Plan your breathing before starting a musical phrase', desc: 'Know exactly where your breath punctuation marks belong in the song lyrics.', icon: 'Compass', order: 4 },
        { title: 'Practise consistently without straining', desc: 'Five minutes of relaxed diaphragmatic awareness daily builds lasting muscle memory.', icon: 'Sparkles', order: 5 }
      ];
      for (const tip of tips) {
        await conn.query(
          "INSERT INTO breathing_tips (stage_id, title, description, icon, display_order, is_active) VALUES (?, ?, ?, ?, ?, TRUE)",
          [stage3Id, tip.title, tip.desc, tip.icon, tip.order]
        );
      }
      console.log('[5-Stage Migration] Seeded 5 Breathing Tips.');
    }

    // Stage 3 Songs (Song Practice: Listen and Follow)
    const [existingS3Songs] = await conn.query("SELECT id FROM learning_songs WHERE stage_id = ?", [stage3Id]);
    if (existingS3Songs.length === 0) {
      await conn.query(`
        INSERT INTO learning_songs (stage_id, title, artist, description, media_type, media_url, instructions, display_order, is_active)
        VALUES (?, 'Amazing Grace (Vocal Phrasing & Breath Marks)', 'Traditional Melody',
          'A classic ballad ideal for practicing slow inhalation, continuous subglottic support, and seamless phrase transitions.',
          'audio',
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          '1. Listen through once to observe the tempo and natural punctuation.\\n2. Mark your breath points: take a silent breath on count 4 before each phrase.\\n3. Sing along while keeping your shoulders relaxed and lower ribs gently expanded.',
          1, TRUE)
      `, [stage3Id]);
      console.log('[5-Stage Migration] Seeded Learning Song for Stage 3.');
    }

    // Stage 4 Challenges: Myth or Fact & Match Part to Job
    const [existingS4Challenges] = await conn.query("SELECT id FROM learning_challenges WHERE stage_id = ?", [stage4Id]);
    if (existingS4Challenges.length === 0) {
      // Challenge 1: Myth or Fact
      const mythOrFactConfig = {
        type: 'myth_or_fact',
        questions: [
          {
            id: 'mf-1',
            statement: 'Pulling your stomach in as you inhale gives better support.',
            correctAnswer: 'MYTH',
            explanation: 'Pulling your stomach in prevents the diaphragm from descending and severely restricts your lung capacity. Allow the lower torso to expand naturally.'
          },
          {
            id: 'mf-2',
            statement: 'The diaphragm flattens downward when you inhale.',
            correctAnswer: 'FACT',
            explanation: 'The diaphragm muscle contracts and moves downward upon inhalation, creating the vacuum that fills the lungs effortlessly.'
          },
          {
            id: 'mf-3',
            statement: 'Good breath support means holding as much air in your lungs as possible.',
            correctAnswer: 'MYTH',
            explanation: 'Overfilling the lungs creates excess subglottic pressure that forces the vocal cords to lock and strain. Support is about regulated release, not maximum volume.'
          },
          {
            id: 'mf-4',
            statement: 'Raising your shoulders during inhalation creates neck tension.',
            correctAnswer: 'FACT',
            explanation: 'Clavicular breathing triggers shoulder and strap muscles around the larynx, restricting vocal agility and causing vocal fatigue.'
          }
        ]
      };
      await conn.query(`
        INSERT INTO learning_challenges (stage_id, title, description, challenge_type, total_marks, passing_score, configuration_json, display_order, is_active)
        VALUES (?, 'Breathe Right: Fact or Myth?', 'Test your understanding of breathing techniques for singing.', 'myth_or_fact', 60, 30, ?, 1, TRUE)
      `, [stage4Id, JSON.stringify(mythOrFactConfig)]);

      console.log('[5-Stage Migration] Seeded Interactive Challenge (Breathe Right: Fact or Myth?) for Stage 4.');
    }

    // Stage 4 Written Assessment prompt config in learning_stage_content
    const [existingS4Content] = await conn.query("SELECT id FROM learning_stage_content WHERE stage_id = ? AND content_type = 'written_assessment_prompt'", [stage4Id]);
    if (existingS4Content.length === 0) {
      await conn.query(`
        INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_data, display_order, is_required, is_active)
        VALUES (?, 'written_assessment_prompt', 'WHAT DO YOU KNOW NOW?',
          'Explain what you have learned about breath management and how you will apply it when singing a song.',
          JSON_OBJECT('prompt_heading', 'WHAT DO YOU KNOW NOW?', 'rubric', 'Clarity of diaphragmatic concept, practical application in song phrasing, self-awareness of tension.'),
          3, TRUE, TRUE)
      `, [stage4Id]);

      await conn.query(`
        INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_data, display_order, is_required, is_active)
        VALUES (?, 'recording_prompt', 'LET YOUR VOICE BE HEARD',
          'Now apply what you have learned. Record yourself singing the song you practised and submit your performance for assessment.',
          JSON_OBJECT('section_heading', 'LET YOUR VOICE BE HEARD', 'max_duration_seconds', 300),
          4, TRUE, TRUE)
      `, [stage4Id]);
    }

    // Stage 5 Content: Feedback settings & Practice Summary activities
    const [existingS5Content] = await conn.query("SELECT id FROM learning_stage_content WHERE stage_id = ? AND content_type = 'feedback_settings'", [stage5Id]);
    if (existingS5Content.length === 0) {
      await conn.query(`
        INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_data, display_order, is_required, is_active)
        VALUES (?, 'feedback_settings', 'SHARE YOUR FEEDBACK',
          'Tell us about your learning experience so we can fine-tune future modules.',
          JSON_OBJECT('questions', JSON_ARRAY('Overall experience rating', 'What did you find useful?', 'What was difficult?', 'What would you like to improve?', 'Additional comments')),
          1, TRUE, TRUE)
      `, [stage5Id]);

      const practiceActivities = [
        'Watched breath management lesson',
        'Completed knowledge recall questions',
        'Practised lungs simulation',
        'Reviewed breath management tips',
        'Practised a song',
        'Completed interactive challenges',
        'Recorded a song',
        'Completed written assessment'
      ];

      await conn.query(`
        INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_data, display_order, is_required, is_active)
        VALUES (?, 'practice_summary_config', 'WHAT DID YOU PRACTISE?',
          'Collect your actual activities completed through this portal and log them directly into your Practice Journal.',
          JSON_OBJECT('activities_options', ?),
          2, TRUE, TRUE)
      `, [stage5Id, JSON.stringify(practiceActivities)]);
    }

    console.log('[5-Stage Migration] All 5-Stage Learning Module tables and seed data verified successfully!');
    await conn.end();
    return true;
  } catch (error) {
    console.error('[5-Stage Migration Error]:', error);
    try { await conn.end(); } catch (e) {}
    throw error;
  }
}

if (require.main === module) {
  runFiveStagesMigration()
    .then(() => {
      console.log('5-Stage migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runFiveStagesMigration;
