const pool = require('./db');

async function migratePart2Song() {
  console.log('[Part 2 Song Migration] Initializing Song Practice Module database schema...');

  const conn = await pool.getConnection();
  try {
    // 1. song_practice_content
    await conn.query(`
      CREATE TABLE IF NOT EXISTS song_practice_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        part_id INT DEFAULT 1,
        song_title VARCHAR(255) NOT NULL DEFAULT 'Snowman',
        artist_name VARCHAR(255) DEFAULT 'Sia',
        subtitle VARCHAR(255) DEFAULT 'Audio guide',
        description TEXT,
        instructions TEXT,
        audio_file VARCHAR(500) DEFAULT '/audio/snowman-vocal-guide.wav',
        cover_image VARCHAR(500) NULL,
        default_repeat_count INT DEFAULT 1,
        min_repeat_count INT DEFAULT 1,
        max_repeat_count INT DEFAULT 3,
        continuous_loop_enabled BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_part_id (part_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. song_practice_levels
    await conn.query(`
      CREATE TABLE IF NOT EXISTS song_practice_levels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        song_id INT NOT NULL,
        level_key VARCHAR(50) NOT NULL,
        level_name VARCHAR(100) NOT NULL,
        score_file VARCHAR(500) NULL,
        score_file_type VARCHAR(50) DEFAULT 'svg',
        score_svg_content LONGTEXT NULL,
        total_notes INT DEFAULT 12,
        default_repeat_count INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_song_id (song_id),
        UNIQUE KEY uk_song_level (song_id, level_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. song_score_markers
    await conn.query(`
      CREATE TABLE IF NOT EXISTS song_score_markers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        level_id INT NOT NULL,
        marker_type ENUM('breath', 'note') NOT NULL,
        note_reference VARCHAR(50) NOT NULL,
        note_name VARCHAR(100) NULL,
        position_x DECIMAL(6,2) NOT NULL,
        position_y DECIMAL(6,2) NOT NULL,
        phrase_number INT DEFAULT 1,
        display_order INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_level_marker (level_id, marker_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. student_song_progress
    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_song_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        song_id INT NOT NULL,
        level_id INT NOT NULL,
        marked_notes JSON NULL,
        total_marked_notes INT DEFAULT 0,
        audio_listening_progress DECIMAL(5,2) DEFAULT 0.00,
        repeat_count INT DEFAULT 1,
        completion_status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_song (user_id, song_id),
        UNIQUE KEY uk_user_song_level (user_id, song_id, level_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. student_song_sessions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_song_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        song_id INT NOT NULL,
        level_id INT NOT NULL,
        listening_duration INT DEFAULT 0,
        repeat_count INT DEFAULT 1,
        marked_notes_count INT DEFAULT 0,
        session_status VARCHAR(50) DEFAULT 'COMPLETED',
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_sessions (user_id, song_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed default song practice content if not exists
    const [existingSong] = await conn.query('SELECT * FROM song_practice_content WHERE part_id = 1 LIMIT 1');
    let songId = null;

    const defaultInstructions = "Now let's use your breathing in a real song. Listen once. Then choose your level and sing along, taking a breath wherever you see a tick on the score.\n\nStart at Beginner and move up when it feels comfortable.";

    if (existingSong.length === 0) {
      const [insertRes] = await conn.query(`
        INSERT INTO song_practice_content (
          part_id, song_title, artist_name, subtitle, description, instructions, audio_file, default_repeat_count, min_repeat_count, max_repeat_count, continuous_loop_enabled, is_active
        ) VALUES (
          1, 'Snowman', 'Sia', 'Audio guide', 'Apply what we\\'re learning in a song with interactive score sheet and breath pacing markers.', ?, '/audio/snowman-vocal-guide.wav', 1, 1, 3, TRUE, TRUE
        )
      `, [defaultInstructions]);
      songId = insertRes.insertId;
      console.log(`[Part 2 Song Migration] Seeded default song practice content (ID: ${songId})`);
    } else {
      songId = existingSong[0].id;
      // Ensure title is Snowman
      await conn.query(`
        UPDATE song_practice_content
        SET song_title = 'Snowman',
            subtitle = 'Audio guide',
            instructions = ?,
            audio_file = COALESCE(audio_file, '/audio/snowman-vocal-guide.wav')
        WHERE id = ?
      `, [defaultInstructions, songId]);
    }

    // Seed default practice levels
    const levelsData = [
      { key: 'beginner', name: 'Beginner', totalNotes: 12, order: 1 },
      { key: 'intermediate', name: 'Intermediate', totalNotes: 16, order: 2 },
      { key: 'advanced', name: 'Advanced', totalNotes: 20, order: 3 }
    ];

    for (const lvl of levelsData) {
      const [existingLvl] = await conn.query(
        'SELECT id FROM song_practice_levels WHERE song_id = ? AND level_key = ?',
        [songId, lvl.key]
      );
      let levelId;
      if (existingLvl.length === 0) {
        const [insertLvl] = await conn.query(`
          INSERT INTO song_practice_levels (
            song_id, level_key, level_name, score_file_type, total_notes, default_repeat_count, is_active, display_order
          ) VALUES (?, ?, ?, 'svg', ?, 1, TRUE, ?)
        `, [songId, lvl.key, lvl.name, lvl.totalNotes, lvl.order]);
        levelId = insertLvl.insertId;
        console.log(`[Part 2 Song Migration] Seeded ${lvl.name} level (ID: ${levelId})`);
      } else {
        levelId = existingLvl[0].id;
        await conn.query(`
          UPDATE song_practice_levels 
          SET total_notes = ?, level_name = ?, display_order = ?
          WHERE id = ?
        `, [lvl.totalNotes, lvl.name, lvl.order, levelId]);
      }

      // Seed markers for each level
      const [markersCount] = await conn.query('SELECT COUNT(*) as count FROM song_score_markers WHERE level_id = ?', [levelId]);
      if (markersCount[0].count === 0) {
        if (lvl.key === 'beginner') {
          // 12 Notes across 3 phrases + 3 Breath markers
          // Phrase 1 (y: 28%): Don't (x: 18%), cry (x: 27%), snow- (x: 42%), man (x: 52%), not (x: 64%), in (x: 74%), front (x: 84%), of me (x: 93%)
          // Phrase 2 (y: 58%): Who'll catch tears
          // Phrase 3 (y: 86%): Don't cry snowman
          const bMarkers = [
            // Breath ticks (above the notes)
            { type: 'breath', ref: 'B1', name: 'Breath 1', x: 15.0, y: 15.0, phrase: 1, order: 1 },
            { type: 'breath', ref: 'B2', name: 'Breath 2', x: 39.0, y: 15.0, phrase: 1, order: 2 },
            { type: 'breath', ref: 'B3', name: 'Breath 3', x: 15.0, y: 45.0, phrase: 2, order: 3 },
            // Note completion targets
            { type: 'note', ref: 'N1', name: "Don't", x: 18.0, y: 28.0, phrase: 1, order: 1 },
            { type: 'note', ref: 'N2', name: "cry", x: 27.0, y: 28.0, phrase: 1, order: 2 },
            { type: 'note', ref: 'N3', name: "snow-", x: 42.0, y: 28.0, phrase: 1, order: 3 },
            { type: 'note', ref: 'N4', name: "man", x: 52.0, y: 28.0, phrase: 1, order: 4 },
            { type: 'note', ref: 'N5', name: "not", x: 64.0, y: 28.0, phrase: 1, order: 5 },
            { type: 'note', ref: 'N6', name: "in", x: 74.0, y: 28.0, phrase: 1, order: 6 },
            { type: 'note', ref: 'N7', name: "front", x: 84.0, y: 28.0, phrase: 1, order: 7 },
            { type: 'note', ref: 'N8', name: "of me", x: 93.0, y: 28.0, phrase: 1, order: 8 },
            { type: 'note', ref: 'N9', name: "Who'll", x: 18.0, y: 58.0, phrase: 2, order: 9 },
            { type: 'note', ref: 'N10', name: "catch", x: 28.0, y: 58.0, phrase: 2, order: 10 },
            { type: 'note', ref: 'N11', name: "your tears", x: 44.0, y: 58.0, phrase: 2, order: 11 },
            { type: 'note', ref: 'N12', name: "darling", x: 70.0, y: 58.0, phrase: 2, order: 12 }
          ];
          for (const m of bMarkers) {
            await conn.query(`
              INSERT INTO song_score_markers (level_id, marker_type, note_reference, note_name, position_x, position_y, phrase_number, display_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [levelId, m.type, m.ref, m.name, m.x, m.y, m.phrase, m.order]);
          }
        } else if (lvl.key === 'intermediate') {
          // 16 Notes across 4 phrases + 4 Breath markers
          const iMarkers = [
            { type: 'breath', ref: 'IB1', name: 'Breath 1', x: 14.0, y: 14.0, phrase: 1, order: 1 },
            { type: 'breath', ref: 'IB2', name: 'Breath 2', x: 50.0, y: 14.0, phrase: 1, order: 2 },
            { type: 'breath', ref: 'IB3', name: 'Breath 3', x: 14.0, y: 40.0, phrase: 2, order: 3 },
            { type: 'breath', ref: 'IB4', name: 'Breath 4', x: 14.0, y: 68.0, phrase: 3, order: 4 },
            // Notes 1 to 16
            { type: 'note', ref: 'IN1', name: "Don't", x: 17.0, y: 24.0, phrase: 1, order: 1 },
            { type: 'note', ref: 'IN2', name: "cry", x: 26.0, y: 24.0, phrase: 1, order: 2 },
            { type: 'note', ref: 'IN3', name: "snow-", x: 36.0, y: 24.0, phrase: 1, order: 3 },
            { type: 'note', ref: 'IN4', name: "man", x: 45.0, y: 24.0, phrase: 1, order: 4 },
            { type: 'note', ref: 'IN5', name: "not", x: 55.0, y: 24.0, phrase: 1, order: 5 },
            { type: 'note', ref: 'IN6', name: "in", x: 65.0, y: 24.0, phrase: 1, order: 6 },
            { type: 'note', ref: 'IN7', name: "front", x: 76.0, y: 24.0, phrase: 1, order: 7 },
            { type: 'note', ref: 'IN8', name: "of me", x: 88.0, y: 24.0, phrase: 1, order: 8 },
            { type: 'note', ref: 'IN9', name: "Who'll", x: 17.0, y: 50.0, phrase: 2, order: 9 },
            { type: 'note', ref: 'IN10', name: "catch", x: 27.0, y: 50.0, phrase: 2, order: 10 },
            { type: 'note', ref: 'IN11', name: "your", x: 38.0, y: 50.0, phrase: 2, order: 11 },
            { type: 'note', ref: 'IN12', name: "tears", x: 50.0, y: 50.0, phrase: 2, order: 12 },
            { type: 'note', ref: 'IN13', name: "dar-", x: 68.0, y: 50.0, phrase: 2, order: 13 },
            { type: 'note', ref: 'IN14', name: "ling", x: 82.0, y: 50.0, phrase: 2, order: 14 },
            { type: 'note', ref: 'IN15', name: "A puddle", x: 24.0, y: 78.0, phrase: 3, order: 15 },
            { type: 'note', ref: 'IN16', name: "of water", x: 56.0, y: 78.0, phrase: 3, order: 16 }
          ];
          for (const m of iMarkers) {
            await conn.query(`
              INSERT INTO song_score_markers (level_id, marker_type, note_reference, note_name, position_x, position_y, phrase_number, display_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [levelId, m.type, m.ref, m.name, m.x, m.y, m.phrase, m.order]);
          }
        } else if (lvl.key === 'advanced') {
          // 20 Notes across 4 phrases + 5 Breath marks
          const aMarkers = [
            { type: 'breath', ref: 'AB1', name: 'Catch 1', x: 13.0, y: 12.0, phrase: 1, order: 1 },
            { type: 'breath', ref: 'AB2', name: 'Catch 2', x: 48.0, y: 12.0, phrase: 1, order: 2 },
            { type: 'breath', ref: 'AB3', name: 'Catch 3', x: 13.0, y: 36.0, phrase: 2, order: 3 },
            { type: 'breath', ref: 'AB4', name: 'Catch 4', x: 13.0, y: 60.0, phrase: 3, order: 4 },
            { type: 'breath', ref: 'AB5', name: 'Catch 5', x: 13.0, y: 80.0, phrase: 4, order: 5 },
            // Notes 1 to 20
            { type: 'note', ref: 'AN1', name: "Don't", x: 16.0, y: 22.0, phrase: 1, order: 1 },
            { type: 'note', ref: 'AN2', name: "cry", x: 24.0, y: 22.0, phrase: 1, order: 2 },
            { type: 'note', ref: 'AN3', name: "snow-", x: 33.0, y: 22.0, phrase: 1, order: 3 },
            { type: 'note', ref: 'AN4', name: "man", x: 42.0, y: 22.0, phrase: 1, order: 4 },
            { type: 'note', ref: 'AN5', name: "not", x: 52.0, y: 22.0, phrase: 1, order: 5 },
            { type: 'note', ref: 'AN6', name: "in", x: 62.0, y: 22.0, phrase: 1, order: 6 },
            { type: 'note', ref: 'AN7', name: "front", x: 72.0, y: 22.0, phrase: 1, order: 7 },
            { type: 'note', ref: 'AN8', name: "of me", x: 84.0, y: 22.0, phrase: 1, order: 8 },
            { type: 'note', ref: 'AN9', name: "Who'll", x: 16.0, y: 46.0, phrase: 2, order: 9 },
            { type: 'note', ref: 'AN10', name: "catch", x: 25.0, y: 46.0, phrase: 2, order: 10 },
            { type: 'note', ref: 'AN11', name: "your", x: 35.0, y: 46.0, phrase: 2, order: 11 },
            { type: 'note', ref: 'AN12', name: "tears", x: 46.0, y: 46.0, phrase: 2, order: 12 },
            { type: 'note', ref: 'AN13', name: "dar-", x: 62.0, y: 46.0, phrase: 2, order: 13 },
            { type: 'note', ref: 'AN14', name: "ling", x: 75.0, y: 46.0, phrase: 2, order: 14 },
            { type: 'note', ref: 'AN15', name: "puddle", x: 20.0, y: 69.0, phrase: 3, order: 15 },
            { type: 'note', ref: 'AN16', name: "of water", x: 45.0, y: 69.0, phrase: 3, order: 16 },
            { type: 'note', ref: 'AN17', name: "hold me", x: 68.0, y: 69.0, phrase: 3, order: 17 },
            { type: 'note', ref: 'AN18', name: "close", x: 86.0, y: 69.0, phrase: 3, order: 18 },
            { type: 'note', ref: 'AN19', name: "hide from", x: 30.0, y: 89.0, phrase: 4, order: 19 },
            { type: 'note', ref: 'AN20', name: "the sun", x: 65.0, y: 89.0, phrase: 4, order: 20 }
          ];
          for (const m of aMarkers) {
            await conn.query(`
              INSERT INTO song_score_markers (level_id, marker_type, note_reference, note_name, position_x, position_y, phrase_number, display_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [levelId, m.type, m.ref, m.name, m.x, m.y, m.phrase, m.order]);
          }
        }
      }
    }

    // Update learning_part_tabs record for 'song'
    await conn.query(`
      UPDATE learning_part_tabs
      SET title = 'Song',
          subtitle = 'Apply what we\\'re learning in a song.',
          description = 'Sing Snowman with interactive sheet music notation, breathing markers, and level-specific note marking.',
          content_data = JSON_OBJECT(
            'song_title', 'Snowman',
            'artist', 'Sia',
            'subtitle', 'Audio guide',
            'step_label', 'Part 2 • Step 3: Sing it — \\"Snowman\\"',
            'instructions', ?,
            'audio_url', '/audio/snowman-vocal-guide.wav',
            'button_text', 'Complete Practice Session ✓'
          )
      WHERE part_id = 1 AND tab_key = 'song'
    `, [defaultInstructions]);

    console.log('[Part 2 Song Migration] Song tab in learning_part_tabs updated successfully!');
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  migratePart2Song()
    .then(() => {
      console.log('[Part 2 Song Migration] Completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Part 2 Song Migration] Error:', err);
      process.exit(1);
    });
}

module.exports = migratePart2Song;
