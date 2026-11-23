const pool = require('../config/db');

// Exact 6 practice checklist activities as required
const DEFAULT_PRACTICE_ACTIVITIES = [
  {
    key: 'vocal_warmup',
    title: 'Vocal Warm-up',
    durationLabel: '5 min',
    durationMinutes: 5,
    repsLabel: '1 round',
    displayOrder: 1
  },
  {
    key: 'posture_breathing_simulation',
    title: 'Posture & Breathing Simulation',
    durationLabel: '5 min',
    durationMinutes: 5,
    repsLabel: '3 cycles',
    displayOrder: 2
  },
  {
    key: 'hiss_exhalation',
    title: 'Hiss Exhalation Practice',
    durationLabel: '3 min',
    durationMinutes: 3,
    repsLabel: '5 repetitions',
    displayOrder: 3
  },
  {
    key: 'song_practice_recording',
    title: 'Song Practice & Recording',
    durationLabel: '10 min',
    durationMinutes: 10,
    repsLabel: '2 rounds',
    displayOrder: 4
  },
  {
    key: 'journal_kanban_tracker',
    title: 'Practice Journal & Kanban Tracker',
    durationLabel: '3 min',
    durationMinutes: 3,
    repsLabel: '1 entry',
    displayOrder: 5
  },
  {
    key: 'vocal_cooldown',
    title: 'Vocal Cool-down – Gentle Sighs',
    durationLabel: '2 min',
    durationMinutes: 2,
    repsLabel: '5 repetitions',
    displayOrder: 6
  }
];

// ============================================================================
// 1. PRACTICE COMMITMENT (Section 1)
// ============================================================================

