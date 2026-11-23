const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

const SIX_QUESTIONS = [
  {
    question_id: 'mf-1',
    statement: 'The more air I take in, the longer I can hold a note.',
    correct_answer: 'MYTH',
    explanation: 'Why? Taking in too much air can create tension. What matters is controlling airflow, not simply filling your lungs to maximum capacity.',
    display_order: 1
  },
  {
    question_id: 'mf-2',
    statement: 'I should breathe at every comma I see in the song lyrics.',
    correct_answer: 'MYTH',
    explanation: 'Why? Musical breathing depends on phrasing, not just punctuation. Sometimes you need to breathe in the middle of a sentence, while other times you can sing through a comma.',
    display_order: 2
  },
  {
    question_id: 'mf-3',
    statement: 'Breathing out completely before taking another breath helps me prepare better for singing.',
    correct_answer: 'MYTH',
    explanation: 'Why? Forcing all the air out can create tension and make the next inhalation uncomfortable. Allow your breath to flow naturally before taking the next one.',
    display_order: 3
  },
  {
    question_id: 'mf-4',
    statement: 'Your breathing muscles continue working even while you sing.',
    correct_answer: 'FACT',
    explanation: 'Why? Breathing muscles help regulate airflow during singing. They coordinate to maintain controlled exhalation rather than simply switching off after inhalation.',
    display_order: 4
  },
  {
    question_id: 'mf-5',
    statement: 'I should hold my breath for a moment before starting every sung phrase.',
    correct_answer: 'MYTH',
    explanation: 'Why? Unnecessary breath-holding can create tension. Aim for a smooth transition from inhalation to singing.',
    display_order: 5
  },
  {
    question_id: 'mf-6',
    statement: 'Two singers can sing the same long note but use their breath differently.',
    correct_answer: 'FACT',
    explanation: 'Why? Breath requirements vary depending on vocal technique, phrasing, volume and individual physiology. There isn\'t one identical breathing pattern for every singer.',
    display_order: 6
  }
];

async function runStage4MythOrFactMigration() {
  console.log('[Stage 4 Myth or Fact Migration] Initializing MySQL tables and questions...');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'resonova_db',
    port: process.env.DB_PORT || 3306
  });

  try {
    // 1. Create myth_fact_questions table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS myth_fact_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id VARCHAR(50) NOT NULL UNIQUE,
        statement TEXT NOT NULL,
        correct_answer ENUM('MYTH', 'FACT') NOT NULL,
        explanation TEXT NOT NULL,
        display_order INT NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] Table myth_fact_questions ensured.');

    // 2. Create myth_fact_student_responses table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS myth_fact_student_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        challenge_id INT NOT NULL DEFAULT 1,
        question_id VARCHAR(50) NOT NULL,
        selected_answer ENUM('MYTH', 'FACT') NOT NULL,
        correct_answer ENUM('MYTH', 'FACT') NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        score INT NOT NULL DEFAULT 0,
        attempt_number INT NOT NULL DEFAULT 1,
        status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_attempt (user_id, attempt_number),
        INDEX idx_user_challenge (user_id, challenge_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] Table myth_fact_student_responses ensured.');

    // 3. Insert or update the 6 exact questions
    for (const q of SIX_QUESTIONS) {
      await conn.query(`
        INSERT INTO myth_fact_questions 
          (question_id, statement, correct_answer, explanation, display_order, is_active)
        VALUES 
          (?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          statement = VALUES(statement),
          correct_answer = VALUES(correct_answer),
          explanation = VALUES(explanation),
          display_order = VALUES(display_order),
          is_active = TRUE
      `, [q.question_id, q.statement, q.correct_answer, q.explanation, q.display_order]);
    }
    console.log('[Migration] Seeded/updated exactly 6 Breathe Right: Fact or Myth? questions.');

    // 4. Update the learning_challenges table entry for myth_or_fact
    const configQuestions = SIX_QUESTIONS.map(q => ({
      id: q.question_id,
      statement: q.statement,
      correctAnswer: q.correct_answer,
      explanation: q.explanation
    }));

    const configJson = JSON.stringify({
      type: 'myth_or_fact',
      title: 'Breathe Right: Fact or Myth?',
      subtitle: 'Test your understanding of breathing techniques for singing.',
      questions: configQuestions
    });

    const [existing] = await conn.query("SELECT id FROM learning_challenges WHERE challenge_type = 'myth_or_fact' LIMIT 1");
    if (existing.length > 0) {
      await conn.query(`
        UPDATE learning_challenges
        SET title = 'Breathe Right: Fact or Myth?',
            description = 'Test your understanding of breathing techniques for singing.',
            total_marks = 60,
            passing_score = 30,
            configuration_json = ?,
            display_order = 1,
            is_active = TRUE,
            updated_at = NOW()
        WHERE id = ?
      `, [configJson, existing[0].id]);
      console.log('[Migration] Updated existing learning_challenges row ID:', existing[0].id);
    } else {
      // Find stage 4 id
      const [stages] = await conn.query("SELECT id FROM learning_stages WHERE stage_number = 4 LIMIT 1");
      const stage4Id = stages.length > 0 ? stages[0].id : 4;
      await conn.query(`
        INSERT INTO learning_challenges 
          (stage_id, title, description, challenge_type, total_marks, passing_score, configuration_json, display_order, is_active)
        VALUES 
          (?, 'Breathe Right: Fact or Myth?', 'Test your understanding of breathing techniques for singing.', 'myth_or_fact', 60, 30, ?, 1, TRUE)
      `, [stage4Id, configJson]);
      console.log('[Migration] Inserted new learning_challenges row for Stage 4 myth_or_fact.');
    }

    // Fully remove Match the Part (matching_pairs)
    await conn.query(`
      DELETE FROM challenge_attempts 
      WHERE challenge_id IN (
        SELECT id FROM (SELECT id FROM learning_challenges WHERE challenge_type = 'matching_pairs' OR title LIKE '%Match the Part%') AS temp
      )
    `);
    await conn.query("DELETE FROM learning_challenges WHERE challenge_type = 'matching_pairs' OR title LIKE '%Match the Part%'");

    console.log('[Stage 4 Myth or Fact Migration] Migration completed successfully!');
  } finally {
    await conn.end();
  }
}

module.exports = runStage4MythOrFactMigration;

if (require.main === module) {
  runStage4MythOrFactMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]:', err);
      process.exit(1);
    });
}
