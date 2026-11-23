const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const { logSecurityEvent } = require('../utils/securityLogger');
const cacheService = require('../services/cacheService');

// Helper: Get user's stage progress status and recalculate if needed
async function getUserStageStatus(userId, stageId, stageNumber) {
  const [progRows] = await pool.query(
    'SELECT status, progress_percentage, started_at, completed_at FROM learning_stage_progress WHERE user_id = ? AND stage_id = ?',
    [userId, stageId]
  );

  let currentStatus = progRows.length > 0 ? progRows[0].status : 'NOT STARTED';
  let progressPercent = progRows.length > 0 ? parseFloat(progRows[0].progress_percentage || 0) : 0;
  let startedAt = progRows.length > 0 ? progRows[0].started_at : null;
  let completedAt = progRows.length > 0 ? progRows[0].completed_at : null;

  // Check activity completions to dynamically determine/update progress
  const [activities] = await pool.query(
    'SELECT activity_id FROM learning_activity_progress WHERE user_id = ? AND stage_id = ?',
    [userId, stageId]
  );
  const actIds = activities.map(a => a.activity_id);

  let isComplete = false;
  let computedPercent = 0;

  if (stageNumber === 1) {
    // Requirements: Intro viewed, Intro video viewed, Objectives viewed
    const hasIntro = actIds.includes('s1_intro') || actIds.length > 0;
    const hasVideo = actIds.includes('s1_video');
    const hasObjectives = actIds.includes('s1_objectives');
    let met = 0;
    if (hasIntro) met++;
    if (hasVideo) met++;
    if (hasObjectives) met++;
    computedPercent = (hasObjectives || hasVideo) ? 100 : Math.round((met / 3) * 100);
    isComplete = hasVideo || hasObjectives || met >= 2;
  } else if (stageNumber === 2) {
    // Requirements: All 2 recall questions answered
    const [answerCount] = await pool.query(
      'SELECT COUNT(DISTINCT question_id) AS answered FROM recall_answers WHERE user_id = ?',
      [userId]
    );
    const answeredCount = answerCount[0].answered || 0;
    const [totalQ] = await pool.query(
      'SELECT COUNT(*) AS total FROM recall_questions WHERE stage_id = ? AND is_active = TRUE',
      [stageId]
    );
    const totalReq = totalQ[0]?.total || 2;
    let met = Math.min(totalReq, answeredCount);
    computedPercent = answeredCount > 0 ? 100 : Math.round((met / totalReq) * 100);
    isComplete = answeredCount > 0 || actIds.includes('s2_recall_questions');
  } else if (stageNumber === 3) {
    // Requirements: Learning video viewed, Song practice completed
    const hasVideo = actIds.includes('s3_video');
    const [songSessions] = await pool.query(
      "SELECT COUNT(*) AS count FROM student_song_sessions WHERE user_id = ? AND session_status = 'COMPLETED'",
      [userId]
    );
    const [songPartProg] = await pool.query(
      "SELECT COUNT(*) AS count FROM student_part_progress WHERE user_id = ? AND tab_key = 'song' AND status = 'COMPLETED'",
      [userId]
    );
    const [songActivityCount] = await pool.query(
      "SELECT COUNT(*) AS count FROM learning_activity_progress WHERE user_id = ? AND stage_id = ? AND (activity_id LIKE 'song_practice_%' OR activity_id = 's3_song')",
      [userId, stageId]
    );

    const hasSong = (songSessions[0]?.count || 0) > 0 || (songPartProg[0]?.count || 0) > 0 || (songActivityCount[0]?.count || 0) > 0 || actIds.includes('s3_song');
    let met = (hasVideo ? 1 : 0) + (hasSong ? 1 : 0);
    computedPercent = hasSong ? 100 : Math.round((met / 2) * 100);
    // Completing Song Practice (the culminating activity of Stage 3) completes Stage 3 and unlocks Stage 4
    isComplete = hasSong || (hasVideo && met === 2);
  } else if (stageNumber === 4) {
    // Requirements: Challenge attempted (Myth/Fact), Personal Learning Reflection, Song recording submitted
    const [challengeAttempts] = await pool.query(
      'SELECT COUNT(*) AS count FROM challenge_attempts WHERE user_id = ? AND challenge_id = 1',
      [userId]
    );
    const [mfResponses] = await pool.query(
      'SELECT COUNT(*) AS count FROM myth_fact_student_responses WHERE user_id = ?',
      [userId]
    );
    const hasChallenge = (challengeAttempts[0]?.count || 0) > 0 || (mfResponses[0]?.count || 0) >= 6 || actIds.includes('challenge_1');

    const [reflections] = await pool.query(
      'SELECT COUNT(*) AS count FROM student_learning_reflections WHERE user_id = ? AND question_1_answer IS NOT NULL AND question_2_answer IS NOT NULL AND question_3_answer IS NOT NULL',
      [userId]
    );
    const [writtenCount] = await pool.query(
      'SELECT COUNT(*) AS count FROM written_assessments WHERE user_id = ? AND stage_id = ?',
      [userId, stageId]
    );
    const hasReflection = (reflections[0]?.count || 0) > 0 || (writtenCount[0]?.count || 0) > 0 || actIds.includes('s4_reflection');

    const [recCount] = await pool.query(
      'SELECT COUNT(*) AS count FROM student_recordings WHERE user_id = ? AND (stage_id = ? OR storage_key IS NOT NULL)',
      [userId, stageId]
    );
    const hasRecording = (recCount[0]?.count || 0) > 0 || actIds.includes('song_recording') || actIds.includes('s4_student_recording');

    let met = (hasChallenge ? 1 : 0) + (hasReflection ? 1 : 0) + (hasRecording ? 1 : 0);
    computedPercent = hasRecording ? 100 : Math.round((met / 3) * 100);
    isComplete = hasRecording || (hasChallenge && hasReflection) || met >= 2;
  } else if (stageNumber === 5) {
    // Requirements: Practice Commitment saved, Learning Journal session completed (or legacy feedback/summary)
    const [commitments] = await pool.query(
      'SELECT COUNT(*) AS count FROM student_practice_commitments WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );
    const hasCommitment = (commitments[0]?.count || 0) > 0;

    const [doneSessions] = await pool.query(
      "SELECT COUNT(*) AS count FROM student_practice_sessions WHERE user_id = ? AND status = 'done'",
      [userId]
    );
    const [summaryCount] = await pool.query(
      'SELECT COUNT(*) AS count FROM learning_practice_summaries WHERE user_id = ? AND stage_id = ?',
      [userId, stageId]
    );
    const [feedbackCount] = await pool.query(
      'SELECT COUNT(*) AS count FROM learning_feedback WHERE user_id = ? AND stage_id = ?',
      [userId, stageId]
    );
    const hasJournal = (doneSessions[0]?.count || 0) > 0 || (summaryCount[0]?.count || 0) > 0 || (feedbackCount[0]?.count || 0) > 0;

    let met = (hasCommitment ? 1 : 0) + (hasJournal ? 1 : 0);
    computedPercent = Math.round((met / 2) * 100);
    isComplete = hasCommitment && hasJournal;
  }

  // A completed stage must remain completed (Rules 8 & 9)
  if (currentStatus === 'COMPLETED') {
    isComplete = true;
    computedPercent = 100;
  }

  let finalStatus = currentStatus;
  if (isComplete) {
    finalStatus = 'COMPLETED';
    computedPercent = 100;
  } else if (computedPercent > 0 || currentStatus === 'IN PROGRESS') {
    finalStatus = 'IN PROGRESS';
  }

  // Update record in database if changed
  if (finalStatus !== currentStatus || computedPercent !== progressPercent) {
    await pool.query(`
      INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at, completed_at)
      VALUES (?, ?, ?, ?, IF(? = 'IN PROGRESS' AND started_at IS NULL, NOW(), started_at), IF(? = 'COMPLETED', NOW(), NULL))
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        progress_percentage = VALUES(progress_percentage),
        started_at = IF(started_at IS NULL AND VALUES(status) IN ('IN PROGRESS', 'COMPLETED'), NOW(), started_at),
        completed_at = IF(VALUES(status) = 'COMPLETED', COALESCE(completed_at, NOW()), NULL)
    `, [userId, stageId, finalStatus, computedPercent, finalStatus, finalStatus]);
  }

  return {
    status: finalStatus,
    progressPercentage: computedPercent,
    isComplete
  };
}

exports.getUserStageStatus = getUserStageStatus;

// ============================================================================
// STUDENT LEARNING STAGE ENDPOINTS
// ============================================================================

// GET /api/learning/stages
exports.getStages = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [stages] = await pool.query(`
      SELECT 
        id,
        module_id,
        stage_number,
        COALESCE(title, stage_title) AS title,
        COALESCE(subtitle, stage_subtitle) AS subtitle,
        COALESCE(description, stage_description) AS description,
        display_order,
        is_active
      FROM learning_stages
      WHERE is_active = TRUE
      ORDER BY stage_number ASC
      LIMIT 5
    `);

    const stagesWithProgress = [];

    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      const prog = await getUserStageStatus(userId, st.id, st.stage_number);
      const isCompleted = prog.status === 'COMPLETED' || prog.isComplete || (prog.progressPercentage >= 100);

      stagesWithProgress.push({
        id: st.id,
        stage_number: st.stage_number,
        title: st.title,
        subtitle: st.subtitle,
        description: st.description,
        display_order: st.display_order,
        status: isCompleted ? 'COMPLETED' : prog.status,
        progress_percentage: isCompleted ? 100 : prog.progressPercentage,
        is_completed: isCompleted,
        is_unlocked: false
      });
    }

    // Determine unlocked status:
    // Stage 1 (index 0) is always unlocked.
    // Completing Stage k unlocks Stage k+1.
    // Any stage already in progress or completed is always accessible.
    let maxUnlockedIndex = 0;
    for (let i = 0; i < stagesWithProgress.length; i++) {
      if (stagesWithProgress[i].is_completed) {
        maxUnlockedIndex = Math.max(maxUnlockedIndex, i + 1);
      }
      if (stagesWithProgress[i].status === 'IN PROGRESS' || stagesWithProgress[i].progress_percentage > 0) {
        maxUnlockedIndex = Math.max(maxUnlockedIndex, i);
      }
    }

    for (let i = 0; i < stagesWithProgress.length; i++) {
      stagesWithProgress[i].is_unlocked = (i <= maxUnlockedIndex);
    }

    const completedStagesCount = stagesWithProgress.filter(s => s.is_completed).length;
    const totalStages = stages.length || 5;
    const overallProgress = Math.round((completedStagesCount / totalStages) * 100);

    // Current active stage: first unlocked stage not yet completed, or latest unlocked
    let currentStage = stagesWithProgress.find(s => s.is_unlocked && !s.is_completed)
      || stagesWithProgress.filter(s => s.is_unlocked).pop()
      || stagesWithProgress[0];

    res.status(200).json({
      success: true,
      module: {
        id: 1,
        title: 'Breathe. Support. Sing.',
        description: 'Breath management isn\'t about taking the biggest breath or holding a note for the longest time. It\'s about coordinating comfortable breathing with the musical phrase.',
        totalStages,
        completedStagesCount,
        overallProgress
      },
      currentStage,
      stages: stagesWithProgress
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/stages/:stageId
exports.getStageDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stageId = parseInt(req.params.stageId, 10);

    const [stageRows] = await pool.query(
      'SELECT id, module_id, stage_number, COALESCE(title, stage_title) AS title, COALESCE(subtitle, stage_subtitle) AS subtitle, COALESCE(description, stage_description) AS description FROM learning_stages WHERE id = ?',
      [stageId]
    );

    if (stageRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stage not found.' });
    }
    const stage = stageRows[0];

    // Sequential stage unlocking enforcement (Requirement 4)
    if (stage.stage_number > 1) {
      const [currentStageProg] = await pool.query(
        'SELECT status, progress_percentage FROM learning_stage_progress WHERE user_id = ? AND stage_id = ?',
        [userId, stageId]
      );
      const isAlreadyUnlockedOrStarted = currentStageProg.length > 0 &&
        (currentStageProg[0].status === 'IN PROGRESS' || currentStageProg[0].status === 'COMPLETED' || parseFloat(currentStageProg[0].progress_percentage || 0) > 0);

      if (!isAlreadyUnlockedOrStarted) {
        const [prevStageRows] = await pool.query(
          'SELECT id, stage_number FROM learning_stages WHERE module_id = ? AND stage_number = ? AND is_active = TRUE LIMIT 1',
          [stage.module_id || 1, stage.stage_number - 1]
        );
        if (prevStageRows.length > 0) {
          const prevProg = await getUserStageStatus(userId, prevStageRows[0].id, prevStageRows[0].stage_number);
          if (prevProg.status !== 'COMPLETED' && !prevProg.isComplete && (prevProg.progressPercentage || 0) < 100) {
            return res.status(403).json({
              success: false,
              isLocked: true,
              message: `Stage ${stage.stage_number} is locked. You must complete Stage ${prevStageRows[0].stage_number} first.`
            });
          }
        }
      }
    }

    // Fetch stage content
    const [contentList] = await pool.query(
      'SELECT * FROM learning_stage_content WHERE stage_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [stageId]
    );

    // Fetch user progress
    const progress = await getUserStageStatus(userId, stageId, stage.stage_number);

    // Fetch user's activity completions for this stage
    const [activityRows] = await pool.query(
      'SELECT activity_id, activity_type, status, completed_at FROM learning_activity_progress WHERE user_id = ? AND stage_id = ?',
      [userId, stageId]
    );

    const stageData = {
      ...stage,
      status: progress.status,
      progress_percentage: progress.progressPercentage,
      content: contentList,
      activities: activityRows
    };

    // Stage 1 Extra: Learning Objectives
    if (stage.stage_number === 1) {
      const [objectives] = await pool.query(
        'SELECT * FROM learning_objectives WHERE stage_id = ? AND is_active = TRUE ORDER BY display_order ASC',
        [stageId]
      );
      stageData.objectives = objectives;
    }

    // Stage 2 Extra: Recall Questions & User Answers
    if (stage.stage_number === 2) {
      const [questions] = await pool.query(
        'SELECT * FROM recall_questions WHERE stage_id = ? AND is_active = TRUE ORDER BY display_order ASC',
        [stageId]
      );
      const [answers] = await pool.query(
        'SELECT ra.*, rq.question FROM recall_answers ra JOIN recall_questions rq ON ra.question_id = rq.id WHERE ra.user_id = ? ORDER BY ra.submitted_at DESC',
        [userId]
      );
      stageData.recallQuestions = questions;
      stageData.userAnswers = answers;
    }

    // Stage 3 Extra: Breathing Tips & Songs
    if (stage.stage_number === 3) {
      const [tips] = await pool.query(
        'SELECT * FROM breathing_tips WHERE stage_id = ? AND is_active = TRUE ORDER BY display_order ASC',
        [stageId]
      );
      const [songs] = await pool.query(
        'SELECT * FROM learning_songs WHERE stage_id = ? AND is_active = TRUE ORDER BY display_order ASC',
        [stageId]
      );
      stageData.breathingTips = tips;
      stageData.songs = songs;
    }

    // Stage 4 Extra: Challenges, Written Assessment, Recordings
    if (stage.stage_number === 4) {
      const [challenges] = await pool.query(
        'SELECT id, stage_id, title, description, challenge_type, total_marks, passing_score, configuration_json, display_order FROM learning_challenges WHERE stage_id = ? AND is_active = TRUE ORDER BY display_order ASC',
        [stageId]
      );

      // Sanitize configuration_json for client (or parse JSON) & attach user attempts
      const challengesWithAttempts = await Promise.all(
        challenges.map(async (ch) => {
          let config = {};
          try {
            config = typeof ch.configuration_json === 'string' ? JSON.parse(ch.configuration_json) : ch.configuration_json;
          } catch (e) {
            config = {};
          }

          const [attempts] = await pool.query(
            'SELECT * FROM challenge_attempts WHERE user_id = ? AND challenge_id = ? ORDER BY attempt_number DESC',
            [userId, ch.id]
          );

          const bestAttempt = attempts.length > 0
            ? attempts.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), attempts[0])
            : null;

          return {
            id: ch.id,
            title: ch.title,
            description: ch.description,
            challenge_type: ch.challenge_type,
            total_marks: ch.total_marks,
            passing_score: ch.passing_score,
            configuration: config,
            attempts,
            latestAttempt: attempts[0] || null,
            bestAttempt
          };
        })
      );

      const [writtenSubmissions] = await pool.query(
        'SELECT * FROM written_assessments WHERE user_id = ? AND stage_id = ? ORDER BY submitted_at DESC LIMIT 1',
        [userId, stageId]
      );

      const [recordings] = await pool.query(
        'SELECT sr.*, ls.title AS song_title FROM student_recordings sr LEFT JOIN learning_songs ls ON sr.song_id = ls.id WHERE sr.user_id = ? AND sr.stage_id = ? ORDER BY sr.submitted_at DESC',
        [userId, stageId]
      );

      stageData.challenges = challengesWithAttempts;
      stageData.writtenAssessment = writtenSubmissions[0] || null;
      stageData.recordings = recordings;
    }

    // Stage 5 Extra: Feedback & Practice Summary
    if (stage.stage_number === 5) {
      const [feedback] = await pool.query(
        'SELECT * FROM learning_feedback WHERE user_id = ? AND stage_id = ? ORDER BY submitted_at DESC LIMIT 1',
        [userId, stageId]
      );
      const [practiceSummary] = await pool.query(
        'SELECT * FROM learning_practice_summaries WHERE user_id = ? AND stage_id = ? ORDER BY submitted_at DESC LIMIT 1',
        [userId, stageId]
      );

      stageData.feedback = feedback[0] || null;
      stageData.practiceSummary = practiceSummary[0] || null;
    }

    res.status(200).json({
      success: true,
      stage: stageData
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/stages/:stageId/start
exports.startStage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stageId = parseInt(req.params.stageId, 10);

    const [existing] = await pool.query(
      'SELECT status FROM learning_stage_progress WHERE user_id = ? AND stage_id = ?',
      [userId, stageId]
    );

    if (existing.length === 0 || existing[0].status === 'NOT STARTED') {
      await pool.query(`
        INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at)
        VALUES (?, ?, 'IN PROGRESS', 10, NOW())
        ON DUPLICATE KEY UPDATE status = 'IN PROGRESS', started_at = COALESCE(started_at, NOW())
      `, [userId, stageId]);
    }

    res.status(200).json({
      success: true,
      message: 'Stage started successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/activity-progress (or /activities/:activityId/complete)
exports.recordActivityProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { stage_id, activity_id, activity_type } = req.body;

    if (!stage_id || !activity_id) {
      return res.status(400).json({ success: false, message: 'stage_id and activity_id are required.' });
    }

    // Security check: Only passive milestones (video views, slide reads) can be marked via this endpoint.
    // Evaluative milestones (recordings, assessments, recall questions) MUST be submitted through their verified endpoints.
    const evaluativeActivities = [
      's4_student_recording',
      'song_recording',
      's4_challenge',
      'challenge_1',
      's4_reflection',
      's2_recall_questions',
      's5_practice_commitment'
    ];

    if (evaluativeActivities.includes(activity_id)) {
      await logSecurityEvent(req, {
        action: 'ATTEMPT_EVALUATIVE_ACTIVITY_BYPASS',
        status: 'BLOCKED',
        userId,
        details: { attemptedActivity: activity_id, stage_id }
      });
      return res.status(403).json({
        success: false,
        message: 'Security Alert: Evaluative assessments and recordings must be submitted through their verified endpoints.'
      });
    }

    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, ?, ?, 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
    `, [userId, stage_id, activity_id, activity_type || 'activity']);

    // Check and update stage progress
    const [stRow] = await pool.query('SELECT stage_number FROM learning_stages WHERE id = ?', [stage_id]);
    if (stRow.length > 0) {
      await getUserStageStatus(userId, stage_id, stRow[0].stage_number);
    }

    res.status(200).json({
      success: true,
      message: 'Activity progress updated.'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STAGE 2: KNOWLEDGE RECALL QUESTIONS
// ============================================================================

// GET /api/learning/recall/questions
exports.getRecallQuestions = async (req, res, next) => {
  try {
    const [questions] = await pool.query(`
      SELECT rq.*, ls.title AS stage_title 
      FROM recall_questions rq
      JOIN learning_stages ls ON rq.stage_id = ls.id
      WHERE rq.is_active = TRUE
      ORDER BY rq.display_order ASC
    `);

    res.status(200).json({
      success: true,
      questions
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/recall/answers
exports.saveRecallAnswers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { stage_id, answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Answers array cannot be empty.' });
    }

    const savedAnswers = [];
    for (const item of answers) {
      if (!item.question_id || !item.answer) continue;

      // Determine attempt number
      const [prevAttempts] = await pool.query(
        'SELECT MAX(attempt_number) AS max_attempt FROM recall_answers WHERE user_id = ? AND question_id = ?',
        [userId, item.question_id]
      );
      const nextAttempt = (prevAttempts[0].max_attempt || 0) + 1;

      const [insertRes] = await pool.query(`
        INSERT INTO recall_answers (user_id, question_id, answer, attempt_number, submitted_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [userId, item.question_id, item.answer.trim(), nextAttempt]);

      savedAnswers.push({
        id: insertRes.insertId,
        question_id: item.question_id,
        answer: item.answer,
        attempt_number: nextAttempt
      });
    }

    // Mark activity in learning_activity_progress
    if (stage_id) {
      await pool.query(`
        INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
        VALUES (?, ?, 's2_recall_questions', 'recall', 'COMPLETED', NOW())
        ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
      `, [userId, stage_id]);

      await pool.query(`
        INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at, completed_at)
        VALUES (?, 2, 'COMPLETED', 100, NOW(), NOW())
        ON DUPLICATE KEY UPDATE status = 'COMPLETED', progress_percentage = 100, completed_at = COALESCE(completed_at, NOW())
      `, [userId]).catch(() => {});

      await getUserStageStatus(userId, stage_id, 2);
    }

    res.status(200).json({
      success: true,
      message: 'Recall answers saved successfully to database.',
      savedAnswers
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/recall/answers
exports.getRecallAnswers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [answers] = await pool.query(`
      SELECT 
        ra.id,
        ra.question_id,
        rq.question,
        ra.answer,
        ra.attempt_number,
        ra.submitted_at
      FROM recall_answers ra
      JOIN recall_questions rq ON ra.question_id = rq.id
      WHERE ra.user_id = ?
      ORDER BY ra.submitted_at DESC
    `, [userId]);

    res.status(200).json({
      success: true,
      answers
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/recall/peer-board
exports.getPeerPinBoard = async (req, res, next) => {
  try {
    const stageId = parseInt(req.query.stage_id || '2', 10);

    const [questions] = await pool.query(
      'SELECT id, question, instructions, display_order FROM recall_questions WHERE stage_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [stageId]
    );

    const boards = {};

    // Standard palette matching reference image 2:
    // Navy, Teal, Coral/Terracotta, Warm Gold, Slate Blue
    const colors = ['#168B7A', '#1E3A5F', '#E05A47', '#C07D18', '#457B9D'];
    const fontSizes = ['1.85rem', '1.45rem', '1.25rem', '1.05rem', '0.92rem'];
    const fontWeights = [900, 850, 750, 700, 600];

    // Canonical words from reference image 2 for Question 1:
    const defaultQ1Words = [
      'diaphragm', 'breathe', 'support', 'control', 'posture',
      'lungs', 'belly', 'relax', 'air', 'stamina',
      'inhale', 'exhale', 'pitch', 'sustain'
    ];

    for (const q of questions) {
      const [rows] = await pool.query(`
        SELECT ra.id, ra.user_id, ra.answer, ra.submitted_at, u.username
        FROM recall_answers ra
        JOIN users u ON ra.user_id = u.id
        WHERE ra.question_id = ?
        ORDER BY ra.submitted_at DESC
        LIMIT 100
      `, [q.id]);

      const seenNorm = new Set();
      const uniqueItems = [];

      const addItem = (text, username, submittedAt) => {
        if (!text) return;
        const clean = text.trim();
        if (clean.length < 2) return;
        const norm = clean.toLowerCase();
        if (seenNorm.has(norm)) return; // Strictly no duplicates
        seenNorm.add(norm);

        const idx = uniqueItems.length;
        const color = colors[idx % colors.length];
        const fontSize = fontSizes[idx % fontSizes.length];
        const fontWeight = fontWeights[idx % fontWeights.length];

        uniqueItems.push({
          id: `pin_${q.id}_${uniqueItems.length + 1}`,
          text: clean,
          username: username || 'Classmate',
          submitted_at: submittedAt || new Date().toISOString(),
          color,
          fontSize,
          fontWeight
        });
      };

      for (const row of rows) {
        if (uniqueItems.length >= 20) break;
        const raw = (row.answer || '').trim();
        if (!raw) continue;

        if (q.display_order === 1 && (raw.includes(',') || raw.includes('\n'))) {
          const tokens = raw.split(/[,\n]+/).map(t => t.trim()).filter(Boolean);
          for (const token of tokens) {
            if (uniqueItems.length >= 20) break;
            addItem(token, row.username, row.submitted_at);
          }
        } else {
          addItem(raw, row.username, row.submitted_at);
        }
      }

      if (q.display_order === 1 && uniqueItems.length < 14) {
        for (const defWord of defaultQ1Words) {
          if (uniqueItems.length >= 20) break;
          addItem(defWord, 'Classmate', new Date().toISOString());
        }
      }

      boards[q.id] = uniqueItems.slice(0, 20); // Last 20 original data
    }

    res.status(200).json({
      success: true,
      boards
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STAGE 3: VIDEOS, BREATHING TIPS & SONG PRACTICE
// ============================================================================

// GET /api/learning/videos
exports.getVideos = async (req, res, next) => {
  try {
    const videos = await cacheService.wrap('curriculum:videos', async () => {
      const [rows] = await pool.query(`
        SELECT lsc.*, ls.stage_number, ls.title AS stage_title
        FROM learning_stage_content lsc
        JOIN learning_stages ls ON lsc.stage_id = ls.id
        WHERE lsc.content_type IN ('intro_video', 'teaching_video', 'video') AND lsc.is_active = TRUE
        ORDER BY ls.stage_number ASC, lsc.display_order ASC
      `);
      return rows;
    }, 1800, ['curriculum']);

    res.status(200).json({
      success: true,
      videos
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/tips
exports.getBreathingTips = async (req, res, next) => {
  try {
    const tips = await cacheService.wrap('curriculum:breathing_tips', async () => {
      const [rows] = await pool.query(
        'SELECT * FROM breathing_tips WHERE is_active = TRUE ORDER BY display_order ASC'
      );
      return rows;
    }, 1800, ['curriculum']);

    res.status(200).json({
      success: true,
      tips
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/songs
exports.getSongs = async (req, res, next) => {
  try {
    const songs = await cacheService.wrap('curriculum:learning_songs', async () => {
      const [rows] = await pool.query(
        'SELECT * FROM learning_songs WHERE is_active = TRUE ORDER BY display_order ASC'
      );
      return rows;
    }, 1800, ['curriculum']);

    res.status(200).json({
      success: true,
      songs
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/songs/:songId/practice
exports.recordSongPractice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const songId = parseInt(req.params.songId, 10);
    const { stage_id, duration_minutes } = req.body;

    const [songRows] = await pool.query('SELECT * FROM learning_songs WHERE id = ?', [songId]);
    if (songRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Song not found.' });
    }
    const song = songRows[0];
    const duration = parseInt(duration_minutes, 10) || 5;

    // Record in practice_sessions
    const [sessRes] = await pool.query(`
      INSERT INTO practice_sessions 
        (user_id, session_type, exercise_name, start_time, end_time, duration_minutes, duration_seconds, completion_status, notes, completed_at)
      VALUES 
        (?, 'Song Practice', ?, DATE_SUB(NOW(), INTERVAL ? MINUTE), NOW(), ?, ?, 'completed', ?, NOW())
    `, [userId, `Breath Management: ${song.title}`, duration, duration, duration * 60, `Practised diaphragmatic phrasing with song: ${song.title}`]);

    // Record activity
    const stageIdVal = stage_id || song.stage_id;
    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, ?, 'song_practice', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
    `, [userId, stageIdVal, `song_practice_${songId}`]);

    await getUserStageStatus(userId, stageIdVal, 3);

    res.status(200).json({
      success: true,
      message: 'Song practice recorded and added to your Practice Journal.',
      sessionId: sessRes.insertId,
      songTitle: song.title
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STAGE 4: CHALLENGES, WRITTEN ASSESSMENT & AUDIO RECORDINGS
// ============================================================================

// GET /api/learning/challenges
exports.getChallenges = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [challenges] = await pool.query(
      'SELECT * FROM learning_challenges WHERE is_active = TRUE ORDER BY display_order ASC'
    );

    const result = await Promise.all(
      challenges.map(async (ch) => {
        let config = {};
        try {
          config = typeof ch.configuration_json === 'string' ? JSON.parse(ch.configuration_json) : ch.configuration_json;
        } catch (e) {
          config = {};
        }

        const [attempts] = await pool.query(
          'SELECT * FROM challenge_attempts WHERE user_id = ? AND challenge_id = ? ORDER BY attempt_number DESC',
          [userId, ch.id]
        );

        const bestAttempt = attempts.length > 0
          ? attempts.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), attempts[0])
          : null;

        return {
          id: ch.id,
          stage_id: ch.stage_id,
          title: ch.title,
          description: ch.description,
          challenge_type: ch.challenge_type,
          total_marks: ch.total_marks,
          passing_score: ch.passing_score,
          configuration: config,
          latestAttempt: attempts[0] || null,
          bestAttempt
        };
      })
    );

    res.status(200).json({
      success: true,
      challenges: result
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/challenges/:challengeId/attempts
exports.submitChallengeAttempt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const challengeId = parseInt(req.params.challengeId, 10);
    const { answers, stage_id } = req.body;

    const [challengeRows] = await pool.query('SELECT * FROM learning_challenges WHERE id = ?', [challengeId]);
    if (challengeRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Challenge not found.' });
    }
    const challenge = challengeRows[0];

    let config = {};
    try {
      config = typeof challenge.configuration_json === 'string' ? JSON.parse(challenge.configuration_json) : challenge.configuration_json;
    } catch (e) {
      config = {};
    }

    // Evaluate answers
    let score = 0;
    let totalMarks = challenge.total_marks || 50;
    const itemFeedback = [];

    if (challenge.challenge_type === 'myth_or_fact') {
      const questions = config.questions || [];
      const marksPerQuestion = questions.length > 0 ? Math.round(totalMarks / questions.length) : 10;

      questions.forEach((q) => {
        const studentAns = (answers && answers[q.id]) ? String(answers[q.id]).trim().toUpperCase() : '';
        const correctAns = String(q.correctAnswer || '').trim().toUpperCase();
        const isCorrect = studentAns === correctAns;
        if (isCorrect) score += marksPerQuestion;

        itemFeedback.push({
          questionId: q.id,
          statement: q.statement,
          studentAnswer: studentAns,
          correctAnswer: correctAns,
          isCorrect,
          explanation: q.explanation
        });
      });
      // Cap at totalMarks
      score = Math.min(totalMarks, score);
    } else if (challenge.challenge_type === 'matching_pairs') {
      const pairs = config.pairs || [];
      const marksPerPair = pairs.length > 0 ? Math.round(totalMarks / pairs.length) : 10;

      pairs.forEach((p) => {
        const studentJob = answers && answers[p.id];
        const isCorrect = studentJob === p.job;
        if (isCorrect) score += marksPerPair;

        itemFeedback.push({
          pairId: p.id,
          part: p.part,
          studentJob: studentJob || '',
          correctJob: p.job,
          isCorrect
        });
      });
      score = Math.min(totalMarks, score);
    } else {
      // General Multiple Choice
      const questions = config.questions || [];
      const marksPerQ = questions.length > 0 ? Math.round(totalMarks / questions.length) : 10;

      questions.forEach((q) => {
        const studentAns = answers && answers[q.id];
        const isCorrect = studentAns === q.correctAnswer;
        if (isCorrect) score += marksPerQ;

        itemFeedback.push({
          questionId: q.id,
          question: q.question,
          studentAnswer: studentAns,
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation
        });
      });
      score = Math.min(totalMarks, score);
    }

    const percentage = totalMarks > 0 ? parseFloat(((score / totalMarks) * 100).toFixed(2)) : 0;
    const status = score >= (challenge.passing_score || 30) ? 'PASSED' : 'COMPLETED';

    // Increment attempt number without overwriting old attempts
    const [prevAttempts] = await pool.query(
      'SELECT MAX(attempt_number) AS max_attempt FROM challenge_attempts WHERE user_id = ? AND challenge_id = ?',
      [userId, challengeId]
    );
    const attemptNumber = (prevAttempts[0].max_attempt || 0) + 1;

    const [insertAttempt] = await pool.query(`
      INSERT INTO challenge_attempts 
        (user_id, challenge_id, attempt_number, answers_json, score, total_marks, percentage, status, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [userId, challengeId, attemptNumber, JSON.stringify(answers || {}), score, totalMarks, percentage, status]);

    // Track activity completion
    const stageIdVal = stage_id || challenge.stage_id;
    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, ?, 'challenge', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
    `, [userId, stageIdVal, `challenge_${challengeId}`]);

    await getUserStageStatus(userId, stageIdVal, 4);

    res.status(200).json({
      success: true,
      message: 'Challenge attempt submitted successfully.',
      attemptId: insertAttempt.insertId,
      attemptNumber,
      score,
      totalMarks,
      percentage,
      status,
      feedback: itemFeedback
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/assessments (Written assessment)
exports.submitWrittenAssessment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { stage_id, answer, prompt } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment answer is required.' });
    }

    const [insertRes] = await pool.query(`
      INSERT INTO written_assessments (user_id, stage_id, prompt, answer, submitted_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [userId, stage_id || 4, prompt || 'Explain what you have learned about breath management and how you will apply it when singing a song.', answer.trim()]);

    // Mark activity
    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, 's4_written_assessment', 'written_assessment', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
    `, [userId, stage_id || 4]);

    await getUserStageStatus(userId, stage_id || 4, 4);

    res.status(200).json({
      success: true,
      message: 'Written assessment submitted successfully.',
      submissionId: insertRes.insertId
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/assessments
exports.getWrittenAssessments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [assessments] = await pool.query(
      'SELECT * FROM written_assessments WHERE user_id = ? ORDER BY submitted_at DESC',
      [userId]
    );

    res.status(200).json({
      success: true,
      assessments
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/recordings (Student audio recording upload)
exports.uploadRecording = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { stage_id, song_id, duration_seconds, comments } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required.' });
    }

    const storageKey = req.file.filename;
    const fileType = req.file.mimetype || 'audio/webm';
    const duration = parseInt(duration_seconds, 10) || 0;

    // Check attempts count
    const [prevAttempts] = await pool.query(
      'SELECT MAX(attempt_number) AS max_attempt FROM student_recordings WHERE user_id = ? AND stage_id = ?',
      [userId, stage_id || 4]
    );
    const nextAttempt = (prevAttempts[0].max_attempt || 0) + 1;

    const [insertRec] = await pool.query(`
      INSERT INTO student_recordings 
        (user_id, stage_id, song_id, storage_key, file_type, duration_seconds, comments, attempt_number, submitted_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'SUBMITTED')
    `, [userId, stage_id || 4, song_id ? parseInt(song_id, 10) : null, storageKey, fileType, duration, comments || null, nextAttempt]);

    // Mark activity
    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, 's4_student_recording', 'audio_recording', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
    `, [userId, stage_id || 4]);

    await pool.query(`
      INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at, completed_at)
      VALUES (?, ?, 'COMPLETED', 100, NOW(), NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', progress_percentage = 100, completed_at = COALESCE(completed_at, NOW())
    `, [userId, stage_id || 4]).catch(() => {});

    await getUserStageStatus(userId, stage_id || 4, 4);

    res.status(201).json({
      success: true,
      message: 'Audio recording submitted successfully.',
      recordingId: insertRec.insertId,
      storageKey,
      attemptNumber: nextAttempt
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/recordings
exports.getRecordings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [recordings] = await pool.query(`
      SELECT sr.*, ls.title AS song_title 
      FROM student_recordings sr
      LEFT JOIN learning_songs ls ON sr.song_id = ls.id
      WHERE sr.user_id = ?
      ORDER BY sr.submitted_at DESC
    `, [userId]);

    res.status(200).json({
      success: true,
      recordings
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/recordings/:recordingId/audio (Stream audio with mandatory authentication & strict owner verification)
exports.streamRecordingAudio = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to stream recording.'
      });
    }

    const recordingId = parseInt(req.params.recordingId, 10);
    const [rows] = await pool.query('SELECT * FROM student_recordings WHERE id = ?', [recordingId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recording not found.' });
    }
    const rec = rows[0];

    // Authorization check: User can stream their own recording, or ADMIN/SUPERADMIN for teaching evaluation
    const isOwner = rec.user_id === req.user.id;
    const isTeacher = req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN';

    if (!isOwner && !isTeacher) {
      await logSecurityEvent(req, {
        action: 'UNAUTHORIZED_STUDENT_RECORDING_ACCESS_ATTEMPT',
        status: 'BLOCKED',
        userId: req.user.id,
        details: { targetRecordingId: recordingId, ownerId: rec.user_id }
      });
      return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to access this recording.' });
    }

    // Path traversal defense
    const safeFilename = path.basename(rec.storage_key);
    const filePath = path.resolve(__dirname, '../uploads/audio', safeFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Recording file missing from server.' });
    }

    // Security & privacy headers (OWASP ASVS / Student Privacy)
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', rec.file_type || 'audio/webm');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STAGE 5: FEEDBACK & PRACTICE SUMMARY (LINKED TO PRACTICE JOURNAL)
// ============================================================================

// POST /api/learning/feedback
exports.submitFeedback = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { stage_id, rating, useful_feedback, difficult_feedback, improvement_suggestions, additional_comments } = req.body;

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ success: false, message: 'Valid rating between 1 and 5 is required.' });
    }

    const [insertFb] = await pool.query(`
      INSERT INTO learning_feedback 
        (user_id, stage_id, rating, useful_feedback, difficult_feedback, improvement_suggestions, additional_comments, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [userId, stage_id || 5, ratingVal, useful_feedback || null, difficult_feedback || null, improvement_suggestions || null, additional_comments || null]);

    // Mark activity
    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, 's5_feedback', 'feedback', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
    `, [userId, stage_id || 5]);

    await getUserStageStatus(userId, stage_id || 5, 5);

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully.',
      feedbackId: insertFb.insertId
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/feedback
exports.getFeedback = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM learning_feedback WHERE user_id = ? ORDER BY submitted_at DESC',
      [userId]
    );

    res.status(200).json({
      success: true,
      feedback: rows
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/practice-summary
exports.submitPracticeSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      stage_id,
      activities,
      duration_minutes,
      practice_notes,
      learned_notes,
      difficulty_notes,
      next_practice_goal
    } = req.body;

    const duration = parseInt(duration_minutes, 10) || 15;
    const activitiesJson = JSON.stringify(Array.isArray(activities) ? activities : [activities].filter(Boolean));

    // Connect with existing Practice Journal: insert into practice_sessions without duplicates
    const [sessRes] = await pool.query(`
      INSERT INTO practice_sessions 
        (user_id, session_type, exercise_name, start_time, end_time, duration_minutes, duration_seconds, completion_status, notes, completed_at)
      VALUES 
        (?, 'Breath Management Practice', '5-Stage Learning Module Summary', DATE_SUB(NOW(), INTERVAL ? MINUTE), NOW(), ?, ?, 'completed', ?, NOW())
    `, [userId, duration, duration, duration * 60, practice_notes || 'Summary of completed Breath Management activities']);

    const practiceSessionId = sessRes.insertId;

    // Create linked reflection if reflections table exists
    try {
      await pool.query(`
        INSERT INTO practice_reflections (session_id, user_id, practice_type, duration_minutes, reflection, practice_date)
        VALUES (?, ?, 'Breath Management Practice', ?, ?, NOW())
      `, [practiceSessionId, userId, duration, learned_notes || practice_notes || 'Breath Management 5-Stage Practice Reflection']);
    } catch (refErr) {
      console.log('[Practice Summary] Reflection table note:', refErr.message);
    }

    // Insert into learning_practice_summaries
    const [insertSum] = await pool.query(`
      INSERT INTO learning_practice_summaries 
        (user_id, stage_id, practice_session_id, activities_json, duration_minutes, practice_notes, learned_notes, difficulty_notes, next_practice_goal, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [userId, stage_id || 5, practiceSessionId, activitiesJson, duration, practice_notes || null, learned_notes || null, difficulty_notes || null, next_practice_goal || null]);

    // Mark activity
    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, 's5_practice_summary', 'practice_summary', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
    `, [userId, stage_id || 5]);

    await getUserStageStatus(userId, stage_id || 5, 5);

    res.status(200).json({
      success: true,
      message: 'Practice summary submitted and linked to your Practice Journal.',
      summaryId: insertSum.insertId,
      practiceSessionId
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/practice-summary
exports.getPracticeSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM learning_practice_summaries WHERE user_id = ? ORDER BY submitted_at DESC',
      [userId]
    );

    res.status(200).json({
      success: true,
      summaries: rows
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// LEARNING MODULES (2-LEVEL NAVIGATION SYSTEM)
// ============================================================================

// GET /api/learning/modules
exports.getLearningModules = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all modules from database ordered by display_order
    const [moduleRows] = await pool.query(
      'SELECT id, module_number, category, title, description, route, thumbnail, is_available, display_order, status FROM learning_modules ORDER BY display_order ASC'
    );

    // Compute progress for available modules (Module 1)
    const [stages] = await pool.query(
      'SELECT id, stage_number FROM learning_stages WHERE is_active = TRUE ORDER BY stage_number ASC LIMIT 5'
    );
    let completedStages = 0;
    for (const st of stages) {
      const prog = await getUserStageStatus(userId, st.id, st.stage_number);
      if (prog.status === 'COMPLETED') completedStages++;
    }
    const totalStages = stages.length || 5;
    const module1Percent = Math.round((completedStages / totalStages) * 100);

    const modules = moduleRows.map((m) => {
      const isAvailable = Boolean(m.is_available);
      if (isAvailable && m.module_number === 1) {
        let status = 'AVAILABLE';
        if (completedStages === totalStages) {
          status = 'COMPLETED';
        } else if (completedStages > 0) {
          status = 'IN_PROGRESS';
        }
        return {
          id: m.id,
          module_number: m.module_number,
          category: m.category,
          title: m.title,
          description: m.description,
          route: m.route || '/learning/modules/breath-management',
          thumbnail: m.thumbnail,
          is_available: true,
          display_order: m.display_order,
          status,
          total_stages: totalStages,
          completed_stages: completedStages,
          progress_percentage: module1Percent,
          button_text: completedStages > 0 ? 'CONTINUE' : 'START'
        };
      } else {
        return {
          id: m.id,
          module_number: m.module_number,
          category: m.category,
          title: m.title,
          description: m.description,
          route: m.route,
          thumbnail: m.thumbnail,
          is_available: false,
          display_order: m.display_order,
          status: 'COMING_SOON',
          total_stages: 5,
          completed_stages: 0,
          progress_percentage: 0,
          button_text: 'COMING SOON'
        };
      }
    });

    res.status(200).json({
      success: true,
      modules
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/modules/:moduleId
exports.getLearningModuleById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;

    const [rows] = await pool.query(
      'SELECT id, module_number, category, title, description, route, thumbnail, is_available, display_order, status FROM learning_modules WHERE id = ? OR module_number = ? OR route LIKE ?',
      [moduleId, moduleId, `%${moduleId}%`]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found.'
      });
    }

    const mod = rows[0];

    // Backend authorization: reject access to locked modules
    if (!mod.is_available) {
      return res.status(403).json({
        success: false,
        message: 'This learning module will be available soon. Continue with Breath Management for now.',
        is_locked: true,
        module: {
          id: mod.id,
          module_number: mod.module_number,
          category: mod.category,
          title: mod.title,
          status: 'COMING_SOON',
          is_available: false
        }
      });
    }

    // Module 01 details and progress
    const [stages] = await pool.query(
      'SELECT id, stage_number, COALESCE(title, stage_title) AS title, COALESCE(subtitle, stage_subtitle) AS subtitle FROM learning_stages WHERE is_active = TRUE ORDER BY stage_number ASC LIMIT 5'
    );
    let completedStages = 0;
    const stageList = await Promise.all(
      stages.map(async (st) => {
        const prog = await getUserStageStatus(userId, st.id, st.stage_number);
        if (prog.status === 'COMPLETED') completedStages++;
        return {
          id: st.id,
          stage_number: st.stage_number,
          title: st.title,
          subtitle: st.subtitle,
          status: prog.status,
          progress_percentage: prog.progressPercentage
        };
      })
    );

    const totalStages = stages.length || 5;
    const progressPercentage = Math.round((completedStages / totalStages) * 100);

    res.status(200).json({
      success: true,
      module: {
        id: mod.id,
        module_number: mod.module_number,
        category: mod.category,
        title: mod.title,
        description: mod.description,
        route: mod.route,
        thumbnail: mod.thumbnail,
        is_available: true,
        status: completedStages === totalStages ? 'COMPLETED' : (completedStages > 0 ? 'IN_PROGRESS' : 'AVAILABLE'),
        total_stages: totalStages,
        completed_stages: completedStages,
        progress_percentage: progressPercentage,
        button_text: completedStages > 0 ? 'CONTINUE' : 'START',
        stages: stageList
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/modules/:moduleId/progress
exports.getLearningModuleProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;

    const [rows] = await pool.query(
      'SELECT id, module_number, is_available FROM learning_modules WHERE id = ? OR module_number = ? OR route LIKE ?',
      [moduleId, moduleId, `%${moduleId}%`]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    if (!rows[0].is_available) {
      return res.status(403).json({
        success: false,
        message: 'This learning module will be available soon. Continue with Breath Management for now.',
        is_locked: true
      });
    }

    // Return progress summary for Module 1
    return exports.getProgressSummary(req, res, next);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PROGRESS & DASHBOARD INTEGRATION
// ============================================================================

// GET /api/learning/progress/summary
exports.getProgressSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch 5 stages with user status
    const [stages] = await pool.query(
      'SELECT id, stage_number, COALESCE(title, stage_title) AS title, COALESCE(subtitle, stage_subtitle) AS subtitle FROM learning_stages WHERE is_active = TRUE ORDER BY stage_number ASC LIMIT 5'
    );

    let completedStages = 0;
    const stageDetails = await Promise.all(
      stages.map(async (st) => {
        const prog = await getUserStageStatus(userId, st.id, st.stage_number);
        if (prog.status === 'COMPLETED') completedStages++;
        return {
          id: st.id,
          stage_number: st.stage_number,
          title: st.title,
          subtitle: st.subtitle,
          status: prog.status,
          progress_percentage: prog.progressPercentage
        };
      })
    );

    const totalStages = stages.length || 5;
    const progressPercent = Math.round((completedStages / totalStages) * 100);

    // 2. Challenge scores
    const [challengeAttempts] = await pool.query(
      'SELECT score, total_marks, percentage, status, completed_at FROM challenge_attempts WHERE user_id = ? ORDER BY completed_at DESC',
      [userId]
    );

    const totalChallengesCompleted = challengeAttempts.length;
    const latestChallengeScore = challengeAttempts.length > 0 ? challengeAttempts[0].score : null;
    const latestChallengePercentage = challengeAttempts.length > 0 ? challengeAttempts[0].percentage : null;

    let bestChallengeScore = null;
    let bestChallengePercentage = null;
    if (challengeAttempts.length > 0) {
      const best = challengeAttempts.reduce((p, c) => (parseFloat(c.percentage) > parseFloat(p.percentage) ? c : p), challengeAttempts[0]);
      bestChallengeScore = best.score;
      bestChallengePercentage = best.percentage;
    }

    // 3. Written assessments
    const [writtenCount] = await pool.query(
      'SELECT COUNT(*) AS count, MAX(submitted_at) AS last_submitted FROM written_assessments WHERE user_id = ?',
      [userId]
    );

    // 4. Recordings
    const [recCount] = await pool.query(
      'SELECT COUNT(*) AS count, MAX(submitted_at) AS last_submitted FROM student_recordings WHERE user_id = ?',
      [userId]
    );

    // 5. Practice sessions & minutes
    const [practiceRows] = await pool.query(
      "SELECT COUNT(*) AS sessions_count, COALESCE(SUM(duration_minutes), 0) AS total_minutes FROM practice_sessions WHERE user_id = ? AND completion_status = 'completed'",
      [userId]
    );

    // 6. Feedback
    const [fbRows] = await pool.query(
      'SELECT COUNT(*) AS count, MAX(submitted_at) AS last_submitted FROM learning_feedback WHERE user_id = ?',
      [userId]
    );

    // Current stage
    const currentStage = stageDetails.find(s => s.status !== 'COMPLETED') || stageDetails[0];

    res.status(200).json({
      success: true,
      summary: {
        totalStages,
        completedStages,
        overallProgress: progressPercent,
        currentStageNumber: currentStage ? currentStage.stage_number : 1,
        currentStageTitle: currentStage ? currentStage.title : 'GAIN ATTENTION',
        stages: stageDetails,
        challenges: {
          totalCompleted: totalChallengesCompleted,
          latestScore: latestChallengeScore,
          latestPercentage: latestChallengePercentage,
          bestScore: bestChallengeScore,
          bestPercentage: bestChallengePercentage
        },
        writtenAssessmentsCount: writtenCount[0].count || 0,
        hasWrittenAssessment: (writtenCount[0].count || 0) > 0,
        recordingsCount: recCount[0].count || 0,
        totalPracticeMinutes: parseInt(practiceRows[0].total_minutes || 0, 10),
        totalPracticeSessions: parseInt(practiceRows[0].sessions_count || 0, 10),
        hasFeedback: (fbRows[0].count || 0) > 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADMIN CONTENT MANAGEMENT (CRUD FOR ALL 5 STAGES)
// ============================================================================

// GET /api/admin/learning/curriculum
exports.getCurriculumForAdmin = async (req, res, next) => {
  try {
    const [stages] = await pool.query(
      'SELECT * FROM learning_stages WHERE is_active = TRUE ORDER BY stage_number ASC LIMIT 5'
    );

    const fullCurriculum = await Promise.all(
      stages.map(async (st) => {
        const [content] = await pool.query(
          'SELECT * FROM learning_stage_content WHERE stage_id = ? ORDER BY display_order ASC',
          [st.id]
        );

        let objectives = [];
        let recallQuestions = [];
        let tips = [];
        let songs = [];
        let challenges = [];

        if (st.stage_number === 1) {
          const [objs] = await pool.query('SELECT * FROM learning_objectives WHERE stage_id = ? ORDER BY display_order ASC', [st.id]);
          objectives = objs;
        } else if (st.stage_number === 2) {
          const [qs] = await pool.query('SELECT * FROM recall_questions WHERE stage_id = ? ORDER BY display_order ASC', [st.id]);
          recallQuestions = qs;
        } else if (st.stage_number === 3) {
          const [t] = await pool.query('SELECT * FROM breathing_tips WHERE stage_id = ? ORDER BY display_order ASC', [st.id]);
          const [s] = await pool.query('SELECT * FROM learning_songs WHERE stage_id = ? ORDER BY display_order ASC', [st.id]);
          tips = t;
          songs = s;
        } else if (st.stage_number === 4) {
          const [ch] = await pool.query('SELECT * FROM learning_challenges WHERE stage_id = ? ORDER BY display_order ASC', [st.id]);
          challenges = ch;
        }

        return {
          ...st,
          content,
          objectives,
          recallQuestions,
          tips,
          songs,
          challenges
        };
      })
    );

    res.status(200).json({
      success: true,
      stages: fullCurriculum
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/learning/stages/:stageId
exports.updateStageForAdmin = async (req, res, next) => {
  try {
    const stageId = parseInt(req.params.stageId, 10);
    const { title, subtitle, description, is_active } = req.body;

    await pool.query(`
      UPDATE learning_stages
      SET title = COALESCE(?, title),
          stage_title = COALESCE(?, stage_title),
          subtitle = COALESCE(?, subtitle),
          stage_subtitle = COALESCE(?, stage_subtitle),
          description = COALESCE(?, description),
          stage_description = COALESCE(?, stage_description),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [title, title, subtitle, subtitle, description, description, is_active, stageId]);

    await cacheService.invalidateTag('curriculum');

    res.status(200).json({
      success: true,
      message: 'Stage updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/learning/content
exports.createStageContent = async (req, res, next) => {
  try {
    const { stage_id, content_type, title, description, content_url, content_data, display_order, is_required } = req.body;

    const [result] = await pool.query(`
      INSERT INTO learning_stage_content (stage_id, content_type, title, description, content_url, content_data, display_order, is_required, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [stage_id, content_type, title, description || null, content_url || null, typeof content_data === 'object' ? JSON.stringify(content_data) : content_data, display_order || 1, is_required !== false]);

    res.status(201).json({
      success: true,
      message: 'Stage content created.',
      contentId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/learning/content/:id
exports.updateStageContent = async (req, res, next) => {
  try {
    const contentId = parseInt(req.params.id, 10);
    const { title, description, content_url, content_data, display_order, is_required, is_active } = req.body;

    await pool.query(`
      UPDATE learning_stage_content
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          content_url = COALESCE(?, content_url),
          content_data = COALESCE(?, content_data),
          display_order = COALESCE(?, display_order),
          is_required = COALESCE(?, is_required),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [title, description, content_url, typeof content_data === 'object' ? JSON.stringify(content_data) : content_data, display_order, is_required, is_active, contentId]);

    res.status(200).json({
      success: true,
      message: 'Content updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Objectives CRUD & Student Interactive Flip Cards
exports.getStageObjectives = async (req, res, next) => {
  try {
    const stageId = parseInt(req.params.stageId || 1, 10);
    const userId = req.user?.id;
    const [objectives] = await pool.query(
      'SELECT * FROM learning_objectives WHERE stage_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [stageId]
    );

    let acknowledged = false;
    if (userId) {
      const [ackRows] = await pool.query(
        'SELECT status FROM learning_activity_progress WHERE user_id = ? AND stage_id = ? AND activity_id = ?',
        [userId, stageId, 's1_objectives']
      );
      acknowledged = ackRows.length > 0 && ackRows[0].status === 'COMPLETED';
    }

    res.status(200).json({
      success: true,
      stage_id: stageId,
      objectives,
      acknowledged
    });
  } catch (error) {
    next(error);
  }
};

exports.acknowledgeStageObjectives = async (req, res, next) => {
  try {
    const stageId = parseInt(req.params.stageId || 1, 10);
    const userId = req.user.id;

    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, 's1_objectives', 'objectives', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
    `, [userId, stageId]);

    await pool.query(`
      INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at, completed_at)
      VALUES (?, ?, 'COMPLETED', 100, NOW(), NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', progress_percentage = 100, completed_at = COALESCE(completed_at, NOW())
    `, [userId, stageId]).catch(() => {});

    // Update user stage status
    const [stRow] = await pool.query('SELECT stage_number FROM learning_stages WHERE id = ?', [stageId]);
    if (stRow.length > 0) {
      await getUserStageStatus(userId, stageId, stRow[0].stage_number);
    }

    res.status(200).json({
      success: true,
      message: 'Objectives acknowledged successfully.',
      acknowledged: true
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminStageObjectives = async (req, res, next) => {
  try {
    const stageId = parseInt(req.params.stageId || req.query.stage_id || 1, 10);
    const [objectives] = await pool.query(
      'SELECT * FROM learning_objectives WHERE stage_id = ? ORDER BY display_order ASC',
      [stageId]
    );
    res.status(200).json({ success: true, objectives });
  } catch (error) {
    next(error);
  }
};

exports.createObjective = async (req, res, next) => {
  try {
    const { stage_id, title, title_line_1, title_line_2, description, icon, display_order, is_active } = req.body;
    const t1 = title_line_1 || (title ? title.split(' ')[0] : 'Maintain');
    const t2 = title_line_2 || (title ? title.split(' ').slice(1).join(' ') : 'POSTURE');
    const fullTitle = title || `${t1} ${t2}`;
    const [result] = await pool.query(`
      INSERT INTO learning_objectives (stage_id, title, title_line_1, title_line_2, description, icon, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      stage_id || 1,
      fullTitle,
      t1,
      t2,
      description || null,
      icon || 'Lightbulb',
      display_order || 1,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    ]);
    res.status(201).json({ success: true, id: result.insertId, message: 'Objective created successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.updateObjective = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, title_line_1, title_line_2, description, icon, display_order, is_active } = req.body;
    const [current] = await pool.query('SELECT * FROM learning_objectives WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Objective not found.' });
    }

    const t1 = title_line_1 !== undefined ? title_line_1 : current[0].title_line_1;
    const t2 = title_line_2 !== undefined ? title_line_2 : current[0].title_line_2;
    const fullTitle = title !== undefined ? title : (t1 && t2 ? `${t1} ${t2}` : current[0].title);
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : current[0].is_active;

    await pool.query(`
      UPDATE learning_objectives
      SET title = ?,
          title_line_1 = ?,
          title_line_2 = ?,
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          display_order = COALESCE(?, display_order),
          is_active = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [
      fullTitle,
      t1,
      t2,
      description !== undefined ? description : current[0].description,
      icon !== undefined ? icon : current[0].icon,
      display_order !== undefined ? display_order : current[0].display_order,
      activeVal,
      id
    ]);
    res.status(200).json({ success: true, message: 'Objective updated successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteObjective = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM learning_objectives WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Objective deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// Recall Questions CRUD
exports.createRecallQuestion = async (req, res, next) => {
  try {
    const { stage_id, question, instructions, display_order } = req.body;
    const [result] = await pool.query(`
      INSERT INTO recall_questions (stage_id, question, instructions, display_order, is_active)
      VALUES (?, ?, ?, ?, TRUE)
    `, [stage_id || 2, question, instructions || null, display_order || 1]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.updateRecallQuestion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { question, instructions, display_order, is_active } = req.body;
    await pool.query(`
      UPDATE recall_questions
      SET question = COALESCE(?, question),
          instructions = COALESCE(?, instructions),
          display_order = COALESCE(?, display_order),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [question, instructions, display_order, is_active, id]);
    res.status(200).json({ success: true, message: 'Question updated.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteRecallQuestion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM recall_questions WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Question deleted.' });
  } catch (error) {
    next(error);
  }
};

// Breathing Tips CRUD
exports.createTip = async (req, res, next) => {
  try {
    const { stage_id, title, description, icon, display_order } = req.body;
    const [result] = await pool.query(`
      INSERT INTO breathing_tips (stage_id, title, description, icon, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `, [stage_id || 3, title, description, icon || 'Wind', display_order || 1]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.updateTip = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, description, icon, display_order, is_active } = req.body;
    await pool.query(`
      UPDATE breathing_tips
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          display_order = COALESCE(?, display_order),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [title, description, icon, display_order, is_active, id]);
    res.status(200).json({ success: true, message: 'Tip updated.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteTip = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM breathing_tips WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Tip deleted.' });
  } catch (error) {
    next(error);
  }
};

// Songs CRUD
exports.createSong = async (req, res, next) => {
  try {
    const { stage_id, title, artist, description, media_type, media_url, instructions, display_order } = req.body;
    const [result] = await pool.query(`
      INSERT INTO learning_songs (stage_id, title, artist, description, media_type, media_url, instructions, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [stage_id || 3, title, artist || null, description || null, media_type || 'audio', media_url || null, instructions || null, display_order || 1]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.updateSong = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, artist, description, media_type, media_url, instructions, display_order, is_active } = req.body;
    await pool.query(`
      UPDATE learning_songs
      SET title = COALESCE(?, title),
          artist = COALESCE(?, artist),
          description = COALESCE(?, description),
          media_type = COALESCE(?, media_type),
          media_url = COALESCE(?, media_url),
          instructions = COALESCE(?, instructions),
          display_order = COALESCE(?, display_order),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [title, artist, description, media_type, media_url, instructions, display_order, is_active, id]);
    res.status(200).json({ success: true, message: 'Song updated.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteSong = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM learning_songs WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Song deleted.' });
  } catch (error) {
    next(error);
  }
};

// Challenges CRUD
exports.createChallenge = async (req, res, next) => {
  try {
    const { stage_id, title, description, challenge_type, total_marks, passing_score, configuration } = req.body;
    const configStr = typeof configuration === 'object' ? JSON.stringify(configuration) : configuration;
    const [result] = await pool.query(`
      INSERT INTO learning_challenges (stage_id, title, description, challenge_type, total_marks, passing_score, configuration_json, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [stage_id || 4, title, description || null, challenge_type, total_marks || 50, passing_score || 30, configStr]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.updateChallenge = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, description, challenge_type, total_marks, passing_score, configuration, is_active } = req.body;
    const configStr = configuration ? (typeof configuration === 'object' ? JSON.stringify(configuration) : configuration) : null;
    await pool.query(`
      UPDATE learning_challenges
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          challenge_type = COALESCE(?, challenge_type),
          total_marks = COALESCE(?, total_marks),
          passing_score = COALESCE(?, passing_score),
          configuration_json = COALESCE(?, configuration_json),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [title, description, challenge_type, total_marks, passing_score, configStr, is_active, id]);
    res.status(200).json({ success: true, message: 'Challenge updated.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteChallenge = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM learning_challenges WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Challenge deleted.' });
  } catch (error) {
    next(error);
  }
};

// Admin view student submissions across the 5 stages
exports.getStudentSubmissionsForAdmin = async (req, res, next) => {
  try {
    const [recallAnswers] = await pool.query(`
      SELECT ra.*, u.username, u.email, rq.question 
      FROM recall_answers ra
      JOIN users u ON ra.user_id = u.id
      JOIN recall_questions rq ON ra.question_id = rq.id
      ORDER BY ra.submitted_at DESC
      LIMIT 50
    `);

    const [challengeAttempts] = await pool.query(`
      SELECT ca.*, u.username, u.email, lc.title AS challenge_title, lc.challenge_type
      FROM challenge_attempts ca
      JOIN users u ON ca.user_id = u.id
      JOIN learning_challenges lc ON ca.challenge_id = lc.id
      ORDER BY ca.completed_at DESC
      LIMIT 50
    `);

    const [writtenAssessments] = await pool.query(`
      SELECT wa.*, u.username, u.email
      FROM written_assessments wa
      JOIN users u ON wa.user_id = u.id
      ORDER BY wa.submitted_at DESC
      LIMIT 50
    `);

    const [recordings] = await pool.query(`
      SELECT sr.*, u.username, u.email, ls.title AS song_title
      FROM student_recordings sr
      JOIN users u ON sr.user_id = u.id
      LEFT JOIN learning_songs ls ON sr.song_id = ls.id
      ORDER BY sr.submitted_at DESC
      LIMIT 50
    `);

    const [feedbackList] = await pool.query(`
      SELECT lf.*, u.username, u.email
      FROM learning_feedback lf
      JOIN users u ON lf.user_id = u.id
      ORDER BY lf.submitted_at DESC
      LIMIT 50
    `);

    res.status(200).json({
      success: true,
      submissions: {
        recallAnswers,
        challengeAttempts,
        writtenAssessments,
        recordings,
        feedback: feedbackList
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin grade written assessment
exports.gradeWrittenAssessment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { assessment_score, reviewer_feedback } = req.body;

    await pool.query(`
      UPDATE written_assessments
      SET assessment_score = ?,
          reviewer_feedback = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [assessment_score, reviewer_feedback, id]);

    res.status(200).json({
      success: true,
      message: 'Assessment graded successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STAGE 03 PART 02: INTERACTIVE PRACTICE (POSTURE / BREATHE / SONG)
// ============================================================================

exports.getPartSection = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stageId = req.params.stageId ? parseInt(req.params.stageId, 10) : 3;
    const partNumber = req.params.partNumber ? parseInt(req.params.partNumber, 10) : 2;

    const [partRows] = await pool.query(
      'SELECT * FROM learning_part_sections WHERE (stage_id = ? OR 1=1) AND part_number = ? AND is_active = TRUE ORDER BY id ASC LIMIT 1',
      [stageId, partNumber]
    );

    if (partRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Learning part not found.' });
    }

    const part = partRows[0];

    const [tabs] = await pool.query(
      'SELECT * FROM learning_part_tabs WHERE part_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [part.id]
    );

    const [indicators] = await pool.query(
      'SELECT * FROM posture_indicators WHERE part_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [part.id]
    );

    const [checklist] = await pool.query(
      'SELECT * FROM posture_checklist_items WHERE part_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [part.id]
    );

    const [studentPostureProg] = await pool.query(
      'SELECT * FROM student_posture_progress WHERE user_id = ? AND part_id = ?',
      [userId, part.id]
    );

    const [studentPartProg] = await pool.query(
      'SELECT * FROM student_part_progress WHERE user_id = ? AND part_id = ?',
      [userId, part.id]
    );

    const [breathingLevels] = await pool.query(
      'SELECT * FROM breathing_practice_levels WHERE is_active = TRUE ORDER BY display_order ASC'
    );

    let postureProgress = null;
    if (studentPostureProg.length > 0) {
      const p = studentPostureProg[0];
      let checkedItems = [];
      try {
        checkedItems = typeof p.checklist_progress_json === 'string'
          ? JSON.parse(p.checklist_progress_json)
          : (p.checklist_progress_json || []);
      } catch (e) {
        checkedItems = [];
      }
      postureProgress = {
        completed_count: p.completed_count,
        total_count: p.total_count,
        status: p.status,
        checked_items: checkedItems,
        completed_at: p.completed_at
      };
    } else {
      postureProgress = {
        completed_count: 0,
        total_count: checklist.length || 5,
        status: 'NOT_STARTED',
        checked_items: [],
        completed_at: null
      };
    }

    res.status(200).json({
      success: true,
      part,
      tabs: tabs.map(t => {
        let parsed = t.content_data;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch (e) { }
        }
        return { ...t, content_data: parsed };
      }),
      indicators,
      checklist,
      breathingLevels,
      postureProgress,
      partProgress: studentPartProg
    });
  } catch (error) {
    next(error);
  }
};

exports.getPostureTab = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partNumber = req.params.partNumber ? parseInt(req.params.partNumber, 10) : 2;

    const [partRows] = await pool.query(
      'SELECT * FROM learning_part_sections WHERE part_number = ? AND is_active = TRUE ORDER BY id ASC LIMIT 1',
      [partNumber]
    );
    if (partRows.length === 0) return res.status(404).json({ success: false, message: 'Part not found' });
    const part = partRows[0];

    const [tabRows] = await pool.query(
      'SELECT * FROM learning_part_tabs WHERE part_id = ? AND tab_key = "posture" LIMIT 1',
      [part.id]
    );
    const [indicators] = await pool.query(
      'SELECT * FROM posture_indicators WHERE part_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [part.id]
    );
    const [checklist] = await pool.query(
      'SELECT * FROM posture_checklist_items WHERE part_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [part.id]
    );
    const [prog] = await pool.query(
      'SELECT * FROM student_posture_progress WHERE user_id = ? AND part_id = ?',
      [userId, part.id]
    );

    let studentProgress = {
      completed_count: 0,
      total_count: checklist.length,
      status: 'NOT_STARTED',
      checked_items: []
    };
    if (prog.length > 0) {
      let checked = [];
      try {
        checked = typeof prog[0].checklist_progress_json === 'string'
          ? JSON.parse(prog[0].checklist_progress_json)
          : (prog[0].checklist_progress_json || []);
      } catch (e) { checked = []; }
      studentProgress = {
        completed_count: prog[0].completed_count,
        total_count: prog[0].total_count,
        status: prog[0].status,
        checked_items: checked
      };
    }

    res.status(200).json({
      success: true,
      tab: tabRows[0] || null,
      indicators,
      checklist,
      studentProgress
    });
  } catch (error) {
    next(error);
  }
};

exports.getBreatheTab = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partNumber = req.params.partNumber ? parseInt(req.params.partNumber, 10) : 2;

    const [partRows] = await pool.query(
      'SELECT * FROM learning_part_sections WHERE part_number = ? AND is_active = TRUE ORDER BY id ASC LIMIT 1',
      [partNumber]
    );
    if (partRows.length === 0) return res.status(404).json({ success: false, message: 'Part not found' });
    const part = partRows[0];

    const [tabRows] = await pool.query(
      'SELECT * FROM learning_part_tabs WHERE part_id = ? AND tab_key = "breathe" LIMIT 1',
      [part.id]
    );
    const [partProg] = await pool.query(
      'SELECT * FROM student_part_progress WHERE user_id = ? AND part_id = ? AND tab_key = "breathe"',
      [userId, part.id]
    );
    const [levels] = await pool.query(
      'SELECT * FROM breathing_practice_levels WHERE is_active = TRUE ORDER BY display_order ASC'
    );

    const tab = tabRows[0] || null;
    if (tab && typeof tab.content_data === 'string') {
      try { tab.content_data = JSON.parse(tab.content_data); } catch (e) { }
    }

    res.status(200).json({
      success: true,
      tab,
      levels,
      progress: partProg[0] || { status: 'NOT_STARTED', progress_percentage: 0 }
    });
  } catch (error) {
    next(error);
  }
};

exports.getSongTab = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const partNumber = req.params.partNumber ? parseInt(req.params.partNumber, 10) : 2;

    const [partRows] = await pool.query(
      'SELECT * FROM learning_part_sections WHERE part_number = ? AND is_active = TRUE ORDER BY id ASC LIMIT 1',
      [partNumber]
    );
    if (partRows.length === 0) return res.status(404).json({ success: false, message: 'Part not found' });
    const part = partRows[0];

    const [tabRows] = await pool.query(
      'SELECT * FROM learning_part_tabs WHERE part_id = ? AND tab_key = "song" LIMIT 1',
      [part.id]
    );
    const tab = tabRows[0] || null;
    if (tab && typeof tab.content_data === 'string') {
      try { tab.content_data = JSON.parse(tab.content_data); } catch (e) { }
    }

    // Fetch Song Content (Snowman)
    const [songRows] = await pool.query(
      'SELECT * FROM song_practice_content WHERE (part_id = ? OR part_id = 1) AND is_active = TRUE ORDER BY (part_id = ?) DESC, id ASC LIMIT 1',
      [part.id, part.id]
    );
    const song = songRows[0] || {
      id: 1,
      part_id: part.id,
      song_title: 'Snowman',
      artist_name: 'Sia',
      subtitle: 'Audio guide',
      instructions: "Now let's use your breathing in a real song. Listen once. Then choose your level and sing along, taking a breath wherever you see a tick on the score.\n\nStart at Beginner and move up when it feels comfortable.",
      audio_file: '/audio/snowman-vocal-guide.wav',
      default_repeat_count: 1,
      min_repeat_count: 1,
      max_repeat_count: 3,
      continuous_loop_enabled: true
    };

    // Fetch Levels and Markers
    const [levels] = await pool.query(
      'SELECT * FROM song_practice_levels WHERE song_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [song.id]
    );

    // Fetch Student Progress for all levels if user is authenticated
    let userProgressMap = {};
    if (userId) {
      const [progRows] = await pool.query(
        'SELECT * FROM student_song_progress WHERE user_id = ? AND song_id = ?',
        [userId, song.id]
      );
      for (const p of progRows) {
        if (typeof p.marked_notes === 'string') {
          try { p.marked_notes = JSON.parse(p.marked_notes); } catch (e) { p.marked_notes = []; }
        }
        userProgressMap[p.level_id] = p;
      }
    }

    // Attach markers and student progress to each level
    const enhancedLevels = [];
    for (const lvl of levels) {
      const [markers] = await pool.query(
        'SELECT * FROM song_score_markers WHERE level_id = ? ORDER BY phrase_number ASC, display_order ASC',
        [lvl.id]
      );
      const prog = userProgressMap[lvl.id] || {
        marked_notes: [],
        total_marked_notes: 0,
        audio_listening_progress: 0,
        repeat_count: lvl.default_repeat_count || 1,
        completion_status: 'NOT_STARTED'
      };

      enhancedLevels.push({
        ...lvl,
        markers,
        progress: prog
      });
    }

    let partProg = { status: 'NOT_STARTED', progress_percentage: 0 };
    let hasCompletedSession = false;
    if (userId) {
      const [pRows] = await pool.query(
        'SELECT * FROM student_part_progress WHERE user_id = ? AND part_id = ? AND tab_key = "song"',
        [userId, part.id]
      );
      if (pRows.length > 0) partProg = pRows[0];

      const [sessRows] = await pool.query(
        'SELECT id FROM student_song_sessions WHERE user_id = ? AND session_status = "COMPLETED" LIMIT 1',
        [userId]
      );
      if (sessRows.length > 0 || partProg.status === 'COMPLETED') {
        hasCompletedSession = true;
      }
    }

    res.status(200).json({
      success: true,
      tab,
      song,
      levels: enhancedLevels,
      progress: partProg,
      has_completed_session: hasCompletedSession
    });
  } catch (error) {
    next(error);
  }
};

exports.savePostureProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partNumber = req.params.partNumber ? parseInt(req.params.partNumber, 10) : 2;
    const { checked_items, is_completed } = req.body;

    const [partRows] = await pool.query(
      'SELECT id, stage_id FROM learning_part_sections WHERE part_number = ? AND is_active = TRUE LIMIT 1',
      [partNumber]
    );
    if (partRows.length === 0) return res.status(404).json({ success: false, message: 'Part not found' });
    const part = partRows[0];

    const [checklistItems] = await pool.query(
      'SELECT id, is_required FROM posture_checklist_items WHERE part_id = ? AND is_active = TRUE',
      [part.id]
    );

    const checkedArray = Array.isArray(checked_items) ? checked_items : [];
    const totalCount = checklistItems.length || 5;
    const completedCount = checkedArray.length;

    // Check if all required items are checked
    const requiredIds = checklistItems.filter(i => i.is_required).map(i => i.id);
    const allRequiredChecked = requiredIds.every(id => checkedArray.includes(id));
    const status = (is_completed || (allRequiredChecked && completedCount === totalCount))
      ? 'COMPLETED'
      : (completedCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');

    const completedAt = status === 'COMPLETED' ? new Date() : null;

    await pool.query(`
      INSERT INTO student_posture_progress (
        user_id, part_id, checklist_progress_json, completed_count, total_count, status, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
      ON DUPLICATE KEY UPDATE
        checklist_progress_json = VALUES(checklist_progress_json),
        completed_count = VALUES(completed_count),
        total_count = VALUES(total_count),
        status = VALUES(status),
        completed_at = CASE WHEN VALUES(status) = 'COMPLETED' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    `, [userId, part.id, JSON.stringify(checkedArray), completedCount, totalCount, status, completedAt]);

    // Update tab progress for 'posture'
    await pool.query(`
      INSERT INTO student_part_progress (
        user_id, part_id, tab_key, status, progress_percentage, completed_at
      ) VALUES (?, ?, 'posture', ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        progress_percentage = VALUES(progress_percentage),
        completed_at = VALUES(completed_at),
        updated_at = NOW()
    `, [
      userId,
      part.id,
      status,
      Math.round((completedCount / totalCount) * 100),
      completedAt
    ]);

    // Log to activity progress
    if (completedCount > 0) {
      const actStatus = status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';
      await pool.query(`
        INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
        VALUES (?, ?, 's3_posture', 'practice', ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          completed_at = VALUES(completed_at)
      `, [userId, part.stage_id, actStatus, completedAt]);
    }

    res.status(200).json({
      success: true,
      message: 'Posture checklist progress saved.',
      progress: {
        completed_count: completedCount,
        total_count: totalCount,
        checked_items: checkedArray,
        status,
        all_required_checked: allRequiredChecked
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.completePartTab = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partNumber = req.params.partNumber ? parseInt(req.params.partNumber, 10) : 2;
    const { tab_key, duration_minutes } = req.body;

    const [partRows] = await pool.query(
      'SELECT id, stage_id FROM learning_part_sections WHERE part_number = ? AND is_active = TRUE LIMIT 1',
      [partNumber]
    );
    if (partRows.length === 0) return res.status(404).json({ success: false, message: 'Part not found' });
    const part = partRows[0];

    const key = tab_key || 'posture';

    await pool.query(`
      INSERT INTO student_part_progress (
        user_id, part_id, tab_key, status, progress_percentage, completed_at
      ) VALUES (?, ?, ?, 'COMPLETED', 100, NOW())
      ON DUPLICATE KEY UPDATE
        status = 'COMPLETED',
        progress_percentage = 100,
        completed_at = NOW(),
        updated_at = NOW()
    `, [userId, part.id, key]);

    const actId = `s3_${key}`;
    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, ?, 'practice', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE
        status = 'COMPLETED',
        completed_at = NOW()
    `, [userId, part.stage_id, actId]);

    // If song or practice session completed, log into practice_sessions table for Dashboard & Journal
    if (key === 'song' || key === 'breathe' || key === 'posture') {
      const minutes = parseInt(duration_minutes, 10) || (key === 'song' ? 10 : 5);
      const exName = key === 'song' ? 'Amazing Grace (Breath Integration)' : (key === 'breathe' ? 'Diaphragmatic Rib Breathing' : 'Singing Posture Alignment');
      await pool.query(`
        INSERT INTO practice_sessions 
          (user_id, session_type, exercise_name, start_time, end_time, duration_minutes, duration_seconds, completion_status, notes, completed_at)
        VALUES 
          (?, 'Stage 3 Practice', ?, DATE_SUB(NOW(), INTERVAL ? MINUTE), NOW(), ?, ?, 'completed', ?, NOW())
      `, [userId, exName, minutes, minutes, minutes * 60, `Stage 03 Part 02 - ${key} practice completed.`]);
    }

    if (key === 'song') {
      // Mark Stage 3 as COMPLETED in learning_stage_progress and activity progress
      await pool.query(`
        INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at, completed_at)
        VALUES (?, 3, 'COMPLETED', 100, NOW(), NOW())
        ON DUPLICATE KEY UPDATE status = 'COMPLETED', progress_percentage = 100, completed_at = COALESCE(completed_at, NOW())
      `, [userId]).catch(() => {});

      await pool.query(`
        INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
        VALUES (?, 3, 'song_practice_1', 'practice', 'COMPLETED', NOW())
        ON DUPLICATE KEY UPDATE status = 'COMPLETED', completed_at = NOW()
      `, [userId]).catch(() => {});

      await pool.query(`
        INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
        VALUES (?, 3, 's3_song', 'practice', 'COMPLETED', NOW())
        ON DUPLICATE KEY UPDATE status = 'COMPLETED', completed_at = NOW()
      `, [userId]).catch(() => {});

      // Unlock Stage 4 so user can proceed immediately
      await pool.query(`
        INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at)
        VALUES (?, 4, 'IN PROGRESS', 10, NOW())
        ON DUPLICATE KEY UPDATE started_at = COALESCE(started_at, NOW())
      `, [userId]).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `${key} activity marked as completed!`,
      tab_key: key,
      status: 'COMPLETED'
    });
  } catch (error) {
    next(error);
  }
};

exports.getPartProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partNumber = req.params.partNumber ? parseInt(req.params.partNumber, 10) : 2;

    const [partRows] = await pool.query(
      'SELECT id, stage_id FROM learning_part_sections WHERE part_number = ? AND is_active = TRUE LIMIT 1',
      [partNumber]
    );
    if (partRows.length === 0) return res.status(404).json({ success: false, message: 'Part not found' });
    const part = partRows[0];

    const [partProg] = await pool.query(
      'SELECT * FROM student_part_progress WHERE user_id = ? AND part_id = ?',
      [userId, part.id]
    );
    const [postureProg] = await pool.query(
      'SELECT * FROM student_posture_progress WHERE user_id = ? AND part_id = ?',
      [userId, part.id]
    );

    const completedTabs = partProg.filter(p => p.status === 'COMPLETED').map(p => p.tab_key);
    const overallPercent = Math.round((completedTabs.length / 3) * 100);

    res.status(200).json({
      success: true,
      part_id: part.id,
      completed_tabs: completedTabs,
      overall_percentage: overallPercent,
      posture: postureProg[0] || null,
      tabs_progress: partProg
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADMIN PART 02 CONTENT MANAGEMENT
// ============================================================================

exports.adminGetPartSection = async (req, res, next) => {
  try {
    const partId = parseInt(req.params.partId, 10);
    const [partRows] = await pool.query('SELECT * FROM learning_part_sections WHERE id = ?', [partId]);
    if (partRows.length === 0) return res.status(404).json({ success: false, message: 'Part not found' });

    const [tabs] = await pool.query('SELECT * FROM learning_part_tabs WHERE part_id = ? ORDER BY display_order ASC', [partId]);
    const [indicators] = await pool.query('SELECT * FROM posture_indicators WHERE part_id = ? ORDER BY display_order ASC', [partId]);
    const [checklist] = await pool.query('SELECT * FROM posture_checklist_items WHERE part_id = ? ORDER BY display_order ASC', [partId]);

    res.status(200).json({
      success: true,
      part: partRows[0],
      tabs: tabs.map(t => ({
        ...t,
        content_data: typeof t.content_data === 'string' ? JSON.parse(t.content_data) : t.content_data
      })),
      indicators,
      checklist
    });
  } catch (error) {
    next(error);
  }
};

exports.adminUpdatePartSection = async (req, res, next) => {
  try {
    const partId = parseInt(req.params.partId, 10);
    const { title, subtitle, description, model_asset_url, is_active } = req.body;

    await pool.query(`
      UPDATE learning_part_sections
      SET title = COALESCE(?, title),
          subtitle = COALESCE(?, subtitle),
          description = COALESCE(?, description),
          model_asset_url = COALESCE(?, model_asset_url),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [title, subtitle, description, model_asset_url, is_active, partId]);

    res.status(200).json({ success: true, message: 'Part updated successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.adminUpdatePartTab = async (req, res, next) => {
  try {
    const partId = parseInt(req.params.partId, 10);
    const tabKey = req.params.tabKey;
    const { title, subtitle, description, content_data, is_active } = req.body;

    await pool.query(`
      UPDATE learning_part_tabs
      SET title = COALESCE(?, title),
          subtitle = COALESCE(?, subtitle),
          description = COALESCE(?, description),
          content_data = COALESCE(?, content_data),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE part_id = ? AND tab_key = ?
    `, [
      title,
      subtitle,
      description,
      content_data ? JSON.stringify(content_data) : null,
      is_active,
      partId,
      tabKey
    ]);

    res.status(200).json({ success: true, message: `Tab ${tabKey} updated successfully.` });
  } catch (error) {
    next(error);
  }
};

exports.adminCreatePostureIndicator = async (req, res, next) => {
  try {
    const partId = parseInt(req.params.partId, 10);
    const { title, description, body_region, icon, display_order } = req.body;

    const [result] = await pool.query(`
      INSERT INTO posture_indicators (part_id, title, description, body_region, icon, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, COALESCE(?, 1), TRUE)
    `, [partId, title, description, body_region || 'head', icon || 'circle', display_order]);

    res.status(201).json({ success: true, id: result.insertId, message: 'Indicator created.' });
  } catch (error) {
    next(error);
  }
};

exports.adminUpdatePostureIndicator = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, description, body_region, icon, display_order, is_active } = req.body;

    await pool.query(`
      UPDATE posture_indicators
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          body_region = COALESCE(?, body_region),
          icon = COALESCE(?, icon),
          display_order = COALESCE(?, display_order),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [title, description, body_region, icon, display_order, is_active, id]);

    res.status(200).json({ success: true, message: 'Indicator updated.' });
  } catch (error) {
    next(error);
  }
};

exports.adminDeletePostureIndicator = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM posture_indicators WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Indicator deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.adminCreatePostureChecklistItem = async (req, res, next) => {
  try {
    const partId = parseInt(req.params.partId, 10);
    const { item_text, display_order, is_required } = req.body;

    const [result] = await pool.query(`
      INSERT INTO posture_checklist_items (part_id, item_text, display_order, is_required, is_active)
      VALUES (?, ?, COALESCE(?, 1), COALESCE(?, TRUE), TRUE)
    `, [partId, item_text, display_order, is_required]);

    res.status(201).json({ success: true, id: result.insertId, message: 'Checklist item created.' });
  } catch (error) {
    next(error);
  }
};

exports.adminUpdatePostureChecklistItem = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { item_text, display_order, is_required, is_active } = req.body;

    await pool.query(`
      UPDATE posture_checklist_items
      SET item_text = COALESCE(?, item_text),
          display_order = COALESCE(?, display_order),
          is_required = COALESCE(?, is_required),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [item_text, display_order, is_required, is_active, id]);

    res.status(200).json({ success: true, message: 'Checklist item updated.' });
  } catch (error) {
    next(error);
  }
};

exports.adminDeletePostureChecklistItem = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM posture_checklist_items WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Checklist item deleted.' });
  } catch (error) {
    next(error);
  }
};

// =====================================================================
// BREATHING PRACTICE LEVELS & SESSIONS (STAGE 03 PART 02 STEP 02)
// =====================================================================

/**
 * GET /api/learning/breathing-levels
 * Public/Student endpoint to fetch the 3 breathing timing configurations.
 */
exports.getBreathingLevels = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM breathing_practice_levels WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    res.status(200).json({ success: true, levels: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/learning/parts/:partNumber/breathe/session
 * Logs student completed breathing practice session to:
 * - student_breathing_sessions
 * - practice_sessions (Dashboard & Practice Journal)
 * - student_part_progress (Step 2: Breathe status = COMPLETED)
 */
exports.saveBreathingSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partNumber = req.params.partNumber ? parseInt(req.params.partNumber, 10) : 2;
    const {
      level_key,
      inhale_duration,
      hold_duration,
      exhale_duration,
      completed_cycles,
      target_cycles,
      total_duration_seconds,
      completion_status,
      notes
    } = req.body;

    if (!level_key || completed_cycles === undefined || !total_duration_seconds) {
      return res.status(400).json({ success: false, message: 'Missing session parameters.' });
    }

    const safeInhale = Number(inhale_duration) || 4.0;
    const safeHold = Number(hold_duration) >= 0 ? Number(hold_duration) : 0.0;
    const safeExhale = Number(exhale_duration) || 10.0;
    const safeCycles = parseInt(completed_cycles, 10) || 5;
    const safeTargetCycles = parseInt(target_cycles, 10) || safeCycles;
    const safeTotalSeconds = parseInt(total_duration_seconds, 10) || Math.round((safeInhale + safeHold + safeExhale) * safeCycles);

    // 1. Insert into student_breathing_sessions
    const [result] = await pool.query(`
      INSERT INTO student_breathing_sessions (
        user_id, level_key, inhale_duration, hold_duration, exhale_duration,
        completed_cycles, target_cycles, total_duration_seconds, completion_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 'COMPLETED'), ?)
    `, [
      userId, String(level_key).slice(0, 50), safeInhale, safeHold, safeExhale,
      safeCycles, safeTargetCycles, safeTotalSeconds,
      completion_status || 'COMPLETED', notes || null
    ]);

    // 2. Log to practice_sessions for Dashboard & Practice Journal
    const levelLabel = String(level_key).charAt(0).toUpperCase() + String(level_key).slice(1);
    const durationMinutes = Math.max(1, Math.ceil(safeTotalSeconds / 60));
    await pool.query(`
      INSERT INTO practice_sessions (
        user_id, session_type, exercise_name, duration_minutes, duration_seconds,
        session_status, completion_status, notes
      ) VALUES (?, 'BREATHING_PRACTICE', ?, ?, ?, 'COMPLETED', 'COMPLETED', ?)
    `, [
      userId,
      `Stage 03 Part 02 - Breathing Practice (${levelLabel})`,
      durationMinutes,
      safeTotalSeconds,
      JSON.stringify({
        level_key,
        inhale: safeInhale,
        hold: safeHold,
        exhale: safeExhale,
        cycles: safeCycles
      })
    ]);

    // 3. Mark Step 2: Breathe as completed in student_part_progress (atomic ON DUPLICATE KEY UPDATE)
    const [partRows] = await pool.query(
      'SELECT id FROM learning_part_sections WHERE part_number = ? LIMIT 1',
      [partNumber]
    );
    const partId = partRows[0]?.id || 1;

    await pool.query(`
      INSERT INTO student_part_progress (
        user_id, part_id, tab_key, status, progress_percentage, completed_at
      ) VALUES (?, ?, 'breathe', 'COMPLETED', 100, NOW())
      ON DUPLICATE KEY UPDATE
        status = 'COMPLETED',
        progress_percentage = 100,
        completed_at = NOW(),
        updated_at = NOW()
    `, [userId, partId]);

    // 4. Mark activity progress
    await pool.query(`
      INSERT INTO learning_activity_progress (
        user_id, stage_id, activity_id, activity_type, status, completed_at
      ) VALUES (?, 3, 's3_breathe', 'practice', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE
        status = 'COMPLETED',
        completed_at = NOW()
    `, [userId]).catch(() => {});

    res.status(201).json({
      success: true,
      sessionId: result.insertId,
      message: 'Breathing practice session logged successfully to Journal and Dashboard.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/learning/parts/:partNumber/breathe/sessions
 * Fetch history of student breathing sessions.
 */
exports.getBreathingSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(`
      SELECT s.*, l.level_name, l.daily_practice_duration
      FROM student_breathing_sessions s
      JOIN breathing_practice_levels l ON s.level_key = l.level_key
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT 20
    `, [userId]);
    res.status(200).json({ success: true, sessions: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/learning/breathing-levels
 * Admin endpoint to list all breathing level settings.
 */
exports.adminGetBreathingLevels = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM breathing_practice_levels ORDER BY display_order ASC'
    );
    res.status(200).json({ success: true, levels: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/learning/breathing-levels/:level_key
 * Admin endpoint to configure durations and ranges with validation.
 */
exports.adminUpdateBreathingLevel = async (req, res, next) => {
  try {
    const levelKey = req.params.level_key;
    const {
      daily_practice_duration,
      core_focus,
      inhale_duration,
      inhale_min,
      inhale_max,
      hold_duration,
      hold_min,
      hold_max,
      exhale_duration,
      exhale_min,
      exhale_max,
      support_pulsed_rhythms,
      default_cycles
    } = req.body;

    const [rows] = await pool.query('SELECT * FROM breathing_practice_levels WHERE level_key = ?', [levelKey]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Breathing level not found' });
    }
    const current = rows[0];

    // Range validations per user specification:
    // Beginner: hold 2-4s, exhale 8-12s, inhale 4s
    if (levelKey === 'beginner') {
      const hold = hold_duration !== undefined ? parseFloat(hold_duration) : parseFloat(current.hold_duration);
      const exhale = exhale_duration !== undefined ? parseFloat(exhale_duration) : parseFloat(current.exhale_duration);
      if (hold < 2 || hold > 4) {
        return res.status(400).json({ success: false, message: 'Beginner hold duration must be between 2 and 4 seconds.' });
      }
      if (exhale < 8 || exhale > 12) {
        return res.status(400).json({ success: false, message: 'Beginner exhale duration must be between 8 and 12 seconds.' });
      }
    }

    // Intermediate: exhale 15-25s, hold 2s, inhale 2s
    if (levelKey === 'intermediate') {
      const exhale = exhale_duration !== undefined ? parseFloat(exhale_duration) : parseFloat(current.exhale_duration);
      if (exhale < 15 || exhale > 25) {
        return res.status(400).json({ success: false, message: 'Intermediate exhale duration must be between 15 and 25 seconds.' });
      }
    }

    // Advanced: inhale 0.5-1s, hold 0s, exhale >= 30s
    if (levelKey === 'advanced') {
      const inhale = inhale_duration !== undefined ? parseFloat(inhale_duration) : parseFloat(current.inhale_duration);
      const exhale = exhale_duration !== undefined ? parseFloat(exhale_duration) : parseFloat(current.exhale_duration);
      if (inhale < 0.5 || inhale > 1.0) {
        return res.status(400).json({ success: false, message: 'Advanced inhale duration must be between 0.5 and 1.0 seconds.' });
      }
      if (exhale < 30) {
        return res.status(400).json({ success: false, message: 'Advanced exhale duration must be at least 30 seconds.' });
      }
    }

    await pool.query(`
      UPDATE breathing_practice_levels
      SET daily_practice_duration = COALESCE(?, daily_practice_duration),
          core_focus = COALESCE(?, core_focus),
          inhale_duration = COALESCE(?, inhale_duration),
          inhale_min = COALESCE(?, inhale_min),
          inhale_max = COALESCE(?, inhale_max),
          hold_duration = COALESCE(?, hold_duration),
          hold_min = COALESCE(?, hold_min),
          hold_max = COALESCE(?, hold_max),
          exhale_duration = COALESCE(?, exhale_duration),
          exhale_min = COALESCE(?, exhale_min),
          exhale_max = COALESCE(?, exhale_max),
          support_pulsed_rhythms = COALESCE(?, support_pulsed_rhythms),
          default_cycles = COALESCE(?, default_cycles),
          updated_at = NOW()
      WHERE level_key = ?
    `, [
      daily_practice_duration, core_focus,
      inhale_duration, inhale_min, inhale_max,
      hold_duration, hold_min, hold_max,
      exhale_duration, exhale_min, exhale_max,
      support_pulsed_rhythms, default_cycles,
      levelKey
    ]);

    res.status(200).json({ success: true, message: `Breathing level ${levelKey} updated successfully.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STEP 3: SING IT - SONG PRACTICE MODULE (SNOWMAN) CONTROLLERS
// ============================================================================

// GET /api/learning/parts/:partNumber/song/levels
exports.getSongLevels = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const [songRows] = await pool.query('SELECT * FROM song_practice_content WHERE part_id = 1 AND is_active = TRUE LIMIT 1');
    const songId = songRows.length > 0 ? songRows[0].id : 1;

    const [levels] = await pool.query(
      'SELECT * FROM song_practice_levels WHERE song_id = ? AND is_active = TRUE ORDER BY display_order ASC',
      [songId]
    );

    let progressMap = {};
    if (userId) {
      const [prog] = await pool.query('SELECT * FROM student_song_progress WHERE user_id = ? AND song_id = ?', [userId, songId]);
      for (const p of prog) {
        if (typeof p.marked_notes === 'string') {
          try { p.marked_notes = JSON.parse(p.marked_notes); } catch (e) { p.marked_notes = []; }
        }
        progressMap[p.level_id] = p;
      }
    }

    const result = [];
    for (const lvl of levels) {
      const [markers] = await pool.query(
        'SELECT * FROM song_score_markers WHERE level_id = ? ORDER BY phrase_number ASC, display_order ASC',
        [lvl.id]
      );
      result.push({
        ...lvl,
        markers,
        progress: progressMap[lvl.id] || {
          marked_notes: [],
          total_marked_notes: 0,
          audio_listening_progress: 0,
          repeat_count: lvl.default_repeat_count || 1,
          completion_status: 'NOT_STARTED'
        }
      });
    }

    res.status(200).json({ success: true, levels: result });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/parts/:partNumber/song/levels/:levelId/score
exports.getSongScore = async (req, res, next) => {
  try {
    const levelId = parseInt(req.params.levelId, 10);
    const [levelRows] = await pool.query('SELECT * FROM song_practice_levels WHERE id = ?', [levelId]);
    if (levelRows.length === 0) return res.status(404).json({ success: false, message: 'Level not found' });

    const [markers] = await pool.query(
      'SELECT * FROM song_score_markers WHERE level_id = ? ORDER BY phrase_number ASC, display_order ASC',
      [levelId]
    );

    res.status(200).json({ success: true, level: levelRows[0], markers });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/parts/:partNumber/song/progress
exports.saveSongProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      song_id,
      level_id,
      level_key,
      marked_notes,
      audio_listening_progress,
      repeat_count,
      completion_status
    } = req.body;

    let targetSongId = song_id;
    if (!targetSongId) {
      const [s] = await pool.query('SELECT id FROM song_practice_content WHERE part_id = 1 LIMIT 1');
      targetSongId = s.length > 0 ? s[0].id : 1;
    }

    let targetLevelId = level_id;
    if (!targetLevelId && level_key) {
      const [l] = await pool.query('SELECT id, total_notes FROM song_practice_levels WHERE song_id = ? AND level_key = ? LIMIT 1', [targetSongId, level_key]);
      if (l.length > 0) targetLevelId = l[0].id;
    }

    if (!targetLevelId) {
      return res.status(400).json({ success: false, message: 'Valid level_id or level_key is required.' });
    }

    const notesArray = Array.isArray(marked_notes) ? marked_notes : [];
    const totalMarked = notesArray.length;
    const status = completion_status || (totalMarked > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');

    await pool.query(`
      INSERT INTO student_song_progress (
        user_id, song_id, level_id, marked_notes, total_marked_notes, audio_listening_progress, repeat_count, completion_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        marked_notes = VALUES(marked_notes),
        total_marked_notes = VALUES(total_marked_notes),
        audio_listening_progress = GREATEST(audio_listening_progress, VALUES(audio_listening_progress)),
        repeat_count = VALUES(repeat_count),
        completion_status = VALUES(completion_status),
        updated_at = NOW()
    `, [
      userId,
      targetSongId,
      targetLevelId,
      JSON.stringify(notesArray),
      totalMarked,
      audio_listening_progress || 0,
      repeat_count || 1,
      status
    ]);

    // If marked notes completed, also check if overall song tab should be marked COMPLETED
    if (status === 'COMPLETED') {
      await pool.query(`
        INSERT INTO student_part_progress (user_id, part_id, tab_key, status, progress_percentage, completed_at, updated_at)
        VALUES (?, 1, 'song', 'COMPLETED', 100, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          status = 'COMPLETED',
          progress_percentage = 100,
          completed_at = NOW(),
          updated_at = NOW()
      `, [userId]);
    }

    res.status(200).json({
      success: true,
      message: 'Song progress saved successfully.',
      progress: {
        song_id: targetSongId,
        level_id: targetLevelId,
        marked_notes: notesArray,
        total_marked_notes: totalMarked,
        completion_status: status
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/parts/:partNumber/song/session/start
exports.startSongSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { song_id, level_id, level_key } = req.body;

    let targetSongId = song_id;
    if (!targetSongId) {
      const [s] = await pool.query('SELECT id FROM song_practice_content WHERE part_id = 1 LIMIT 1');
      targetSongId = s.length > 0 ? s[0].id : 1;
    }

    let targetLevelId = level_id;
    if (!targetLevelId && level_key) {
      const [l] = await pool.query('SELECT id FROM song_practice_levels WHERE song_id = ? AND level_key = ? LIMIT 1', [targetSongId, level_key]);
      if (l.length > 0) targetLevelId = l[0].id;
    }

    const [result] = await pool.query(`
      INSERT INTO student_song_sessions (user_id, song_id, level_id, session_status, started_at)
      VALUES (?, ?, ?, 'IN_PROGRESS', NOW())
    `, [userId, targetSongId, targetLevelId || 1]);

    res.status(201).json({
      success: true,
      session_id: result.insertId,
      message: 'Song practice session started.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/learning/parts/:partNumber/song/session/complete
exports.completeSongSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      session_id,
      song_id,
      level_id,
      level_key,
      listening_duration,
      repeat_count,
      marked_notes_count
    } = req.body;

    let targetSongId = song_id;
    if (!targetSongId) {
      const [s] = await pool.query('SELECT id FROM song_practice_content WHERE part_id = 1 LIMIT 1');
      targetSongId = s.length > 0 ? s[0].id : 1;
    }

    let targetLevelId = level_id;
    let targetLevelName = 'Beginner';
    if (!targetLevelId && level_key) {
      const [l] = await pool.query('SELECT id, level_name FROM song_practice_levels WHERE song_id = ? AND level_key = ? LIMIT 1', [targetSongId, level_key]);
      if (l.length > 0) {
        targetLevelId = l[0].id;
        targetLevelName = l[0].level_name;
      }
    }

    const durationSec = parseInt(listening_duration || 0, 10);
    const durationMin = Math.max(1, Math.round(durationSec / 60));

    if (session_id) {
      await pool.query(`
        UPDATE student_song_sessions
        SET listening_duration = ?,
            repeat_count = ?,
            marked_notes_count = ?,
            session_status = 'COMPLETED',
            completed_at = NOW()
        WHERE id = ? AND user_id = ?
      `, [durationSec, repeat_count || 1, marked_notes_count || 0, session_id, userId]);
    } else {
      await pool.query(`
        INSERT INTO student_song_sessions (user_id, song_id, level_id, listening_duration, repeat_count, marked_notes_count, session_status, started_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', NOW(), NOW())
      `, [userId, targetSongId, targetLevelId || 1, durationSec, repeat_count || 1, marked_notes_count || 0]);
    }

    // Connect to Practice Journal & Dashboard
    await pool.query(`
      INSERT INTO practice_sessions (
        user_id, session_type, exercise_name, duration_minutes, duration_seconds, session_status, completion_status, notes, completed_at
      ) VALUES (
        ?, 'song_practice', ?, ?, ?, 'COMPLETED', 'completed', ?, NOW()
      )
    `, [
      userId,
      `Snowman (${targetLevelName})`,
      durationMin,
      durationSec,
      `Song Practice: ${marked_notes_count || 0} notes marked, repeated ${repeat_count || 1} time(s).`
    ]);

    // Mark song tab and Stage 3 complete to immediately unlock Stage 4
    await pool.query(`
      INSERT INTO student_part_progress (user_id, part_id, tab_key, status, progress_percentage, completed_at)
      VALUES (?, 1, 'song', 'COMPLETED', 100, NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', progress_percentage = 100, completed_at = NOW(), updated_at = NOW()
    `, [userId]).catch(() => {});

    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, 3, 's3_song', 'practice', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', completed_at = NOW()
    `, [userId]).catch(() => {});

    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, 3, 'song_practice_1', 'practice', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', completed_at = NOW()
    `, [userId]).catch(() => {});

    await pool.query(`
      INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at, completed_at)
      VALUES (?, 3, 'COMPLETED', 100, NOW(), NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', progress_percentage = 100, completed_at = COALESCE(completed_at, NOW())
    `, [userId]).catch(() => {});

    // Ensure Stage 4 is initialized so it is immediately unlocked
    await pool.query(`
      INSERT INTO learning_stage_progress (user_id, stage_id, status, progress_percentage, started_at)
      VALUES (?, 4, 'IN PROGRESS', 10, NOW())
      ON DUPLICATE KEY UPDATE started_at = COALESCE(started_at, NOW())
    `, [userId]).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Song practice session recorded successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/learning/parts/:partNumber/song/progress
exports.getSongProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [prog] = await pool.query(`
      SELECT p.*, l.level_key, l.level_name, l.total_notes
      FROM student_song_progress p
      JOIN song_practice_levels l ON p.level_id = l.id
      WHERE p.user_id = ?
    `, [userId]);

    for (const p of prog) {
      if (typeof p.marked_notes === 'string') {
        try { p.marked_notes = JSON.parse(p.marked_notes); } catch (e) { p.marked_notes = []; }
      }
    }

    res.status(200).json({ success: true, progress: prog });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADMIN SONG PRACTICE MODULE MANAGEMENT
// ============================================================================

// GET /api/admin/song-practice
exports.adminGetSongPractice = async (req, res, next) => {
  try {
    const [songs] = await pool.query('SELECT * FROM song_practice_content WHERE part_id = 1 LIMIT 1');
    const song = songs[0] || null;

    if (!song) {
      return res.status(200).json({ success: true, song: null, levels: [] });
    }

    const [levels] = await pool.query(
      'SELECT * FROM song_practice_levels WHERE song_id = ? ORDER BY display_order ASC',
      [song.id]
    );

    const levelsWithMarkers = [];
    for (const lvl of levels) {
      const [markers] = await pool.query(
        'SELECT * FROM song_score_markers WHERE level_id = ? ORDER BY phrase_number ASC, display_order ASC',
        [lvl.id]
      );
      levelsWithMarkers.push({ ...lvl, markers });
    }

    res.status(200).json({
      success: true,
      song,
      levels: levelsWithMarkers
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/song-practice
exports.adminUpdateSongPractice = async (req, res, next) => {
  try {
    const {
      song_title,
      artist_name,
      subtitle,
      description,
      instructions,
      audio_file,
      default_repeat_count,
      min_repeat_count,
      max_repeat_count,
      continuous_loop_enabled,
      is_active
    } = req.body;

    const [existing] = await pool.query('SELECT id FROM song_practice_content WHERE part_id = 1 LIMIT 1');
    let songId;

    if (existing.length > 0) {
      songId = existing[0].id;
      await pool.query(`
        UPDATE song_practice_content
        SET song_title = COALESCE(?, song_title),
            artist_name = COALESCE(?, artist_name),
            subtitle = COALESCE(?, subtitle),
            description = COALESCE(?, description),
            instructions = COALESCE(?, instructions),
            audio_file = COALESCE(?, audio_file),
            default_repeat_count = COALESCE(?, default_repeat_count),
            min_repeat_count = COALESCE(?, min_repeat_count),
            max_repeat_count = COALESCE(?, max_repeat_count),
            continuous_loop_enabled = COALESCE(?, continuous_loop_enabled),
            is_active = COALESCE(?, is_active),
            updated_at = NOW()
        WHERE id = ?
      `, [
        song_title, artist_name, subtitle, description, instructions,
        audio_file, default_repeat_count, min_repeat_count, max_repeat_count,
        continuous_loop_enabled, is_active, songId
      ]);
    } else {
      const [insertRes] = await pool.query(`
        INSERT INTO song_practice_content (
          part_id, song_title, artist_name, subtitle, description, instructions, audio_file,
          default_repeat_count, min_repeat_count, max_repeat_count, continuous_loop_enabled, is_active
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        song_title || 'Snowman', artist_name || 'Sia', subtitle || 'Audio guide',
        description || '', instructions || '', audio_file || '/audio/snowman-vocal-guide.wav',
        default_repeat_count || 1, min_repeat_count || 1, max_repeat_count || 3,
        continuous_loop_enabled !== false, is_active !== false
      ]);
      songId = insertRes.insertId;
    }

    res.status(200).json({ success: true, message: 'Song practice content updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/song-practice/audio
exports.adminUploadSongAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded.' });
    }
    const audioPath = `/uploads/audio/${req.file.filename}`;
    await pool.query(`
      UPDATE song_practice_content
      SET audio_file = ?, updated_at = NOW()
      WHERE part_id = 1
    `, [audioPath]);

    res.status(200).json({
      success: true,
      message: 'Audio guide file uploaded successfully.',
      audio_file: audioPath
    });
  } catch (error) {
    next(error);
  }
};

// POST / PUT /api/admin/song-practice/levels/:levelId/score
exports.adminUploadSongScore = async (req, res, next) => {
  try {
    const levelId = parseInt(req.params.levelId, 10);
    const { score_svg_content, total_notes, score_file } = req.body;
    let scoreFile = score_file !== undefined ? score_file : null;

    if (req.file) {
      scoreFile = `/uploads/cms/${req.file.filename}`;
    }

    const updates = [];
    const params = [];

    if (scoreFile !== null) {
      updates.push('score_file = ?');
      params.push(scoreFile);
    }
    if (score_svg_content !== undefined) {
      updates.push('score_svg_content = ?');
      params.push(score_svg_content);
    }
    if (total_notes !== undefined) {
      updates.push('total_notes = ?');
      params.push(parseInt(total_notes, 10));
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(levelId);
      await pool.query(`UPDATE song_practice_levels SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [updatedRow] = await pool.query('SELECT * FROM song_practice_levels WHERE id = ?', [levelId]);

    res.status(200).json({
      success: true,
      message: 'Level score sheet updated successfully.',
      level: updatedRow[0] || null,
      score_file: updatedRow[0]?.score_file || scoreFile
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/song-practice/levels/:levelId/markers
exports.adminUpdateSongMarkers = async (req, res, next) => {
  try {
    const levelId = parseInt(req.params.levelId, 10);
    const { markers, total_notes } = req.body;

    if (Array.isArray(markers)) {
      await pool.query('DELETE FROM song_score_markers WHERE level_id = ?', [levelId]);
      for (const m of markers) {
        await pool.query(`
          INSERT INTO song_score_markers (
            level_id, marker_type, note_reference, note_name, position_x, position_y, phrase_number, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          levelId,
          m.marker_type || 'note',
          m.note_reference || 'N',
          m.note_name || '',
          m.position_x || 0,
          m.position_y || 0,
          m.phrase_number || 1,
          m.display_order || 1
        ]);
      }
    }

    if (total_notes !== undefined) {
      await pool.query('UPDATE song_practice_levels SET total_notes = ? WHERE id = ?', [parseInt(total_notes, 10), levelId]);
    }

    res.status(200).json({ success: true, message: 'Markers updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/song-practice/students
exports.adminGetStudentSongProgressList = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        sp.song_id,
        sc.song_title,
        MAX(CASE WHEN sl.level_key = 'beginner' THEN sp.total_marked_notes ELSE 0 END) as beginner_marked,
        MAX(CASE WHEN sl.level_key = 'beginner' THEN sl.total_notes ELSE 12 END) as beginner_total,
        MAX(CASE WHEN sl.level_key = 'beginner' THEN sp.completion_status ELSE 'NOT_STARTED' END) as beginner_status,
        MAX(CASE WHEN sl.level_key = 'intermediate' THEN sp.total_marked_notes ELSE 0 END) as intermediate_marked,
        MAX(CASE WHEN sl.level_key = 'intermediate' THEN sl.total_notes ELSE 16 END) as intermediate_total,
        MAX(CASE WHEN sl.level_key = 'intermediate' THEN sp.completion_status ELSE 'NOT_STARTED' END) as intermediate_status,
        MAX(CASE WHEN sl.level_key = 'advanced' THEN sp.total_marked_notes ELSE 0 END) as advanced_marked,
        MAX(CASE WHEN sl.level_key = 'advanced' THEN sl.total_notes ELSE 20 END) as advanced_total,
        MAX(CASE WHEN sl.level_key = 'advanced' THEN sp.completion_status ELSE 'NOT_STARTED' END) as advanced_status,
        MAX(sp.repeat_count) as max_repeat,
        MAX(sp.updated_at) as last_practice_date,
        COUNT(DISTINCT ss.id) as total_sessions
      FROM users u
      JOIN student_song_progress sp ON u.id = sp.user_id
      JOIN song_practice_levels sl ON sp.level_id = sl.id
      JOIN song_practice_content sc ON sp.song_id = sc.id
      LEFT JOIN student_song_sessions ss ON u.id = ss.user_id AND ss.song_id = sp.song_id
      GROUP BY u.id, u.username, u.email, sp.song_id, sc.song_title
      ORDER BY last_practice_date DESC
    `);

    res.status(200).json({ success: true, students: rows });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/song-practice/students/:userId
exports.adminResetStudentSongProgress = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    await pool.query('DELETE FROM student_song_progress WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM student_song_sessions WHERE user_id = ?', [userId]);
    res.status(200).json({ success: true, message: 'Student song practice records reset successfully.' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STAGE 04: BREATHE RIGHT: FACT OR MYTH? INTERACTIVE CHALLENGE
// ============================================================================

// Helper to keep learning_challenges.configuration_json synchronized
async function syncMythFactToLearningChallenge() {
  try {
    const [questions] = await pool.query(
      'SELECT question_id, statement, correct_answer, explanation, display_order FROM myth_fact_questions WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    const configQuestions = questions.map(q => ({
      id: q.question_id,
      statement: q.statement,
      correctAnswer: q.correct_answer,
      explanation: q.explanation
    }));
    const configJson = JSON.stringify({
      type: 'myth_or_fact',
      title: 'Breathe Right: Fact or Myth?',
      subtitle: 'Test your understanding of breathing techniques for singing.',
      questions: configQuestions
    });
    await pool.query(`
      UPDATE learning_challenges
      SET title = 'Breathe Right: Fact or Myth?',
          description = 'Test your understanding of breathing techniques for singing.',
          total_marks = 60,
          passing_score = 30,
          configuration_json = ?,
          updated_at = NOW()
      WHERE challenge_type = 'myth_or_fact'
    `, [configJson]);
  } catch (err) {
    console.warn('[Myth or Fact Sync Warning]:', err.message);
  }
}

// GET /api/breath-management/challenges/myth-fact
// GET /api/learning/challenges/myth-fact
exports.getMythFactChallenge = async (req, res, next) => {
  try {
    const [questions] = await pool.query(
      'SELECT id, question_id, statement, display_order, correct_answer, explanation FROM myth_fact_questions WHERE is_active = TRUE ORDER BY display_order ASC'
    );

    const [challengeRows] = await pool.query(
      "SELECT id, title, description, total_marks, passing_score FROM learning_challenges WHERE challenge_type = 'myth_or_fact' LIMIT 1"
    );
    const challengeInfo = challengeRows[0] || {
      id: 1,
      title: 'Breathe Right: Fact or Myth?',
      description: 'Test your understanding of breathing techniques for singing.',
      total_marks: 60,
      passing_score: 30
    };

    // Client question list with category and order
    const sanitizedQuestions = questions.map(q => ({
      id: q.question_id,
      question_id: q.question_id,
      statement: q.statement,
      category: 'Breathing Technique',
      display_order: q.display_order
    }));

    // If user is authenticated, determine next attempt number and check historical attempts
    let nextAttemptNumber = 1;
    let latestAttempt = null;
    let bestAttempt = null;

    if (req.user && req.user.id) {
      const userId = req.user.id;
      const [attempts] = await pool.query(
        'SELECT attempt_number, score, total_marks, percentage, status, completed_at FROM challenge_attempts WHERE user_id = ? AND challenge_id = ? ORDER BY attempt_number DESC',
        [userId, challengeInfo.id]
      );
      if (attempts.length > 0) {
        nextAttemptNumber = attempts[0].attempt_number + 1;
        latestAttempt = attempts[0];
        bestAttempt = attempts.reduce((prev, curr) => (parseFloat(curr.percentage) > parseFloat(prev.percentage) ? curr : prev), attempts[0]);
      }
    }

    res.status(200).json({
      success: true,
      challenge: {
        id: challengeInfo.id,
        title: 'Breathe Right: Fact or Myth?',
        subtitle: 'Test your understanding of breathing techniques for singing.',
        total_questions: sanitizedQuestions.length,
        total_marks: challengeInfo.total_marks || 60,
        passing_score: challengeInfo.passing_score || 30,
        nextAttemptNumber,
        latestAttempt,
        bestAttempt
      },
      questions: sanitizedQuestions
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/breath-management/challenges/myth-fact/submit-answer
exports.submitMythFactAnswer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { questionId, selectedAnswer, attemptNumber } = req.body;

    if (!questionId || !selectedAnswer) {
      return res.status(400).json({ success: false, message: 'Question ID and selected answer (MYTH or FACT) are required.' });
    }

    const cleanAnswer = String(selectedAnswer).trim().toUpperCase();
    if (cleanAnswer !== 'MYTH' && cleanAnswer !== 'FACT') {
      return res.status(400).json({ success: false, message: 'Answer must be either MYTH or FACT.' });
    }

    // Look up question in MySQL
    const [qRows] = await pool.query(
      'SELECT * FROM myth_fact_questions WHERE question_id = ? LIMIT 1',
      [questionId]
    );
    if (qRows.length === 0) {
      return res.status(404).json({ success: false, message: `Question not found: ${questionId}` });
    }
    const question = qRows[0];
    const isCorrect = cleanAnswer === String(question.correct_answer).toUpperCase();
    const scoreAwarded = isCorrect ? 10 : 0;

    // Resolve attempt number
    let attemptNum = parseInt(attemptNumber, 10);
    if (!attemptNum || attemptNum < 1) {
      const [prev] = await pool.query(
        'SELECT MAX(attempt_number) AS max_attempt FROM challenge_attempts WHERE user_id = ? AND challenge_id = 1',
        [userId]
      );
      attemptNum = (prev[0].max_attempt || 0) + 1;
    }

    // Check if student already submitted this question for this attempt (prevent duplicate scoring)
    const [existing] = await pool.query(
      'SELECT id, selected_answer, is_correct, score FROM myth_fact_student_responses WHERE user_id = ? AND question_id = ? AND attempt_number = ? LIMIT 1',
      [userId, questionId, attemptNum]
    );

    if (existing.length > 0) {
      // Already answered - return verified result without adding duplicate score
      return res.status(200).json({
        success: true,
        questionId: question.question_id,
        isCorrect: Boolean(existing[0].is_correct),
        selectedAnswer: existing[0].selected_answer,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        score: existing[0].score,
        isDuplicate: true
      });
    }

    // Save individual student response in MySQL
    await pool.query(`
      INSERT INTO myth_fact_student_responses (
        user_id, challenge_id, question_id, selected_answer, correct_answer, is_correct, score, attempt_number, status, started_at, completed_at
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, 'ANSWERED', NOW(), NOW())
    `, [userId, questionId, cleanAnswer, question.correct_answer, isCorrect, scoreAwarded, attemptNum]);

    res.status(200).json({
      success: true,
      questionId: question.question_id,
      isCorrect,
      selectedAnswer: cleanAnswer,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      score: scoreAwarded,
      isDuplicate: false
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/breath-management/challenges/myth-fact/complete
exports.completeMythFactChallenge = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { attemptNumber, answers, timeSpentSeconds } = req.body;

    const [allQuestions] = await pool.query(
      'SELECT question_id, statement, correct_answer, explanation, display_order FROM myth_fact_questions WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    const totalQuestions = allQuestions.length || 6;
    const totalMarks = totalQuestions * 10; // 60 marks total

    // Resolve attempt number
    let attemptNum = parseInt(attemptNumber, 10);
    if (!attemptNum || attemptNum < 1) {
      const [prev] = await pool.query(
        'SELECT MAX(attempt_number) AS max_attempt FROM challenge_attempts WHERE user_id = ? AND challenge_id = 1',
        [userId]
      );
      attemptNum = (prev[0].max_attempt || 0) + 1;
    }

    // If answers provided in payload, ensure all responses exist in myth_fact_student_responses
    if (answers && typeof answers === 'object') {
      for (const q of allQuestions) {
        if (answers[q.question_id]) {
          const sel = String(answers[q.question_id]).trim().toUpperCase();
          const isCorr = sel === q.correct_answer.toUpperCase();
          const pts = isCorr ? 10 : 0;
          await pool.query(`
            INSERT INTO myth_fact_student_responses (
              user_id, challenge_id, question_id, selected_answer, correct_answer, is_correct, score, attempt_number, status, started_at, completed_at
            ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, 'COMPLETED', NOW(), NOW())
            ON DUPLICATE KEY UPDATE selected_answer = VALUES(selected_answer), is_correct = VALUES(is_correct), score = VALUES(score)
          `, [userId, q.question_id, sel, q.correct_answer, isCorr, pts, attemptNum]);
        }
      }
    }

    // Pull student responses for this attempt
    const [responses] = await pool.query(
      'SELECT question_id, selected_answer, correct_answer, is_correct, score FROM myth_fact_student_responses WHERE user_id = ? AND attempt_number = ?',
      [userId, attemptNum]
    );

    const responseMap = {};
    responses.forEach(r => { responseMap[r.question_id] = r; });

    let correctCount = 0;
    const review = allQuestions.map(q => {
      const resp = responseMap[q.question_id];
      const isCorr = resp ? Boolean(resp.is_correct) : false;
      if (isCorr) correctCount++;
      return {
        questionId: q.question_id,
        statement: q.statement,
        selectedAnswer: resp ? resp.selected_answer : 'UNANSWERED',
        correctAnswer: q.correct_answer,
        isCorrect: isCorr,
        explanation: q.explanation
      };
    });

    const incorrectCount = totalQuestions - correctCount;
    const finalScore = correctCount * 10;
    const percentage = parseFloat(((correctCount / totalQuestions) * 100).toFixed(2));

    // Performance category
    let category = 'Keep learning and try again.';
    if (correctCount >= 5) {
      category = 'Excellent understanding!';
    } else if (correctCount >= 3) {
      category = 'Good effort! Keep practising.';
    }

    const status = percentage >= 50 ? 'PASSED' : 'COMPLETED';

    // Insert complete record into challenge_attempts
    const answersPayload = {
      review,
      summary: {
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        category,
        timeSpentSeconds: parseInt(timeSpentSeconds, 10) || 0
      }
    };

    await pool.query(`
      INSERT INTO challenge_attempts (
        user_id, challenge_id, attempt_number, answers_json, score, total_marks, percentage, status, completed_at
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, NOW())
    `, [userId, attemptNum, JSON.stringify(answersPayload), finalScore, totalMarks, percentage, status]);

    // Mark challenge activity as completed for Stage 4
    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, 4, 'challenge_1', 'challenge', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED', updated_at = NOW()
    `, [userId]);

    res.status(200).json({
      success: true,
      message: 'Challenge attempt completed and saved successfully.',
      result: {
        attemptNumber: attemptNum,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        finalScore,
        totalMarks,
        percentage,
        category,
        status,
        review
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/breath-management/challenges/myth-fact/progress
exports.getMythFactProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [prevAttempts] = await pool.query(
      'SELECT MAX(attempt_number) AS max_attempt FROM challenge_attempts WHERE user_id = ? AND challenge_id = 1',
      [userId]
    );
    const nextAttemptNumber = (prevAttempts[0].max_attempt || 0) + 1;

    // Check responses in progress for this next attempt
    const [responses] = await pool.query(
      'SELECT question_id, selected_answer, correct_answer, is_correct, score FROM myth_fact_student_responses WHERE user_id = ? AND attempt_number = ?',
      [userId, nextAttemptNumber]
    );

    const answered = {};
    responses.forEach(r => {
      answered[r.question_id] = {
        selectedAnswer: r.selected_answer,
        correctAnswer: r.correct_answer,
        isCorrect: Boolean(r.is_correct),
        score: r.score
      };
    });

    res.status(200).json({
      success: true,
      attemptNumber: nextAttemptNumber,
      answeredCount: responses.length,
      answeredQuestions: answered
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/breath-management/challenges/myth-fact/results
exports.getMythFactResults = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [attempts] = await pool.query(
      'SELECT id, attempt_number, answers_json, score, total_marks, percentage, status, completed_at FROM challenge_attempts WHERE user_id = ? AND challenge_id = 1 ORDER BY attempt_number DESC',
      [userId]
    );

    const parsedAttempts = attempts.map(a => {
      let parsed = {};
      try {
        parsed = typeof a.answers_json === 'string' ? JSON.parse(a.answers_json) : a.answers_json;
      } catch (e) {
        parsed = {};
      }
      return {
        id: a.id,
        attemptNumber: a.attempt_number,
        score: a.score,
        totalMarks: a.total_marks,
        percentage: parseFloat(a.percentage),
        status: a.status,
        completedAt: a.completed_at,
        review: parsed.review || [],
        summary: parsed.summary || {}
      };
    });

    const latestAttempt = parsedAttempts.length > 0 ? parsedAttempts[0] : null;
    const bestAttempt = parsedAttempts.length > 0
      ? parsedAttempts.reduce((prev, curr) => (curr.percentage > prev.percentage ? curr : prev), parsedAttempts[0])
      : null;

    res.status(200).json({
      success: true,
      totalAttempts: parsedAttempts.length,
      latestAttempt,
      bestAttempt,
      attempts: parsedAttempts
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN: GET /api/admin/myth-fact/questions
exports.adminGetMythFactQuestions = async (req, res, next) => {
  try {
    const [questions] = await pool.query(
      'SELECT * FROM myth_fact_questions ORDER BY display_order ASC'
    );
    res.status(200).json({ success: true, questions });
  } catch (error) {
    next(error);
  }
};

// ADMIN: PUT /api/admin/myth-fact/questions/:id
exports.adminUpdateMythFactQuestion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { statement, correct_answer, explanation, display_order, is_active } = req.body;

    await pool.query(`
      UPDATE myth_fact_questions
      SET statement = COALESCE(?, statement),
          correct_answer = COALESCE(?, correct_answer),
          explanation = COALESCE(?, explanation),
          display_order = COALESCE(?, display_order),
          is_active = COALESCE(?, is_active),
          updated_at = NOW()
      WHERE id = ?
    `, [statement, correct_answer, explanation, display_order, is_active, id]);

    await syncMythFactToLearningChallenge();

    res.status(200).json({ success: true, message: 'Question updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// ADMIN: POST /api/admin/myth-fact/questions
exports.adminCreateMythFactQuestion = async (req, res, next) => {
  try {
    const { statement, correct_answer, explanation, display_order } = req.body;
    if (!statement || !correct_answer || !explanation) {
      return res.status(400).json({ success: false, message: 'Statement, correct answer, and explanation are required.' });
    }

    const [maxId] = await pool.query('SELECT MAX(id) AS max_id FROM myth_fact_questions');
    const nextQId = `mf-${(maxId[0].max_id || 0) + 1}`;

    await pool.query(`
      INSERT INTO myth_fact_questions (question_id, statement, correct_answer, explanation, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `, [nextQId, statement, String(correct_answer).toUpperCase(), explanation, display_order || 1]);

    await syncMythFactToLearningChallenge();

    res.status(201).json({ success: true, message: 'Question created successfully.', question_id: nextQId });
  } catch (error) {
    next(error);
  }
};

// ADMIN: DELETE /api/admin/myth-fact/questions/:id
exports.adminDeleteMythFactQuestion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM myth_fact_questions WHERE id = ?', [id]);
    await syncMythFactToLearningChallenge();
    res.status(200).json({ success: true, message: 'Question deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ADMIN: GET /api/admin/myth-fact/student-results
exports.adminGetMythFactStudentResults = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id AS user_id,
        u.username,
        u.email,
        COUNT(ca.id) AS total_attempts,
        COALESCE(MAX(ca.score), 0) AS best_score,
        COALESCE(MAX(ca.percentage), 0) AS best_percentage,
        (SELECT score FROM challenge_attempts WHERE user_id = u.id AND challenge_id = 1 ORDER BY completed_at DESC LIMIT 1) AS latest_score,
        (SELECT percentage FROM challenge_attempts WHERE user_id = u.id AND challenge_id = 1 ORDER BY completed_at DESC LIMIT 1) AS latest_percentage,
        (SELECT status FROM challenge_attempts WHERE user_id = u.id AND challenge_id = 1 ORDER BY completed_at DESC LIMIT 1) AS latest_status,
        (SELECT completed_at FROM challenge_attempts WHERE user_id = u.id AND challenge_id = 1 ORDER BY completed_at DESC LIMIT 1) AS last_attempt_date,
        (SELECT COUNT(*) FROM myth_fact_student_responses WHERE user_id = u.id AND is_correct = TRUE) AS total_correct_answers,
        (SELECT COUNT(*) FROM myth_fact_student_responses WHERE user_id = u.id AND is_correct = FALSE) AS total_incorrect_answers
      FROM users u
      LEFT JOIN challenge_attempts ca ON u.id = ca.user_id AND ca.challenge_id = 1
      WHERE u.role = 'STUDENT' OR ca.id IS NOT NULL
      GROUP BY u.id, u.username, u.email
      ORDER BY last_attempt_date DESC, total_attempts DESC
    `);

    res.status(200).json({ success: true, students: rows });
  } catch (error) {
    next(error);
  }
};

// ADMIN: DELETE /api/admin/myth-fact/student-results/:userId
exports.adminResetStudentMythFact = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    await pool.query('DELETE FROM challenge_attempts WHERE user_id = ? AND challenge_id = 1', [userId]);
    await pool.query('DELETE FROM myth_fact_student_responses WHERE user_id = ?', [userId]);
    res.status(200).json({ success: true, message: 'Student Myth or Fact challenge records reset successfully.' });
  } catch (error) {
    next(error);
  }
};

