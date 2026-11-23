const pool = require('../config/db');

const API_BASE = 'http://localhost:5000/api';

async function runTest() {
  console.log('=================================================================');
  console.log('   FULL END-TO-END NEXT & PREVIOUS NAVIGATION TEST SUITE        ');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate student
    const username = `NavUser_${Date.now()}`;
    const password = 'Password123!';

    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email: `${username}@notreoble.com`,
        gender: 'Female',
        phone: '1234567890',
        password,
        confirm_password: password,
        types_of_music: ['Classical']
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success, 'Step 1: Student registration succeeded');

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.token, 'Step 1b: Student login succeeded and token received');

    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Fetch initial 5 stages
    const stagesRes = await fetch(`${API_BASE}/learning/stages`, {
      headers: authHeaders
    });
    const stagesData = await stagesRes.json();
    assert(stagesRes.status === 200 && stagesData.success, 'Step 2: Fetched 5 learning stages');
    assert(stagesData.stages.length === 5, 'Step 2b: Returned exactly 5 stages');
    assert(stagesData.stages[0].stage_number === 1, 'Step 2c: Stage 1 is first');
    assert(stagesData.stages[0].is_unlocked === true, 'Step 2d: Stage 1 is unlocked initially');
    assert(stagesData.stages[1].is_unlocked === false, 'Step 2e: Stage 2 is locked initially');

    // 3. Stage 1 - View content and complete objectives (Next clicked on Stage 1)
    const ackRes = await fetch(`${API_BASE}/learning/stages/1/objectives/acknowledge`, {
      method: 'POST',
      headers: authHeaders
    });
    const ackData = await ackRes.json();
    assert(ackRes.status === 200 && ackData.acknowledged === true, 'Step 3: Stage 1 objectives acknowledged via save API');

    const vidRes = await fetch(`${API_BASE}/learning/activity-progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        stage_id: 1,
        activity_id: 's1_video',
        activity_type: 'video'
      })
    });
    assert(vidRes.status === 200, 'Step 3b: Stage 1 video progress recorded');

    // 4. Verify Stage 1 is now COMPLETED and Stage 2 is UNLOCKED
    const afterS1StagesRes = await fetch(`${API_BASE}/learning/stages`, {
      headers: authHeaders
    });
    const afterS1Data = await afterS1StagesRes.json();
    const stage1 = afterS1Data.stages.find(s => s.stage_number === 1);
    const stage2 = afterS1Data.stages.find(s => s.stage_number === 2);
    assert(stage1.is_completed === true || stage1.status === 'COMPLETED', 'Step 4: Stage 1 status is COMPLETED');
    assert(stage2.is_unlocked === true, 'Step 4b: Stage 2 is now UNLOCKED for navigation');

    // 5. Open Stage 2 Details
    const s2Res = await fetch(`${API_BASE}/learning/stages/${stage2.id}`, {
      headers: authHeaders
    });
    const s2Data = await s2Res.json();
    assert(s2Res.status === 200 && s2Data.success, 'Step 5: Successfully opened Stage 2 (What Do You Know?)');

    // 6. Submit Stage 2 answers (Next clicked on Stage 2)
    const [qRows] = await pool.query('SELECT id FROM recall_questions WHERE is_active = TRUE ORDER BY display_order ASC LIMIT 2');
    const q1Id = qRows[0].id;
    const q2Id = qRows[1].id;

    const saveAnsRes = await fetch(`${API_BASE}/learning/recall/answers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        stage_id: stage2.id,
        answers: [
          { question_id: q1Id, answer: 'Diaphragm lowers and intercostal muscles expand the ribcage.' },
          { question_id: q2Id, answer: 'Steady subglottic pressure without clavicular shoulder raising.' }
        ]
      })
    });
    const saveAnsData = await saveAnsRes.json();
    assert(saveAnsRes.status === 200 && saveAnsData.success, 'Step 6: Stage 2 answers saved to MySQL');

    // 7. Verify Stage 3 is now UNLOCKED
    const afterS2StagesRes = await fetch(`${API_BASE}/learning/stages`, {
      headers: authHeaders
    });
    const afterS2Data = await afterS2StagesRes.json();
    const stage3 = afterS2Data.stages.find(s => s.stage_number === 3);
    assert(stage3.is_unlocked === true, 'Step 7: Stage 3 (How To Do It) is now UNLOCKED');

    // 8. Revisit Previous Stage: Go back to Stage 2
    const s2RevisitRes = await fetch(`${API_BASE}/learning/stages/${stage2.id}`, {
      headers: authHeaders
    });
    const s2RevisitData = await s2RevisitRes.json();
    assert(s2RevisitRes.status === 200 && s2RevisitData.success, 'Step 8: Reopened Stage 2 via Previous navigation');
    assert(s2RevisitData.stage.userAnswers && s2RevisitData.stage.userAnswers.length >= 2, 'Step 8b: Previous answers preserved on revisit');

    // 9. Revisit Stage 1 via Previous navigation
    const s1RevisitRes = await fetch(`${API_BASE}/learning/stages/${stage1.id}`, {
      headers: authHeaders
    });
    const s1RevisitData = await s1RevisitRes.json();
    assert(s1RevisitRes.status === 200 && s1RevisitData.success, 'Step 9: Reopened Stage 1 via Previous navigation');
    assert(s1RevisitData.stage.status === 'COMPLETED' || s1RevisitData.stage.is_completed, 'Step 9b: Stage 1 retains COMPLETED status after revisit');

    // 10. Part 2 Sub-navigation (Posture -> Breathe -> Song)
    const part2PostRes = await fetch(`${API_BASE}/learning/parts/2/posture/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        checked_items: [1, 2, 3, 4, 5],
        is_completed: true
      })
    });
    assert(part2PostRes.status === 200, 'Step 10: Part 2 Posture saved');

    const part2BreatheRes = await fetch(`${API_BASE}/learning/parts/2/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        tab_key: 'breathe',
        duration_minutes: 5
      })
    });
    assert(part2BreatheRes.status === 200, 'Step 10b: Part 2 Breathe tab completed');

    const part2SongRes = await fetch(`${API_BASE}/learning/parts/2/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        tab_key: 'song',
        duration_minutes: 10
      })
    });
    assert(part2SongRes.status === 200, 'Step 10c: Part 2 Song tab completed');

    // 11. Verify Stage 4 is now UNLOCKED
    const afterS3StagesRes = await fetch(`${API_BASE}/learning/stages`, {
      headers: authHeaders
    });
    const afterS3Data = await afterS3StagesRes.json();
    const stage4 = afterS3Data.stages.find(s => s.stage_number === 4);
    assert(stage4.is_unlocked === true, 'Step 11: Stage 4 (Let\'s Check Ourselves) is now UNLOCKED');

    // 12. Complete Stage 4 (Myth/Fact challenge + Song Recording)
    const [mfQuestions] = await pool.query('SELECT id, correct_answer FROM myth_fact_questions WHERE is_active = TRUE');
    const mfResponses = mfQuestions.map(q => ({
      question_id: q.id,
      selected_answer: q.correct_answer || 'FACT'
    }));

    const studentId = regData.userId || loginData.user?.id;

    // Record Stage 4 challenge activity via challenge attempt endpoint
    const chRes = await fetch(`${API_BASE}/learning/challenges/1/attempts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        stage_id: stage4.id,
        answers: { 'mf-1': 'FACT', 'mf-2': 'FACT' }
      })
    });
    assert(chRes.status === 200, 'Step 12: Stage 4 Challenge progress recorded');

    // Simulate audio recording upload
    await pool.query(`
      INSERT INTO student_recordings (user_id, stage_id, storage_key, file_type, duration_seconds)
      VALUES (?, ?, '/recordings/test.webm', 'audio/webm', 45)
    `, [studentId, stage4.id]);

    await pool.query(`
      INSERT INTO learning_activity_progress (user_id, stage_id, activity_id, activity_type, status, completed_at)
      VALUES (?, ?, 'song_recording', 'recording', 'COMPLETED', NOW())
      ON DUPLICATE KEY UPDATE status = 'COMPLETED'
    `, [studentId, stage4.id]);

    // 13. Verify Stage 5 is now UNLOCKED
    const afterS4StagesRes = await fetch(`${API_BASE}/learning/stages`, {
      headers: authHeaders
    });
    const afterS4Data = await afterS4StagesRes.json();
    const stage5 = afterS4Data.stages.find(s => s.stage_number === 5);
    assert(stage5.is_unlocked === true, 'Step 13: Stage 5 (Keep It Going) is now UNLOCKED');

    // 14. Save Stage 5 Practice Commitment
    const commitRes = await fetch(`${API_BASE}/practice/commitment`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        minutes_per_session: 15,
        sessions_per_week: 3,
        selected_activities: ['vocal_warmup', 'posture_breathing_simulation']
      })
    });
    const commitData = await commitRes.json();
    assert(commitRes.status === 200 && commitData.success, 'Step 14: Stage 5 Practice Commitment saved (15 min/session, 3 sessions/wk)');

    // 15. Verify all stages unlocked & accessible
    const finalStagesRes = await fetch(`${API_BASE}/learning/stages`, {
      headers: authHeaders
    });
    const finalStagesData = await finalStagesRes.json();
    const allUnlocked = finalStagesData.stages.every(s => s.is_unlocked);
    assert(allUnlocked, 'Step 15: All 5 stages are accessible and unlocked for the student');

    console.log(`\n=================================================================`);
    console.log(`  FINAL RESULT: ${passed} PASSED | ${failed} FAILED`);
    console.log(`=================================================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTest();