// GET /api/practice/commitment
exports.getCommitment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = 1;

    // Fetch active commitment
    const [commitments] = await pool.query(`
      SELECT id, user_id, module_id, minutes_per_session, sessions_per_week, weekly_minutes, is_active, created_at, updated_at
      FROM student_practice_commitments
      WHERE user_id = ? AND module_id = ? AND is_active = TRUE
      ORDER BY id DESC LIMIT 1
    `, [userId, moduleId]);

    let commitment = null;
    let selectedActivityKeys = [];

    if (commitments.length > 0) {
      commitment = commitments[0];

      // Fetch saved checklist selections
      const [savedActs] = await pool.query(`
        SELECT activity_key, is_selected
        FROM student_commitment_activities
        WHERE commitment_id = ?
      `, [commitment.id]);

      if (savedActs.length > 0) {
        selectedActivityKeys = savedActs
          .filter(a => Boolean(a.is_selected))
          .map(a => a.activity_key);
      }
    }

    // Fetch completed practice activities
    const [completions] = await pool.query(`
      SELECT activity_key, completion_status, completed_at
      FROM student_practice_activity_completions
      WHERE user_id = ? AND module_id = ? AND completion_status = 'completed'
    `, [userId, moduleId]);

    const completedKeyMap = {};
    completions.forEach(c => {
      completedKeyMap[c.activity_key] = c.completed_at;
    });

    const activitiesList = DEFAULT_PRACTICE_ACTIVITIES.map(act => ({
      ...act,
      isSelected: selectedActivityKeys.includes(act.key),
      isCompleted: Boolean(completedKeyMap[act.key]),
      completedAt: completedKeyMap[act.key] || null
    }));

    res.status(200).json({
      success: true,
      hasCommitment: Boolean(commitment),
      commitment: commitment,
      activities: activitiesList
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/practice/commitment & PUT /api/practice/commitment
exports.saveCommitment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = 1;
    let { minutes_per_session, sessions_per_week, selected_activities } = req.body;

    // Validate inputs
    const minPerSession = Math.max(1, Math.min(240, parseInt(minutes_per_session, 10) || 10));
    const sessPerWeek = Math.max(1, Math.min(7, parseInt(sessions_per_week, 10) || 4));
    const weeklyMinutes = minPerSession * sessPerWeek;

    // Normalize selected activities
    let selectedKeys = [];
    if (Array.isArray(selected_activities)) {
      selectedKeys = selected_activities.map(k => typeof k === 'object' ? k.key : String(k));
    } else {
      selectedKeys = [];
    }

    // Check existing active commitment
    const [existing] = await pool.query(`
      SELECT id FROM student_practice_commitments
      WHERE user_id = ? AND module_id = ? AND is_active = TRUE
      LIMIT 1
    `, [userId, moduleId]);

    let commitmentId;
    if (existing.length > 0) {
      commitmentId = existing[0].id;
      await pool.query(`
        UPDATE student_practice_commitments
        SET minutes_per_session = ?, sessions_per_week = ?, weekly_minutes = ?, updated_at = NOW()
        WHERE id = ?
      `, [minPerSession, sessPerWeek, weeklyMinutes, commitmentId]);
    } else {
      const [insertRes] = await pool.query(`
        INSERT INTO student_practice_commitments (user_id, module_id, minutes_per_session, sessions_per_week, weekly_minutes, is_active)
        VALUES (?, ?, ?, ?, ?, TRUE)
      `, [userId, moduleId, minPerSession, sessPerWeek, weeklyMinutes]);
      commitmentId = insertRes.insertId;
    }

    // Sync with user_practice_goals for Dashboard integration
    await pool.query(`
      INSERT INTO user_practice_goals (user_id, weekly_target_minutes, updated_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE weekly_target_minutes = VALUES(weekly_target_minutes), updated_at = NOW()
    `, [userId, weeklyMinutes]);

    // Save checklist items in student_commitment_activities
    await pool.query('DELETE FROM student_commitment_activities WHERE commitment_id = ?', [commitmentId]);
    for (const act of DEFAULT_PRACTICE_ACTIVITIES) {
      const isSelected = selectedKeys.includes(act.key);
      await pool.query(`
        INSERT INTO student_commitment_activities (commitment_id, user_id, activity_key, activity_title, duration_label, repetitions_label, is_selected)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [commitmentId, userId, act.key, act.title, act.durationLabel, act.repsLabel, isSelected]);
    }

    // =========================================================================
    // AUTOMATIC SESSION GENERATION IN LEARNING JOURNAL (Requirement 2.A)
    // =========================================================================
    // Generate planned sessions matching sessions_per_week without duplicating or deleting completed/practising sessions.
    const [existingSessions] = await pool.query(`
      SELECT id, session_number, status, planned_duration, session_title
      FROM student_practice_sessions
      WHERE user_id = ?
      ORDER BY session_number ASC, id ASC
    `, [userId]);

    const completedOrPractising = existingSessions.filter(s => s.status === 'done' || s.status === 'practising');
    const existingPlanned = existingSessions.filter(s => s.status === 'planned');

    const activeCount = completedOrPractising.length;
    const neededPlannedCount = Math.max(0, sessPerWeek - activeCount);

    // Update existing planned sessions to new duration
    for (let i = 0; i < existingPlanned.length; i++) {
      if (i < neededPlannedCount) {
        // Keep and update duration
        await pool.query(`
          UPDATE student_practice_sessions
          SET planned_duration = ?, session_title = ?
          WHERE id = ?
        `, [minPerSession, `Session ${existingPlanned[i].session_number} – ${minPerSession} min`, existingPlanned[i].id]);
      } else {
        // Excess planned sessions above updated commitment limit: remove safely
        await pool.query('DELETE FROM student_practice_sessions WHERE id = ?', [existingPlanned[i].id]);
      }
    }

    // If more planned sessions are needed, generate them
    const currentPlannedCount = Math.min(existingPlanned.length, neededPlannedCount);
    const toCreateCount = neededPlannedCount - currentPlannedCount;

    if (toCreateCount > 0) {
      // Find highest existing session number
      const maxSessionNum = existingSessions.length > 0
        ? Math.max(...existingSessions.map(s => s.session_number || 0))
        : 0;

      for (let k = 1; k <= toCreateCount; k++) {
        const sessionNum = maxSessionNum + k;
        const sessionTitle = `Session ${sessionNum} – ${minPerSession} min`;
        await pool.query(`
          INSERT INTO student_practice_sessions (
            user_id, commitment_id, session_number, session_title, activity, planned_duration, status
          ) VALUES (?, ?, ?, ?, 'Breath Routine & Song Vocalization', ?, 'planned')
        `, [userId, commitmentId, sessionNum, sessionTitle, minPerSession]);
      }
    }

    // Check Stage 5 progress update
    await updateStageFiveProgress(userId);

    res.status(200).json({
      success: true,
      message: 'Practice commitment saved successfully! Learning Journal sessions generated.',
      commitment: {
        id: commitmentId,
        user_id: userId,
        module_id: moduleId,
        minutes_per_session: minPerSession,
        sessions_per_week: sessPerWeek,
        weekly_minutes: weeklyMinutes
      }
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 2. LEARNING JOURNAL KANBAN SESSIONS (Section 2)
// ============================================================================

// GET /api/practice/sessions
exports.getPracticeSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [sessions] = await pool.query(`
      SELECT id, user_id, commitment_id, session_number, session_title, activity,
             planned_duration, actual_duration, scheduled_date, week_identifier,
             status, notes, started_at, completed_at, created_at, updated_at
      FROM student_practice_sessions
      WHERE user_id = ?
      ORDER BY session_number ASC, id ASC
    `, [userId]);

    res.status(200).json({
      success: true,
      sessions
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/practice/sessions (Add Manual Session, Requirement 2.C)
exports.addManualSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { session_title, activity, planned_duration, scheduled_date, notes } = req.body;

    const [maxNumRows] = await pool.query(`
      SELECT COALESCE(MAX(session_number), 0) AS max_num FROM student_practice_sessions WHERE user_id = ?
    `, [userId]);
    const nextSessionNum = (maxNumRows[0]?.max_num || 0) + 1;

    const duration = Math.max(1, parseInt(planned_duration, 10) || 10);
    const title = (session_title || '').trim() || `Session ${nextSessionNum} – ${duration} min`;
    const act = (activity || '').trim() || 'Custom Practice Routine';

    const [insertRes] = await pool.query(`
      INSERT INTO student_practice_sessions (
        user_id, commitment_id, session_number, session_title, activity,
        planned_duration, scheduled_date, status, notes
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, 'planned', ?)
    `, [userId, nextSessionNum, title, act, duration, scheduled_date || null, notes || null]);

    const [newSession] = await pool.query('SELECT * FROM student_practice_sessions WHERE id = ?', [insertRes.insertId]);

    res.status(201).json({
      success: true,
      message: 'New practice session added to planned column.',
      session: newSession[0]
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/practice/sessions/:id/status (Drag & drop or button move, Requirement 2.B & 2.D)
exports.updateSessionStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id, 10);
    const { status, actual_duration, notes } = req.body;

    const validStatuses = ['planned', 'practising', 'done'];
    const cleanStatus = String(status).toLowerCase();
    if (!validStatuses.includes(cleanStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be planned, practising, or done.' });
    }

    // Verify student ownership
    const [existing] = await pool.query(`
      SELECT * FROM student_practice_sessions WHERE id = ? AND user_id = ?
    `, [sessionId, userId]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found or unauthorised.' });
    }

    const current = existing[0];
    let startedAt = current.started_at;
    let completedAt = current.completed_at;

    // Safely parse actual duration (preventing any NaN)
    let actualDur = current.actual_duration || null;
    if (actual_duration !== undefined && actual_duration !== null) {
      const parsed = parseInt(actual_duration, 10);
      if (!isNaN(parsed) && parsed > 0) {
        actualDur = parsed;
      }
    }

    if (cleanStatus === 'practising' && !startedAt) {
      startedAt = new Date();
    }

    if (cleanStatus === 'done') {
      if (!completedAt) completedAt = new Date();
      if (!actualDur || actualDur <= 0) actualDur = current.planned_duration || 10;

      // Anti-Tamper & Duplicate Prevention: Only insert into practice_sessions if this session was NOT ALREADY marked 'done'
      if (current.status !== 'done') {
        const durationSeconds = actualDur * 60;
        await pool.query(`
          INSERT INTO practice_sessions (
            user_id, session_type, exercise_name, duration_minutes, duration_seconds,
            session_status, completion_status, notes, completed_at
          ) VALUES (?, 'Learning Journal', ?, ?, ?, 'completed', 'completed', ?, NOW())
        `, [userId, current.activity || current.session_title, actualDur, durationSeconds, notes || current.notes || 'Completed via Learning Journal Kanban']);
      }

      // Automatically mark journal_kanban_tracker activity as completed
      await pool.query(`
        INSERT INTO student_practice_activity_completions (user_id, module_id, activity_key, completion_status, completed_at, session_id)
        VALUES (?, 1, 'journal_kanban_tracker', 'completed', NOW(), ?)
        ON DUPLICATE KEY UPDATE completion_status = 'completed', completed_at = NOW(), session_id = ?
      `, [userId, sessionId, sessionId]);
    } else if (cleanStatus === 'planned') {
      completedAt = null;
    }

    await pool.query(`
      UPDATE student_practice_sessions
      SET status = ?, actual_duration = ?, started_at = ?, completed_at = ?, notes = COALESCE(?, notes), updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [cleanStatus, actualDur, startedAt, completedAt, notes || null, sessionId, userId]);

    // Recalculate Stage 5 and Module progress
    await updateStageFiveProgress(userId);

    const [updated] = await pool.query('SELECT * FROM student_practice_sessions WHERE id = ?', [sessionId]);

    res.status(200).json({
      success: true,
      message: `Session moved to ${cleanStatus.toUpperCase()}`,
      session: updated[0]
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/practice/sessions/:id
exports.updateSessionDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id, 10);
    const { session_title, activity, planned_duration, scheduled_date, notes } = req.body;

    const [existing] = await pool.query('SELECT id FROM student_practice_sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    await pool.query(`
      UPDATE student_practice_sessions
      SET session_title = COALESCE(?, session_title),
          activity = COALESCE(?, activity),
          planned_duration = COALESCE(?, planned_duration),
          scheduled_date = COALESCE(?, scheduled_date),
          notes = COALESCE(?, notes),
          updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [session_title || null, activity || null, planned_duration || null, scheduled_date || null, notes || null, sessionId, userId]);

    const [updated] = await pool.query('SELECT * FROM student_practice_sessions WHERE id = ?', [sessionId]);
    res.status(200).json({ success: true, session: updated[0] });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 3. ACTIVITY COMPLETIONS TRACKER (Requirement 3.C)
// ============================================================================

// POST /api/practice/activities/:activityKey/complete
exports.completePracticeActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const activityKey = String(req.params.activityKey).trim();
    const moduleId = 1;

    const validKeys = DEFAULT_PRACTICE_ACTIVITIES.map(a => a.key);
    if (!validKeys.includes(activityKey)) {
      return res.status(400).json({ success: false, message: `Unknown activity key: ${activityKey}` });
    }

    await pool.query(`
      INSERT INTO student_practice_activity_completions (user_id, module_id, activity_key, completion_status, completed_at)
      VALUES (?, ?, ?, 'completed', NOW())
      ON DUPLICATE KEY UPDATE completion_status = 'completed', completed_at = NOW()
    `, [userId, moduleId, activityKey]);

    res.status(200).json({
      success: true,
      message: `Practice activity "${activityKey}" marked as completed.`,
      activityKey
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 4. MODULE 1 COMPLETION SUMMARY & THREE CIRCLES (Section 3 & Requirement 3)
// ============================================================================

// GET /api/modules/1/completion-summary & GET /api/modules/1/progress
exports.getModuleCompletionSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = 1;

    const summary = await calculateModuleCompletion(userId, moduleId);

    res.status(200).json({
      success: true,
      ...summary
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 5. SEQUENTIAL STAGE UNLOCK STATUS (Requirement 4)
// ============================================================================

// GET /api/learning/stages/unlock-status
exports.getStagesUnlockStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = 1;

    const [stages] = await pool.query(`
      SELECT id, stage_number, COALESCE(title, stage_title) AS title, COALESCE(subtitle, stage_subtitle) AS subtitle
      FROM learning_stages
      WHERE is_active = TRUE
      ORDER BY stage_number ASC
      LIMIT 5
    `);

    const fiveStageCtrl = require('./fiveStageLearningController');
    const getUserStageStatus = fiveStageCtrl.getUserStageStatus;

    let prevCompleted = true;
    const unlockStatus = {};
    const stagesList = [];

    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      let isCompleted = false;
      let status = 'NOT STARTED';
      let progressPercent = 0;

      if (typeof getUserStageStatus === 'function') {
        const prog = await getUserStageStatus(userId, st.id, st.stage_number);
        isCompleted = prog.status === 'COMPLETED' || prog.isComplete;
        status = prog.status;
        progressPercent = prog.progressPercentage;
      }

      const isUnlocked = i === 0 ? true : prevCompleted;
      unlockStatus[st.stage_number] = isUnlocked;

      stagesList.push({
        id: st.id,
        stage_number: st.stage_number,
        title: st.title,
        subtitle: st.subtitle,
        status,
        progress_percentage: progressPercent,
        is_unlocked: isUnlocked,
        is_completed: isCompleted
      });

      prevCompleted = prevCompleted && isCompleted;
    }

    res.status(200).json({
      success: true,
      unlockStatus,
      stages: stagesList
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// 6. ADMIN PRACTICE COMMITMENTS VIEW (Requirement 10)
// ============================================================================

// GET /api/admin/practice-commitments
exports.getAdminPracticeCommitments = async (req, res, next) => {
  try {
    const { studentId, search, startDate, endDate } = req.query;

    let whereClause = "WHERE u.role = 'USER' AND u.email NOT LIKE '%example.com' AND u.email NOT LIKE '%dummy%' AND u.username NOT LIKE 'Aria_%' AND u.username NOT LIKE 'Baritone_%' AND u.username NOT LIKE 'Assistant_%' AND u.username NOT LIKE 'vocal_%' AND u.username NOT LIKE 'mod_user_%' AND u.username NOT LIKE 'test_%'";
    const params = [];

    if (studentId) {
      whereClause += ' AND u.id = ?';
      params.push(parseInt(studentId, 10));
    }
    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (startDate) {
      whereClause += ' AND spc.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND spc.created_at <= ?';
      params.push(endDate);
    }

    const [rows] = await pool.query(`
      SELECT 
        u.id AS student_id,
        u.username AS student_name,
        u.email AS student_email,
        spc.id AS commitment_id,
        spc.minutes_per_session,
        spc.sessions_per_week,
        spc.weekly_minutes,
        spc.is_active AS commitment_active,
        spc.created_at AS commitment_date,
        (SELECT COUNT(*) FROM student_practice_sessions WHERE user_id = u.id) AS total_sessions,
        (SELECT COUNT(*) FROM student_practice_sessions WHERE user_id = u.id AND status = 'planned') AS planned_sessions,
        (SELECT COUNT(*) FROM student_practice_sessions WHERE user_id = u.id AND status = 'practising') AS practising_sessions,
        (SELECT COUNT(*) FROM student_practice_sessions WHERE user_id = u.id AND status = 'done') AS done_sessions,
        (SELECT COUNT(*) FROM student_commitment_activities WHERE user_id = u.id AND is_selected = TRUE) AS selected_activities_count,
        (SELECT COUNT(*) FROM student_practice_activity_completions WHERE user_id = u.id AND completion_status = 'completed') AS completed_activities_count
      FROM users u
      LEFT JOIN student_practice_commitments spc ON u.id = spc.user_id AND spc.is_active = TRUE
      ${whereClause}
      ORDER BY u.username ASC
    `, params);

    // Enrich with calculated module summaries
    const commitments = await Promise.all(rows.map(async (row) => {
      const summary = await calculateModuleCompletion(row.student_id, 1);
      return {
        ...row,
        lessonsPercentage: summary.lessons.percentage,
        journalPercentage: summary.journal.percentage,
        practicePercentage: summary.practice.percentage,
        overallPercentage: summary.module.overallPercentage,
        isModuleComplete: summary.module.isComplete,
        moduleStatus: summary.module.status
      };
    }));

    res.status(200).json({
      success: true,
      count: commitments.length,
      commitments
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function updateStageFiveProgress(userId) {
  try {
    const [commitments] = await pool.query(
      'SELECT id FROM student_practice_commitments WHERE user_id = ? AND is_active = TRUE LIMIT 1',
      [userId]
    );
    const hasCommitment = commitments.length > 0;

    const [doneSessions] = await pool.query(
      "SELECT id FROM student_practice_sessions WHERE user_id = ? AND status = 'done' LIMIT 1",
      [userId]
    );
    const hasDoneSession = doneSessions.length > 0;

    const met = (hasCommitment ? 1 : 0) + (hasDoneSession ? 1 : 0);
    const percent = Math.round((met / 2) * 100);
    const status = percent === 100 ? 'COMPLETED' : percent > 0 ? 'IN PROGRESS' : 'NOT STARTED';

    await pool.query(`
      INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at, completed_at)
      VALUES (?, 5, ?, ?, IF(? IN ('IN PROGRESS', 'COMPLETED'), NOW(), NULL), IF(? = 'COMPLETED', NOW(), NULL))
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        progress_percentage = VALUES(progress_percentage),
        started_at = IF(started_at IS NULL AND VALUES(status) IN ('IN PROGRESS', 'COMPLETED'), NOW(), started_at),
        completed_at = IF(VALUES(status) = 'COMPLETED', COALESCE(completed_at, NOW()), NULL)
    `, [userId, status, percent, status, status]);
  } catch (e) {
    console.error('Error updating stage 5 progress:', e);
  }
}

async function calculateModuleCompletion(userId, moduleId = 1) {
  // A. LESSONS PROGRESS (Stages 1-5 completion)
  const [stages] = await pool.query(
    'SELECT id, stage_number FROM learning_stages WHERE is_active = TRUE ORDER BY stage_number ASC LIMIT 5'
  );

  const fiveStageCtrl = require('./fiveStageLearningController');
  const getUserStageStatus = fiveStageCtrl.getUserStageStatus;

  let completedStagesCount = 0;
  const stageStatuses = [];

  for (const st of stages) {
    let isComp = false;
    let progPercent = 0;
    if (typeof getUserStageStatus === 'function') {
      const prog = await getUserStageStatus(userId, st.id, st.stage_number);
      isComp = prog.status === 'COMPLETED' || prog.isComplete;
      progPercent = prog.progressPercentage;
    } else {
      const [p] = await pool.query(
        'SELECT status, progress_percentage FROM learning_stage_progress WHERE user_id = ? AND stage_id = ?',
        [userId, st.id]
      );
      isComp = p[0]?.status === 'COMPLETED';
      progPercent = parseFloat(p[0]?.progress_percentage || 0);
    }

    if (isComp) completedStagesCount++;
    stageStatuses.push({
      stage_number: st.stage_number,
      isCompleted: isComp,
      progressPercentage: progPercent
    });
  }

  const totalStages = stages.length || 5;
  const lessonsPercentage = Math.round((completedStagesCount / totalStages) * 100);

  // B. JOURNAL PROGRESS (Completed sessions / Total generated sessions * 100)
  const [sessionRows] = await pool.query(`
    SELECT 
      COUNT(*) AS total_sessions,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done_sessions,
      SUM(CASE WHEN status = 'practising' THEN 1 ELSE 0 END) AS practising_sessions,
      SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) AS planned_sessions
    FROM student_practice_sessions
    WHERE user_id = ?
  `, [userId]);

  const totalSessions = parseInt(sessionRows[0]?.total_sessions || 0, 10);
  const doneSessions = parseInt(sessionRows[0]?.done_sessions || 0, 10);
  const practisingSessions = parseInt(sessionRows[0]?.practising_sessions || 0, 10);
  const plannedSessions = parseInt(sessionRows[0]?.planned_sessions || 0, 10);

  let journalPercentage = 0;
  if (totalSessions > 0) {
    journalPercentage = Math.round((doneSessions / totalSessions) * 100);
  }

  // C. PRACTICE PROGRESS (6 Practice Checklist Activities)
  const [completions] = await pool.query(`
    SELECT activity_key, completion_status, completed_at
    FROM student_practice_activity_completions
    WHERE user_id = ? AND module_id = ? AND completion_status = 'completed'
  `, [userId, moduleId]);

  const completedMap = {};
  completions.forEach(c => { completedMap[c.activity_key] = c.completed_at; });

  let completedActCount = 0;
  const practiceDetails = DEFAULT_PRACTICE_ACTIVITIES.map(act => {
    const isDone = Boolean(completedMap[act.key]);
    if (isDone) completedActCount++;
    return {
      key: act.key,
      title: act.title,
      durationLabel: act.durationLabel,
      repsLabel: act.repsLabel,
      isCompleted: isDone,
      completedAt: completedMap[act.key] || null
    };
  });

  const practicePercentage = Math.round((completedActCount / DEFAULT_PRACTICE_ACTIVITIES.length) * 100);

  // Module Completion Determination
  const isLessonsComplete = completedStagesCount >= 5;
  const isJournalComplete = doneSessions > 0;
  const isModuleComplete = isLessonsComplete && isJournalComplete && completedActCount >= 3;

  const overallPercentage = Math.round(
    (lessonsPercentage * 0.4) + (journalPercentage * 0.3) + (practicePercentage * 0.3)
  );

  // Remaining activities list
  const remainingActivities = [];
  stageStatuses.forEach(st => {
    if (!st.isCompleted) {
      remainingActivities.push({
        type: 'stage',
        text: `Complete Stage 0${st.stage_number}`,
        stageNumber: st.stage_number
      });
    }
  });

  if (totalSessions === 0) {
    remainingActivities.push({
      type: 'commitment',
      text: 'Save your weekly practice commitment in Stage 05'
    });
  } else if (doneSessions === 0) {
    remainingActivities.push({
      type: 'journal',
      text: 'Complete at least one practice session in your Learning Journal'
    });
  }

  practiceDetails.forEach(act => {
    if (!act.isCompleted) {
      remainingActivities.push({
        type: 'practice',
        text: `Practice: ${act.title} (${act.durationLabel})`,
        key: act.key
      });
    }
  });

  // Sync to student_module_progress table
  await pool.query(`
    INSERT INTO student_module_progress (
      user_id, module_id, stage_id, completion_status, completion_percentage, completed_at
    ) VALUES (?, ?, 5, ?, ?, IF(? = TRUE, NOW(), NULL))
    ON DUPLICATE KEY UPDATE
      completion_status = VALUES(completion_status),
      completion_percentage = VALUES(completion_percentage),
      completed_at = IF(VALUES(completion_status) = 'COMPLETED', COALESCE(completed_at, NOW()), NULL),
      updated_at = NOW()
  `, [userId, moduleId, isModuleComplete ? 'COMPLETED' : 'IN_PROGRESS', overallPercentage, isModuleComplete]);

  return {
    module: {
      id: moduleId,
      title: 'Module 01 – Breath Management',
      isComplete: isModuleComplete,
      status: isModuleComplete ? 'COMPLETED' : 'IN_PROGRESS',
      overallPercentage
    },
    lessons: {
      percentage: lessonsPercentage,
      completedStages: completedStagesCount,
      totalStages
    },
    journal: {
      percentage: journalPercentage,
      completedSessions: doneSessions,
      totalSessions,
      practisingSessions,
      plannedSessions
    },
    practice: {
      percentage: practicePercentage,
      completedActivities: completedActCount,
      totalActivities: DEFAULT_PRACTICE_ACTIVITIES.length,
      activities: practiceDetails
    },
    remainingActivities
  };
}

exports.calculateModuleCompletion = calculateModuleCompletion;
exports.updateStageFiveProgress = updateStageFiveProgress;
