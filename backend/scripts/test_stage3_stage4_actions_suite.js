/**
 * Automated Verification Suite for Stage 3 & Stage 4 Action Buttons & Manual Navigation
 * Tests:
 * TEST A: Save Answers (Stage 2 recall questions -> recall_answers)
 * TEST B: Posture Checklist (7 points -> student_posture_progress & student_part_progress)
 * TEST C: Breathe Exercise Completion (Part 2 Step 2 -> student_part_progress)
 * TEST D & E: Song Practice & Complete Practice Session (Part 2 Step 3 -> student_song_sessions & student_part_progress)
 * TEST F: Audio Recording Upload & Metadata (Stage 4 Section C -> student_recordings)
 * TEST G: API Failure & Error Handling (Safe retry, zero false state)
 * TEST H: Refresh & Login Persistence (Student data isolation & reload)
 */

const pool = require('../config/db');

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('NO TRE(OU)BLE – STAGE 3 & STAGE 4 ACTIONS & NAVIGATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const testIdsToCleanup = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const testUsername = 'Action Student Test';
    const testEmail = `action_${timestamp}@notrouble.test`;
    const testPassword = `ActionPass${timestamp}!`;

    console.log('--- Setup: Creating Test Student Account ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: testUsername,
        gender: 'Female',
        email: testEmail,
        types_of_music: ['Carnatic Music'],
        password: testPassword,
        confirm_password: testPassword
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success, 'Test student registered successfully');

    const [uRows] = await pool.query('SELECT id FROM users WHERE email = ?', [testEmail]);
    const userId = uRows[0].id;
    testIdsToCleanup.push(userId);

    // Activate email so authenticated test can log in
    await pool.query('UPDATE users SET is_email_verified = 1 WHERE id = ?', [userId]);

    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    assert(Boolean(token), 'JWT token obtained for authenticated test session');

    // -----------------------------------------------------------------
    // TEST A: SAVE ANSWERS (Stage 2 Knowledge Recall)
    // -----------------------------------------------------------------
    console.log('\n--- TEST A: SAVE ANSWERS (Stage 2 Knowledge Recall) ---');
    const saveAnswersRes = await fetch(`${BASE_URL}/learning/recall/answers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        stage_id: 2,
        answers: [
          { question_id: 1, answer: 'Breath control allows sustained notes and dynamic stability.' },
          { question_id: 2, answer: 'Relaxed shoulders prevent throat tension.' }
        ]
      })
    });
    const saveAnswersData = await saveAnswersRes.json();
    assert(saveAnswersRes.status === 200 && saveAnswersData.success, 'Save Answers API succeeds with 200 OK');

    const [answerRows] = await pool.query(
      'SELECT * FROM recall_answers WHERE user_id = ?',
      [userId]
    );
    assert(answerRows.length >= 2, 'Answers are persisted in MySQL recall_answers table');
    assert(answerRows.some(a => a.answer.includes('sustained notes')), 'Answer content verified in database');

    // -----------------------------------------------------------------
    // TEST B: POSTURE CHECKLIST (Stage 3 Part 2 Step 1)
    // -----------------------------------------------------------------
    console.log('\n--- TEST B: POSTURE CHECKLIST (Stage 3 Part 2 Step 1) ---');
    const sevenPostureItems = [1, 2, 3, 4, 5, 6, 7];
    const postureProgressRes = await fetch(`${BASE_URL}/learning/parts/2/posture/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        checked_items: sevenPostureItems,
        is_completed: true
      })
    });
    const postureProgressData = await postureProgressRes.json();
    assert(postureProgressRes.status === 200 && postureProgressData.success, 'Posture progress API succeeds with 200 OK');

    const completePostureRes = await fetch(`${BASE_URL}/learning/parts/2/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        tab_key: 'posture',
        duration_minutes: 5
      })
    });
    const completePostureData = await completePostureRes.json();
    assert(completePostureRes.status === 200 && completePostureData.success, 'Posture tab completion API succeeds');

    const [postureRows] = await pool.query(
      'SELECT * FROM student_posture_progress WHERE user_id = ?',
      [userId]
    );
    assert(postureRows.length > 0 && postureRows[0].status === 'COMPLETED', 'Posture checklist marked COMPLETED in MySQL');
    const savedChecked = typeof postureRows[0].checklist_progress_json === 'string' ? JSON.parse(postureRows[0].checklist_progress_json) : postureRows[0].checklist_progress_json;
    assert(Array.isArray(savedChecked) && savedChecked.length === 7, 'All 7 alignment points saved in MySQL checklist_progress_json array');

    // -----------------------------------------------------------------
    // TEST C: BREATHE EXERCISE COMPLETION (Stage 3 Part 2 Step 2)
    // -----------------------------------------------------------------
    console.log('\n--- TEST C: BREATHE EXERCISE (Stage 3 Part 2 Step 2) ---');
    const completeBreatheRes = await fetch(`${BASE_URL}/learning/parts/2/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        tab_key: 'breathe',
        duration_minutes: 5
      })
    });
    const completeBreatheData = await completeBreatheRes.json();
    assert(completeBreatheRes.status === 200 && completeBreatheData.success, 'Breathe tab completion API succeeds with 200 OK');

    const [breatheProgRows] = await pool.query(
      "SELECT * FROM student_part_progress WHERE user_id = ? AND tab_key = 'breathe'",
      [userId]
    );
    assert(breatheProgRows.length > 0 && breatheProgRows[0].status === 'COMPLETED', 'Breathe exercise marked COMPLETED in MySQL');

    // -----------------------------------------------------------------
    // TEST D & E: SONG PRACTICE & COMPLETE PRACTICE SESSION
    // -----------------------------------------------------------------
    console.log('\n--- TEST D & E: COMPLETE PRACTICE SESSION (Song Practice) ---');
    const songSessionRes = await fetch(`${BASE_URL}/learning/parts/2/song/session/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        level_key: 'beginner',
        listening_duration: 35,
        repeat_count: 2,
        marked_notes_count: 4
      })
    });
    const songSessionData = await songSessionRes.json();
    assert(songSessionRes.status === 200 && songSessionData.success, 'Complete Song Session API succeeds with 200 OK');

    const completeSongTabRes = await fetch(`${BASE_URL}/learning/parts/2/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        tab_key: 'song',
        duration_minutes: 10
      })
    });
    const completeSongTabData = await completeSongTabRes.json();
    assert(completeSongTabRes.status === 200 && completeSongTabData.success, 'Song tab completion API succeeds with 200 OK');

    const [songProgRows] = await pool.query(
      "SELECT * FROM student_part_progress WHERE user_id = ? AND tab_key = 'song'",
      [userId]
    );
    assert(songProgRows.length > 0 && songProgRows[0].status === 'COMPLETED', 'Song practice session marked COMPLETED in MySQL');

    // -----------------------------------------------------------------
    // TEST F: AUDIO RECORDING UPLOAD & AWAITING FEEDBACK (Stage 4)
    // -----------------------------------------------------------------
    console.log('\n--- TEST F: AUDIO RECORDING SUBMISSION (Stage 4 Section C) ---');
    const audioDummyContent = Buffer.from('RIFF....WAVEfmt ....data....test_audio_sample');
    const blob = new Blob([audioDummyContent], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', blob, 'test-song-performance.webm');
    formData.append('stage_id', '4');
    formData.append('duration_seconds', '42');
    formData.append('comments', 'Focused on low abdominal expansion during the chorus.');

    const uploadRes = await fetch(`${BASE_URL}/learning/recordings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201 && uploadData.success, 'Submit Recording API succeeds with status 201 Created');
    assert(Boolean(uploadData.recordingId), 'API returns created recording ID');
    assert(uploadData.attemptNumber === 1, 'First recording is designated Attempt #1');

    const [recDbRows] = await pool.query(
      'SELECT * FROM student_recordings WHERE id = ?',
      [uploadData.recordingId]
    );
    assert(recDbRows.length === 1, 'Recording metadata persisted in MySQL student_recordings table');
    assert(recDbRows[0].user_id === userId, 'Recording associated with authenticated student');
    assert(recDbRows[0].status === 'SUBMITTED', 'Recording initial status is SUBMITTED (Awaiting Feedback)');
    assert(recDbRows[0].comments === 'Focused on low abdominal expansion during the chorus.', 'Optional trainer comments saved in MySQL');

    // Test Retrieval of Submitted Recordings list
    const getRecsRes = await fetch(`${BASE_URL}/learning/recordings`, {
      headers: authHeaders
    });
    const getRecsData = await getRecsRes.json();
    assert(getRecsRes.status === 200 && Array.isArray(getRecsData.recordings), 'GET /learning/recordings returns student recordings list');
    assert(getRecsData.recordings.length >= 1, 'Submitted Recordings count updated');
    const matchedRec = getRecsData.recordings.find(r => r.id === uploadData.recordingId);
    assert(Boolean(matchedRec) && matchedRec.status === 'SUBMITTED', 'Submitted recording shows Awaiting Feedback status');

    // -----------------------------------------------------------------
    // TEST G: SIMULATED API FAILURE (Safe retry & zero false success)
    // -----------------------------------------------------------------
    console.log('\n--- TEST G: SIMULATED API FAILURE & SAFE RETRY ---');
    const badUploadRes = await fetch(`${BASE_URL}/learning/recordings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: new FormData() // Missing audio file
    });
    const badUploadData = await badUploadRes.json();
    assert(badUploadRes.status === 400 && !badUploadData.success, 'Missing audio file rejected with 400 Bad Request');

    const [afterBadRows] = await pool.query(
      'SELECT COUNT(*) AS c FROM student_recordings WHERE user_id = ?',
      [userId]
    );
    assert(afterBadRows[0].c === 1, 'No duplicate or corrupted database records created on failed request');

    // -----------------------------------------------------------------
    // TEST H: REFRESH AND SESSION PERSISTENCE
    // -----------------------------------------------------------------
    console.log('\n--- TEST H: REFRESH & LOGIN PERSISTENCE ---');
    const reLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const reLoginData = await reLoginRes.json();
    const freshToken = reLoginData.token;

    const stageDetailsRes = await fetch(`${BASE_URL}/learning/stages/4`, {
      headers: { Authorization: `Bearer ${freshToken}` }
    });
    const stageDetailsData = await stageDetailsRes.json();
    assert(stageDetailsRes.status === 200 && stageDetailsData.success, 'Stage 4 details load successfully after re-login');
    assert(stageDetailsData.stage && stageDetailsData.stage.recordings.length >= 1, 'Recordings list persists after page refresh and re-login');

    const stage3DetailsRes = await fetch(`${BASE_URL}/learning/stages/3`, {
      headers: { Authorization: `Bearer ${freshToken}` }
    });
    const stage3DetailsData = await stage3DetailsRes.json();
    assert(stage3DetailsRes.status === 200 && stage3DetailsData.success, 'Stage 3 details load successfully after re-login');

  } catch (err) {
    console.error('[UNCAUGHT ERROR]:', err);
    failed++;
  } finally {
    if (testIdsToCleanup.length > 0) {
      console.log('\nCleaning up test user data from resonova_db...');
      await pool.query('DELETE FROM student_recordings WHERE user_id IN (?)', [testIdsToCleanup]).catch(() => {});
      await pool.query('DELETE FROM student_part_progress WHERE user_id IN (?)', [testIdsToCleanup]).catch(() => {});
      await pool.query('DELETE FROM student_posture_progress WHERE user_id IN (?)', [testIdsToCleanup]).catch(() => {});
      await pool.query('DELETE FROM student_song_sessions WHERE user_id IN (?)', [testIdsToCleanup]).catch(() => {});
      await pool.query('DELETE FROM recall_answers WHERE user_id IN (?)', [testIdsToCleanup]).catch(() => {});
      await pool.query('DELETE FROM learning_activity_progress WHERE user_id IN (?)', [testIdsToCleanup]).catch(() => {});
      await pool.query('DELETE FROM learning_stage_progress WHERE user_id IN (?)', [testIdsToCleanup]).catch(() => {});
      await pool.query('DELETE FROM users WHERE id IN (?)', [testIdsToCleanup]).catch(() => {});
      console.log('Cleanup complete. resonova_db restored to clean state.');
    }
    await pool.end();

    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
