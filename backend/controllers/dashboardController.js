const pool = require('../config/db');

// Helper: Professional time-of-day greeting:
// - Good morning:   12:00 AM - 12:00 PM (00:00 - 11:59)
// - Good afternoon: 12:00 PM - 05:00 PM (12:00 - 16:59)
// - Good evening:   05:00 PM - 11:59 PM (17:00 - 23:59)
function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 0 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

// Helper: Time-of-day period key
function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 0 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

// Helper: Format Date as e.g. "WEDNESDAY, NOVEMBER 18 · 4:52 PM · YOUR LEARNING SPACE"
function formatLearningSpaceDate(date = new Date()) {
  const optionsDay = { weekday: 'long' };
  const optionsMonth = { month: 'long', day: 'numeric' };
  const dayName = new Intl.DateTimeFormat('en-US', optionsDay).format(date).toUpperCase();
  const dateStr = new Intl.DateTimeFormat('en-US', optionsMonth).format(date).toUpperCase();
  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date).toUpperCase();
  return `${dayName}, ${dateStr} · ${timeStr} · YOUR LEARNING SPACE`;
}

// GET /api/dashboard/overview
exports.getOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // 1. Fetch user data
    const [users] = await pool.query(
      'SELECT id, username, email, role, selected_musical_goal FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const user = users[0];

    // 2. Weekly Practice Statistics (Monday to Sunday calendar week)
    const [weeklyStatsRows] = await pool.query(
      `SELECT 
         COALESCE(SUM(duration_minutes), 0) AS total_minutes,
         COUNT(*) AS sessions_count
       FROM practice_sessions 
       WHERE user_id = ?
         AND completion_status = 'completed'
         AND completed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
         AND completed_at < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)`,
      [userId]
    );
    const weeklyMinutes = parseInt(weeklyStatsRows?.[0]?.total_minutes || 0, 10);
    const weeklySessionsCount = parseInt(weeklyStatsRows?.[0]?.sessions_count || 0, 10);

    // 3. User Practice Goal (from user_practice_goals)
    const [goalRows] = await pool.query(
      'SELECT weekly_target_minutes FROM user_practice_goals WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const weeklyGoalTarget = (goalRows && goalRows.length > 0) ? (goalRows[0].weekly_target_minutes || 60) : 60;
    const weeklyGoalPercent = weeklyGoalTarget > 0 
      ? Math.min(100, Math.round((weeklyMinutes / weeklyGoalTarget) * 100))
      : 0;

    // 4. Module 01 (Vocal Foundations) Gagné 9-Stage Progress
    const [breathModuleRows] = await pool.query(
      "SELECT id, title, description, status FROM learning_modules WHERE module_order = 1 LIMIT 1"
    );
    const breathModule = breathModuleRows.length > 0 ? breathModuleRows[0] : {
      id: 1,
      title: 'Breathe. Support. Sing.',
      description: 'Breath management isn\'t about taking the biggest breath or holding a note for the longest time. It\'s about coordinating comfortable breathing with the musical phrase.',
      status: 'IN_PROGRESS'
    };

    // 5-Stage Breath Management Learning Module
    const [stagesRows] = await pool.query(
      'SELECT id, stage_number, COALESCE(title, stage_title) AS stage_title, COALESCE(subtitle, stage_subtitle) AS stage_subtitle FROM learning_stages WHERE module_id = ? AND is_active = TRUE ORDER BY stage_number ASC LIMIT 5',
      [breathModule.id]
    );
    const totalStages = (stagesRows && stagesRows.length > 0) ? stagesRows.length : 5;

    // User completed stages from learning_stage_progress (and user_stage_progress fallback)
    const [completedStagesRows] = await pool.query(`
      SELECT COUNT(DISTINCT ls.id) AS completed 
      FROM learning_stages ls
      LEFT JOIN learning_stage_progress lsp ON ls.id = lsp.stage_id AND lsp.user_id = ?
      LEFT JOIN user_stage_progress usp ON ls.id = usp.stage_id AND usp.user_id = ?
      WHERE ls.module_id = ? AND ls.is_active = TRUE 
        AND (lsp.status = 'COMPLETED' OR usp.completion_status = 'COMPLETED')
    `, [userId, userId, breathModule.id]);
    const completedStages = completedStagesRows?.[0]?.completed || 0;

    // Current active stage
    const [currentStageRows] = await pool.query(`
      SELECT ls.stage_number, COALESCE(ls.title, ls.stage_title) AS stage_title, COALESCE(ls.subtitle, ls.stage_subtitle) AS stage_subtitle
      FROM learning_stages ls
      LEFT JOIN learning_stage_progress lsp ON ls.id = lsp.stage_id AND lsp.user_id = ?
      LEFT JOIN user_stage_progress usp ON ls.id = usp.stage_id AND usp.user_id = ?
      WHERE ls.module_id = ? AND ls.is_active = TRUE 
        AND COALESCE(lsp.status, usp.completion_status, 'NOT STARTED') != 'COMPLETED'
      ORDER BY ls.stage_number ASC LIMIT 1
    `, [userId, userId, breathModule.id]);

    const currentStage = (currentStageRows && currentStageRows.length > 0)
      ? currentStageRows[0]
      : ((stagesRows && stagesRows.length > 0) ? stagesRows[0] : {
          stage_number: 1,
          stage_title: 'Introduction',
          stage_subtitle: 'Get curious'
        });

    const moduleProgressPercent = totalStages > 0 
      ? Math.round((completedStages / totalStages) * 100) 
      : 0;

    // Challenge Scores and Activity Metrics from live MySQL
    const [challengeAttempts] = await pool.query(
      'SELECT score, total_marks, percentage FROM challenge_attempts WHERE user_id = ? ORDER BY completed_at DESC',
      [userId]
    );
    const totalChallengesCompleted = challengeAttempts ? challengeAttempts.length : 0;
    const latestChallengeScore = (challengeAttempts && challengeAttempts.length > 0) ? (challengeAttempts[0].score || 0) : 0;
    const latestChallengePercentage = (challengeAttempts && challengeAttempts.length > 0) ? (challengeAttempts[0].percentage || 0) : 0;
    let bestChallengeScore = 0;
    let bestChallengePercentage = 0;
    if (challengeAttempts && challengeAttempts.length > 0) {
      const best = challengeAttempts.reduce((p, c) => (parseFloat(c?.percentage || 0) > parseFloat(p?.percentage || 0) ? c : p), challengeAttempts[0]);
      bestChallengeScore = best?.score || 0;
      bestChallengePercentage = best?.percentage || 0;
    }

    // Specific Stage 4: Myth or Fact Challenge Metrics from live MySQL
    const [mfAttempts] = await pool.query(
      'SELECT score, total_marks, percentage, status, completed_at FROM challenge_attempts WHERE user_id = ? AND challenge_id = 1 ORDER BY completed_at DESC',
      [userId]
    );
    const mythFactTotalAttempts = mfAttempts ? mfAttempts.length : 0;
    const mythFactCompleted = mythFactTotalAttempts > 0;
    const mythFactLatestScore = (mfAttempts && mfAttempts.length > 0) ? (mfAttempts[0].score || 0) : 0;
    const mythFactLatestPercentage = (mfAttempts && mfAttempts.length > 0) ? parseFloat(mfAttempts[0].percentage || 0) : 0;
    const mythFactLastAttemptDate = (mfAttempts && mfAttempts.length > 0) ? mfAttempts[0].completed_at : null;
    let mythFactBestScore = 0;
    let mythFactBestPercentage = 0;
    if (mfAttempts && mfAttempts.length > 0) {
      const bestMf = mfAttempts.reduce((p, c) => (parseFloat(c?.percentage || 0) > parseFloat(p?.percentage || 0) ? c : p), mfAttempts[0]);
      mythFactBestScore = bestMf?.score || 0;
      mythFactBestPercentage = parseFloat(bestMf?.percentage || 0);
    }

    const [writtenStats] = await pool.query(
      'SELECT COUNT(*) AS count FROM written_assessments WHERE user_id = ?',
      [userId]
    );
    const writtenAssessmentsCount = writtenStats?.[0]?.count || 0;

    const [recordingsStats] = await pool.query(
      'SELECT COUNT(*) AS count FROM student_recordings WHERE user_id = ?',
      [userId]
    );
    const recordingsCount = recordingsStats?.[0]?.count || 0;

    // Total Marks and Scores (combining challenges & assessments)
    const totalAwarded = latestChallengeScore;
    const totalPossible = (challengeAttempts && challengeAttempts.length > 0) ? (challengeAttempts[0].total_marks || 100) : 100;
    const provisionalScorePercent = totalPossible > 0 ? Math.round((totalAwarded / totalPossible) * 100) : 0;

    // 5b. Practice Diary Counts
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

    const diaryStats = {
      total: parseInt(diaryCounts?.[0]?.total_tasks || 0, 10),
      todo: parseInt(diaryCounts?.[0]?.todo_count || 0, 10),
      doing: parseInt(diaryCounts?.[0]?.doing_count || 0, 10),
      done: parseInt(diaryCounts?.[0]?.done_count || 0, 10),
      completedThisWeek: parseInt(diaryCounts?.[0]?.done_this_week || 0, 10)
    };

    // 5b. Student Learning Reflection Status (Stage 04 Pinboard)
    const [reflectionRows] = await pool.query(
      'SELECT id, status, question_1_answer, question_2_answer, question_3_answer, submitted_at, updated_at FROM student_learning_reflections WHERE user_id = ? AND module_id = ? AND stage_id = ? LIMIT 1',
      [userId, breathModule.id, 4]
    );
    let learningReflectionStatus = 'Not started';
    let learningReflectionData = null;
    if (reflectionRows.length > 0) {
      const r = reflectionRows[0];
      const hasAllThree = Boolean(r.question_1_answer?.trim() && r.question_2_answer?.trim() && r.question_3_answer?.trim());
      learningReflectionStatus = hasAllThree ? 'Completed' : 'In progress';
      learningReflectionData = {
        id: r.id,
        status: learningReflectionStatus,
        submittedAt: r.submitted_at || r.updated_at,
        hasSubmitted: hasAllThree
      };
    }

    // 5c. Stage 05 Practice Commitment & Learning Journal Kanban
    const [commitmentRows] = await pool.query(
      'SELECT minutes_per_session, sessions_per_week, weekly_minutes FROM student_practice_commitments WHERE user_id = ? AND module_id = ? AND is_active = TRUE LIMIT 1',
      [userId, breathModule.id]
    );
    const activeCommitment = commitmentRows.length > 0 ? commitmentRows[0] : null;

    const [journalSessionCounts] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) AS planned,
        SUM(CASE WHEN status = 'practising' THEN 1 ELSE 0 END) AS practising,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done
      FROM student_practice_sessions
      WHERE user_id = ?
    `, [userId]);

    const journalStats = {
      total: parseInt(journalSessionCounts[0]?.total || 0, 10),
      planned: parseInt(journalSessionCounts[0]?.planned || 0, 10),
      practising: parseInt(journalSessionCounts[0]?.practising || 0, 10),
      done: parseInt(journalSessionCounts[0]?.done || 0, 10)
    };

    let moduleSummary = null;
    try {
      const stageFivePracticeCtrl = require('./stageFivePracticeController');
      if (typeof stageFivePracticeCtrl.calculateModuleCompletion === 'function') {
        moduleSummary = await stageFivePracticeCtrl.calculateModuleCompletion(userId, 1);
      }
    } catch (e) {
      console.error('Error calculating module summary in dashboard:', e);
    }

    // 6. Learning Pathway (3 modules in row)
    const [pathwayRows] = await pool.query(
      'SELECT id, title, description, module_order, status FROM learning_modules ORDER BY module_order ASC LIMIT 3'
    );

    const defaultPathway = [
      {
        id: 1,
        title: 'Breathe. Support. Sing.',
        description: 'Master diaphragmatic support, appoggio, and rhythmic airflow pacing.',
        status: 'IN PROGRESS',
        rawStatus: 'IN_PROGRESS',
        icon: 'wind'
      },
      {
        id: 2,
        title: 'Pitch & Intonation',
        description: 'Fine-tune micro-intonation, interval accuracy, and agile vocal scales.',
        status: 'NEXT LEARNING MODULE',
        rawStatus: 'NEXT_MODULE',
        icon: 'music'
      },
      {
        id: 3,
        title: 'Vocal Resonance',
        description: 'Unlock mask resonance and vocal projection without throat constriction.',
        status: 'COMING SOON',
        rawStatus: 'COMING_SOON',
        icon: 'volume-2'
      }
    ];

    const pathwayCards = pathwayRows.length > 0 ? pathwayRows.map(m => {
      let icon = 'wind';
      if (m.module_order === 2) icon = 'music';
      if (m.module_order === 3) icon = 'volume-2';

      let displayStatus = 'COMING SOON';
      if (m.status === 'IN_PROGRESS') displayStatus = 'IN PROGRESS';
      if (m.status === 'NEXT_MODULE') displayStatus = 'NEXT LEARNING MODULE';

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        status: displayStatus,
        rawStatus: m.status,
        icon
      };
    }) : defaultPathway;

    // Build complete Dashboard response
    const dashboardData = {
      header: {
        dateDisplay: formatLearningSpaceDate(now),
        dayDateDisplay: `${new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now).toUpperCase()}, ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(now).toUpperCase()}`,
        timeDisplay: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(now),
        timeOfDay: getTimeOfDay(now),
        timeGreeting: getTimeGreeting(now),
        username: user?.username || 'Vocalist',
        greeting: `${getTimeGreeting(now)}, ${user?.username || 'Vocalist'} ✦`,
        tagline: 'A little intentional practice goes a long way. Pick up where you left off.',
        ctaText: 'CONTINUE LEARNING',
        ctaLink: '/learning'
      },
      heroBanner: {
        badge: 'YOUR VOICE, YOUR PACE',
        heading: 'Make every practice session count.',
        description: "Go beyond repeating exercises. Understand what you're practising, why it matters, and how to bring it into your songs.",
        buttonText: 'Resume breath management →',
        buttonLink: '/learning'
      },
      statistics: {
        practiceThisWeek: {
          value: `${weeklyMinutes} min`,
          numericValue: weeklyMinutes,
          rawMinutes: weeklyMinutes,
          label: 'Practice this week',
          helper: 'Calculated from live MySQL sessions'
        },
        sessionsCompleted: {
          value: `${weeklySessionsCount} sessions`,
          numericValue: weeklySessionsCount,
          rawCount: weeklySessionsCount,
          label: 'Sessions completed',
          helper: 'Current week progress'
        },
        weeklyGoalReached: {
          value: `${weeklyGoalPercent}%`,
          numericValue: weeklyGoalPercent,
          rawPercent: weeklyGoalPercent,
          targetMinutes: weeklyGoalTarget,
          label: 'Weekly goal reached',
          isConfigured: goalRows.length > 0
        },
        diaryStats,
        commitment: activeCommitment,
        journalStats,
        moduleSummary
      },
      learningProgress: {
        moduleId: breathModule.id,
        badge: 'MODULE 01 · VOCAL FOUNDATIONS',
        title: 'Breathe. Support. Sing.',
        description: breathModule.description,
        totalStages,
        completedStages,
        currentStageNumber: currentStage.stage_number,
        currentStageTitle: currentStage.stage_title,
        statusText: completedStages > 0 ? `${completedStages} of ${totalStages} learning stages explored` : 'Not started · 0%',
        percentage: moduleProgressPercent,
        buttonText: 'Open module →',
        buttonLink: '/learning',
        marksObtained: totalAwarded,
        totalPossibleMarks: totalPossible,
        provisionalScorePercent,
        challenges: {
          totalCompleted: totalChallengesCompleted,
          latestScore: latestChallengeScore,
          latestPercentage: latestChallengePercentage,
          bestScore: bestChallengeScore,
          bestPercentage: bestChallengePercentage,
          mythOrFactCompleted: mythFactCompleted,
          totalAttempts: mythFactTotalAttempts,
          lastAttemptDate: mythFactLastAttemptDate,
          completionPercentage: mythFactLatestPercentage,
          latestScoreMythFact: mythFactLatestScore,
          bestScoreMythFact: mythFactBestScore
        },
        writtenAssessmentsCount,
        recordingsCount,
        reflectionStatus: learningReflectionStatus,
        learningReflection: learningReflectionData
      },
      diaryStats,
      learningPathway: pathwayCards,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/learning-summary
exports.getLearningSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [modules] = await pool.query('SELECT id, title, description, module_code FROM learning_modules WHERE module_order = 1 LIMIT 1');
    const moduleId = modules.length > 0 ? modules[0].id : 1;

    const [stages] = await pool.query('SELECT id, stage_number, COALESCE(title, stage_title) AS stage_title, COALESCE(subtitle, stage_subtitle) AS stage_subtitle FROM learning_stages WHERE module_id = ? AND is_active = TRUE ORDER BY stage_number ASC LIMIT 5', [moduleId]);
    const [progress] = await pool.query(`
      SELECT ls.id AS stage_id, COALESCE(lsp.status, usp.completion_status, 'NOT STARTED') AS completion_status
      FROM learning_stages ls
      LEFT JOIN learning_stage_progress lsp ON ls.id = lsp.stage_id AND lsp.user_id = ?
      LEFT JOIN user_stage_progress usp ON ls.id = usp.stage_id AND usp.user_id = ?
      WHERE ls.module_id = ? AND ls.is_active = TRUE
    `, [userId, userId, moduleId]);

    const progMap = {};
    progress.forEach(p => { progMap[p.stage_id] = p.completion_status; });

    let completed = 0;
    let inProgress = 0;
    let submitted = 0;
    let notStarted = 0;
    let currentStage = 1;

    stages.forEach(st => {
      const stStatus = progMap[st.id] || 'NOT_STARTED';
      if (stStatus === 'COMPLETED') completed++;
      else if (stStatus === 'IN_PROGRESS') inProgress++;
      else if (stStatus === 'SUBMITTED') submitted++;
      else notStarted++;
    });

    for (const st of stages) {
      if ((progMap[st.id] || 'NOT_STARTED') !== 'COMPLETED') {
        currentStage = st.stage_number;
        break;
      }
    }

    const percentage = stages.length > 0 ? Math.round((completed / stages.length) * 100) : 0;

    res.status(200).json({
      success: true,
      moduleName: 'MODULE 01 · VOCAL FOUNDATIONS',
      title: 'Breathe. Support. Sing.',
      totalStages: stages.length,
      completedStages: completed,
      inProgressStages: inProgress,
      submittedStages: submitted,
      pendingStages: notStarted,
      currentStageNumber: currentStage,
      overallProgressPercent: percentage
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/task-performance
exports.getTaskPerformance = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [tasks] = await pool.query('SELECT id, task_title, maximum_marks FROM learning_tasks');
    const [assignments] = await pool.query('SELECT task_id, assignment_status FROM user_task_assignments WHERE user_id = ?', [userId]);
    const [assessments] = await pool.query('SELECT task_id, marks_awarded, maximum_marks, percentage, assessment_status FROM task_assessments WHERE user_id = ?', [userId]);

    const assignMap = {};
    assignments.forEach(a => { assignMap[a.task_id] = a.assignment_status; });

    let completedTasks = 0;
    let submittedTasks = 0;
    let inProgressTasks = 0;
    let pendingTasks = 0;

    tasks.forEach(t => {
      const status = assignMap[t.id] || 'ASSIGNED';
      if (status === 'COMPLETED') completedTasks++;
      else if (status === 'SUBMITTED') submittedTasks++;
      else if (status === 'IN_PROGRESS') inProgressTasks++;
      else pendingTasks++;
    });

    let totalMarksObtained = 0;
    let totalPossibleMarks = tasks.reduce((sum, t) => sum + (t.maximum_marks || 0), 0);
    let latestScore = null;

    if (assessments.length > 0) {
      const sorted = [...assessments].reverse();
      latestScore = sorted[0];
      assessments.forEach(ass => {
        if (ass.marks_awarded !== null) {
          totalMarksObtained += ass.marks_awarded;
        }
      });
    }

    const provisionalPercent = totalPossibleMarks > 0 ? Math.round((totalMarksObtained / totalPossibleMarks) * 100) : 0;

    res.status(200).json({
      success: true,
      totalAssignedTasks: tasks.length,
      completedTasks,
      submittedTasks,
      inProgressTasks,
      pendingTasks,
      totalMarksObtained,
      totalPossibleMarks,
      provisionalPercent,
      latestTaskScore: latestScore ? `${latestScore.marks_awarded}/${latestScore.maximum_marks}` : 'None'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/recent-activity
exports.getRecentActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Recently completed stage
    const [completedStage] = await pool.query(`
      SELECT ls.stage_number, ls.stage_title, usp.completed_at
      FROM user_stage_progress usp
      JOIN learning_stages ls ON usp.stage_id = ls.id
      WHERE usp.user_id = ? AND usp.completion_status = 'COMPLETED'
      ORDER BY usp.completed_at DESC LIMIT 1
    `, [userId]);

    // Recently submitted task
    const [submittedTask] = await pool.query(`
      SELECT lt.task_title, uts.submitted_at, uts.submission_type
      FROM user_task_submissions uts
      JOIN learning_tasks lt ON uts.task_id = lt.id
      WHERE uts.user_id = ?
      ORDER BY uts.submitted_at DESC LIMIT 1
    `, [userId]);

    // Latest assessment
    const [latestAssessment] = await pool.query(`
      SELECT lt.task_title, ta.marks_awarded, ta.maximum_marks, ta.feedback, ta.assessed_at
      FROM task_assessments ta
      JOIN learning_tasks lt ON ta.task_id = lt.id
      WHERE ta.user_id = ? AND ta.assessed_at IS NOT NULL
      ORDER BY ta.assessed_at DESC LIMIT 1
    `, [userId]);

    // Latest practice reflection
    const [latestReflection] = await pool.query(`
      SELECT practice_type, duration_minutes, reflection, practice_date
      FROM practice_reflections
      WHERE user_id = ?
      ORDER BY practice_date DESC LIMIT 1
    `, [userId]);

    // Latest completed diary task
    const [latestDiaryTask] = await pool.query(`
      SELECT title, completed_at
      FROM practice_diary_tasks
      WHERE user_id = ? AND status = 'DONE' AND completed_at IS NOT NULL
      ORDER BY completed_at DESC LIMIT 1
    `, [userId]);

    res.status(200).json({
      success: true,
      recentlyCompletedStage: completedStage.length > 0 ? completedStage[0] : null,
      recentlySubmittedTask: submittedTask.length > 0 ? submittedTask[0] : null,
      latestAssessment: latestAssessment.length > 0 ? latestAssessment[0] : null,
      latestPracticeReflection: latestReflection.length > 0 ? latestReflection[0] : null,
      latestCompletedDiaryTask: latestDiaryTask.length > 0 ? latestDiaryTask[0] : null,
      lastActivityDate: (latestReflection.length > 0 ? latestReflection[0].practice_date : null) || (submittedTask.length > 0 ? submittedTask[0].submitted_at : null) || (completedStage.length > 0 ? completedStage[0].completed_at : null)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/practice-summary
exports.getPracticeSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [weeklyRows] = await pool.query(`
      SELECT 
        COALESCE(SUM(duration_minutes), 0) AS weekly_minutes,
        COUNT(*) AS weekly_sessions
      FROM practice_sessions
      WHERE user_id = ?
        AND completion_status = 'completed'
        AND completed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    `, [userId]);

    const [goalRows] = await pool.query(
      'SELECT weekly_target_minutes FROM user_practice_goals WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const targetMinutes = goalRows.length > 0 ? goalRows[0].weekly_target_minutes : 60;
    const weeklyMinutes = parseInt(weeklyRows[0].weekly_minutes || 0, 10);
    const weeklySessions = parseInt(weeklyRows[0].weekly_sessions || 0, 10);
    const percentage = targetMinutes > 0 ? Math.min(100, Math.round((weeklyMinutes / targetMinutes) * 100)) : 0;

    const [reflections] = await pool.query(`
      SELECT id, practice_type, duration_minutes, reflection, practice_date
      FROM practice_reflections
      WHERE user_id = ?
      ORDER BY practice_date DESC LIMIT 5
    `, [userId]);

    const [diarySummary] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) AS todo,
        SUM(CASE WHEN status = 'DOING' THEN 1 ELSE 0 END) AS doing,
        SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) AS done,
        SUM(CASE WHEN status = 'DONE' AND completed_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN 1 ELSE 0 END) AS done_this_week
      FROM practice_diary_tasks
      WHERE user_id = ?
    `, [userId]);

    res.status(200).json({
      success: true,
      weeklyMinutes,
      weeklySessions,
      targetMinutes,
      percentage,
      recentReflections: reflections,
      diaryStats: {
        total: parseInt(diarySummary[0].total || 0, 10),
        todo: parseInt(diarySummary[0].todo || 0, 10),
        doing: parseInt(diarySummary[0].doing || 0, 10),
        done: parseInt(diarySummary[0].done || 0, 10),
        completedThisWeek: parseInt(diarySummary[0].done_this_week || 0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};
