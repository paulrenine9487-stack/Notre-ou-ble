const pool = require('./db');

async function migrateLearningModules() {
  console.log('Running learning modules migration...');

  const columnsToAdd = [
    { name: 'module_number', type: 'INT NOT NULL DEFAULT 1' },
    { name: 'category', type: 'VARCHAR(100) NOT NULL DEFAULT "Breath"' },
    { name: 'route', type: 'VARCHAR(255) NOT NULL DEFAULT "/learning/modules/breath-management"' },
    { name: 'thumbnail', type: 'VARCHAR(255) NULL' },
    { name: 'is_available', type: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'display_order', type: 'INT NOT NULL DEFAULT 1' },
    { name: 'updated_at', type: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
  ];

  const [existingCols] = await pool.query('DESCRIBE learning_modules');
  const colNames = existingCols.map(c => c.Field.toLowerCase());

  for (const col of columnsToAdd) {
    if (!colNames.includes(col.name.toLowerCase())) {
      await pool.query(`ALTER TABLE learning_modules ADD COLUMN ${col.name} ${col.type}`);
    }
  }

  try {
    await pool.query("ALTER TABLE learning_modules MODIFY COLUMN status VARCHAR(50) DEFAULT 'COMING_SOON'");
  } catch (e) {
    // Already modified or compatible
  }

  const modules = [
    {
      id: 1,
      module_number: 1,
      category: 'Breath',
      title: 'The Hidden Engine: Breath Control & Vocal Stamina',
      description: 'Learn posture, diaphragmatic breathing, breath control and vocal stamina for singing.',
      route: '/learning/modules/breath-management',
      thumbnail: 'breath',
      is_available: 1,
      display_order: 1,
      status: 'AVAILABLE'
    },
    {
      id: 2,
      module_number: 2,
      category: 'Pitch Correction',
      title: 'Tuning the Instrument: Ear-to-Voice Precision',
      description: 'Develop accurate pitch recognition, listening skills and voice control.',
      route: '/learning/modules/pitch-correction',
      thumbnail: 'pitch',
      is_available: 0,
      display_order: 2,
      status: 'COMING_SOON'
    },
    {
      id: 3,
      module_number: 3,
      category: 'High Notes',
      title: 'Breaking the Ceiling: Singing High Notes Without Strain',
      description: 'Learn techniques for developing vocal range and singing higher notes comfortably.',
      route: '/learning/modules/high-notes',
      thumbnail: 'high_notes',
      is_available: 0,
      display_order: 3,
      status: 'COMING_SOON'
    },
    {
      id: 4,
      module_number: 4,
      category: 'Pronunciation & Diction',
      title: 'Sculpting Words: Shaping Vowels and Consonants',
      description: 'Improve pronunciation, vowel formation, consonant clarity and vocal articulation.',
      route: '/learning/modules/pronunciation-diction',
      thumbnail: 'diction',
      is_available: 0,
      display_order: 4,
      status: 'COMING_SOON'
    },
    {
      id: 5,
      module_number: 5,
      category: 'Style of the Song',
      title: 'Making It Yours: Phrasing, Emotion, and Musical Style',
      description: 'Develop musical expression, phrasing, interpretation and individual singing style.',
      route: '/learning/modules/song-style',
      thumbnail: 'style',
      is_available: 0,
      display_order: 5,
      status: 'COMING_SOON'
    }
  ];

  for (const m of modules) {
    const [existing] = await pool.query('SELECT id FROM learning_modules WHERE id = ?', [m.id]);
    if (existing.length > 0) {
      await pool.query(`
        UPDATE learning_modules
        SET module_number = ?, category = ?, title = ?, description = ?, route = ?, thumbnail = ?, is_available = ?, display_order = ?, status = ?
        WHERE id = ?
      `, [m.module_number, m.category, m.title, m.description, m.route, m.thumbnail, m.is_available, m.display_order, m.status, m.id]);
    } else {
      await pool.query(`
        INSERT INTO learning_modules (id, module_number, category, title, description, route, thumbnail, is_available, display_order, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [m.id, m.module_number, m.category, m.title, m.description, m.route, m.thumbnail, m.is_available, m.display_order, m.status]);
    }
  }

  await pool.query('DELETE FROM learning_modules WHERE id > 5');
  console.log('[Migration] 5 Learning Modules initialized successfully.');
}

module.exports = migrateLearningModules;

if (require.main === module) {
  migrateLearningModules()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
