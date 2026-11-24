const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runFlipObjectivesMigration() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'resonova_db';

  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password, database });
    console.log('[Flip Objectives Migration] Connected to database.');

    // 1. Ensure columns exist on learning_objectives table
    const [cols] = await conn.query("SHOW COLUMNS FROM learning_objectives");
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('title_line_1')) {
      await conn.query("ALTER TABLE learning_objectives ADD COLUMN title_line_1 VARCHAR(100) DEFAULT NULL AFTER title");
      console.log('[Flip Objectives Migration] Added column title_line_1.');
    }
    if (!colNames.includes('title_line_2')) {
      await conn.query("ALTER TABLE learning_objectives ADD COLUMN title_line_2 VARCHAR(100) DEFAULT NULL AFTER title_line_1");
      console.log('[Flip Objectives Migration] Added column title_line_2.');
    }
    if (!colNames.includes('icon')) {
      await conn.query("ALTER TABLE learning_objectives ADD COLUMN icon VARCHAR(100) DEFAULT 'Lightbulb' AFTER description");
      console.log('[Flip Objectives Migration] Added column icon.');
    }

    // 2. Fetch Stage 01 ID
    const [stages] = await conn.query("SELECT id FROM learning_stages WHERE stage_number = 1 LIMIT 1");
    if (stages.length === 0) {
      console.warn('[Flip Objectives Migration] Stage 01 not found; skipping seed.');
      return true;
    }
    const stage1Id = stages[0].id;

    // 3. Exact 4 objective cards requested
    const targetCards = [
      {
        stage_id: stage1Id,
        title: 'Maintain POSTURE',
        title_line_1: 'Maintain',
        title_line_2: 'POSTURE',
        description: 'Demonstrate correct singing posture and diaphragmatic breathing techniques independently.',
        icon: 'Lightbulb',
        display_order: 1,
        is_active: 1
      },
      {
        stage_id: stage1Id,
        title: 'Manage BREATHING',
        title_line_1: 'Manage',
        title_line_2: 'BREATHING',
        description: 'Perform controlled inhalation and exhalation exercises to regulate your airflow.',
        icon: 'Wind',
        display_order: 2,
        is_active: 1
      },
      {
        stage_id: stage1Id,
        title: 'Apply VOCAL TECHNIQUES',
        title_line_1: 'Apply',
        title_line_2: 'VOCAL TECHNIQUES',
        description: 'Apply breath management techniques to a song!',
        icon: 'Megaphone',
        display_order: 3,
        is_active: 1
      },
      {
        stage_id: stage1Id,
        title: 'Organize PRACTICE ROUTINE',
        title_line_1: 'Organize',
        title_line_2: 'PRACTICE ROUTINE',
        description: 'Develop and maintain a structured weekly breathing practice journal to track your exercises and progress.',
        icon: 'CalendarCheck',
        display_order: 4,
        is_active: 1
      }
    ];

    // Ensure Stage 01 objectives exist without destroying customized entries
    const [existingCards] = await conn.query("SELECT COUNT(*) AS count FROM learning_objectives WHERE stage_id = ?", [stage1Id]);
    if (existingCards[0].count === 0) {
      for (const card of targetCards) {
        await conn.query(`
          INSERT INTO learning_objectives (stage_id, title, title_line_1, title_line_2, description, icon, display_order, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          card.stage_id,
          card.title,
          card.title_line_1,
          card.title_line_2,
          card.description,
          card.icon,
          card.display_order,
          card.is_active
        ]);
      }
      console.log('[Flip Objectives Migration] Successfully seeded exactly 4 interactive 3D flip card objectives for Stage 01.');
    } else {
      console.log(`[Flip Objectives Migration] Stage 01 objectives already present (${existingCards[0].count} items found); preserving existing records.`);
    }
    return true;
  } catch (err) {
    console.error('[Flip Objectives Migration Error]:', err.message);
    throw err;
  } finally {
    if (conn) await conn.end();
  }
}

if (require.main === module) {
  runFlipObjectivesMigration()
    .then(() => {
      console.log('Migration complete.');
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = runFlipObjectivesMigration;
