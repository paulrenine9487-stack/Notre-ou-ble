const pool = require('../config/db');

async function migrate() {
  console.log('--- Migrating 5 Stage Names in learning_stages ---');
  const updates = [
    { num: 1, title: 'Introduction', subtitle: 'Get curious' },
    { num: 2, title: 'What Do You Know?', subtitle: 'Remember' },
    { num: 3, title: 'How To Do It', subtitle: 'Understand' },
    { num: 4, title: "Let's Check Ourselves", subtitle: 'Show what you know' },
    { num: 5, title: 'Keep It Going', subtitle: 'Fine-tune' }
  ];

  for (const u of updates) {
    await pool.query(
      `UPDATE learning_stages 
       SET title = ?, stage_title = ?, subtitle = ?, stage_subtitle = ?, display_order = ?
       WHERE stage_number = ?`,
      [u.title, u.title, u.subtitle, u.subtitle, u.num, u.num]
    );
    console.log(`Updated stage ${u.num} -> ${u.title}`);
  }

  const [rows] = await pool.query(
    'SELECT stage_number, title, stage_title, subtitle, display_order FROM learning_stages WHERE is_active = TRUE ORDER BY stage_number ASC'
  );
  console.log('Resulting active stages:', rows);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
