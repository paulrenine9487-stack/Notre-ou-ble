const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const { detectFileType } = require('../middleware/cmsUpload');
const cacheService = require('../services/cacheService');

// Helper to record content revisions
async function recordRevision(adminId, entityType, entityId, action, prevState, newState, summary) {
  try {
    await pool.query(
      `INSERT INTO cms_content_revisions (entity_type, entity_id, admin_id, action, previous_state, new_state, change_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entityType,
        entityId,
        adminId || 1,
        action,
        prevState ? JSON.stringify(prevState) : null,
        newState ? JSON.stringify(newState) : null,
        summary || `${action} on ${entityType} #${entityId}`
      ]
    );

    // Invalidate CMS cache on any revision
    await cacheService.invalidateTag('cms');
  } catch (err) {
    console.error('[CMS Revision Error]:', err.message);
  }
}

// 1. CMS Dashboard Statistics (Real queries only - zero fabricated data)
exports.getCmsDashboardStats = async (req, res, next) => {
  try {
    const [pageRows] = await pool.query('SELECT COUNT(DISTINCT page_slug) AS total FROM cms_page_sections');
    const [sectionPub] = await pool.query("SELECT COUNT(*) AS total FROM cms_page_sections WHERE status = 'PUBLISHED'");
    const [sectionDraft] = await pool.query("SELECT COUNT(*) AS total FROM cms_page_sections WHERE status = 'DRAFT'");
    const [sectionArch] = await pool.query("SELECT COUNT(*) AS total FROM cms_page_sections WHERE status = 'ARCHIVED'");

    const [videoRows] = await pool.query("SELECT COUNT(*) AS total FROM cms_media_assets WHERE file_type = 'VIDEO'");
    const [imageRows] = await pool.query("SELECT COUNT(*) AS total FROM cms_media_assets WHERE file_type = 'IMAGE'");
    const [gifRows] = await pool.query("SELECT COUNT(*) AS total FROM cms_media_assets WHERE file_type = 'GIF'");
    const [audioRows] = await pool.query("SELECT COUNT(*) AS total FROM cms_media_assets WHERE file_type = 'AUDIO'");

    const [moduleRows] = await pool.query('SELECT COUNT(*) AS total FROM learning_modules');
    const [stageRows] = await pool.query('SELECT COUNT(*) AS total FROM learning_stages');
    const [activityRows] = await pool.query('SELECT COUNT(*) AS total FROM learning_stage_content');
    const [objectiveRows] = await pool.query('SELECT COUNT(*) AS total FROM learning_objectives');
    const [questionRows] = await pool.query('SELECT COUNT(*) AS total FROM myth_fact_questions');
    const [tipRows] = await pool.query('SELECT COUNT(*) AS total FROM breathing_tips');

    const [recentRevisions] = await pool.query(`
      SELECT r.id, r.entity_type, r.entity_id, r.action, r.change_summary, r.created_at,
             COALESCE(u.username, 'Admin') AS admin_username
      FROM cms_content_revisions r
      LEFT JOIN users u ON r.admin_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalPages: (pageRows[0].total || 0) + 1, // sections + module hub
        totalPublished: (sectionPub[0].total || 0) + (objectiveRows[0].total || 0) + (questionRows[0].total || 0),
        draftContent: sectionDraft[0].total || 0,
        unpublishedContent: sectionArch[0].total || 0,
        totalVideos: videoRows[0].total || 0,
        totalImages: imageRows[0].total || 0,
        totalGifs: gifRows[0].total || 0,
        totalAudio: audioRows[0].total || 0,
        totalModules: moduleRows[0].total || 0,
        totalStages: stageRows[0].total || 0,
        totalActivities: activityRows[0].total || 0,
        totalObjectives: objectiveRows[0].total || 0,
        totalQuestions: questionRows[0].total || 0,
        totalTips: tipRows[0].total || 0
      },
      recentActivity: recentRevisions
    });
  } catch (error) {
    next(error);
  }
};

// 2. Public Page Sections API (User-facing frontend fetches published content)
exports.getPublicPageSections = async (req, res, next) => {
  try {
    const { pageSlug } = req.params;
    const cacheKey = `cms:public:${pageSlug}`;

    const data = await cacheService.wrap(cacheKey, async () => {
      const [rows] = await pool.query(
        `SELECT section_key, section_title, headline, subheadline, body_content, 
                cta_button_text, cta_button_url, media_url, extra_settings, display_order
         FROM cms_page_sections 
         WHERE page_slug = ? AND status = 'PUBLISHED'
         ORDER BY display_order ASC`,
        [pageSlug]
      );

      const sections = {};
      rows.forEach(r => {
        let settings = null;
        try {
          settings = typeof r.extra_settings === 'string' ? JSON.parse(r.extra_settings) : r.extra_settings;
        } catch (e) {
          settings = {};
        }
        sections[r.section_key] = {
          title: r.section_title,
          headline: r.headline,
          subheadline: r.subheadline,
          body: r.body_content,
          ctaText: r.cta_button_text,
          ctaUrl: r.cta_button_url,
          mediaUrl: r.media_url,
          settings,
          displayOrder: r.display_order
        };
      });

      return {
        pageSlug,
        sections,
        list: rows
      };
    }, 1800, ['cms']);

    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

// 3. Admin Sections CRUD
exports.getAllSections = async (req, res, next) => {
  try {
    const { page_slug, status, search } = req.query;
    let query = 'SELECT * FROM cms_page_sections WHERE 1=1';
    const params = [];

    if (page_slug) {
      query += ' AND page_slug = ?';
      params.push(page_slug);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (headline LIKE ? OR section_title LIKE ? OR section_key LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY page_slug ASC, display_order ASC';
    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      sections: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getSectionById = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cms_page_sections WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }
    res.status(200).json({ success: true, section: rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.createSection = async (req, res, next) => {
  try {
    const {
      page_slug, section_key, section_title, headline, subheadline,
      body_content, cta_button_text, cta_button_url, media_url,
      extra_settings, status, display_order
    } = req.body;

    if (!page_slug || !section_key || !section_title) {
      return res.status(400).json({
        success: false,
        message: 'Page slug, section key, and section title are required.'
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM cms_page_sections WHERE page_slug = ? AND section_key = ?',
      [page_slug.trim(), section_key.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A section with key "${section_key}" already exists on page "${page_slug}".`
      });
    }

    const [result] = await pool.query(
      `INSERT INTO cms_page_sections (
        page_slug, section_key, section_title, headline, subheadline,
        body_content, cta_button_text, cta_button_url, media_url,
        extra_settings, status, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        page_slug.trim(),
        section_key.trim(),
        section_title.trim(),
        headline || null,
        subheadline || null,
        body_content || null,
        cta_button_text || null,
        cta_button_url || null,
        media_url || null,
        extra_settings ? (typeof extra_settings === 'string' ? extra_settings : JSON.stringify(extra_settings)) : null,
        status || 'PUBLISHED',
        display_order || 1
      ]
    );

    const newId = result.insertId;
    const [newRow] = await pool.query('SELECT * FROM cms_page_sections WHERE id = ?', [newId]);

    await recordRevision(req.user?.id, 'page_section', newId, 'CREATE', null, newRow[0], `Created section ${section_title}`);

    res.status(201).json({
      success: true,
      message: 'Section created successfully.',
      section: newRow[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    const [current] = await pool.query('SELECT * FROM cms_page_sections WHERE id = ?', [sectionId]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    const oldState = current[0];
    const {
      section_title, headline, subheadline, body_content,
      cta_button_text, cta_button_url, media_url, extra_settings,
      status, display_order
    } = req.body;

    await pool.query(
      `UPDATE cms_page_sections SET
        section_title = COALESCE(?, section_title),
        headline = COALESCE(?, headline),
        subheadline = COALESCE(?, subheadline),
        body_content = COALESCE(?, body_content),
        cta_button_text = COALESCE(?, cta_button_text),
        cta_button_url = COALESCE(?, cta_button_url),
        media_url = COALESCE(?, media_url),
        extra_settings = COALESCE(?, extra_settings),
        status = COALESCE(?, status),
        display_order = COALESCE(?, display_order)
      WHERE id = ?`,
      [
        section_title !== undefined ? section_title : null,
        headline !== undefined ? headline : null,
        subheadline !== undefined ? subheadline : null,
        body_content !== undefined ? body_content : null,
        cta_button_text !== undefined ? cta_button_text : null,
        cta_button_url !== undefined ? cta_button_url : null,
        media_url !== undefined ? media_url : null,
        extra_settings !== undefined ? (typeof extra_settings === 'string' ? extra_settings : JSON.stringify(extra_settings)) : null,
        status !== undefined ? status : null,
        display_order !== undefined ? display_order : null,
        sectionId
      ]
    );

    const [updatedRow] = await pool.query('SELECT * FROM cms_page_sections WHERE id = ?', [sectionId]);
    await recordRevision(req.user?.id, 'page_section', sectionId, 'UPDATE', oldState, updatedRow[0], `Updated section ${updatedRow[0].section_title}`);

    res.status(200).json({
      success: true,
      message: 'Section updated successfully.',
      section: updatedRow[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSection = async (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    const [current] = await pool.query('SELECT * FROM cms_page_sections WHERE id = ?', [sectionId]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    const oldState = current[0];
    await pool.query('DELETE FROM cms_page_sections WHERE id = ?', [sectionId]);
    await recordRevision(req.user?.id, 'page_section', sectionId, 'DELETE', oldState, null, `Deleted section ${oldState.section_title}`);

    res.status(200).json({
      success: true,
      message: 'Section deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

exports.publishSection = async (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    const [current] = await pool.query('SELECT * FROM cms_page_sections WHERE id = ?', [sectionId]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    await pool.query("UPDATE cms_page_sections SET status = 'PUBLISHED' WHERE id = ?", [sectionId]);
    const [updated] = await pool.query('SELECT * FROM cms_page_sections WHERE id = ?', [sectionId]);
    await recordRevision(req.user?.id, 'page_section', sectionId, 'PUBLISH', current[0], updated[0], `Published section ${updated[0].section_title}`);

    res.status(200).json({
      success: true,
      message: 'Section published live to portal.',
      section: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.unpublishSection = async (req, res, next) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    const [current] = await pool.query('SELECT * FROM cms_page_sections WHERE id = ?', [sectionId]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    await pool.query("UPDATE cms_page_sections SET status = 'DRAFT' WHERE id = ?", [sectionId]);
    const [updated] = await pool.query('SELECT * FROM cms_page_sections WHERE id = ?', [sectionId]);
    await recordRevision(req.user?.id, 'page_section', sectionId, 'UNPUBLISH', current[0], updated[0], `Unpublished section ${updated[0].section_title}`);

    res.status(200).json({
      success: true,
      message: 'Section unpublished and saved as draft.',
      section: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// 4. Media Library CRUD
exports.getMediaAssets = async (req, res, next) => {
  try {
    const { file_type, search, is_published } = req.query;
    let query = 'SELECT * FROM cms_media_assets WHERE 1=1';
    const params = [];

    if (file_type && file_type !== 'ALL') {
      query += ' AND file_type = ?';
      params.push(file_type);
    }
    if (is_published !== undefined && is_published !== '') {
      query += ' AND is_published = ?';
      params.push(is_published === 'true' || is_published === '1' ? 1 : 0);
    }
    if (search) {
      query += ' AND (file_name LIKE ? OR alt_text LIKE ? OR caption LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      media: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadMediaAsset = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
    }

    const { alt_text, caption, used_on_pages } = req.body;
    const file = req.file;
    const ext = path.extname(file.originalname);
    const fileType = detectFileType(ext, file.mimetype);
    const relativePath = `/uploads/cms/${file.filename}`;

    const [result] = await pool.query(
      `INSERT INTO cms_media_assets (
        file_name, original_name, file_type, mime_type, file_size_bytes,
        storage_path, alt_text, caption, used_on_pages, is_published, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        file.filename,
        file.originalname,
        fileType,
        file.mimetype,
        file.size,
        relativePath,
        alt_text || file.originalname,
        caption || null,
        used_on_pages ? (typeof used_on_pages === 'string' ? used_on_pages : JSON.stringify(used_on_pages)) : JSON.stringify([]),
        req.user?.id || 1
      ]
    );

    const [newRow] = await pool.query('SELECT * FROM cms_media_assets WHERE id = ?', [result.insertId]);
    await recordRevision(req.user?.id, 'media_asset', result.insertId, 'CREATE', null, newRow[0], `Uploaded media asset ${file.originalname}`);

    res.status(201).json({
      success: true,
      message: 'Media asset uploaded successfully.',
      media: newRow[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMediaAsset = async (req, res, next) => {
  try {
    const mediaId = parseInt(req.params.id, 10);
    const [current] = await pool.query('SELECT * FROM cms_media_assets WHERE id = ?', [mediaId]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Media asset not found.' });
    }

    const { alt_text, caption, is_published } = req.body;
    await pool.query(
      `UPDATE cms_media_assets SET
        alt_text = COALESCE(?, alt_text),
        caption = COALESCE(?, caption),
        is_published = COALESCE(?, is_published)
      WHERE id = ?`,
      [
        alt_text !== undefined ? alt_text : null,
        caption !== undefined ? caption : null,
        is_published !== undefined ? (is_published ? 1 : 0) : null,
        mediaId
      ]
    );

    const [updatedRow] = await pool.query('SELECT * FROM cms_media_assets WHERE id = ?', [mediaId]);
    await recordRevision(req.user?.id, 'media_asset', mediaId, 'UPDATE', current[0], updatedRow[0], `Updated media asset ${updatedRow[0].file_name}`);

    res.status(200).json({
      success: true,
      message: 'Media asset updated successfully.',
      media: updatedRow[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMediaAsset = async (req, res, next) => {
  try {
    const mediaId = parseInt(req.params.id, 10);
    const [current] = await pool.query('SELECT * FROM cms_media_assets WHERE id = ?', [mediaId]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Media asset not found.' });
    }

    const asset = current[0];
    await pool.query('DELETE FROM cms_media_assets WHERE id = ?', [mediaId]);

    // If file is in uploads/cms, delete from disk
    if (asset.storage_path.startsWith('/uploads/cms/')) {
      const diskPath = path.resolve(__dirname, '..', asset.storage_path.replace(/^\//, ''));
      if (fs.existsSync(diskPath)) {
        try { fs.unlinkSync(diskPath); } catch (e) {}
      }
    }

    await recordRevision(req.user?.id, 'media_asset', mediaId, 'DELETE', asset, null, `Deleted media asset ${asset.file_name}`);

    res.status(200).json({
      success: true,
      message: 'Media asset deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// 5. Learning Modules Content Management
exports.getCmsModules = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM learning_modules ORDER BY display_order ASC');
    res.status(200).json({ success: true, modules: rows });
  } catch (error) {
    next(error);
  }
};

exports.updateCmsModule = async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.id, 10);
    const [current] = await pool.query('SELECT * FROM learning_modules WHERE id = ?', [moduleId]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    const { title, description, category, status, is_available, thumbnail, display_order } = req.body;

    await pool.query(
      `UPDATE learning_modules SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        status = COALESCE(?, status),
        is_available = COALESCE(?, is_available),
        thumbnail = COALESCE(?, thumbnail),
        display_order = COALESCE(?, display_order),
        updated_at = NOW()
      WHERE id = ?`,
      [
        title !== undefined ? title : null,
        description !== undefined ? description : null,
        category !== undefined ? category : null,
        status !== undefined ? status : null,
        is_available !== undefined ? (is_available ? 1 : 0) : null,
        thumbnail !== undefined ? thumbnail : null,
        display_order !== undefined ? display_order : null,
        moduleId
      ]
    );

    const [updatedRow] = await pool.query('SELECT * FROM learning_modules WHERE id = ?', [moduleId]);
    await recordRevision(req.user?.id, 'learning_module', moduleId, 'UPDATE', current[0], updatedRow[0], `Updated module ${updatedRow[0].title}`);

    res.status(200).json({
      success: true,
      message: 'Module updated successfully.',
      module: updatedRow[0]
    });
  } catch (error) {
    next(error);
  }
};

// 6. Curriculum Stages Content Management
exports.getCmsStages = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM learning_stages ORDER BY stage_number ASC');
    res.status(200).json({ success: true, stages: rows });
  } catch (error) {
    next(error);
  }
};

exports.updateCmsStage = async (req, res, next) => {
  try {
    const stageId = parseInt(req.params.id, 10);
    const [current] = await pool.query('SELECT * FROM learning_stages WHERE id = ?', [stageId]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Stage not found.' });
    }

    const { title, subtitle, description, stage_content, is_active } = req.body;

    await pool.query(
      `UPDATE learning_stages SET
        title = COALESCE(?, title),
        stage_title = COALESCE(?, stage_title),
        subtitle = COALESCE(?, subtitle),
        stage_subtitle = COALESCE(?, stage_subtitle),
        description = COALESCE(?, description),
        stage_description = COALESCE(?, stage_description),
        stage_content = COALESCE(?, stage_content),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
      WHERE id = ?`,
      [
        title !== undefined ? title : null,
        title !== undefined ? title : null,
        subtitle !== undefined ? subtitle : null,
        subtitle !== undefined ? subtitle : null,
        description !== undefined ? description : null,
        description !== undefined ? description : null,
        stage_content !== undefined ? stage_content : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        stageId
      ]
    );

    const [updatedRow] = await pool.query('SELECT * FROM learning_stages WHERE id = ?', [stageId]);
    await recordRevision(req.user?.id, 'learning_stage', stageId, 'UPDATE', current[0], updatedRow[0], `Updated stage ${updatedRow[0].title}`);

    res.status(200).json({
      success: true,
      message: 'Stage updated successfully.',
      stage: updatedRow[0]
    });
  } catch (error) {
    next(error);
  }
};

// 7. Revision History
exports.getCmsRevisions = async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.query;
    let query = `
      SELECT r.*, u.username AS admin_username, u.email AS admin_email
      FROM cms_content_revisions r
      LEFT JOIN users u ON r.admin_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (entity_type) {
      query += ' AND r.entity_type = ?';
      params.push(entity_type);
    }
    if (entity_id) {
      query += ' AND r.entity_id = ?';
      params.push(entity_id);
    }

    query += ' ORDER BY r.created_at DESC LIMIT 50';
    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      revisions: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.rollbackRevision = async (req, res, next) => {
  try {
    const revId = parseInt(req.params.id, 10);
    const [revRows] = await pool.query('SELECT * FROM cms_content_revisions WHERE id = ?', [revId]);
    if (revRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Revision snapshot not found.' });
    }

    const revision = revRows[0];
    if (!revision.previous_state) {
      return res.status(400).json({ success: false, message: 'No previous state available in this snapshot.' });
    }

    const prevState = JSON.parse(revision.previous_state);

    if (revision.entity_type === 'page_section') {
      await pool.query(
        `UPDATE cms_page_sections SET
          section_title = ?, headline = ?, subheadline = ?, body_content = ?,
          cta_button_text = ?, cta_button_url = ?, media_url = ?, extra_settings = ?,
          status = ?, display_order = ?
        WHERE id = ?`,
        [
          prevState.section_title, prevState.headline, prevState.subheadline, prevState.body_content,
          prevState.cta_button_text, prevState.cta_button_url, prevState.media_url, prevState.extra_settings,
          prevState.status, prevState.display_order, prevState.id
        ]
      );
    }

    await recordRevision(
      req.user?.id,
      revision.entity_type,
      revision.entity_id,
      'UPDATE',
      null,
      prevState,
      `Rolled back revision #${revId}`
    );

    res.status(200).json({
      success: true,
      message: `Content safely rolled back to revision #${revId}.`
    });
  } catch (error) {
    next(error);
  }
};
