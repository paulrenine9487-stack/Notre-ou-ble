const pool = require('../config/db');

// ============================================================================
// 1. PRACTICE SESSIONS (Real-time Timer & Session Recording)
// ============================================================================

// POST /api/practice/start
exports.startSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { session_type, exercise_name, task_id } = req.body;

    res.status(200).json({
      success: true,
      message: 'Practice session initiated.',
      session: {
        user_id: userId,
        task_id: task_id ? parseInt(task_id, 10) : null,
        session_type: session_type || 'Breath Management',
        exercise_name: exercise_name || 'Diaphragmatic Expansion',
        start_time: new Date().toISOString(),
        status: 'active'
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/practice/pause
exports.pauseSession = async (req, res, next) => {
  try {
    const { current_duration_seconds } = req.body;
    res.status(200).json({
      success: true,
      message: 'Practice session paused.',
      paused_at: new Date().toISOString(),
      current_duration_seconds: current_duration_seconds || 0
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/practice/resume
exports.resumeSession = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Practice session resumed.',
      resumed_at: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/practice/complete (also handles /api/practice/sessions POST)
exports.recordSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      session_type,
      exercise_name,
      start_time,
      end_time,
      duration_minutes,
      duration_seconds,
      task_id,
      notes
    } = req.body;

    const sessionType = (session_type && session_type.trim()) || 'Breath Management';
    const exerciseName = (exercise_name && exercise_name.trim()) || 'Diaphragmatic Breathing';

    let durationMins = parseInt(duration_minutes, 10);
    const durationSecs = parseInt(duration_seconds, 10) || 0;

    if (isNaN(durationMins) || durationMins <= 0) {
      if (durationSecs > 0) {
        durationMins = Math.max(1, Math.round(durationSecs / 60));
      } else {
        durationMins = 1;
      }
    }

    const startDate = start_time ? new Date(start_time) : new Date(Date.now() - durationMins * 60000);
    const endDate = end_time ? new Date(end_time) : new Date();
    const taskIdVal = task_id ? parseInt(task_id, 10) : null;

    const [result] = await pool.query(
      `INSERT INTO practice_sessions 
         (user_id, task_id, session_type, exercise_name, start_time, end_time, duration_minutes, duration_seconds, completion_status, notes, completed_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, NOW())`,
      [userId, taskIdVal, sessionType, exerciseName, startDate, endDate, durationMins, durationSecs || (durationMins * 60), notes || null]
    );

    const [newSession] = await pool.query(
      'SELECT id, user_id, task_id, session_type, exercise_name, duration_minutes, duration_seconds, completion_status, notes, completed_at FROM practice_sessions WHERE id = ?',
      [result.insertId]
    );

    // If session was associated with a learning task, mark assignment progress
    if (taskIdVal) {
      await pool.query(`
        INSERT INTO user_task_assignments (user_id, task_id, assignment_status, submitted_at, completed_at)
        VALUES (?, ?, 'COMPLETED', NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
          assignment_status = 'COMPLETED',
          completed_at = NOW(),
          updated_at = NOW()
      `, [userId, taskIdVal]);
    }

    res.status(201).json({
      success: true,
      message: 'Practice session recorded successfully.',
      session: newSession[0]
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/practice/sessions & GET /api/practice/history
exports.getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT id, user_id, task_id, session_type, exercise_name, duration_minutes, duration_seconds, completion_status, notes, completed_at 
       FROM practice_sessions 
       WHERE user_id = ? 
       ORDER BY completed_at DESC`,
      [userId]
    );

    const [stats] = await pool.query(
      `SELECT 
         COUNT(*) AS total_sessions, 
         COALESCE(SUM(duration_minutes), 0) AS total_minutes,
         COALESCE(SUM(duration_seconds), 0) AS total_seconds,
         COALESCE(MAX(duration_minutes), 0) AS max_duration 
       FROM practice_sessions 
       WHERE user_id = ? AND completion_status = 'completed'`,
      [userId]
    );

    res.status(200).json({
      success: true,
      sessions: rows,
      history: rows,
      stats: {
        totalSessions: stats[0].total_sessions || 0,
        totalMinutes: parseInt(stats[0].total_minutes || 0, 10),
        totalSeconds: parseInt(stats[0].total_seconds || 0, 10),
        maxDuration: stats[0].max_duration || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/practice/weekly-stats
exports.getWeeklyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [weeklyRows] = await pool.query(
      `SELECT 
         COALESCE(SUM(duration_minutes), 0) AS weekly_minutes,
         COUNT(*) AS weekly_sessions
       FROM practice_sessions
       WHERE user_id = ?
         AND completion_status = 'completed'
         AND completed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
         AND completed_at < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)`,
      [userId]
    );

    const [goalRows] = await pool.query(
      'SELECT weekly_target_minutes FROM user_practice_goals WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const targetMinutes = goalRows.length > 0 ? goalRows[0].weekly_target_minutes : 60;
    const weeklyMinutes = parseInt(weeklyRows[0].weekly_minutes || 0, 10);
    const weeklySessions = parseInt(weeklyRows[0].weekly_sessions || 0, 10);
    const percentage = targetMinutes > 0 ? Math.min(100, Math.round((weeklyMinutes / targetMinutes) * 100)) : 0;

    res.status(200).json({
      success: true,
      weeklyMinutes,
      weeklySessions,
      targetMinutes,
      percentage
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/practice/goals
exports.getGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT weekly_target_minutes, created_at, updated_at FROM user_practice_goals WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        goal: { weekly_target_minutes: 60, isDefault: true }
      });
    }

    res.status(200).json({
      success: true,
      goal: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/practice/goals
exports.setGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { weekly_target_minutes } = req.body;

    const target = parseInt(weekly_target_minutes, 10);
    if (isNaN(target) || target < 10 || target > 600) {
      return res.status(400).json({
        success: false,
        message: 'Weekly target must be a number between 10 and 600 minutes.'
      });
    }

    await pool.query(
      `INSERT INTO user_practice_goals (user_id, weekly_target_minutes) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE weekly_target_minutes = ?, updated_at = NOW()`,
      [userId, target, target]
    );

    res.status(200).json({
      success: true,
      message: 'Weekly practice goal updated successfully.',
      weekly_target_minutes: target
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. PRACTICE REFLECTIONS (Log a Session & Recent Reflections)
// ============================================================================

// POST /api/practice/reflections
exports.createReflection = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const { practice_type, duration_minutes, reflection, linked_task_id } = req.body;

    // Validation
    if (!practice_type || !practice_type.trim()) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Please select what you practised.' });
    }

    const duration = parseInt(duration_minutes, 10);
    if (isNaN(duration) || duration <= 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Please select a valid practice duration.' });
    }

    if (!reflection || !reflection.trim()) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Please enter your practice reflection.' });
    }

    const linkedTaskId = linked_task_id ? parseInt(linked_task_id, 10) : null;

    // 1. Insert into practice_reflections
    const [refResult] = await conn.query(
      `INSERT INTO practice_reflections 
         (user_id, practice_type, duration_minutes, reflection, practice_date, linked_task_id) 
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [userId, practice_type.trim(), duration, reflection.trim(), linkedTaskId]
    );
    const reflectionId = refResult.insertId;

    // 2. Also record in practice_sessions so weekly practice duration & session counts update
    const [sessResult] = await conn.query(
      `INSERT INTO practice_sessions 
         (user_id, task_id, reflection_id, session_type, exercise_name, duration_minutes, duration_seconds, completion_status, notes, completed_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, NOW())`,
      [userId, linkedTaskId, reflectionId, practice_type.trim(), practice_type.trim(), duration, duration * 60, reflection.trim()]
    );
    const sessionId = sessResult.insertId;

    // Update reflection with session_id
    await conn.query('UPDATE practice_reflections SET session_id = ? WHERE id = ?', [sessionId, reflectionId]);

    await conn.commit();

    // Fetch created reflection with stage/task info if linked
    const [created] = await pool.query(`
      SELECT 
        pr.*,
        lt.task_title,
        ls.stage_number,
        ls.stage_title
      FROM practice_reflections pr
      LEFT JOIN learning_tasks lt ON pr.linked_task_id = lt.id
      LEFT JOIN learning_stages ls ON lt.stage_id = ls.id
      WHERE pr.id = ?
    `, [reflectionId]);

    res.status(201).json({
      success: true,
      message: 'Practice reflection saved successfully.',
      reflection: created[0]
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// GET /api/practice/reflections
exports.getReflections = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT 
        pr.id,
        pr.user_id,
        pr.practice_type,
        pr.duration_minutes,
        pr.reflection,
        pr.practice_date,
        pr.linked_task_id,
        pr.session_id,
        pr.created_at,
        pr.updated_at,
        lt.task_title,
        ls.stage_number,
        ls.stage_title
      FROM practice_reflections pr
      LEFT JOIN learning_tasks lt ON pr.linked_task_id = lt.id
      LEFT JOIN learning_stages ls ON lt.stage_id = ls.id
      WHERE pr.user_id = ?
      ORDER BY pr.practice_date DESC, pr.id DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM practice_reflections WHERE user_id = ?',
      [userId]
    );

    // Also fetch student's learning module pinboard reflection (without adding duplicate practice minutes)
    const [moduleReflections] = await pool.query(
      `SELECT r.*, 'Module 01: Breath Management' AS module_title, 'Stage 04: Let\\'s Check Ourselves' AS stage_title
       FROM student_learning_reflections r
       WHERE r.user_id = ?
       LIMIT 1`,
      [userId]
    );

    res.status(200).json({
      success: true,
      reflections: rows,
      moduleReflection: moduleReflections[0] || null,
      total: countRows[0].total,
      page,
      limit
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/practice/reflections/:id
exports.getReflectionById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const [rows] = await pool.query(`
      SELECT 
        pr.*,
        lt.task_title,
        ls.stage_number,
        ls.stage_title
      FROM practice_reflections pr
      LEFT JOIN learning_tasks lt ON pr.linked_task_id = lt.id
      LEFT JOIN learning_stages ls ON lt.stage_id = ls.id
      WHERE pr.id = ? AND pr.user_id = ?
    `, [id, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Practice reflection not found.' });
    }

    res.status(200).json({
      success: true,
      reflection: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/practice/reflections/:id
exports.updateReflection = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { practice_type, duration_minutes, reflection } = req.body;

    const [existing] = await conn.query(
      'SELECT id, session_id FROM practice_reflections WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Practice reflection not found or access denied.' });
    }

    const duration = parseInt(duration_minutes, 10);
    const pType = practice_type ? practice_type.trim() : null;
    const refText = reflection ? reflection.trim() : null;

    await conn.query(`
      UPDATE practice_reflections 
      SET practice_type = COALESCE(?, practice_type),
          duration_minutes = COALESCE(?, duration_minutes),
          reflection = COALESCE(?, reflection),
          updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [pType, isNaN(duration) ? null : duration, refText, id, userId]);

    // Also update linked practice session if present
    if (existing[0].session_id) {
      await conn.query(`
        UPDATE practice_sessions 
        SET session_type = COALESCE(?, session_type),
            exercise_name = COALESCE(?, exercise_name),
            duration_minutes = COALESCE(?, duration_minutes),
            duration_seconds = COALESCE(?, duration_minutes) * 60,
            notes = COALESCE(?, notes)
        WHERE id = ? AND user_id = ?
      `, [pType, pType, isNaN(duration) ? null : duration, isNaN(duration) ? null : duration, refText, existing[0].session_id, userId]);
    }

    await conn.commit();

    const [updated] = await pool.query(
      'SELECT * FROM practice_reflections WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Practice reflection updated successfully.',
      reflection: updated[0]
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// DELETE /api/practice/reflections/:id
exports.deleteReflection = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const [existing] = await conn.query(
      'SELECT id, session_id FROM practice_reflections WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Practice reflection not found or access denied.' });
    }

    // Delete linked session if any
    if (existing[0].session_id) {
      await conn.query('DELETE FROM practice_sessions WHERE id = ? AND user_id = ?', [existing[0].session_id, userId]);
    }

    await conn.query('DELETE FROM practice_reflections WHERE id = ? AND user_id = ?', [id, userId]);

    await conn.commit();

    res.status(200).json({
      success: true,
      message: 'Practice reflection deleted successfully.'
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// ============================================================================
// 3. PERSONAL PRACTICE DIARY (Kanban: TO DO, DOING, DONE)
// ============================================================================

// POST /api/practice/diary/tasks
exports.createDiaryTask = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const {
      title,
      description,
      priority,
      due_date,
      learning_module_id,
      learning_stage_id,
      learning_task_id
    } = req.body;

    if (!title || !title.trim()) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const priorityVal = ['LOW', 'MEDIUM', 'HIGH'].includes((priority || '').toUpperCase())
      ? priority.toUpperCase()
      : 'MEDIUM';

    // Calculate next position in TODO (0-indexed)
    const [maxPos] = await conn.query(
      "SELECT MAX(position) AS max_p FROM practice_diary_tasks WHERE user_id = ? AND status = 'TODO'",
      [userId]
    );
    const nextPos = maxPos[0].max_p !== null ? maxPos[0].max_p + 1 : 0;

    const modId = learning_module_id ? parseInt(learning_module_id, 10) : null;
    const stId = learning_stage_id ? parseInt(learning_stage_id, 10) : null;
    const tId = learning_task_id ? parseInt(learning_task_id, 10) : null;

    const [result] = await conn.query(`
      INSERT INTO practice_diary_tasks 
        (user_id, title, description, status, priority, due_date, position, learning_module_id, learning_stage_id, learning_task_id)
      VALUES (?, ?, ?, 'TODO', ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      title.trim(),
      description ? description.trim() : null,
      priorityVal,
      due_date || null,
      nextPos,
      modId,
      stId,
      tId
    ]);
    const taskId = result.insertId;

    // Record initial history
    await conn.query(`
      INSERT INTO practice_task_history 
        (diary_task_id, user_id, previous_status, new_status, notes)
      VALUES (?, ?, NULL, 'TODO', 'Task created in practice diary')
    `, [taskId, userId]);

    // If linked to learning task, add link
    if (tId) {
      await conn.query(`
        INSERT IGNORE INTO learning_task_links (user_id, diary_task_id, learning_task_id)
        VALUES (?, ?, ?)
      `, [userId, taskId, tId]);
    }

    await conn.commit();

    const [newTask] = await pool.query(`
      SELECT 
        pdt.*,
        ls.stage_number,
        ls.stage_title,
        lt.task_title
      FROM practice_diary_tasks pdt
      LEFT JOIN learning_stages ls ON pdt.learning_stage_id = ls.id
      LEFT JOIN learning_tasks lt ON pdt.learning_task_id = lt.id
      WHERE pdt.id = ?
    `, [taskId]);

    res.status(201).json({
      success: true,
      message: 'Practice diary task created.',
      task: newTask[0]
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// GET /api/practice/diary/tasks
exports.getDiaryTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [tasks] = await pool.query(`
      SELECT 
        pdt.id,
        pdt.user_id,
        pdt.title,
        pdt.description,
        pdt.status,
        pdt.priority,
        pdt.due_date,
        pdt.position,
        pdt.learning_module_id,
        pdt.learning_stage_id,
        pdt.learning_task_id,
        pdt.started_at,
        pdt.completed_at,
        pdt.created_at,
        pdt.updated_at,
        ls.stage_number,
        ls.stage_title,
        lt.task_title,
        lt.task_type,
        lt.maximum_marks,
        lt.is_required
      FROM practice_diary_tasks pdt
      LEFT JOIN learning_stages ls ON pdt.learning_stage_id = ls.id
      LEFT JOIN learning_tasks lt ON pdt.learning_task_id = lt.id
      WHERE pdt.user_id = ?
      ORDER BY pdt.status ASC, pdt.position ASC, pdt.created_at ASC
    `, [userId]);

    // Summary counts
    const todo = tasks.filter(t => t.status === 'TODO');
    const doing = tasks.filter(t => t.status === 'DOING');
    const done = tasks.filter(t => t.status === 'DONE');

    res.status(200).json({
      success: true,
      tasks,
      columns: {
        TODO: todo,
        DOING: doing,
        DONE: done
      },
      counts: {
        total: tasks.length,
        todo: todo.length,
        doing: doing.length,
        done: done.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/practice/diary/tasks/:id
exports.getDiaryTaskById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const [tasks] = await pool.query(`
      SELECT 
        pdt.*,
        ls.stage_number,
        ls.stage_title,
        lt.task_title,
        lt.task_type,
        lt.maximum_marks
      FROM practice_diary_tasks pdt
      LEFT JOIN learning_stages ls ON pdt.learning_stage_id = ls.id
      LEFT JOIN learning_tasks lt ON pdt.learning_task_id = lt.id
      WHERE pdt.id = ? AND pdt.user_id = ?
    `, [id, userId]);

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Diary task not found.' });
    }

    // Fetch history
    const [history] = await pool.query(
      'SELECT id, previous_status, new_status, changed_at, notes FROM practice_task_history WHERE diary_task_id = ? ORDER BY changed_at ASC',
      [id]
    );

    res.status(200).json({
      success: true,
      task: {
        ...tasks[0],
        history
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/practice/diary/tasks/:id
exports.updateDiaryTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { title, description, priority, due_date } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM practice_diary_tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Diary task not found or unauthorized.' });
    }

    const priorityVal = priority ? priority.toUpperCase() : null;

    await pool.query(`
      UPDATE practice_diary_tasks 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          priority = COALESCE(?, priority),
          due_date = ?,
          updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [title ? title.trim() : null, description ? description.trim() : null, priorityVal, due_date || null, id, userId]);

    const [updated] = await pool.query('SELECT * FROM practice_diary_tasks WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Diary task updated successfully.',
      task: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/practice/diary/tasks/:id/status
exports.updateDiaryTaskStatus = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { status, position } = req.body;

    const validStatuses = ['TODO', 'DOING', 'DONE'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Valid status (TODO, DOING, DONE) is required.' });
    }
    const newStatus = status.toUpperCase();

    const [existing] = await conn.query(
      'SELECT id, status, started_at, completed_at, learning_task_id FROM practice_diary_tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Diary task not found or unauthorized.' });
    }
    const currentTask = existing[0];
    const prevStatus = currentTask.status;

    let startedAt = currentTask.started_at;
    let completedAt = currentTask.completed_at;

    if (newStatus === 'DOING' && !startedAt) {
      startedAt = new Date();
    }
    if (newStatus === 'DONE') {
      completedAt = new Date();
    }

    const newPos = position !== undefined ? parseInt(position, 10) : 0;

    await conn.query(`
      UPDATE practice_diary_tasks 
      SET status = ?,
          position = ?,
          started_at = ?,
          completed_at = ?,
          updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [newStatus, newPos, startedAt, completedAt, id, userId]);

    // Record in history
    await conn.query(`
      INSERT INTO practice_task_history 
        (diary_task_id, user_id, previous_status, new_status, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [id, userId, prevStatus, newStatus, `Task moved from ${prevStatus} to ${newStatus}`]);

    await conn.commit();

    const [updated] = await pool.query(`
      SELECT 
        pdt.*,
        ls.stage_number,
        ls.stage_title,
        lt.task_title
      FROM practice_diary_tasks pdt
      LEFT JOIN learning_stages ls ON pdt.learning_stage_id = ls.id
      LEFT JOIN learning_tasks lt ON pdt.learning_task_id = lt.id
      WHERE pdt.id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: `Task moved to ${newStatus}.`,
      task: updated[0]
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// PATCH /api/practice/diary/tasks/reorder
exports.reorderDiaryTasks = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const { items } = req.body; // Array of { id, status, position }

    if (!Array.isArray(items)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Items array is required for reordering.' });
    }

    for (const item of items) {
      const taskId = parseInt(item.id, 10);
      const pos = parseInt(item.position, 10) || 0;
      const status = item.status ? item.status.toUpperCase() : null;

      if (status) {
        await conn.query(
          'UPDATE practice_diary_tasks SET position = ?, status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
          [pos, status, taskId, userId]
        );
      } else {
        await conn.query(
          'UPDATE practice_diary_tasks SET position = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
          [pos, taskId, userId]
        );
      }
    }

    await conn.commit();

    res.status(200).json({
      success: true,
      message: 'Tasks reordered successfully.'
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// DELETE /api/practice/diary/tasks/:id
exports.deleteDiaryTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const [existing] = await pool.query(
      'SELECT id FROM practice_diary_tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Diary task not found or unauthorized.' });
    }

    await pool.query('DELETE FROM practice_diary_tasks WHERE id = ? AND user_id = ?', [id, userId]);

    res.status(200).json({
      success: true,
      message: 'Diary task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. LEARNING INTEGRATION (Add Learning Task to Practice Diary)
// ============================================================================

// POST /api/practice/diary/tasks/from-learning
exports.createFromLearningTask = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const { learning_task_id, priority, due_date } = req.body;

    if (!learning_task_id) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'learning_task_id is required.' });
    }
    const taskId = parseInt(learning_task_id, 10);

    // Fetch learning task and stage details
    const [tasks] = await conn.query(`
      SELECT 
        lt.*,
        ls.id AS stage_id,
        ls.stage_number,
        ls.stage_title,
        ls.module_id
      FROM learning_tasks lt
      JOIN learning_stages ls ON lt.stage_id = ls.id
      WHERE lt.id = ?
    `, [taskId]);

    if (tasks.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Learning task not found.' });
    }
    const lTask = tasks[0];

    // Check if user already has an active diary task for this learning task
    const [existingLinks] = await conn.query(`
      SELECT pdt.id, pdt.title, pdt.status 
      FROM practice_diary_tasks pdt
      JOIN learning_task_links ltl ON pdt.id = ltl.diary_task_id
      WHERE ltl.user_id = ? AND ltl.learning_task_id = ? AND pdt.status IN ('TODO', 'DOING')
      LIMIT 1
    `, [userId, taskId]);

    if (existingLinks.length > 0) {
      await conn.rollback();
      return res.status(200).json({
        success: true,
        message: 'This learning task is already present in your practice diary.',
        task: existingLinks[0],
        alreadyExists: true
      });
    }

    // Determine position (0-indexed)
    const [maxPos] = await conn.query(
      "SELECT MAX(position) AS max_p FROM practice_diary_tasks WHERE user_id = ? AND status = 'TODO'",
      [userId]
    );
    const nextPos = maxPos[0].max_p !== null ? maxPos[0].max_p + 1 : 0;

    const diaryTitle = `Stage ${lTask.stage_number.toString().padStart(2, '0')}: ${lTask.task_title}`;
    const diaryDesc = lTask.task_instructions || lTask.task_description;
    const priorityVal = priority ? priority.toUpperCase() : 'HIGH';

    // Insert diary task
    const [result] = await conn.query(`
      INSERT INTO practice_diary_tasks 
        (user_id, title, description, status, priority, due_date, position, learning_module_id, learning_stage_id, learning_task_id)
      VALUES (?, ?, ?, 'TODO', ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      diaryTitle,
      diaryDesc,
      priorityVal,
      due_date || null,
      nextPos,
      lTask.module_id,
      lTask.stage_id,
      taskId
    ]);
    const diaryTaskId = result.insertId;

    // Link
    await conn.query(`
      INSERT INTO learning_task_links (user_id, diary_task_id, learning_task_id)
      VALUES (?, ?, ?)
    `, [userId, diaryTaskId, taskId]);

    // History
    await conn.query(`
      INSERT INTO practice_task_history 
        (diary_task_id, user_id, previous_status, new_status, notes)
      VALUES (?, ?, NULL, 'TODO', 'Imported from Learning Module task')
    `, [diaryTaskId, userId]);

    await conn.commit();

    const [created] = await pool.query(`
      SELECT 
        pdt.*,
        ls.stage_number,
        ls.stage_title,
        lt.task_title
      FROM practice_diary_tasks pdt
      LEFT JOIN learning_stages ls ON pdt.learning_stage_id = ls.id
      LEFT JOIN learning_tasks lt ON pdt.learning_task_id = lt.id
      WHERE pdt.id = ?
    `, [diaryTaskId]);

    res.status(201).json({
      success: true,
      message: 'Learning task successfully added to your Practice Diary!',
      task: created[0]
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

// GET /api/practice/diary/tasks/linked-learning
exports.getLinkedLearningTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(`
      SELECT 
        ltl.id AS link_id,
        ltl.diary_task_id,
        ltl.learning_task_id,
        pdt.title AS diary_task_title,
        pdt.status AS diary_task_status,
        lt.task_title,
        lt.task_type,
        lt.maximum_marks,
        ls.stage_number,
        ls.stage_title
      FROM learning_task_links ltl
      JOIN practice_diary_tasks pdt ON ltl.diary_task_id = pdt.id
      JOIN learning_tasks lt ON ltl.learning_task_id = lt.id
      JOIN learning_stages ls ON lt.stage_id = ls.id
      WHERE ltl.user_id = ?
    `, [userId]);

    res.status(200).json({
      success: true,
      links: rows
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. PRACTICE ANALYTICS & INSIGHTS
// ============================================================================

// GET /api/practice/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Total practice minutes & sessions from practice_sessions
    const [totals] = await pool.query(`
      SELECT 
        COALESCE(SUM(duration_minutes), 0) AS total_minutes,
        COUNT(*) AS total_sessions
      FROM practice_sessions
      WHERE user_id = ? AND completion_status = 'completed'
    `, [userId]);

    const totalMinutes = parseInt(totals[0].total_minutes || 0, 10);
    const totalSessions = parseInt(totals[0].total_sessions || 0, 10);

    // 2. Most practised activity
    const [mostPracticed] = await pool.query(`
      SELECT session_type, COUNT(*) AS count, SUM(duration_minutes) AS total_mins
      FROM practice_sessions
      WHERE user_id = ? AND completion_status = 'completed'
      GROUP BY session_type
      ORDER BY count DESC, total_mins DESC
      LIMIT 1
    `, [userId]);

    const topActivity = mostPracticed.length > 0 ? mostPracticed[0].session_type : null;
    const topActivityCount = mostPracticed.length > 0 ? mostPracticed[0].count : 0;

    // 3. Weekly consistency (distinct practice days in current Monday-Sunday week)
    const [weeklyConsistency] = await pool.query(`
      SELECT COUNT(DISTINCT DATE(completed_at)) AS active_days
      FROM practice_sessions
      WHERE user_id = ?
        AND completion_status = 'completed'
        AND completed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    `, [userId]);

    const activeDaysThisWeek = parseInt(weeklyConsistency[0].active_days || 0, 10);

    // 4. Diary task stats
    const [diaryCounts] = await pool.query(`
      SELECT 
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) AS todo_count,
        SUM(CASE WHEN status = 'DOING' THEN 1 ELSE 0 END) AS doing_count,
        SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) AS done_count,
        SUM(CASE WHEN status = 'DONE' AND completed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN 1 ELSE 0 END) AS done_this_week
      FROM practice_diary_tasks
      WHERE user_id = ?
    `, [userId]);

    const totalDiaryTasks = parseInt(diaryCounts[0].total_tasks || 0, 10);
    const todoCount = parseInt(diaryCounts[0].todo_count || 0, 10);
    const doingCount = parseInt(diaryCounts[0].doing_count || 0, 10);
    const doneCount = parseInt(diaryCounts[0].done_count || 0, 10);
    const doneThisWeek = parseInt(diaryCounts[0].done_this_week || 0, 10);

    // 5. Generate natural language observations supported strictly by actual database records
    const insights = [];

    if (totalSessions > 0) {
      if (topActivity) {
        insights.push(`Your most frequent activity is ${topActivity} (${topActivityCount} session${topActivityCount > 1 ? 's' : ''}).`);
      }
      if (activeDaysThisWeek > 0) {
        insights.push(`You have practiced on ${activeDaysThisWeek} day${activeDaysThisWeek > 1 ? 's' : ''} this week.`);
      }
      if (doneThisWeek > 0) {
        insights.push(`You completed ${doneThisWeek} practice diary task${doneThisWeek > 1 ? 's' : ''} this week.`);
      }
      const unfinished = todoCount + doingCount;
      if (unfinished > 0) {
        insights.push(`You have ${unfinished} task${unfinished > 1 ? 's' : ''} remaining in your practice diary.`);
      }
    }

    res.status(200).json({
      success: true,
      analytics: {
        totalPracticeMinutes: totalMinutes,
        totalPracticeSessions: totalSessions,
        mostPracticedActivity: topActivity,
        weeklyPracticeConsistency: `${activeDaysThisWeek} of 7 days`,
        activeDaysThisWeek,
        diaryTasksCompleted: doneCount,
        currentUnfinishedTasks: todoCount + doingCount,
        diaryStats: {
          total: totalDiaryTasks,
          todo: todoCount,
          doing: doingCount,
          done: doneCount,
          completedThisWeek: doneThisWeek
        },
        insights,
        hasHistory: totalSessions > 0 || totalDiaryTasks > 0
      }
    });
  } catch (error) {
    next(error);
  }
};
