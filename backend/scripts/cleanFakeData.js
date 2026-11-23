const pool = require('../config/db');

async function cleanFakeData() {
  console.log('--- Cleaning Fake & Test Data from resonova_db ---');

  // Identify fake user IDs
  const [fakeUsers] = await pool.query(`
    SELECT id, username, email FROM users
    WHERE username LIKE 'testvocal_%'
       OR username LIKE 'student_%'
       OR username LIKE 'Aria_%'
       OR username LIKE 'Baritone_%'
       OR username LIKE 'Assistant_%'
       OR username LIKE 'JournalSinger%'
       OR email LIKE '%@example.com'
       OR email LIKE '%@test.com'
       OR email LIKE 'test_%@resonova.com'
       OR (username = 'SuperAdmin' AND email = 'admin@notreoble.com')
  `);

  console.log(`Found ${fakeUsers.length} test/dummy user accounts to remove.`);

  if (fakeUsers.length > 0) {
    const fakeIds = fakeUsers.map(u => u.id);
    const placeholders = fakeIds.map(() => '?').join(',');

    // Delete child records for fake users
    await pool.query(`DELETE FROM task_assessments WHERE submission_id IN (SELECT id FROM user_task_submissions WHERE user_id IN (${placeholders}))`, fakeIds);
    await pool.query(`DELETE FROM user_task_submissions WHERE user_id IN (${placeholders})`, fakeIds);
    await pool.query(`DELETE FROM learning_task_links WHERE user_id IN (${placeholders})`, fakeIds);
    await pool.query(`DELETE FROM practice_task_history WHERE user_id IN (${placeholders})`, fakeIds);
    await pool.query(`DELETE FROM practice_diary_tasks WHERE user_id IN (${placeholders})`, fakeIds);
    await pool.query(`DELETE FROM practice_reflections WHERE user_id IN (${placeholders})`, fakeIds);
    await pool.query(`DELETE FROM practice_sessions WHERE user_id IN (${placeholders})`, fakeIds);
    await pool.query(`DELETE FROM user_learning_progress WHERE user_id IN (${placeholders})`, fakeIds);
    await pool.query(`DELETE FROM admin_audit_logs WHERE admin_id IN (${placeholders})`, fakeIds);

    // Delete the users
    await pool.query(`DELETE FROM users WHERE id IN (${placeholders})`, fakeIds);
    console.log(`Successfully removed ${fakeUsers.length} test accounts and their associated test submissions.`);
  }

  // Ensure default branding settings in MySQL
  await pool.query(`
    INSERT INTO branding_settings (id, theme_name, primary_color, secondary_color, accent_bg_color, main_bg_color)
    VALUES (1, 'No Tre(ou)ble Harmonic Vocal Palette', '#193B40', '#398575', '#DCECE5', '#F3F6F3')
    ON DUPLICATE KEY UPDATE
      theme_name = VALUES(theme_name),
      primary_color = VALUES(primary_color),
      secondary_color = VALUES(secondary_color),
      accent_bg_color = VALUES(accent_bg_color),
      main_bg_color = VALUES(main_bg_color)
  `);

  // Verify remaining authentic users
  const [remainingUsers] = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY id ASC');
  console.log('\n--- Authentic Users in MySQL Database (resonova_db) ---');
  console.table(remainingUsers);

  const [submissionsCount] = await pool.query('SELECT COUNT(*) AS total FROM user_task_submissions');
  console.log('Real Submissions in DB:', submissionsCount[0].total);

  const [practiceCount] = await pool.query('SELECT COUNT(*) AS total FROM practice_sessions');
  console.log('Real Practice Sessions in DB:', practiceCount[0].total);

  const [branding] = await pool.query('SELECT * FROM branding_settings WHERE id = 1');
  console.log('Branding Settings in DB:', branding[0]);

  await pool.end();
}

cleanFakeData().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});

