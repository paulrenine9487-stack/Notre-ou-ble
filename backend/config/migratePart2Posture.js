const mysql = require('mysql2/promise');
require('dotenv').config();

async function migratePart2Posture() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'resonova_db'
  });

  console.log('--- Migrating Stage 03 Part 02: Interactive Posture Learning ---');

  try {
    // 1. learning_part_sections
    await connection.query(`
      CREATE TABLE IF NOT EXISTS learning_part_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT DEFAULT 1,
        stage_id INT NOT NULL,
        part_number INT DEFAULT 2,
        title VARCHAR(255) NOT NULL DEFAULT 'Part 2 • Step 1: Posture',
        subtitle VARCHAR(255) NOT NULL DEFAULT 'Stand tall, stay relaxed',
        description TEXT,
        model_asset_url VARCHAR(500) DEFAULT NULL,
        display_order INT DEFAULT 2,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_stage_part (stage_id, part_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. learning_part_tabs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS learning_part_tabs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        part_id INT NOT NULL,
        tab_key VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        content_data JSON DEFAULT NULL,
        display_order INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_part_tab (part_id, tab_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. posture_indicators
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posture_indicators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        part_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        body_region VARCHAR(50) NOT NULL,
        icon VARCHAR(50) DEFAULT 'circle',
        display_order INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_part_indicator (part_id, display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. posture_checklist_items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posture_checklist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        part_id INT NOT NULL,
        item_text VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 1,
        is_required BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_part_item (part_id, display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. student_posture_progress
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_posture_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        part_id INT NOT NULL,
        checklist_progress_json JSON,
        completed_count INT DEFAULT 0,
        total_count INT DEFAULT 5,
        status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
        started_at DATETIME DEFAULT NULL,
        completed_at DATETIME DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_posture_part (user_id, part_id),
        INDEX idx_user_posture (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. student_part_progress
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_part_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        part_id INT NOT NULL,
        tab_key VARCHAR(50) NOT NULL,
        status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
        progress_percentage INT DEFAULT 0,
        completed_at DATETIME DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_part_tab (user_id, part_id, tab_key),
        INDEX idx_user_part (user_id, part_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('[OK] Part 2 tables created / verified.');

    // Find Stage 3 id
    const [stages] = await connection.query("SELECT id FROM learning_stages WHERE stage_number = 3 LIMIT 1");
    const stage3Id = stages.length > 0 ? stages[0].id : 3;

    // Check if Part 2 section exists
    const [existingPart] = await connection.query(
      "SELECT id FROM learning_part_sections WHERE stage_id = ? AND part_number = 2 LIMIT 1",
      [stage3Id]
    );

    let partId;
    if (existingPart.length === 0) {
      const [insertPart] = await connection.query(`
        INSERT INTO learning_part_sections (
          module_id, stage_id, part_number, title, subtitle, description, display_order, is_active
        ) VALUES (
          1, ?, 2, 'Part 2 • Step 1: Posture', 'Stand tall, stay relaxed',
          'Interactive posture alignment, diaphragmatic breath regulation, and musical phrase application.',
          2, TRUE
        )
      `, [stage3Id]);
      partId = insertPart.insertId;
      console.log(`[OK] Inserted Part 2 section id: ${partId}`);
    } else {
      partId = existingPart[0].id;
      await connection.query(`
        UPDATE learning_part_sections
        SET title = 'Part 2 • Step 1: Posture', subtitle = 'Stand tall, stay relaxed', is_active = TRUE
        WHERE id = ?
      `, [partId]);
      console.log(`[OK] Found Part 2 section id: ${partId}`);
    }

    // Seed 3 Tabs: Posture, Breathe, Song
    const tabsToSeed = [
      {
        tab_key: 'posture',
        title: 'Posture',
        subtitle: 'Stand tall, stay relaxed',
        description: 'Demonstrate correct singing posture independently using the 3D anatomical viewer and posture checklist.',
        display_order: 1,
        content_data: JSON.stringify({
          step_label: 'Step 1: Posture',
          next_tab: 'breathe',
          button_text: 'Next: Breathe →'
        })
      },
      {
        tab_key: 'breathe',
        title: 'Breathe',
        subtitle: 'Controlled inhalation & lower rib expansion',
        description: 'Perform controlled diaphragmatic breathing exercises to regulate airflow without shoulder elevation.',
        display_order: 2,
        content_data: JSON.stringify({
          step_label: 'Step 2: Breathe',
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          instructions: 'Place your hands against your lower floating ribs. Breathe in slowly through your nose and mouth together, allowing your lower ribcage and belly to expand naturally. Exhale on a sustained [s] sound for 8 seconds without letting your chest collapse.',
          next_tab: 'song',
          button_text: 'Next: Song →',
          checklist: [
            'Place your hands gently on your lower ribs.',
            'Inhale silently through nose and mouth for 4 beats.',
            'Feel your ribs expand 360 degrees without raising your shoulders.',
            'Exhale steadily on a gentle hiss [s] for 8 beats.'
          ]
        })
      },
      {
        tab_key: 'song',
        title: 'Song',
        subtitle: 'Apply breath management to a song phrase',
        description: 'Coordinate comfortable posture and airflow with musical phrasing across an authentic vocal standard.',
        display_order: 3,
        content_data: JSON.stringify({
          step_label: 'Step 3: Song',
          song_title: 'Amazing Grace',
          artist: 'Traditional Vocal Standard',
          audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          instructions: 'Sing each phrase on a single, steady breath. Breathe at the designated breath marks (✓) without rushing.',
          button_text: 'Complete Practice Session ✓',
          checklist: [
            'Check singing posture before the first note.',
            'Observe breath marks before Phrase 1.',
            'Maintain steady airflow through the long note.',
            'Relax abdomen between musical phrases.'
          ]
        })
      }
    ];

    for (const tab of tabsToSeed) {
      const [existingTab] = await connection.query(
        "SELECT id FROM learning_part_tabs WHERE part_id = ? AND tab_key = ?",
        [partId, tab.tab_key]
      );
      if (existingTab.length === 0) {
        await connection.query(`
          INSERT INTO learning_part_tabs (part_id, tab_key, title, subtitle, description, display_order, content_data, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [partId, tab.tab_key, tab.title, tab.subtitle, tab.description, tab.display_order, tab.content_data]);
      } else {
        await connection.query(`
          UPDATE learning_part_tabs
          SET title = ?, subtitle = ?, description = ?, display_order = ?, content_data = ?, is_active = TRUE
          WHERE id = ?
        `, [tab.title, tab.subtitle, tab.description, tab.display_order, tab.content_data, existingTab[0].id]);
      }
    }
    console.log('[OK] 3 Tabs (Posture, Breathe, Song) seeded.');

    // Seed 5 Posture Indicators
    const indicatorsToSeed = [
      {
        title: 'Head level',
        description: 'Align your ears directly over your shoulders. Keep your chin parallel to the floor without tucking in or tilting up.',
        body_region: 'head',
        icon: 'head',
        display_order: 1
      },
      {
        title: 'Shoulders loose',
        description: 'Drop your shoulders naturally down and slightly back. Release any trapped trapezius tension.',
        body_region: 'shoulders',
        icon: 'shoulders',
        display_order: 2
      },
      {
        title: 'Chest forward',
        description: 'Keep your chest comfortably lifted and forward without arching your back. Maintain open, buoyant expansion as you sing.',
        body_region: 'ribs',
        icon: 'ribs',
        display_order: 3
      },
      {
        title: 'Knees soft, not locked',
        description: 'Maintain a slight, elastic micro-bend in both knees to allow grounding and free pelvic alignment.',
        body_region: 'knees',
        icon: 'knees',
        display_order: 4
      },
      {
        title: 'Feet hip-width apart',
        description: 'Place both feet firmly hip-width apart with weight balanced evenly between heel and ball of foot.',
        body_region: 'feet',
        icon: 'feet',
        display_order: 5
      }
    ];

    await connection.query("DELETE FROM posture_indicators WHERE part_id = ?", [partId]);
    for (const ind of indicatorsToSeed) {
      await connection.query(`
        INSERT INTO posture_indicators (part_id, title, description, body_region, icon, display_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, TRUE)
      `, [partId, ind.title, ind.description, ind.body_region, ind.icon, ind.display_order]);
    }
    console.log('[OK] 5 Posture Indicators seeded.');

    // Seed 5 Posture Checklist Items
    const checklistItemsToSeed = [
      { item_text: 'Feet about hip-width apart.', display_order: 1, is_required: true },
      { item_text: 'Knees soft, not locked.', display_order: 2, is_required: true },
      { item_text: 'Spine long, chin level.', display_order: 3, is_required: true },
      { item_text: 'Shoulders down and relaxed.', display_order: 4, is_required: true },
      { item_text: 'Hands loose at your sides.', display_order: 5, is_required: true }
    ];

    await connection.query("DELETE FROM posture_checklist_items WHERE part_id = ?", [partId]);
    for (const item of checklistItemsToSeed) {
      await connection.query(`
        INSERT INTO posture_checklist_items (part_id, item_text, display_order, is_required, is_active)
        VALUES (?, ?, ?, ?, TRUE)
      `, [partId, item.item_text, item.display_order, item.is_required]);
    }
    console.log('[OK] 5 Posture Checklist Items seeded.');

    console.log('=== Stage 03 Part 02 Migration Completed Successfully ===');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    await connection.end();
    throw error;
  }
}

if (require.main === module) {
  migratePart2Posture()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migratePart2Posture };
