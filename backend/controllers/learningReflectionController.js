const pool = require('../config/db');

// GET /api/learning/reflections/breath-management
// Retrieve the authenticated student's reflection (Student-Specific)
exports.getStudentReflection = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = parseInt(req.query.moduleId, 10) || 1;
    const stageId = parseInt(req.query.stageId, 10) || 4;

    const [rows] = await pool.query(
      `SELECT id, user_id, module_id, stage_id, question_1_answer, question_2_answer, question_3_answer, status, submitted_at, updated_at, created_at
       FROM student_learning_reflections
       WHERE user_id = ? AND module_id = ? AND stage_id = ?
       LIMIT 1`,
      [userId, moduleId, stageId]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        hasSubmitted: false,
        status: 'NOT_STARTED',
        reflection: null
      });
    }

    const reflection = rows[0];

    // Check version count
    const [historyRows] = await pool.query(
      'SELECT COUNT(*) AS versionCount FROM student_learning_reflection_history WHERE reflection_id = ?',
      [reflection.id]
    );

    return res.status(200).json({
      success: true,
      hasSubmitted: true,
      status: reflection.status || 'COMPLETED',
      reflection: {
        ...reflection,
        versionCount: historyRows[0]?.versionCount || 1
      }
    });
  } catch (error) {
    console.error('[Reflection Error] getStudentReflection:', error);
    next(error);
  }
};

// POST /api/learning/reflections/breath-management
// Save or submit the student's 3-question reflection
exports.submitStudentReflection = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      question_1_answer,
      question_2_answer,
      question_3_answer,
      module_id = 1,
      stage_id = 4
    } = req.body;

    const q1 = String(question_1_answer || '').trim();
    const q2 = String(question_2_answer || '').trim();
    const q3 = String(question_3_answer || '').trim();

    // 1. Validate all three answers are mandatory
    if (!q1 || !q2 || !q3) {
      return res.status(400).json({
        success: false,
        message: 'All three reflection questions are mandatory. Please complete all three cards.'
      });
    }

    // 2. Check character limit (1500 chars max)
    if (q1.length > 1500 || q2.length > 1500 || q3.length > 1500) {
      return res.status(400).json({
        success: false,
        message: 'Answers cannot exceed 1,500 characters each.'
      });
    }

    const moduleIdNum = parseInt(module_id, 10) || 1;
    const stageIdNum = parseInt(stage_id, 10) || 4;

    // 3. Check if reflection already exists for this student
    const [existing] = await pool.query(
      'SELECT id FROM student_learning_reflections WHERE user_id = ? AND module_id = ? AND stage_id = ? LIMIT 1',
      [userId, moduleIdNum, stageIdNum]
    );

    let reflectionId;
    let versionNum = 1;

    if (existing.length > 0) {
      // Update existing reflection
      reflectionId = existing[0].id;

      // Get current max version number
      const [vRows] = await pool.query(
        'SELECT COALESCE(MAX(version_number), 1) AS max_v FROM student_learning_reflection_history WHERE reflection_id = ?',
        [reflectionId]
      );
      versionNum = (vRows[0].max_v || 1) + 1;

      await pool.query(
        `UPDATE student_learning_reflections
         SET question_1_answer = ?,
             question_2_answer = ?,
             question_3_answer = ?,
             status = 'COMPLETED',
             updated_at = NOW()
         WHERE id = ?`,
        [q1, q2, q3, reflectionId]
      );
    } else {
      // Insert new reflection
      const [insertRes] = await pool.query(
        `INSERT INTO student_learning_reflections
          (user_id, module_id, stage_id, question_1_answer, question_2_answer, question_3_answer, status, submitted_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', NOW(), NOW())`,
        [userId, moduleIdNum, stageIdNum, q1, q2, q3]
      );
      reflectionId = insertRes.insertId;
    }

    // 4. Save into version history table
    await pool.query(
      `INSERT INTO student_learning_reflection_history
        (reflection_id, user_id, question_1_answer, question_2_answer, question_3_answer, version_number, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [reflectionId, userId, q1, q2, q3, versionNum]
    );

    // 5. Update stage activity progress in learning_activity_progress
    try {
      await pool.query(
        `INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
         VALUES (?, ?, 's4_reflection_pinboard', 'reflection', 'COMPLETED', NOW())
         ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()`,
        [userId, stageIdNum]
      );
    } catch (actErr) {
      console.warn('[Reflection] Could not update activity progress:', actErr.message);
    }

    // 6. Fetch updated record
    const [updated] = await pool.query(
      'SELECT * FROM student_learning_reflections WHERE id = ?',
      [reflectionId]
    );

    res.status(200).json({
      success: true,
      message: existing.length > 0 ? 'Reflection updated successfully!' : 'Reflection submitted successfully!',
      reflection: {
        ...updated[0],
        versionCount: versionNum
      }
    });
  } catch (error) {
    console.error('[Reflection Error] submitStudentReflection:', error);
    next(error);
  }
};

// PUT /api/learning/reflections/breath-management
// Alias for updating reflection
exports.updateStudentReflection = exports.submitStudentReflection;

// ============================================================================
// ADMIN / SUPERADMIN ENDPOINTS
// ============================================================================

// GET /api/admin/learning-reflections
// View all student reflections with search, filter, and pagination
exports.adminGetReflections = async (req, res, next) => {
  try {
    const { search = '', moduleId = 1, stageId = 4, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (moduleId) {
      whereClause += ' AND r.module_id = ?';
      params.push(parseInt(moduleId, 10));
    }

    if (stageId) {
      whereClause += ' AND r.stage_id = ?';
      params.push(parseInt(stageId, 10));
    }

    if (search && search.trim()) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR r.question_1_answer LIKE ? OR r.question_2_answer LIKE ? OR r.question_3_answer LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    // Total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM student_learning_reflections r
       JOIN users u ON r.user_id = u.id
       ${whereClause}`,
      params
    );
    const totalCount = countRows[0].total;

    // Results
    const [rows] = await pool.query(
      `SELECT 
         r.id,
         r.user_id,
         u.username,
         u.email,
         r.module_id,
         r.stage_id,
         r.question_1_answer,
         r.question_2_answer,
         r.question_3_answer,
         r.status,
         r.submitted_at,
         r.updated_at,
         (SELECT COUNT(*) FROM student_learning_reflection_history h WHERE h.reflection_id = r.id) AS version_count
       FROM student_learning_reflections r
       JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    res.status(200).json({
      success: true,
      reflections: rows,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / parseInt(limit, 10))
    });
  } catch (error) {
    console.error('[Admin Reflection Error] adminGetReflections:', error);
    next(error);
  }
};

// DELETE /api/admin/learning-reflections/:userId
// Reset or delete a student's reflection
exports.adminResetStudentReflection = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const moduleId = parseInt(req.query.moduleId, 10) || 1;
    const stageId = parseInt(req.query.stageId, 10) || 4;

    const [delRes] = await pool.query(
      'DELETE FROM student_learning_reflections WHERE user_id = ? AND module_id = ? AND stage_id = ?',
      [targetUserId, moduleId, stageId]
    );

    res.status(200).json({
      success: true,
      message: `Student #${targetUserId} reflection reset successfully.`,
      affectedRows: delRes.affectedRows
    });
  } catch (error) {
    console.error('[Admin Reflection Error] adminResetStudentReflection:', error);
    next(error);
  }
};
