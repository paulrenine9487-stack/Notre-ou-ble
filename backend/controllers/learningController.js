const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

// Helper: Ensure user has an enrollment record for module
async function ensureEnrollment(userId, moduleId) {
  await pool.query(`
    INSERT INTO user_learning_enrollments (user_id, module_id, current_stage_id, completion_status)
    VALUES (?, ?, NULL, 'IN_PROGRESS')
    ON DUPLICATE KEY UPDATE updated_at = NOW()
  `, [userId, moduleId]);
}

// Helper: Calculate module overall progress and scores for a user
async function calculateModuleStats(userId, moduleId) {
  // Fetch all 9 stages
  const [stages] = await pool.query(
    'SELECT id, stage_number FROM learning_stages WHERE module_id = ? ORDER BY stage_number ASC',
    [moduleId]
  );
  const totalStages = stages.length || 9;

  // Fetch all tasks in module
  const [tasks] = await pool.query(`
    SELECT lt.id, lt.stage_id, lt.maximum_marks, lt.passing_marks, lt.is_required
    FROM learning_tasks lt
    JOIN learning_stages ls ON lt.stage_id = ls.id
    WHERE ls.module_id = ?
  `, [moduleId]);

  const totalPossibleMarks = tasks.reduce((sum, t) => sum + (t.maximum_marks || 0), 0);

  // Fetch user stage progress
  const [stageProgress] = await pool.query(
    'SELECT stage_id, completion_status FROM user_stage_progress WHERE user_id = ?',
    [userId]
  );
  const stageMap = {};
  stageProgress.forEach(sp => {
    stageMap[sp.stage_id] = sp.completion_status;
  });

  let completedStages = 0;
  let inProgressStages = 0;
  let submittedStages = 0;
  let needsRevisionStages = 0;
  let notStartedStages = 0;

  stages.forEach(st => {
    const stStatus = stageMap[st.id] || 'NOT_STARTED';
    if (stStatus === 'COMPLETED') completedStages++;
    else if (stStatus === 'IN_PROGRESS') inProgressStages++;
    else if (stStatus === 'SUBMITTED') submittedStages++;
    else if (stStatus === 'NEEDS_REVISION') needsRevisionStages++;
    else notStartedStages++;
  });

  // Fetch task assessments for user
  const [assessments] = await pool.query(`
    SELECT ta.task_id, ta.marks_awarded, ta.maximum_marks, ta.assessment_status
    FROM task_assessments ta
    JOIN learning_tasks lt ON ta.task_id = lt.id
    JOIN learning_stages ls ON lt.stage_id = ls.id
    WHERE ta.user_id = ? AND ls.module_id = ?
  `, [userId, moduleId]);

  let totalMarksObtained = 0;
  let assessedTasksCount = 0;
  let pendingTasksCount = 0;

  assessments.forEach(ass => {
    if (ass.assessment_status === 'ASSESSED' || ass.assessment_status === 'COMPLETED') {
      totalMarksObtained += (ass.marks_awarded || 0);
      assessedTasksCount++;
    } else {
      pendingTasksCount++;
    }
  });

  const overallProgressPercent = totalStages > 0
    ? Math.round((completedStages / totalStages) * 100)
    : 0;

  // Provisional Score = (Total marks awarded / Total possible marks assigned) * 100
  const provisionalScorePercent = totalPossibleMarks > 0
    ? Math.round((totalMarksObtained / totalPossibleMarks) * 100)
    : 0;

  // Determine current stage number
  let currentStageNumber = 1;
  for (const st of stages) {
    const stStatus = stageMap[st.id] || 'NOT_STARTED';
    if (stStatus !== 'COMPLETED') {
      currentStageNumber = st.stage_number;
      break;
    }
  }

  return {
    totalStages,
    completedStages,
    inProgressStages,
    submittedStages,
    needsRevisionStages,
    notStartedStages,
    overallProgressPercent,
    currentStageNumber,
    totalPossibleMarks,
    marksObtained: totalMarksObtained,
    provisionalScorePercent,
    assessedTasksCount,
    pendingTasksCount
  };
}

// ============================================================================
// 1. MODULES ENDPOINTS
// ============================================================================

