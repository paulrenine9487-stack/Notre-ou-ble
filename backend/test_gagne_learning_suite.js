// Test Suite for Gagné's 9 Events of Instruction & Task Management System using native Node.js fetch & FormData
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:5000';

async function postJson(endpoint, data, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function getJson(endpoint, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function uploadFile(endpoint, filePath, fields = {}, token = null) {
  const formData = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    formData.append(k, v);
  }
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'audio/webm' });
  formData.append('audio', blob, path.basename(filePath));

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  No Tre(ou)ble - GAGNÉ 9-STAGE & TASK SYSTEM INTEGRATION TESTS  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await getJson('/api/health');
    assert(health.status === 200 && health.body.status === 'ok', '1. Server Health Check');

    // 2. Login Admin
    const adminLogin = await postJson('/api/auth/login', {
      email: 'admin@notreoble.com',
      password: 'Admin@Treoble2026'
    });
    const adminToken = adminLogin.body?.token;
    assert(adminLogin.status === 200 && adminToken, '2. Admin Authentication');

    // 3. Register Student A & Login
    const studentAEmail = `student_a_${Date.now()}@test.com`;
    const regStudentA = await postJson('/api/auth/register', {
      username: `student_a_${Date.now().toString().slice(-4)}`,
      email: studentAEmail,
      password: 'Password123!',
      confirm_password: 'Password123!',
      gender: 'MALE',
      phone: '9876543210',
      types_of_music: ['Classical', 'Pop'],
      selected_musical_goal: 'I want to sing higher notes.'
    });
    assert(regStudentA.status === 201, '3. Student A Registration');

    const loginStudentA = await postJson('/api/auth/login', {
      email: studentAEmail,
      password: 'Password123!'
    });
    const studentAToken = loginStudentA.body?.token;
    assert(loginStudentA.status === 200 && studentAToken, '4. Student A Login & JWT Token');

    // 4. Register Student B & Login (for data isolation testing)
    const studentBEmail = `student_b_${Date.now()}@test.com`;
    const regStudentB = await postJson('/api/auth/register', {
      username: `student_b_${Date.now().toString().slice(-4)}`,
      email: studentBEmail,
      password: 'Password123!',
      confirm_password: 'Password123!',
      gender: 'FEMALE',
      phone: '9876543211',
      types_of_music: ['Jazz'],
      selected_musical_goal: 'I want to sing with better tone.'
    });
    assert(regStudentB.status === 201, '5. Student B Registration');

    const loginStudentB = await postJson('/api/auth/login', {
      email: studentBEmail,
      password: 'Password123!'
    });
    const studentBToken = loginStudentB.body?.token;
    assert(loginStudentB.status === 200 && studentBToken, '6. Student B Login');

    // 5. Test Stages Fetch & Sequential Gagné Ordering (TEST 2)
    const stagesRes = await getJson('/api/learning/modules/1/stages', studentAToken);
    assert(stagesRes.status === 200 && stagesRes.body.stages.length === 9, '7. Module 01 has exact 9 Gagné stages');

    const expectedTitles = [
      'Gain Attention',
      'Inform Objectives',
      'Stimulate Recall',
      'Present Content',
      'Provide Learning Guidance',
      'Elicit Performance',
      'Provide Feedback',
      'Assess Performance',
      'Enhance Retention & Transfer'
    ];

    let orderCorrect = true;
    stagesRes.body.stages.forEach((st, idx) => {
      if (st.stage_number !== idx + 1 || st.stage_title !== expectedTitles[idx]) {
        orderCorrect = false;
      }
    });
    assert(orderCorrect, '8. Stages sequence follows Gagné 9 events (01 to 09 in order)');

    const stage1 = stagesRes.body.stages[0];
    const task1 = stage1.tasks[0];

    // 6. Test Start Stage and Task (TEST 3)
    const startStageRes = await postJson(`/api/learning/stages/${stage1.id}/start`, {}, studentAToken);
    assert(startStageRes.status === 200 && startStageRes.body.status === 'IN_PROGRESS', '9. Start Stage 01');

    const startTaskRes = await postJson(`/api/learning/tasks/${task1.id}/start`, {}, studentAToken);
    assert(startTaskRes.status === 200 && startTaskRes.body.status === 'IN_PROGRESS', '10. Start Task 01');

    // 7. Test Submit Task (Written Response) (TEST 5 & 6)
    const submitTask1 = await postJson(`/api/learning/tasks/${task1.id}/submit`, {
      submission_type: 'text',
      text_response: 'Reflecting on natural diaphragmatic expansion: noticed ribs expanding 360 degrees when lying down.'
    }, studentAToken);
    assert(submitTask1.status === 201 && submitTask1.body.submissionId, '11. Submit Task 01 saved to MySQL');

    // 8. Test Reading Task Completion (Stage 04)
    const stage4 = stagesRes.body.stages[3];
    const task4 = stage4.tasks[0];
    const submitReading = await postJson(`/api/learning/tasks/${task4.id}/submit`, {
      submission_type: 'reading',
      text_response: 'Completed reading Appoggio & Respiratory Mechanics.'
    }, studentAToken);
    assert(submitReading.status === 201 && submitReading.body.taskStatus === 'COMPLETED', '12. Reading task automatically marks COMPLETED with marks');

    // 9. Test Timed Practice Session Logging (TEST 4)
    const practiceSessionRes = await postJson('/api/practice/complete', {
      session_type: 'Breath Management',
      exercise_name: 'Timed Respiratory Drill',
      duration_minutes: 15,
      notes: 'Active practice drill logging'
    }, studentAToken);
    assert(practiceSessionRes.status === 200 || practiceSessionRes.status === 201, '13. Practice timer session saved to MySQL');

    // 10. Test Audio Upload for Stage 08 (TEST 9)
    const stage8 = stagesRes.body.stages[7];
    const task8 = stage8.tasks[0];

    // Create a mock audio sample file
    const sampleAudioPath = path.join(__dirname, 'mock_sample.webm');
    fs.writeFileSync(sampleAudioPath, Buffer.from('RIFF....WAVEfmt ....data....mock audio content'));

    const uploadRes = await uploadFile(`/api/learning/tasks/${task8.id}/audio`, sampleAudioPath, {
      duration_seconds: '45',
      notes: 'Ode to Harmony - Phrase 1 breath mapping demonstration'
    }, studentAToken);

    assert(uploadRes.status === 201 && uploadRes.body.submissionId, '14. Audio demonstration uploaded & stored');
    const audioSubId = uploadRes.body.submissionId;

    // 11. Security & Data Isolation: Student B cannot access Student A's audio submission (TEST 14)
    const studentBAudioAccess = await getJson(`/api/learning/submissions/${audioSubId}/audio`, studentBToken);
    assert(studentBAudioAccess.status === 403, '15. Security check: User B cannot access User A audio recording (HTTP 403)');

    // 12. Security: Unauthorized student cannot access teacher grading APIs (TEST 15)
    const studentTeacherAccess = await getJson('/api/teacher/submissions', studentAToken);
    assert(studentTeacherAccess.status === 403, '16. Security check: Student cannot access Teacher Studio APIs (HTTP 403)');

    // 13. Admin views teacher submissions (TEST 10)
    const teacherSubs = await getJson('/api/teacher/submissions', adminToken);
    const foundAudioSub = teacherSubs.body?.submissions?.find(s => s.submission_id === audioSubId);
    assert(teacherSubs.status === 200 && foundAudioSub, '17. Admin views audio submission in Teacher Studio');

    // 14. Admin grades audio submission (TEST 11)
    const assessRes = await postJson(`/api/teacher/submissions/${audioSubId}/assess`, {
      marks_awarded: 48,
      feedback: 'Outstanding breath support and sustained intercostal expansion throughout the vocalise.',
      improvement_suggestions: 'Try an even softer abdominal release on the final cadence.'
    }, adminToken);
    assert(assessRes.status === 200 && assessRes.body.percentage === '96.00', '18. Admin grades submission with score & feedback');

    // 15. User Dashboard Integration & Provisional Score Calculation (TEST 12 & 13)
    const dashRes = await getJson('/api/dashboard/overview', studentAToken);
    assert(
      dashRes.status === 200 &&
      dashRes.body.data.learningProgress.marksObtained >= 48 &&
      dashRes.body.data.learningProgress.provisionalScorePercent > 0,
      '19. Live Dashboard automatically synchronizes MySQL score & completed stages'
    );

    // 16. Test Resubmission Versioning (TEST 16)
    const resubmitAudio = await uploadFile(`/api/learning/tasks/${task8.id}/audio`, sampleAudioPath, {
      duration_seconds: '50',
      notes: 'Second attempt with improved soft release'
    }, studentAToken);
    assert(resubmitAudio.status === 201 && resubmitAudio.body.version === 2, '20. Resubmission creates version 2 without overwriting history');

    // 17. Test Persistence After Re-login (TEST 7 & 8)
    const relogin = await postJson('/api/auth/login', {
      email: studentAEmail,
      password: 'Password123!'
    });
    const freshToken = relogin.body?.token;
    const restoredStages = await getJson('/api/learning/modules/1/stages', freshToken);
    const restoredStage8 = restoredStages.body?.stages?.find(s => s.stage_number === 8);
    assert(
      relogin.status === 200 &&
      restoredStage8.tasks[0].latest_version === 2,
      '21. Re-login persistence: Previous submissions, versions & progress restored from MySQL'
    );

    // Clean up sample audio file
    if (fs.existsSync(sampleAudioPath)) fs.unlinkSync(sampleAudioPath);

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    // Purge test student data from MySQL so production admin panel remains clean
    try {
      const dbPool = require('./config/db');
      if (studentAId || studentBId) {
        const ids = [studentAId, studentBId].filter(Boolean);
        await dbPool.query(`DELETE FROM task_assessments WHERE submission_id IN (SELECT id FROM user_task_submissions WHERE user_id IN (?))`, [ids]);
        await dbPool.query(`DELETE FROM user_task_submissions WHERE user_id IN (?)`, [ids]);
        await dbPool.query(`DELETE FROM user_learning_progress WHERE user_id IN (?)`, [ids]);
        await dbPool.query(`DELETE FROM practice_sessions WHERE user_id IN (?)`, [ids]);
        await dbPool.query(`DELETE FROM users WHERE id IN (?)`, [ids]);
      }
      await dbPool.end();
    } catch (e) {}
  }

  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();

