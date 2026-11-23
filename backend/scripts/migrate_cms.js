const pool = require('../config/db');

async function migrateCms() {
  console.log('[CMS Migration] Starting CMS schema initialization...');

  // 1. Table: cms_page_sections
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_page_sections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      page_slug VARCHAR(100) NOT NULL,
      section_key VARCHAR(100) NOT NULL,
      section_title VARCHAR(255) NOT NULL,
      headline VARCHAR(500),
      subheadline TEXT,
      body_content LONGTEXT,
      cta_button_text VARCHAR(100),
      cta_button_url VARCHAR(255),
      media_url VARCHAR(500),
      extra_settings JSON,
      status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'PUBLISHED',
      display_order INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_page_section (page_slug, section_key),
      INDEX idx_page_status (page_slug, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[CMS Migration] Table cms_page_sections ensured.');

  // 2. Table: cms_media_assets
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_media_assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_type ENUM('IMAGE', 'GIF', 'VIDEO', 'AUDIO', 'DOCUMENT') NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size_bytes BIGINT NOT NULL,
      storage_path VARCHAR(500) NOT NULL,
      alt_text VARCHAR(255),
      caption VARCHAR(500),
      used_on_pages JSON,
      is_published TINYINT(1) DEFAULT 1,
      uploaded_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_media_type (file_type),
      INDEX idx_media_published (is_published)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[CMS Migration] Table cms_media_assets ensured.');

  // 3. Table: cms_content_revisions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_content_revisions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entity_type VARCHAR(100) NOT NULL,
      entity_id INT NOT NULL,
      admin_id INT NOT NULL,
      action ENUM('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH') NOT NULL,
      previous_state LONGTEXT,
      new_state LONGTEXT,
      change_summary VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_revision_entity (entity_type, entity_id),
      INDEX idx_revision_admin (admin_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[CMS Migration] Table cms_content_revisions ensured.');

  // 4. Seed initial Homepage and Portal sections if empty
  const [existingSections] = await pool.query('SELECT COUNT(*) AS count FROM cms_page_sections');
  if (existingSections[0].count === 0) {
    console.log('[CMS Migration] Seeding initial portal sections...');

    const initialSections = [
      {
        page_slug: 'homepage',
        section_key: 'hero',
        section_title: 'Hero / Welcome Banner',
        headline: 'EVERY VOICE HAS A STORY.',
        subheadline: 'A comprehensive training platform for singers to build vocal strength, control, and confidence for effortless singing.',
        body_content: 'Embark on a guided pedagogical pathway designed for vocalists of all backgrounds.',
        cta_button_text: 'JOURNEY',
        cta_button_url: '#journey-goals',
        media_url: '/hero-singer.jpeg',
        extra_settings: JSON.stringify({
          badgeText: 'Stage 01 Available Now',
          secondaryCtaText: 'Sign In',
          secondaryCtaUrl: '/login',
          animationStyle: 'fade-up'
        }),
        status: 'PUBLISHED',
        display_order: 1
      },
      {
        page_slug: 'homepage',
        section_key: 'what_is_breath',
        section_title: 'What is Breath Management?',
        headline: 'The Science of Breath Management',
        subheadline: 'Understanding inhalation, diaphragmatic expansion, and controlled exhalation.',
        body_content: 'Breath management is not simply taking a deep breath; it is the art of regulating subglottic air pressure, thoracic support, and vocal tract resonance to sustain phrases effortlessly without vocal strain.',
        cta_button_text: 'Explore Stage 1',
        cta_button_url: '/learning/modules/breath-management?stage=1',
        media_url: '/IMG_7993.MP4',
        extra_settings: JSON.stringify({
          keyPillars: ['Diaphragm Control', 'Subglottic Pressure', 'Intercostal Expansion']
        }),
        status: 'PUBLISHED',
        display_order: 2
      },
      {
        page_slug: 'homepage',
        section_key: 'kinetic_posture',
        section_title: 'Kinetic Posture & Breathing Mechanics',
        headline: 'Posture Drives Breath, Breath Powers Voice',
        subheadline: 'Align your head, shoulders, ribs, knees, and feet for maximum pulmonary capacity.',
        body_content: 'Physical alignment is the foundation of singing. When the skeleton is stacked properly, the lungs expand unimpeded and the diaphragm lowers smoothly.',
        cta_button_text: 'Launch Posture Studio',
        cta_button_url: '/learning/modules/breath-management?stage=3',
        media_url: '/posture_animation_HD.gif',
        extra_settings: JSON.stringify({
          secondaryMediaUrl: '/converted_HD_loop.gif'
        }),
        status: 'PUBLISHED',
        display_order: 3
      },
      {
        page_slug: 'homepage',
        section_key: 'musical_goals',
        section_title: 'What is Your Musical Journey?',
        headline: 'Choose Your Personalized Vocal Path',
        subheadline: 'Select your core goal to customize your practice routines and diagnostic feedback.',
        body_content: 'Every singer has unique aspirations—from learning the basics to classical operatic precision.',
        cta_button_text: 'Get Started',
        cta_button_url: '/login',
        media_url: null,
        extra_settings: JSON.stringify({
          goalsList: [
            { id: 'learn-singing', title: 'I want to learn singing.', desc: 'Foundations of pitch, ear training and fundamental vocalization.' },
            { id: 'improve-breathing', title: 'I want to improve my breathing.', desc: 'Master diaphragmatic support, lung capacity, and steady airflow.' },
            { id: 'develop-technique', title: 'I want to develop my vocal technique.', desc: 'Refine agility, vibrato, register blending, and vocal resonance.' },
            { id: 'explore-classical', title: 'I want to explore classical singing.', desc: 'Immerse in classical pedagogy, Carnatic/Hindustani, or operatic arias.' },
            { id: 'prepare-performances', title: 'I want to prepare for performances.', desc: 'Build stage presence, microphone command, and performance endurance.' },
            { id: 'vocal-trainer', title: 'I am a vocal trainer.', desc: 'Access pedagogical tools, breath telemetry, and vocal diagnostic exercises.' }
          ]
        }),
        status: 'PUBLISHED',
        display_order: 4
      },
      {
        page_slug: 'homepage',
        section_key: 'footer',
        section_title: 'Portal Footer & Copyright',
        headline: 'No Tre(ou)ble – Voice Pedagogy Studio',
        subheadline: 'Empowering vocal excellence through science and music.',
        body_content: '© 2026 No Tre(ou)ble. All rights reserved. Vocal breath management, kinetic simulation, and diagnostic learning system.',
        cta_button_text: 'Accessibility Controls',
        cta_button_url: '#accessibility',
        media_url: '/NoTreble-Classicfinal.png',
        extra_settings: JSON.stringify({
          contactEmail: 'contact@notreoble.com',
          privacyUrl: '/privacy',
          termsUrl: '/terms'
        }),
        status: 'PUBLISHED',
        display_order: 5
      },
      {
        page_slug: 'certificate',
        section_key: 'stage_completion',
        section_title: 'Module 1 Completion Certificate',
        headline: 'Certificate of Breath Mastery',
        subheadline: 'Awarded for completing all 5 progressive stages of Breath Management & Vocal Stamina.',
        body_content: 'This acknowledges that the vocalist has demonstrated posture alignment, sustained exhalation control, song breath-marking execution, and consistent weekly practice journal entries.',
        cta_button_text: 'Download Certificate',
        cta_button_url: '#download',
        media_url: '/NoTreble-Classicfinal.png',
        extra_settings: JSON.stringify({
          accreditation: 'No Tre(ou)ble Vocal Academy',
          passingScoreMin: 80
        }),
        status: 'PUBLISHED',
        display_order: 1
      }
    ];

    for (const sec of initialSections) {
      await pool.query(`
        INSERT INTO cms_page_sections (
          page_slug, section_key, section_title, headline, subheadline, 
          body_content, cta_button_text, cta_button_url, media_url, 
          extra_settings, status, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sec.page_slug, sec.section_key, sec.section_title, sec.headline, sec.subheadline,
        sec.body_content, sec.cta_button_text, sec.cta_button_url, sec.media_url,
        sec.extra_settings, sec.status, sec.display_order
      ]);
    }
    console.log(`[CMS Migration] Seeded ${initialSections.length} portal sections.`);
  }

  // 5. Seed existing media assets into cms_media_assets if empty
  const [existingMedia] = await pool.query('SELECT COUNT(*) AS count FROM cms_media_assets');
  if (existingMedia[0].count === 0) {
    console.log('[CMS Migration] Indexing existing portal media into Media Library...');

    const coreMedia = [
      {
        file_name: 'IMG_7993.MP4',
        original_name: 'IMG_7993.MP4',
        file_type: 'VIDEO',
        mime_type: 'video/mp4',
        file_size_bytes: 51606358,
        storage_path: '/IMG_7993.MP4',
        alt_text: 'Stage 01 Breath Management Instructional Video',
        caption: 'Master video demonstrating diaphragmatic breathing and vocal stamina.',
        used_on_pages: JSON.stringify(['stage_01.video', 'homepage.what_is_breath'])
      },
      {
        file_name: 'posture_animation_HD.gif',
        original_name: 'posture_animation_HD.gif',
        file_type: 'GIF',
        mime_type: 'image/gif',
        file_size_bytes: 49734064,
        storage_path: '/posture_animation_HD.gif',
        alt_text: 'Kinetic Posture Animation (5 Points of Alignment)',
        caption: 'Detailed animation highlighting proper head, shoulder, ribs, knee, and foot alignment.',
        used_on_pages: JSON.stringify(['homepage.posture', 'stage_03.posture'])
      },
      {
        file_name: 'converted_HD_loop.gif',
        original_name: 'converted_HD_loop.gif',
        file_type: 'GIF',
        mime_type: 'image/gif',
        file_size_bytes: 6173340,
        storage_path: '/converted_HD_loop.gif',
        alt_text: 'Thoracic Expansion Loop',
        caption: 'Continuous loop illustrating smooth lung expansion and diaphragmatic descent.',
        used_on_pages: JSON.stringify(['homepage.loop', 'stage_02.lungs', 'stage_03.lungs'])
      },
      {
        file_name: 'hero-singer.jpeg',
        original_name: 'hero-singer.jpeg',
        file_type: 'IMAGE',
        mime_type: 'image/jpeg',
        file_size_bytes: 172749,
        storage_path: '/hero-singer.jpeg',
        alt_text: 'No Tre(ou)ble Vocalist Hero Singer Portrait',
        caption: 'Vocalist with headphones demonstrating focused singing expression.',
        used_on_pages: JSON.stringify(['homepage.hero'])
      },
      {
        file_name: 'NoTreble-Classicfinal.png',
        original_name: 'NoTreble-Classicfinal.png',
        file_type: 'IMAGE',
        mime_type: 'image/png',
        file_size_bytes: 103985,
        storage_path: '/NoTreble-Classicfinal.png',
        alt_text: 'No Tre(ou)ble Logo Badge',
        caption: 'Official brand mark of No Tre(ou)ble.',
        used_on_pages: JSON.stringify(['navbar.logo', 'footer.logo'])
      },
      {
        file_name: 'snowman-vocal-guide.wav',
        original_name: 'snowman-vocal-guide.wav',
        file_type: 'AUDIO',
        mime_type: 'audio/wav',
        file_size_bytes: 882044,
        storage_path: '/audio/snowman-vocal-guide.wav',
        alt_text: 'Vocal Practice Song Guide Track',
        caption: 'Audio reference track for Stage 03 vocal breath pacing.',
        used_on_pages: JSON.stringify(['stage_03.song_practice'])
      },
      {
        file_name: 'posture-guide-model.jpg',
        original_name: 'posture-guide-model.jpg',
        file_type: 'IMAGE',
        mime_type: 'image/jpeg',
        file_size_bytes: 43383,
        storage_path: '/images/posture-guide-model.jpg',
        alt_text: 'Posture Guide 3D Reference Model',
        caption: 'Reference model with kinetic indicator guides.',
        used_on_pages: JSON.stringify(['stage_03.posture'])
      }
    ];

    for (const m of coreMedia) {
      await pool.query(`
        INSERT INTO cms_media_assets (
          file_name, original_name, file_type, mime_type, file_size_bytes,
          storage_path, alt_text, caption, used_on_pages, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        m.file_name, m.original_name, m.file_type, m.mime_type, m.file_size_bytes,
        m.storage_path, m.alt_text, m.caption, m.used_on_pages
      ]);
    }
    console.log(`[CMS Migration] Indexed ${coreMedia.length} core media assets into Media Library.`);
  }

  console.log('[CMS Migration] CMS schema initialization completed successfully!');
}

if (require.main === module) {
  migrateCms()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[CMS Migration Error]:', err);
      process.exit(1);
    });
}

module.exports = migrateCms;
