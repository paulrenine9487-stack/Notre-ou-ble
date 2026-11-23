const pool = require('../config/db');

// GET /api/teacher/submissions
exports.getSubmissions = async (req, res, next) => {
  try {
    const { status, taskId, stageId } = req.query;

    let query = `
      SELECT 
        uts.id AS submission_id,
        uts.user_id,
        u.username,
        u.email,
        uts.task_id,
        lt.task_title,
        lt.task_type,
        lt.maximum_marks,
        lt.passing_marks,
        ls.id AS stage_id,
        ls.stage_number,
        ls.stage_title,
        uts.submission_type,
        uts.text_response,
        uts.file_reference,
        uts.original_file_name,
        uts.file_size_bytes,
        uts.mime_type,
        uts.duration_seconds,
        uts.submission_version,
        uts.submitted_at,
        ta.id AS assessment_id,
        ta.marks_awarded,
        ta.percentage,
        ta.feedback,
        ta.improvement_suggestions,
        COALESCE(ta.assessment_status, 'AWAITING_REVIEW') AS assessment_status,
        ta.assessed_at,
        assessor.username AS assessed_by_username
      FROM user_task_submissions uts
      JOIN users u ON uts.user_id = u.id
      JOIN learning_tasks lt ON uts.task_id = lt.id
      JOIN learning_stages ls ON lt.stage_id = ls.id
      LEFT JOIN task_assessments ta ON uts.id = ta.submission_id
      LEFT JOIN users assessor ON ta.assessed_by = assessor.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND COALESCE(ta.assessment_status, 'AWAITING_REVIEW') = ?`;
      params.push(status);
    }
    if (taskId) {
      query += ` AND uts.task_id = ?`;
      params.push(parseInt(taskId, 10));
    }
    if (stageId) {
      query += ` AND ls.id = ?`;
      params.push(parseInt(stageId, 10));
    }

    query += ` ORDER BY uts.submitted_at DESC`;

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      submissions: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/teacher/submissions/:submissionId
exports.getSubmissionById = async (req, res, next) => {
  try {
    const submissionId = parseInt(req.params.submissionId, 10);

    const [rows] = await pool.query(`
      SELECT 
        uts.id AS submission_id,
        uts.user_id,
        u.username,
        u.email,
        uts.task_id,
        lt.task_title,
        lt.task_type,
        lt.task_description,
        lt.task_instructions,
        lt.maximum_marks,
        lt.passing_marks,
        ls.id AS stage_id,
        ls.stage_number,
        ls.stage_title,
        uts.submission_type,
        uts.text_response,
        uts.quiz_answers,
        uts.file_reference,
        uts.original_file_name,
        uts.file_size_bytes,
        uts.mime_type,
        uts.duration_seconds,
        uts.metadata,
        uts.submission_version,
        uts.submitted_at,
        ta.id AS assessment_id,
        ta.marks_awarded,
        ta.percentage,
        ta.feedback,
        ta.improvement_suggestions,
        COALESCE(ta.assessment_status, 'AWAITING_REVIEW') AS assessment_status,
        ta.assessed_at,
        assessor.username AS assessed_by_username
      FROM user_task_submissions uts
      JOIN users u ON uts.user_id = u.id
      JOIN learning_tasks lt ON uts.task_id = lt.id
      JOIN learning_stages ls ON lt.stage_id = ls.id
      LEFT JOIN task_assessments ta ON uts.id = ta.submission_id
      LEFT JOIN users assessor ON ta.assessed_by = assessor.id
      WHERE uts.id = ?
    `, [submissionId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    res.status(200).json({
      success: true,
      submission: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/teacher/submissions/:submissionId/assess
exports.assessSubmission = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const adminId = req.user.id;
    const submissionId = parseInt(req.params.submissionId, 10);
    const { marks_awarded, feedback, improvement_suggestions } = req.body;

    const [subs] = await conn.query(`
      SELECT uts.*, lt.maximum_marks, lt.passing_marks, lt.stage_id
      FROM user_task_submissions uts
      JOIN learning_tasks lt ON uts.task_id = lt.id
      WHERE uts.id = ?
    `, [submissionId]);

    if (subs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    const sub = subs[0];

    const marks = parseInt(marks_awarded, 10);
    if (isNaN(marks) || marks < 0 || marks > sub.maximum_marks) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Marks awarded must be between 0 and ${sub.maximum_marks}.`
      });
    }

    const percentage = ((marks / sub.maximum_marks) * 100).toFixed(2);
    const isPassing = marks >= sub.passing_marks;
    const finalStatus = isPassing ? 'COMPLETED' : 'ASSESSED';

    // Update or insert task_assessments
    const [existingAss] = await conn.query(
      'SELECT id FROM task_assessments WHERE submission_id = ? LIMIT 1',
      [submissionId]
    );

    if (existingAss.length > 0) {
      await conn.query(`
        UPDATE task_assessments
        SET marks_awarded = ?, percentage = ?, feedback = ?, improvement_suggestions = ?,
            assessment_status = ?, assessed_by = ?, assessed_at = NOW()
        WHERE id = ?
      `, [marks, percentage, feedback || 'Assessment completed.', improvement_suggestions || null, finalStatus, adminId, existingAss[0].id]);
    } else {
      await conn.query(`
        INSERT INTO task_assessments 
          (submission_id, task_id, user_id, maximum_marks, marks_awarded, percentage, feedback, improvement_suggestions, assessment_status, assessed_by, assessed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [submissionId, sub.task_id, sub.user_id, sub.maximum_marks, marks, percentage, feedback || 'Assessment completed.', improvement_suggestions || null, finalStatus, adminId]);
    }

    // Update user_task_assignments status
    const assignmentStatus = isPassing ? 'COMPLETED' : 'COMPLETED';
    await conn.query(`
      UPDATE user_task_assignments 
      SET assignment_status = ?, completed_at = NOW(), updated_at = NOW()
      WHERE user_id = ? AND task_id = ?
    `, [assignmentStatus, sub.user_id, sub.task_id]);

    // Check if stage is completed
    const [allStageTasks] = await conn.query(
      'SELECT id, is_required FROM learning_tasks WHERE stage_id = ?',
      [sub.stage_id]
    );
    const [userTasks] = await conn.query(`
      SELECT task_id, assignment_status 
      FROM user_task_assignments 
      WHERE user_id = ? AND task_id IN (${allStageTasks.map(t => t.id).join(',')})
    `, [sub.user_id]);

    const compCount = userTasks.filter(ut => ut.assignment_status === 'COMPLETED').length;
    const isStageDone = compCount === allStageTasks.length;

    await conn.query(`
      UPDATE user_stage_progress
      SET completion_status = ?,
          progress_percentage = ?,
          completed_at = ${isStageDone ? 'NOW()' : 'completed_at'},
          updated_at = NOW()
      WHERE user_id = ? AND stage_id = ?
    `, [isStageDone ? 'COMPLETED' : 'IN_PROGRESS', isStageDone ? 100.00 : 75.00, sub.user_id, sub.stage_id]);

    // Audit log
    await conn.query(`
      INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
      VALUES (?, 'ASSESS_SUBMISSION', 'user_task_submissions', ?, ?)
    `, [adminId, submissionId, `Awarded ${marks}/${sub.maximum_marks} (${percentage}%) to user ${sub.user_id} for task ${sub.task_id}`]);

    await conn.commit();

    res.status(200).json({
      success: true,
      message: 'Assessment saved successfully.',
      marksAwarded: marks,
      maximumMarks: sub.maximum_marks,
      percentage,
      assessmentStatus: finalStatus,
      isStageDone
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// POST /api/teacher/submissions/:submissionId/request-revision
exports.requestRevision = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const adminId = req.user.id;
    const submissionId = parseInt(req.params.submissionId, 10);
    const { feedback, improvement_suggestions } = req.body;

    const [subs] = await conn.query(`
      SELECT uts.*, lt.maximum_marks, lt.stage_id
      FROM user_task_submissions uts
      JOIN learning_tasks lt ON uts.task_id = lt.id
      WHERE uts.id = ?
    `, [submissionId]);

    if (subs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    const sub = subs[0];

    // Update assessment to NEEDS_REVISION
    await conn.query(`
      UPDATE task_assessments
      SET assessment_status = 'NEEDS_REVISION',
          feedback = ?,
          improvement_suggestions = ?,
          assessed_by = ?,
          assessed_at = NOW()
      WHERE submission_id = ?
    `, [
      feedback || 'Revision requested. Please review feedback and resubmit.',
      improvement_suggestions || null,
      adminId,
      submissionId
    ]);

    // Update task assignment status to NEEDS_REVISION
    await conn.query(`
      UPDATE user_task_assignments 
      SET assignment_status = 'NEEDS_REVISION', updated_at = NOW()
      WHERE user_id = ? AND task_id = ?
    `, [sub.user_id, sub.task_id]);

    // Update stage progress to NEEDS_REVISION
    await conn.query(`
      UPDATE user_stage_progress
      SET completion_status = 'NEEDS_REVISION', updated_at = NOW()
      WHERE user_id = ? AND stage_id = ?
    `, [sub.user_id, sub.stage_id]);

    // Audit log
    await conn.query(`
      INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
      VALUES (?, 'REQUEST_REVISION', 'user_task_submissions', ?, ?)
    `, [adminId, submissionId, `Requested revision from user ${sub.user_id} on task ${sub.task_id}`]);

    await conn.commit();

    res.status(200).json({
      success: true,
      message: 'Revision requested from student.',
      submissionId,
      status: 'NEEDS_REVISION'
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};