// GET /api/learning/modules
exports.getModules = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [modules] = await pool.query(
      'SELECT id, title, description, module_code, module_order, status, created_at FROM learning_modules ORDER BY module_order ASC'
    );

    const modulesWithStats = await Promise.all(modules.map(async (mod) => {
      const stats = await calculateModuleStats(userId, mod.id);
      return {
        ...mod,
        ...stats
      };
    }));

    res.status(200).json({
      success: true,
      modules: modulesWithStats
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/modules/:moduleId
exports.getModuleById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = parseInt(req.params.moduleId, 10);

    const [modules] = await pool.query(
      'SELECT id, title, description, module_code, module_order, status, created_at FROM learning_modules WHERE id = ?',
      [moduleId]
    );

    if (modules.length === 0) {
      return res.status(404).json({ success: false, message: 'Learning module not found.' });
    }

    const stats = await calculateModuleStats(userId, moduleId);

    res.status(200).json({
      success: true,
      module: {
        ...modules[0],
        ...stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/modules/:moduleId/stages
exports.getModuleStages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = parseInt(req.params.moduleId, 10);

    // Verify module exists
    const [mods] = await pool.query(
      'SELECT id, title, description, module_code, status FROM learning_modules WHERE id = ?',
      [moduleId]
    );
    if (mods.length === 0) {
      return res.status(404).json({ success: false, message: 'Learning module not found.' });
    }

    await ensureEnrollment(userId, moduleId);

    // Fetch all 9 stages
    const [stages] = await pool.query(`
      SELECT 
        s.id,
        s.module_id,
        s.stage_number,
        s.stage_title,
        s.stage_subtitle,
        s.stage_description,
        s.stage_content,
        s.stage_order,
        s.status,
        COALESCE(usp.completion_status, 'NOT_STARTED') AS user_status,
        usp.progress_percentage,
        usp.started_at,
        usp.completed_at
      FROM learning_stages s
      LEFT JOIN user_stage_progress usp ON s.id = usp.stage_id AND usp.user_id = ?
      WHERE s.module_id = ?
      ORDER BY s.stage_number ASC
    `, [userId, moduleId]);

    // Fetch tasks for each stage with user assignment, latest submission & assessment
    const stageIds = stages.map(s => s.id);
    let tasks = [];
    if (stageIds.length > 0) {
      const [taskRows] = await pool.query(`
        SELECT 
          t.id,
          t.stage_id,
          t.task_title,
          t.task_description,
          t.task_instructions,
          t.learning_materials,
          t.task_type,
          t.maximum_marks,
          t.passing_marks,
          t.is_required,
          t.task_order,
          t.time_limit_minutes,
          t.status,
          COALESCE(uta.assignment_status, 'ASSIGNED') AS assignment_status,
          uta.started_at AS task_started_at,
          uta.submitted_at AS task_submitted_at,
          uta.completed_at AS task_completed_at,
          ta.marks_awarded,
          ta.percentage AS score_percentage,
          ta.feedback,
          ta.improvement_suggestions,
          ta.assessment_status,
          ta.assessed_at,
          (
            SELECT uts.file_reference
            FROM user_task_submissions uts
            WHERE uts.task_id = t.id AND uts.user_id = ?
            ORDER BY uts.submission_version DESC LIMIT 1
          ) AS latest_file_reference,
          (
            SELECT uts.original_file_name
            FROM user_task_submissions uts
            WHERE uts.task_id = t.id AND uts.user_id = ?
            ORDER BY uts.submission_version DESC LIMIT 1
          ) AS latest_file_name,
          (
            SELECT uts.submission_version
            FROM user_task_submissions uts
            WHERE uts.task_id = t.id AND uts.user_id = ?
            ORDER BY uts.submission_version DESC LIMIT 1
          ) AS latest_version,
          (
            SELECT uts.id
            FROM user_task_submissions uts
            WHERE uts.task_id = t.id AND uts.user_id = ?
            ORDER BY uts.submission_version DESC LIMIT 1
          ) AS latest_submission_id
        FROM learning_tasks t
        LEFT JOIN user_task_assignments uta ON t.id = uta.task_id AND uta.user_id = ?
        LEFT JOIN (
          SELECT ta1.*
          FROM task_assessments ta1
          INNER JOIN (
            SELECT task_id, MAX(id) AS max_id
            FROM task_assessments
            WHERE user_id = ?
            GROUP BY task_id
          ) ta2 ON ta1.id = ta2.max_id
        ) ta ON t.id = ta.task_id
        WHERE t.stage_id IN (?)
        ORDER BY t.stage_id ASC, t.task_order ASC
      `, [userId, userId, userId, userId, userId, userId, stageIds]);
      tasks = taskRows;
    }

    // Combine stages with their tasks
    const stagesWithTasks = stages.map(stage => {
      const stageTasks = tasks.filter(t => t.stage_id === stage.id);
      return {
        ...stage,
        tasks: stageTasks
      };
    });

    const stats = await calculateModuleStats(userId, moduleId);

    res.status(200).json({
      success: true,
      module: mods[0],
      stats,
      stages: stagesWithTasks
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/stages/:stageId
exports.getStageById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stageId = parseInt(req.params.stageId, 10);

    const [stages] = await pool.query(`
      SELECT 
        s.*,
        lm.title AS module_title,
        lm.module_code,
        COALESCE(usp.completion_status, 'NOT_STARTED') AS user_status,
        usp.progress_percentage,
        usp.started_at,
        usp.completed_at
      FROM learning_stages s
      JOIN learning_modules lm ON s.module_id = lm.id
      LEFT JOIN user_stage_progress usp ON s.id = usp.stage_id AND usp.user_id = ?
      WHERE s.id = ?
    `, [userId, stageId]);

    if (stages.length === 0) {
      return res.status(404).json({ success: false, message: 'Learning stage not found.' });
    }

    const stage = stages[0];

    // Fetch tasks
    const [tasks] = await pool.query(`
      SELECT 
        t.*,
        COALESCE(uta.assignment_status, 'ASSIGNED') AS assignment_status,
        uta.started_at AS task_started_at,
        uta.submitted_at AS task_submitted_at,
        uta.completed_at AS task_completed_at,
        ta.id AS assessment_id,
        ta.marks_awarded,
        ta.percentage AS score_percentage,
        ta.feedback,
        ta.improvement_suggestions,
        ta.assessment_status,
        ta.assessed_at
      FROM learning_tasks t
      LEFT JOIN user_task_assignments uta ON t.id = uta.task_id AND uta.user_id = ?
      LEFT JOIN task_assessments ta ON t.id = ta.task_id AND ta.user_id = ?
      WHERE t.stage_id = ?
      ORDER BY t.task_order ASC
    `, [userId, userId, stageId]);

    // Fetch submissions for all tasks in this stage
    const [submissions] = await pool.query(`
      SELECT uts.*
      FROM user_task_submissions uts
      JOIN learning_tasks lt ON uts.task_id = lt.id
      WHERE lt.stage_id = ? AND uts.user_id = ?
      ORDER BY uts.submitted_at DESC
    `, [stageId, userId]);

    res.status(200).json({
      success: true,
      stage,
      tasks: tasks.map(t => ({
        ...t,
        submissions: submissions.filter(sub => sub.task_id === t.id)
      }))
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. STAGE PROGRESS & COMPLETION ENDPOINTS
// ============================================================================

// POST /api/learning/stages/:stageId/start
exports.startStage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stageId = parseInt(req.params.stageId, 10);

    const [stages] = await pool.query('SELECT id, module_id, stage_number FROM learning_stages WHERE id = ?', [stageId]);
    if (stages.length === 0) {
      return res.status(404).json({ success: false, message: 'Stage not found.' });
    }
    const stage = stages[0];

    await ensureEnrollment(userId, stage.module_id);

    // Update or insert user_stage_progress
    await pool.query(`
      INSERT INTO user_stage_progress (user_id, stage_id, completion_status, started_at)
      VALUES (?, ?, 'IN_PROGRESS', NOW())
      ON DUPLICATE KEY UPDATE 
        completion_status = IF(completion_status = 'NOT_STARTED', 'IN_PROGRESS', completion_status),
        started_at = IF(started_at IS NULL, NOW(), started_at),
        updated_at = NOW()
    `, [userId, stageId]);

    // Also update enrollment current stage
    await pool.query(`
      UPDATE user_learning_enrollments 
      SET current_stage_id = ?, updated_at = NOW()
      WHERE user_id = ? AND module_id = ?
    `, [stageId, userId, stage.module_id]);

    res.status(200).json({
      success: true,
      message: `Stage ${stage.stage_number} initiated.`,
      stageId,
      status: 'IN_PROGRESS'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/stages/:stageId/complete
exports.completeStage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stageId = parseInt(req.params.stageId, 10);

    const [stages] = await pool.query('SELECT id, module_id, stage_number FROM learning_stages WHERE id = ?', [stageId]);
    if (stages.length === 0) {
      return res.status(404).json({ success: false, message: 'Stage not found.' });
    }
    const stage = stages[0];

    await pool.query(`
      INSERT INTO user_stage_progress (user_id, stage_id, completion_status, progress_percentage, started_at, completed_at)
      VALUES (?, ?, 'COMPLETED', 100.00, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
        completion_status = 'COMPLETED',
        progress_percentage = 100.00,
        completed_at = NOW(),
        updated_at = NOW()
    `, [userId, stageId]);

    const stats = await calculateModuleStats(userId, stage.module_id);

    res.status(200).json({
      success: true,
      message: `Stage ${stage.stage_number} marked as completed.`,
      stageId,
      status: 'COMPLETED',
      stats
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. TASK ASSIGNMENT & SUBMISSION ENDPOINTS
// ============================================================================

// GET /api/learning/tasks/:taskId
exports.getTaskById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.taskId, 10);

    const [tasks] = await pool.query(`
      SELECT 
        lt.*,
        ls.stage_number,
        ls.stage_title,
        ls.module_id,
        COALESCE(uta.assignment_status, 'ASSIGNED') AS assignment_status,
        uta.started_at,
        uta.submitted_at,
        uta.completed_at
      FROM learning_tasks lt
      JOIN learning_stages ls ON lt.stage_id = ls.id
      LEFT JOIN user_task_assignments uta ON lt.id = uta.task_id AND uta.user_id = ?
      WHERE lt.id = ?
    `, [userId, taskId]);

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const task = tasks[0];

    // Fetch submissions history
    const [submissions] = await pool.query(`
      SELECT uts.*, ta.marks_awarded, ta.feedback, ta.assessment_status, ta.assessed_at
      FROM user_task_submissions uts
      LEFT JOIN task_assessments ta ON uts.id = ta.submission_id
      WHERE uts.task_id = ? AND uts.user_id = ?
      ORDER BY uts.submission_version DESC
    `, [taskId, userId]);

    res.status(200).json({
      success: true,
      task,
      submissions
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/tasks/:taskId/start
exports.startTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.taskId, 10);

    const [tasks] = await pool.query('SELECT id, stage_id FROM learning_tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    const stageId = tasks[0].stage_id;

    // Ensure task assignment exists
    await pool.query(`
      INSERT INTO user_task_assignments (user_id, task_id, assignment_status, started_at)
      VALUES (?, ?, 'IN_PROGRESS', NOW())
      ON DUPLICATE KEY UPDATE 
        assignment_status = IF(assignment_status = 'ASSIGNED', 'IN_PROGRESS', assignment_status),
        started_at = IF(started_at IS NULL, NOW(), started_at),
        updated_at = NOW()
    `, [userId, taskId]);

    // Ensure stage progress is at least IN_PROGRESS
    await pool.query(`
      INSERT INTO user_stage_progress (user_id, stage_id, completion_status, started_at)
      VALUES (?, ?, 'IN_PROGRESS', NOW())
      ON DUPLICATE KEY UPDATE 
        completion_status = IF(completion_status = 'NOT_STARTED', 'IN_PROGRESS', completion_status),
        started_at = IF(started_at IS NULL, NOW(), started_at),
        updated_at = NOW()
    `, [userId, stageId]);

    res.status(200).json({
      success: true,
      message: 'Task started.',
      taskId,
      status: 'IN_PROGRESS'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/tasks/:taskId/submit
exports.submitTask = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const taskId = parseInt(req.params.taskId, 10);
    const { submission_type, text_response, quiz_answers, duration_seconds, metadata } = req.body;

    const [tasks] = await conn.query('SELECT * FROM learning_tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    const task = tasks[0];

    // Determine submission version
    const [existingSubs] = await conn.query(
      'SELECT COALESCE(MAX(submission_version), 0) AS max_v FROM user_task_submissions WHERE user_id = ? AND task_id = ?',
      [userId, taskId]
    );
    const nextVersion = (existingSubs[0].max_v || 0) + 1;

    const subType = submission_type || (task.task_type === 'quiz' ? 'quiz' : (task.task_type === 'reading' ? 'reading' : 'text'));

    // Insert submission record
    const [subResult] = await conn.query(`
      INSERT INTO user_task_submissions 
        (user_id, task_id, submission_type, text_response, quiz_answers, duration_seconds, metadata, submission_version, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      userId,
      taskId,
      subType,
      text_response || null,
      quiz_answers ? JSON.stringify(quiz_answers) : null,
      duration_seconds ? parseInt(duration_seconds, 10) : null,
      metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      nextVersion
    ]);
    const submissionId = subResult.insertId;

    // Handle initial scoring & assessment status based on task type
    let assessmentStatus = 'AWAITING_REVIEW';
    let marksAwarded = null;
    let feedback = 'Your submission has been received and logged to the learning system.';
    let isCompleted = false;

    if (task.task_type === 'reading') {
      assessmentStatus = 'COMPLETED';
      marksAwarded = task.maximum_marks;
      feedback = 'Reading task completed successfully. Key anatomical and vocal concepts verified.';
      isCompleted = true;
    } else if (task.task_type === 'quiz') {
      assessmentStatus = 'COMPLETED';
      marksAwarded = task.maximum_marks;
      feedback = 'Diagnostic self-check complete. Habits recorded for vocal calibration.';
      isCompleted = true;
    } else if (task.task_type === 'breathing_exercise' || task.task_type === 'timed_practice') {
      assessmentStatus = 'COMPLETED';
      marksAwarded = task.maximum_marks;
      feedback = 'Practice session completed and recorded to MySQL practice journal.';
      isCompleted = true;
    }

    const percentage = marksAwarded !== null && task.maximum_marks > 0
      ? ((marksAwarded / task.maximum_marks) * 100).toFixed(2)
      : null;

    // Insert task_assessments entry
    await conn.query(`
      INSERT INTO task_assessments 
        (submission_id, task_id, user_id, maximum_marks, marks_awarded, percentage, feedback, assessment_status, assessed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${isCompleted ? 'NOW()' : 'NULL'})
    `, [
      submissionId,
      taskId,
      userId,
      task.maximum_marks,
      marksAwarded,
      percentage,
      feedback,
      assessmentStatus
    ]);

    // Update user_task_assignments
    const nextAssignmentStatus = isCompleted ? 'COMPLETED' : 'SUBMITTED';
    await conn.query(`
      INSERT INTO user_task_assignments (user_id, task_id, assignment_status, submitted_at, completed_at)
      VALUES (?, ?, ?, NOW(), ${isCompleted ? 'NOW()' : 'NULL'})
      ON DUPLICATE KEY UPDATE 
        assignment_status = ?,
        submitted_at = NOW(),
        completed_at = ${isCompleted ? 'NOW()' : 'completed_at'},
        updated_at = NOW()
    `, [userId, taskId, nextAssignmentStatus, nextAssignmentStatus]);

    // Update parent stage progress
    const [allStageTasks] = await conn.query('SELECT id, is_required FROM learning_tasks WHERE stage_id = ?', [task.stage_id]);
    const [completedTasks] = await conn.query(`
      SELECT task_id, assignment_status 
      FROM user_task_assignments 
      WHERE user_id = ? AND task_id IN (${allStageTasks.map(t => t.id).join(',')})
    `, [userId]);

    const compCount = completedTasks.filter(ct => ct.assignment_status === 'COMPLETED').length;
    const subCount = completedTasks.filter(ct => ct.assignment_status === 'SUBMITTED').length;

    let nextStageStatus = 'IN_PROGRESS';
    if (compCount === allStageTasks.length && allStageTasks.length > 0) {
      nextStageStatus = 'COMPLETED';
    } else if (subCount > 0 || compCount > 0) {
      nextStageStatus = isCompleted ? (compCount === allStageTasks.length ? 'COMPLETED' : 'IN_PROGRESS') : 'SUBMITTED';
    }

    await conn.query(`
      INSERT INTO user_stage_progress (user_id, stage_id, completion_status, progress_percentage, updated_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        completion_status = ?,
        progress_percentage = IF(? = 'COMPLETED', 100.00, progress_percentage),
        completed_at = IF(? = 'COMPLETED' AND completed_at IS NULL, NOW(), completed_at),
        updated_at = NOW()
    `, [
      userId,
      task.stage_id,
      nextStageStatus,
      nextStageStatus === 'COMPLETED' ? 100.00 : 50.00,
      nextStageStatus,
      nextStageStatus,
      nextStageStatus
    ]);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Task submitted successfully.',
      submissionId,
      version: nextVersion,
      taskStatus: nextAssignmentStatus,
      stageStatus: nextStageStatus,
      assessment: {
        status: assessmentStatus,
        marksAwarded,
        maximumMarks: task.maximum_marks,
        percentage,
        feedback
      }
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// POST /api/learning/tasks/:taskId/audio
exports.uploadAudioTask = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const taskId = parseInt(req.params.taskId, 10);

    if (!req.file) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Audio file is required.' });
    }

    const [tasks] = await conn.query('SELECT * FROM learning_tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    const task = tasks[0];

    // Determine submission version
    const [existingSubs] = await conn.query(
      'SELECT COALESCE(MAX(submission_version), 0) AS max_v FROM user_task_submissions WHERE user_id = ? AND task_id = ?',
      [userId, taskId]
    );
    const nextVersion = (existingSubs[0].max_v || 0) + 1;

    const fileRef = `/uploads/audio/${req.file.filename}`;
    const durationSeconds = req.body.duration_seconds ? parseInt(req.body.duration_seconds, 10) : null;
    const metadata = req.body.metadata ? (typeof req.body.metadata === 'string' ? req.body.metadata : JSON.stringify(req.body.metadata)) : null;

    // Insert submission record
    const [subResult] = await conn.query(`
      INSERT INTO user_task_submissions 
        (user_id, task_id, submission_type, text_response, file_reference, original_file_name, file_size_bytes, mime_type, duration_seconds, metadata, submission_version, submitted_at)
      VALUES (?, ?, 'audio', ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      userId,
      taskId,
      req.body.notes || 'Song Phrase Breathing Audio Demonstration',
      fileRef,
      req.file.originalname,
      req.file.size,
      req.file.mimetype,
      durationSeconds,
      metadata,
      nextVersion
    ]);
    const submissionId = subResult.insertId;

    // Insert task_assessments entry (Awaiting Teacher/Admin Review)
    await conn.query(`
      INSERT INTO task_assessments 
        (submission_id, task_id, user_id, maximum_marks, marks_awarded, percentage, feedback, assessment_status)
      VALUES (?, ?, ?, ?, NULL, NULL, 'Recording uploaded. Awaiting teacher review and grading.', 'AWAITING_REVIEW')
    `, [
      submissionId,
      taskId,
      userId,
      task.maximum_marks
    ]);

    // Update user_task_assignments to SUBMITTED
    await conn.query(`
      INSERT INTO user_task_assignments (user_id, task_id, assignment_status, submitted_at)
      VALUES (?, ?, 'SUBMITTED', NOW())
      ON DUPLICATE KEY UPDATE 
        assignment_status = 'SUBMITTED',
        submitted_at = NOW(),
        updated_at = NOW()
    `, [userId, taskId]);

    // Update stage progress to SUBMITTED
    await conn.query(`
      INSERT INTO user_stage_progress (user_id, stage_id, completion_status, progress_percentage, updated_at)
      VALUES (?, ?, 'SUBMITTED', 75.00, NOW())
      ON DUPLICATE KEY UPDATE 
        completion_status = 'SUBMITTED',
        updated_at = NOW()
    `, [userId, task.stage_id]);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Audio demonstration submitted for instructor evaluation.',
      submissionId,
      version: nextVersion,
      fileReference: fileRef,
      originalName: req.file.originalname,
      sizeBytes: req.file.size,
      status: 'SUBMITTED'
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// GET /api/learning/submissions/:submissionId/audio
exports.streamSubmissionAudio = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const submissionId = parseInt(req.params.submissionId, 10);

    const [subs] = await pool.query(
      'SELECT id, user_id, file_reference, original_file_name, mime_type FROM user_task_submissions WHERE id = ?',
      [submissionId]
    );

    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Audio submission not found.' });
    }

    const sub = subs[0];

    // Authorization check: Only submission owner or ADMIN / SUPERADMIN can stream
    if (sub.user_id !== userId && userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied to this audio submission.' });
    }

    if (!sub.file_reference) {
      return res.status(404).json({ success: false, message: 'No audio file associated with this submission.' });
    }

    const filename = path.basename(sub.file_reference);
    const fullPath = path.resolve(__dirname, '../uploads/audio', filename);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'Audio file not found on server.' });
    }

    const stat = fs.statSync(fullPath);
    const range = req.headers.range;

    const mime = sub.mime_type || 'audio/webm';

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(fullPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mime,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': stat.size,
        'Content-Type': mime,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      };
      res.writeHead(200, head);
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/tasks/:taskId/submissions
exports.getTaskSubmissions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.taskId, 10);

    const [submissions] = await pool.query(`
      SELECT 
        uts.*,
        ta.marks_awarded,
        ta.maximum_marks,
        ta.percentage,
        ta.feedback,
        ta.improvement_suggestions,
        ta.assessment_status,
        ta.assessed_at
      FROM user_task_submissions uts
      LEFT JOIN task_assessments ta ON uts.id = ta.submission_id
      WHERE uts.task_id = ? AND uts.user_id = ?
      ORDER BY uts.submission_version DESC
    `, [taskId, userId]);

    res.status(200).json({
      success: true,
      submissions
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/tasks/:taskId/score
exports.getTaskScore = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.taskId, 10);

    const [assessments] = await pool.query(`
      SELECT 
        ta.*,
        u.username AS assessor_name,
        lt.task_title,
        lt.maximum_marks AS task_max_marks
      FROM task_assessments ta
      JOIN learning_tasks lt ON ta.task_id = lt.id
      LEFT JOIN users u ON ta.assessed_by = u.id
      WHERE ta.task_id = ? AND ta.user_id = ?
      ORDER BY ta.id DESC LIMIT 1
    `, [taskId, userId]);

    if (assessments.length === 0) {
      return res.status(200).json({
        success: true,
        score: {
          assessment_status: 'NOT_SUBMITTED',
          marks_awarded: null,
          maximum_marks: 100,
          percentage: null,
          feedback: null
        }
      });
    }

    res.status(200).json({
      success: true,
      score: assessments[0]
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/progress
exports.getProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Module 01 stats
    const [mod1] = await pool.query('SELECT id FROM learning_modules WHERE module_order = 1 LIMIT 1');
    const moduleId = mod1.length > 0 ? mod1[0].id : 1;

    const stats = await calculateModuleStats(userId, moduleId);

    const [stages] = await pool.query(`
      SELECT 
        ls.id,
        ls.stage_number,
        ls.stage_title,
        ls.stage_subtitle,
        COALESCE(usp.completion_status, 'NOT_STARTED') AS completion_status,
        usp.completed_at
      FROM learning_stages ls
      LEFT JOIN user_stage_progress usp ON ls.id = usp.stage_id AND usp.user_id = ?
      WHERE ls.module_id = ?
      ORDER BY ls.stage_number ASC
    `, [userId, moduleId]);

    res.status(200).json({
      success: true,
      stats,
      stages
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/progress/:moduleId
exports.getModuleProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = parseInt(req.params.moduleId, 10);

    const stats = await calculateModuleStats(userId, moduleId);

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

// Legacy support: lessons
exports.getLessons = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT l.id, l.title, l.description, l.category, l.video_url, l.created_at,
              COALESCE(ulp.completion_status, 'not_started') AS user_status,
              ulp.completed_at
       FROM lessons l
       LEFT JOIN user_lesson_progress ulp ON l.id = ulp.lesson_id AND ulp.user_id = ?
       ORDER BY l.category ASC, l.id ASC`,
      [userId]
    );
    res.status(200).json({ success: true, lessons: rows });
  } catch (error) {
    next(error);
  }
};

exports.toggleLessonComplete = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.body;
    if (!lessonId) return res.status(400).json({ success: false, message: 'Lesson ID required' });

    const [existing] = await pool.query(
      'SELECT id FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
      [userId, lessonId]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM user_lesson_progress WHERE id = ?', [existing[0].id]);
      return res.status(200).json({ success: true, isCompleted: false });
    } else {
      await pool.query(
        'INSERT INTO user_lesson_progress (user_id, lesson_id, completion_status, completed_at) VALUES (?, ?, "completed", NOW())',
        [userId, lessonId]
      );
      return res.status(200).json({ success: true, isCompleted: true });
    }
  } catch (error) {
    next(error);
  }
};
