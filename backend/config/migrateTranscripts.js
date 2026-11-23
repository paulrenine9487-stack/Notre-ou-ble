const pool = require('./db');

async function migrateTranscripts() {
  console.log('[Transcript Migration] Starting video_transcripts table initialization...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS video_transcripts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      video_id INT NOT NULL,
      module_id INT NOT NULL DEFAULT 1,
      stage_id INT NOT NULL DEFAULT 3,
      title VARCHAR(255) NOT NULL DEFAULT 'Video Transcript',
      transcript_content LONGTEXT NOT NULL,
      has_spoken_dialogue TINYINT(1) NOT NULL DEFAULT 1,
      language VARCHAR(50) NOT NULL DEFAULT 'en',
      publication_status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
      created_by INT NULL,
      updated_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      published_at TIMESTAMP NULL,
      INDEX idx_video (video_id),
      INDEX idx_stage (stage_id),
      INDEX idx_status (publication_status),
      FOREIGN KEY (video_id) REFERENCES learning_stage_content(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('[Transcript Migration] Table video_transcripts ensured.');

  // Check if initial transcript record exists for Stage 3 Part 1 video (video_id = 5)
  const [existing] = await pool.query('SELECT id FROM video_transcripts WHERE video_id = 5 LIMIT 1');
  if (existing.length === 0) {
    // Initial verified record for Stage 3 Part 1 video (mov_bbb.mp4 demonstration)
    await pool.query(`
      INSERT INTO video_transcripts (
        video_id, module_id, stage_id, title, transcript_content, has_spoken_dialogue, language, publication_status, published_at
      ) VALUES (
        5, 1, 3,
        'Stage 3 Part 1: How Breathing Works - Instructional Transcript',
        '### Lesson Overview: How Breathing Works in Singing\n\n[00:00] In this visual demonstration, observe how diaphragmatic breath expansion creates relaxed, sustained vocal airflow without upper-chest or shoulder tension.\n\n[00:15] **Key Observation Points:**\n- Notice the low, lateral ribcage expansion during inhalation.\n- Keep your neck, throat, and jaw completely released as air enters through your nose and mouth.\n- During exhalation, low abdominal engagement controls the steady release of air to power your vocal folds effortlessly.\n\n[00:45] **Practice Advice:**\n- Stand with aligned posture before beginning the subsequent practice guide.\n- When ready, proceed to Part 2 to practice the posture mannequin, rhythmic breathing simulation, and song phrase exercises.',
        1,
        'en',
        'PUBLISHED',
        NOW()
      )
    `);
    console.log('[Transcript Migration] Initial Stage 3 Part 1 transcript record inserted.');
  }

  console.log('[Transcript Migration] Completed successfully!');
}

if (require.main === module) {
  migrateTranscripts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Transcript Migration Error]:', err);
      process.exit(1);
    });
}

module.exports = migrateTranscripts;
