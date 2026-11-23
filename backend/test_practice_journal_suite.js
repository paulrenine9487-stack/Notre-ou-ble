// Comprehensive Practice Journal & Personal Practice Diary Verification Suite
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = 'http://127.0.0.1:5000';

async function requestJson(method, endpoint, data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers
  };
  if (data) options.body = JSON.stringify(data);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  NO TREBLE - PRACTICE JOURNAL & PERSONAL PRACTICE DIARY TESTS ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond, name, details = '') {
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // Direct MySQL connection for low-level integrity verification
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'resonova_db'
  });

  try {
    const timestamp = Date.now();
    const userAEmail = `diary_user_a_${timestamp}@example.com`;
    const userBEmail = `diary_user_b_${timestamp}@example.com`;
    const testPassword = 'Password123';

    // 1. Health check
    const health = await requestJson('GET', '/api/health');
    assert(health.status === 200, 'Test 1: Backend API health check returns 200 OK');

    // 2. Register & Login User A
    const regResA = await requestJson('POST', '/api/auth/register', {
      username: `JournalSingerA_${timestamp}`,
      gender: 'Female',
      email: userAEmail,
      phone: '9876543210',
      password: testPassword,
      confirm_password: testPassword,
      selected_musical_goal: 'I want to develop my vocal technique.',
      types_of_music: ['Carnatic', 'Western Classical']
    });
    assert(regResA.status === 201, 'Test 2: User A registered successfully');

    const loginResA = await requestJson('POST', '/api/auth/login', {
      email: userAEmail,
      password: testPassword
    });
    const tokenA = loginResA.body.token;
    const userAId = loginResA.body.user.id;
    assert(loginResA.status === 200 && tokenA, 'Test 3: User A login succeeded with JWT');

    // Register & Login User B (for isolation tests)
    const regResB = await requestJson('POST', '/api/auth/register', {
      username: `JournalSingerB_${timestamp}`,
      gender: 'Male',
      email: userBEmail,
      phone: '9876543211',
      password: testPassword,
      confirm_password: testPassword,
      selected_musical_goal: 'Stage performance breathing',
      types_of_music: ['Jazz']
    });
    const loginResB = await requestJson('POST', '/api/auth/login', {
      email: userBEmail,
      password: testPassword
    });
    const tokenB = loginResB.body.token;
    assert(tokenB, 'Test 4: User B registered & authenticated for isolation testing');

    // -------------------------------------------------------------
    // SECTION 1 & 2: PRACTICE REFLECTION LOGGING & RETRIEVAL
    // -------------------------------------------------------------

    // 5. Log a Practice Session (SSS airflow exercise, 10 min)
    const logRes1 = await requestJson('POST', '/api/practice/reflections', {
      practice_type: 'SSS airflow exercise',
      duration_minutes: 10,
      reflection: 'I found it much easier to keep the airflow steady when I kept my ribs expanded.'
    }, tokenA);
    assert(logRes1.status === 201 && logRes1.body.success, 'Test 5: Log a practice session (SSS airflow exercise, 10 mins)');
    const reflection1Id = logRes1.body.reflection?.id;

    // 6. Verify record created in MySQL practice_reflections table
    const [dbReflections] = await db.query(
      'SELECT * FROM practice_reflections WHERE id = ? AND user_id = ?',
      [reflection1Id, userAId]
    );
    assert(
      dbReflections.length === 1 &&
      dbReflections[0].practice_type === 'SSS airflow exercise' &&
      Number(dbReflections[0].duration_minutes) === 10,
      'Test 6: MySQL database contains practice_reflections record with matching type and 10 minutes'
    );

    // 7. Verify linked record created in practice_sessions table
    const [dbSessions] = await db.query(
      'SELECT * FROM practice_sessions WHERE reflection_id = ? AND user_id = ?',
      [reflection1Id, userAId]
    );
    assert(
      dbSessions.length === 1 &&
      Number(dbSessions[0].duration_minutes) === 10,
      'Test 7: Linked practice_sessions entry automatically created with matching 10 mins duration and reflection_id'
    );

    // 8. Verify reflection appears in GET /api/practice/reflections
    const getRefsRes = await requestJson('GET', '/api/practice/reflections', null, tokenA);
    assert(
      getRefsRes.status === 200 &&
      getRefsRes.body.reflections.some(r => r.id === reflection1Id),
      'Test 8: GET /api/practice/reflections returns logged reflection'
    );

    // 9. Update reflection (Change to 15 mins and updated notes)
    const updateRefRes = await requestJson('PUT', `/api/practice/reflections/${reflection1Id}`, {
      practice_type: 'SSS airflow exercise',
      duration_minutes: 15,
      reflection: 'Updated: practiced for 15 mins with metronome.'
    }, tokenA);
    assert(updateRefRes.status === 200 && updateRefRes.body.success, 'Test 9: PUT /api/practice/reflections/:id updates reflection');

    // 10. Verify linked practice_sessions duration updated in MySQL
    const [updatedDbSessions] = await db.query(
      'SELECT duration_minutes FROM practice_sessions WHERE reflection_id = ?',
      [reflection1Id]
    );
    assert(
      updatedDbSessions.length === 1 && Number(updatedDbSessions[0].duration_minutes) === 15,
      'Test 10: Linked practice_sessions duration automatically synchronized to 15 minutes'
    );

    // -------------------------------------------------------------
    // SECTION 3: PERSONAL PRACTICE DIARY (KANBAN BOARD)
    // -------------------------------------------------------------

    // 11. Create a diary task in TODO column
    const createTaskRes1 = await requestJson('POST', '/api/practice/diary/tasks', {
      title: 'Practice 4-Count Inhale / 8-Count SSS Exhale',
      description: 'Focus on abdominal release on inhale and continuous hiss.',
      priority: 'HIGH'
    }, tokenA);
    assert(createTaskRes1.status === 201 && createTaskRes1.body.success, 'Test 11: Create Personal Practice Diary task in TODO column');
    const task1Id = createTaskRes1.body.task?.id;

    // 12. Verify diary task in MySQL with position and status = TODO
    const [dbTasks] = await db.query(
      'SELECT * FROM practice_diary_tasks WHERE id = ? AND user_id = ?',
      [task1Id, userAId]
    );
    assert(
      dbTasks.length === 1 && dbTasks[0].status === 'TODO' && dbTasks[0].position === 0,
      'Test 12: Diary task persisted in MySQL with status TODO and position 0'
    );

    // 13. Move task TODO -> DOING
    const statusDoingRes = await requestJson('PATCH', `/api/practice/diary/tasks/${task1Id}/status`, {
      status: 'DOING',
      notes: 'Started practice today'
    }, tokenA);
    assert(statusDoingRes.status === 200 && statusDoingRes.body.success, 'Test 13: Move task status TODO -> DOING via API');

    // 14. Verify MySQL started_at and history record
    const [dbTaskDoing] = await db.query(
      'SELECT started_at, status FROM practice_diary_tasks WHERE id = ?',
      [task1Id]
    );
    const [historyRows1] = await db.query(
      'SELECT * FROM practice_task_history WHERE diary_task_id = ? ORDER BY id DESC',
      [task1Id]
    );
    assert(
      dbTaskDoing[0].status === 'DOING' &&
      dbTaskDoing[0].started_at !== null &&
      historyRows1.some(h => h.new_status === 'DOING'),
      'Test 14: MySQL started_at timestamp populated and transition logged in practice_task_history'
    );

    // 15. Move task DOING -> DONE
    const statusDoneRes = await requestJson('PATCH', `/api/practice/diary/tasks/${task1Id}/status`, {
      status: 'DONE',
      notes: 'Mastered 8-count airflow'
    }, tokenA);
    assert(statusDoneRes.status === 200 && statusDoneRes.body.success, 'Test 15: Move task status DOING -> DONE');

    // 16. Verify completed_at populated in MySQL and duration was NOT counted as practice session duration
    const [dbTaskDone] = await db.query(
      'SELECT completed_at, status FROM practice_diary_tasks WHERE id = ?',
      [task1Id]
    );
    const [totalSessionMinsRows] = await db.query(
      'SELECT COALESCE(SUM(duration_minutes), 0) AS total_mins FROM practice_sessions WHERE user_id = ?',
      [userAId]
    );
    assert(
      dbTaskDone[0].status === 'DONE' &&
      dbTaskDone[0].completed_at !== null &&
      Number(totalSessionMinsRows[0].total_mins) === 15, // exactly matches the 15 min reflection, no extra duration from task completion
      'Test 16: Task completed_at recorded; diary task completion does NOT artificially add practice duration'
    );

    // -------------------------------------------------------------
    // SECTION 4: INTEGRATION WITH GAGNÉ LEARNING MODULE
    // -------------------------------------------------------------

    // 17. Link Gagné learning task to Practice Diary
    const [learningTasks] = await db.query(
      'SELECT id, task_title FROM learning_tasks LIMIT 1'
    );
    const learningTaskId = learningTasks[0].id;

    const linkRes1 = await requestJson('POST', '/api/practice/diary/tasks/from-learning', {
      learning_task_id: learningTaskId,
      priority: 'HIGH'
    }, tokenA);
    assert(
      linkRes1.status === 201 && linkRes1.body.success,
      'Test 17: "ADD TO MY PRACTICE DIARY" from Gagné Learning Task successfully creates task'
    );
    const linkedDiaryTaskId = linkRes1.body.task?.id;

    // 18. Deduplication check: linking same learning task again returns existing task
    const linkRes2 = await requestJson('POST', '/api/practice/diary/tasks/from-learning', {
      learning_task_id: learningTaskId,
      priority: 'HIGH'
    }, tokenA);
    assert(
      linkRes2.status === 200 && linkRes2.body.alreadyExists === true && linkRes2.body.task?.id === linkedDiaryTaskId,
      'Test 18: Deduplication active - adding existing learning task returns existing diary task without duplicating'
    );

    // -------------------------------------------------------------
    // SECTION 5: PRACTICE INSIGHTS & DASHBOARD OVERVIEW INTEGRATION
    // -------------------------------------------------------------

    // 19. Verify Practice Insights / Analytics endpoint
    const insightsRes = await requestJson('GET', '/api/practice/analytics', null, tokenA);
    assert(
      insightsRes.status === 200 &&
      insightsRes.body.analytics.totalPracticeMinutes === 15 &&
      insightsRes.body.analytics.totalPracticeSessions === 1 &&
      insightsRes.body.analytics.mostPracticedActivity === 'SSS airflow exercise' &&
      insightsRes.body.analytics.diaryTasksCompleted === 1,
      'Test 19: Practice Insights accurately calculates MySQL minutes, sessions, top activity, and completed diary tasks'
    );

    // 20. Verify User Dashboard overview reflects live weekly minutes and diaryStats
    const dashRes = await requestJson('GET', '/api/dashboard/overview', null, tokenA);
    assert(
      dashRes.status === 200 &&
      dashRes.body.data.statistics.practiceThisWeek.rawMinutes === 15 &&
      dashRes.body.data.statistics.sessionsCompleted.rawCount === 1 &&
      dashRes.body.data.statistics.diaryStats?.done === 1 &&
      dashRes.body.data.statistics.diaryStats?.total >= 2,
      'Test 20: User Dashboard Overview live sync: weeklyMinutes=15, sessionsCompleted=1, diaryStats synced'
    );

    // -------------------------------------------------------------
    // BONUS / SECURITY: MULTI-USER ISOLATION TESTS
    // -------------------------------------------------------------

    // User B should see 0 reflections and 0 diary tasks
    const userBReflections = await requestJson('GET', '/api/practice/reflections', null, tokenB);
    const userBDiary = await requestJson('GET', '/api/practice/diary/tasks', null, tokenB);
    assert(
      userBReflections.body.reflections.length === 0 &&
      userBDiary.body.tasks.length === 0,
      'Test 21 (Security): User B cannot view User A\'s reflections or diary tasks'
    );

    // User B cannot edit or delete User A's reflection
    const userBEditRef = await requestJson('PUT', `/api/practice/reflections/${reflection1Id}`, {
      practice_type: 'Other vocal practice',
      duration_minutes: 20,
      reflection: 'Hacked by B'
    }, tokenB);
    assert(userBEditRef.status === 404, 'Test 22 (Security): User B cannot update User A\'s reflection (404 Not Found)');

    // User B cannot edit or change status of User A's diary task
    const userBStatusTask = await requestJson('PATCH', `/api/practice/diary/tasks/${task1Id}/status`, {
      status: 'DONE'
    }, tokenB);
    assert(userBStatusTask.status === 404, 'Test 23 (Security): User B cannot change status of User A\'s diary task (404 Not Found)');

    // -------------------------------------------------------------
    // CLEANUP / DELETION VERIFICATION
    // -------------------------------------------------------------

    // Delete Reflection: ensure linked practice_sessions entry is removed
    const delRefRes = await requestJson('DELETE', `/api/practice/reflections/${reflection1Id}`, null, tokenA);
    assert(delRefRes.status === 200 && delRefRes.body.success, 'Test 24: DELETE /api/practice/reflections/:id removes reflection');

    const [dbReflectionsAfterDel] = await db.query('SELECT * FROM practice_reflections WHERE id = ?', [reflection1Id]);
    const [dbSessionsAfterDel] = await db.query('SELECT * FROM practice_sessions WHERE reflection_id = ?', [reflection1Id]);
    assert(
      dbReflectionsAfterDel.length === 0 && dbSessionsAfterDel.length === 0,
      'Test 25: Reflection and linked practice_sessions entry successfully purged from MySQL'
    );

    // Delete Diary Task: ensure task, history, and links are removed
    const delTaskRes = await requestJson('DELETE', `/api/practice/diary/tasks/${linkedDiaryTaskId}`, null, tokenA);
    assert(delTaskRes.status === 200 && delTaskRes.body.success, 'Test 26: DELETE /api/practice/diary/tasks/:id removes diary task');

    const [dbTaskAfterDel] = await db.query('SELECT * FROM practice_diary_tasks WHERE id = ?', [linkedDiaryTaskId]);
    assert(dbTaskAfterDel.length === 0, 'Test 27: Diary task completely removed from MySQL');

    console.log('\n================================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test suite failed with unexpected error:', err);
    process.exit(1);
  } finally {
    if (userIdA || userIdB) {
      try {
        const ids = [userIdA, userIdB].filter(Boolean);
        await db.query('DELETE FROM practice_reflections WHERE user_id IN (?)', [ids]);
        await db.query('DELETE FROM practice_sessions WHERE user_id IN (?)', [ids]);
        await db.query('DELETE FROM practice_diary_tasks WHERE user_id IN (?)', [ids]);
        await db.query('DELETE FROM users WHERE id IN (?)', [ids]);
      } catch (e) {}
    }
    await db.end();
  }
}

runTestSuite();
