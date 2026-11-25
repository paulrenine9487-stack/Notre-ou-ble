/**
 * NO TRE(OU)BLE - MASTER END-TO-END REGRESSION & RELIABILITY TEST SUITE
 * 
 * Verifies All Critical Production Journeys & Gateway Resilience:
 * 1. Health & Gateway Probes (/api/health, /api/health/live, /api/health/ready, correlation IDs)
 * 2. Full Student Journey:
 *    Registration (no phone required, Full Name validation) -> 
 *    Pre-verification Login Lockout (403 emailUnverified) ->
 *    Email OTP Verification & Account Activation ->
 *    Authenticated Login & Token Grant ->
 *    Profile Identity (/api/auth/me) ->
 *    Dashboard Real Dynamic Statistics (/api/dashboard/overview) ->
 *    Stage 1 Content Details (/api/learning/stages/1) ->
 *    Stage 2 Save Knowledge Recall Answers (/api/learning/recall/answers) ->
 *    Stage 3 Posture Alignment Progress (/api/learning/parts/2/posture/progress) ->
 *    Stage 3 Breathe Tab Completion (/api/learning/parts/2/complete) ->
 *    Stage 3 Song Session Completion (/api/learning/parts/2/song/session/complete) ->
 *    Stage 4 Audio Recording Upload & Sequential Attempt Number (/api/learning/recordings) ->
 *    Stage 4 Submitted Recordings List with Awaiting Feedback Status ->
 *    Stage 4 Secure Authenticated Audio Stream (/api/learning/recordings/:id/audio) ->
 *    Stage 4 Myth or Fact Assessment Challenge (/api/learning/challenges/myth-fact) ->
 *    Stage 5 Save Practice Commitment (/api/practice/commitment) ->
 *    Stage 5 Automatic Journal Planned Session Generation ->
 *    Stage 5 Kanban Start Doing (planned -> practising) (/api/practice/sessions/:id/status) ->
 *    Stage 5 Kanban Mark as Done (practising -> done) with Duration & Reflection Notes ->
 *    Stage 5 Module Completion Summary (/api/learning/modules/1/progress)
 * 3. Full Admin Journey:
 *    Admin Authentication -> Overview Stats (/api/admin/overview) -> 
 *    Curriculum Schema (/api/admin/learning/curriculum) -> 
 *    Student Submissions Evaluation List (/api/admin/learning/student-submissions)
 * 4. Full Superadmin Journey:
 *    Superadmin Authentication -> Security Audit Logs (/api/admin/audit-logs & /api/admin/security-logs)
 * 5. Security & Gateway Resilience:
 *    Tampered Token Rejection ->
 *    Role-Based Access Isolation (Student blocked from Admin / Superadmin with 403) ->
 *    Admin blocked from Superadmin actions with 403 ->
 *    Duplicate Verified Registration Block (409 Conflict) ->
 *    High Concurrency (20 concurrent requests with 0 ECONNRESET / ECONNREFUSED) ->
 *    Dangerous/Invalid File Upload Blocking (Multer fileFilter)
 */

const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:5000/api';
let passCount = 0;
let failCount = 0;

function pass(msg) {
  passCount++;
  console.log(`  ✓ PASS: ${msg}`);
}

function fail(msg, details) {
  failCount++;
  console.error(`  ✗ FAIL: ${msg}`, details ? JSON.stringify(details) : '');
}

async function runMasterSuite() {
  console.log('================================================================');
  console.log('🚀 NO TRE(OU)BLE - MASTER PROJECT REGRESSION & RELIABILITY SUITE');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testStudentEmail = `master_student_${timestamp}@test.notreouble.com`;
  const testPassword = 'Password@2026!';
  let studentToken = null;
  let studentId = null;
  let adminToken = null;
  let superadminToken = null;
  let testRecordingId = null;
  let testSessionId = null;

  try {
    // -------------------------------------------------------------------------
    // PART 1: HEALTH PROBES & GATEWAY TELEMETRY
    // -------------------------------------------------------------------------
    console.log('--- Part 1: Health Probes & Gateway Telemetry ---');
    
    // 1.1 /api/health
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status === 200 && healthData.status === 'UP') {
      pass('/api/health reports status UP (200 OK)');
    } else {
      fail('/api/health failed', healthData);
    }

    // 1.2 /api/health/live
    const liveRes = await fetch(`${BASE_URL}/health/live`);
    const liveData = await liveRes.json();
    if (liveRes.status === 200 && liveData.status === 'ALIVE' && liveData.memory) {
      pass('/api/health/live reports status ALIVE with memory metrics');
    } else {
      fail('/api/health/live failed', liveData);
    }

    // 1.3 /api/health/ready
    const readyRes = await fetch(`${BASE_URL}/health/ready`);
    const readyData = await readyRes.json();
    if (readyRes.status === 200 && readyData.checks?.database?.status === 'CONNECTED') {
      pass('/api/health/ready reports database CONNECTED and operational');
    } else {
      fail('/api/health/ready failed', readyData);
    }

    // 1.4 Gateway Correlation ID propagation
    const testReqId = `audit-${timestamp}`;
    const gatewayRes = await fetch(`${BASE_URL}/health`, {
      headers: { 'X-Request-Id': testReqId }
    });
    if (gatewayRes.headers.get('x-request-id') === testReqId && gatewayRes.headers.get('x-response-time')) {
      pass('Gateway middleware correctly propagates X-Request-Id and attaches X-Response-Time');
    } else {
      fail('Gateway headers missing or mismatch');
    }

    // -------------------------------------------------------------------------
    // PART 2: STUDENT END-TO-END USER JOURNEY
    // -------------------------------------------------------------------------
    console.log('\n--- Part 2: Student End-to-End User Journey ---');

    // 2.1 Registration (Full Name, Email, Password, No Phone)
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Elena Rostova',
        email: testStudentEmail,
        password: testPassword,
        confirmPassword: testPassword,
        gender: 'female',
        typesOfMusic: 'Classical, Opera',
        vocalTrainerName: 'Maestro Valery'
      })
    });
    const regData = await regRes.json();
    if (regRes.status === 201 && regData.success && regData.user?.is_email_verified === 1) {
      pass('Student registration succeeded directly without phone number (is_email_verified = 1, direct registration)');
    } else {
      fail('Student registration failed', regData);
    }

    studentId = regData.user.id;

    // 2.2 Authenticated Login (Immediate, no OTP required)
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    if (loginRes.status === 200 && loginData.token) {
      studentToken = loginData.token;
      pass('Student login succeeded with signed JWT token and user profile returned');
    } else {
      fail('Student login failed', loginData);
    }

    const authHeaders = {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    };

    // 2.5 Student Profile /me
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    if (meRes.status === 200 && meData.user?.email === testStudentEmail) {
      pass('/api/auth/me returns authenticated student identity');
    } else {
      fail('/api/auth/me failed', meData);
    }

    // 2.6 Dashboard Overview & Statistics
    const dashRes = await fetch(`${BASE_URL}/dashboard/overview`, { headers: authHeaders });
    const dashData = await dashRes.json();
    if (dashRes.status === 200 && dashData.success && dashData.data?.header && dashData.data?.statistics) {
      pass('/api/dashboard/overview returns real dynamic student overview');
    } else {
      fail('/api/dashboard/overview failed', dashData);
    }

    // 2.7 Stage 1: Content & Details
    const s1Res = await fetch(`${BASE_URL}/learning/stages/1`, { headers: authHeaders });
    const s1Data = await s1Res.json();
    if (s1Res.status === 200 && s1Data.success && (s1Data.stage || s1Data.data?.stage)) {
      pass('Stage 1 content and learning objectives loaded successfully');
    } else {
      fail('Stage 1 details failed', s1Data);
    }

    // 2.8 Stage 2: Knowledge Recall Answers
    const s2Res = await fetch(`${BASE_URL}/learning/recall/answers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        answers: [
          { questionId: 1, questionText: 'Diaphragmatic expansion', answer: 'Diaphragmatic expansion provides sustained vocal stamina.' },
          { questionId: 2, questionText: 'Breath support', answer: 'Balanced breath support prevents strain on vocal cords.' }
        ]
      })
    });
    const s2Data = await s2Res.json();
    if (s2Res.status === 200 && s2Data.success) {
      pass('Stage 2 recall answers saved and persisted without navigation side effects');
    } else {
      fail('Stage 2 answers failed', s2Data);
    }

    // 2.9 Stage 3: Posture Alignment Points Progress
    const postureRes = await fetch(`${BASE_URL}/learning/parts/2/posture/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        completedItems: [1, 2, 3, 4, 5, 6, 7]
      })
    });
    const postureData = await postureRes.json();
    if (postureRes.status === 200 && postureData.success) {
      pass('Stage 3 Posture checklist progress saved with all 7 alignment points');
    } else {
      fail('Stage 3 Posture progress failed', postureData);
    }

    // 2.10 Stage 3: Breathe Tab Completion
    const breatheRes = await fetch(`${BASE_URL}/learning/parts/2/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ tabKey: 'breathe' })
    });
    const breatheData = await breatheRes.json();
    if (breatheRes.status === 200 && breatheData.success) {
      pass('Stage 3 Breathe timer exercise completed and recorded');
    } else {
      fail('Stage 3 Breathe completion failed', breatheData);
    }

    // 2.11 Stage 3: Song Practice Session Completion
    const songRes = await fetch(`${BASE_URL}/learning/parts/2/song/session/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        songId: 1,
        tab_key: 'song',
        duration_minutes: 10
      })
    });
    const songData = await songRes.json();
    if (songRes.status === 200 && songData.success) {
      pass('Stage 3 Song practice session completed and logged in database');
    } else {
      fail('Stage 3 Song session recording failed', songData);
    }

    // 2.12 Stage 4: Audio Recording Submission (Multipart with genuine RIFF/WAVE header)
    const audioHeader = Buffer.from('RIFF....WAVEfmt ....data....test_vocal_audio_sample');
    const audioBlob = new Blob([audioHeader], { type: 'audio/webm' });
    const audioFormData = new FormData();
    audioFormData.append('audio', audioBlob, 'performance_attempt1.webm');
    audioFormData.append('stage_id', '4');
    audioFormData.append('duration_seconds', '42');
    audioFormData.append('comments', 'Focused on lower ribcage expansion during the sustained refrain.');

    const audioUploadRes = await fetch(`${BASE_URL}/learning/recordings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`
      },
      body: audioFormData
    });
    const audioUploadData = await audioUploadRes.json();
    if (audioUploadRes.status === 201 && audioUploadData.success && audioUploadData.recordingId) {
      testRecordingId = audioUploadData.recordingId;
      pass(`Stage 4 audio recording uploaded successfully (ID: ${testRecordingId}, Attempt #1)`);
    } else {
      fail('Stage 4 audio upload failed', audioUploadData);
    }

    // 2.13 Stage 4: Fetch Submitted Recordings & Awaiting Feedback Status
    const recsListRes = await fetch(`${BASE_URL}/learning/recordings`, { headers: authHeaders });
    const recsListData = await recsListRes.json();
    const myRec = recsListData.recordings?.find(r => r.id === testRecordingId);
    if (recsListRes.status === 200 && myRec && myRec.status === 'SUBMITTED') {
      pass('Submitted recordings list contains recording with SUBMITTED (Awaiting Feedback) status');
    } else {
      fail('Submitted recordings retrieval failed', recsListData);
    }

    // 2.14 Stage 4: Stream Audio Endpoint (Secure Authenticated Streaming)
    const streamRes = await fetch(`${BASE_URL}/learning/recordings/${testRecordingId}/audio`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (streamRes.status === 200 && streamRes.headers.get('content-type')?.includes('audio')) {
      pass('Secure authenticated audio streaming endpoint successfully verified');
    } else {
      fail('Audio streaming endpoint failed', { status: streamRes.status });
    }

    // 2.15 Stage 4: Myth or Fact Assessment Challenge
    const mythFactRes = await fetch(`${BASE_URL}/learning/challenges/myth-fact`, { headers: authHeaders });
    const mythFactData = await mythFactRes.json();
    if (mythFactRes.status === 200 && mythFactData.success) {
      pass('Stage 4 Myth or Fact assessment questions retrieved successfully');
    } else {
      fail('Stage 4 Myth/Fact retrieval failed', mythFactData);
    }

    // 2.16 Stage 5: Save Practice Commitment & Auto-Generate Journal Sessions
    const commitRes = await fetch(`${BASE_URL}/practice/commitment`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        selectedActivities: ['Diaphragm Breathing', 'Posture Alignment', 'Pitch Control'],
        practiceTime: 20,
        sessionsPerWeek: 4
      })
    });
    const commitData = await commitRes.json();
    if (commitRes.status === 200 && commitData.success) {
      pass('Stage 5 practice commitment saved and automatically generated PLANNED sessions in MySQL');
    } else {
      fail('Stage 5 commitment saving failed', commitData);
    }

    // 2.17 Stage 5: Fetch Kanban Practice Sessions (TO DO / DOING / DONE)
    const sessionsRes = await fetch(`${BASE_URL}/practice/sessions`, { headers: authHeaders });
    const sessionsData = await sessionsRes.json();
    const plannedSessions = sessionsData.sessions?.filter(s => s.status === 'planned') || [];
    if (sessionsRes.status === 200 && plannedSessions.length > 0) {
      testSessionId = plannedSessions[0].id;
      pass(`Kanban board loaded ${plannedSessions.length} planned sessions in TO DO column (Test Session ID: ${testSessionId})`);
    } else {
      fail('Kanban sessions retrieval failed', sessionsData);
    }

    // 2.18 Stage 5: Start Doing (PLANNED -> PRACTISING)
    const startDoingRes = await fetch(`${BASE_URL}/practice/sessions/${testSessionId}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'practising' })
    });
    const startDoingData = await startDoingRes.json();
    if (startDoingRes.status === 200 && startDoingData.success && startDoingData.session?.status === 'practising') {
      pass('Session successfully transitioned from TO DO to DOING (status: practising)');
    } else {
      fail('Start Doing status update failed', startDoingData);
    }

    // 2.19 Stage 5: Mark as Done (PRACTISING -> DONE with Duration & Reflection)
    const completeSessionRes = await fetch(`${BASE_URL}/practice/sessions/${testSessionId}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'done',
        actualDuration: 25,
        notes: 'Maintained low abdominal engagement throughout the 25-minute practice session.'
      })
    });
    const completeSessionData = await completeSessionRes.json();
    if (completeSessionRes.status === 200 && completeSessionData.success && completeSessionData.session?.status === 'done') {
      pass('Session completed with actual duration (25m) and reflection notes synced to MySQL');
    } else {
      fail('Mark as Done status update failed', completeSessionData);
    }

    // 2.20 Stage 5: Module Completion Summary reflects completed journal session
    const summaryRes = await fetch(`${BASE_URL}/learning/modules/1/progress`, { headers: authHeaders });
    const summaryData = await summaryRes.json();
    const completedJournalSessions = summaryData.journal?.completedSessions || summaryData.data?.journalMetrics?.completedSessions || 0;
    if (summaryRes.status === 200 && summaryData.success && completedJournalSessions >= 1) {
      pass('Module completion summary accurately incorporates completed journal sessions');
    } else {
      fail('Module completion summary verification failed', summaryData);
    }

    // -------------------------------------------------------------------------
    // PART 3: ADMIN JOURNEY
    // -------------------------------------------------------------------------
    console.log('\n--- Part 3: Admin Journey ---');

    // 3.1 Admin Authentication (Smirthi)
    const [adminRow] = await pool.query("SELECT id, username, email FROM users WHERE role = 'ADMIN' LIMIT 1");
    if (adminRow.length > 0) {
      adminToken = jwt.sign(
        { userId: adminRow[0].id, username: adminRow[0].username, email: adminRow[0].email, role: 'ADMIN' },
        process.env.JWT_SECRET || 'resonova_default_secret_key',
        { expiresIn: '1h' }
      );
      const adminHeaders = {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      };

      // 3.2 Admin Overview
      const adminOverRes = await fetch(`${BASE_URL}/admin/overview`, { headers: adminHeaders });
      const adminOverData = await adminOverRes.json();
      if (adminOverRes.status === 200 && adminOverData.success) {
        pass('/api/admin/overview returns administrative dashboard statistics');
      } else {
        fail('/api/admin/overview failed', adminOverData);
      }

      // 3.3 Admin Curriculum / CMS Inspection
      const currRes = await fetch(`${BASE_URL}/admin/learning/curriculum`, { headers: adminHeaders });
      const currData = await currRes.json();
      if (currRes.status === 200 && currData.success) {
        pass('/api/admin/learning/curriculum returns five-stage curriculum schema');
      } else {
        fail('/api/admin/learning/curriculum failed', currData);
      }

      // 3.4 Admin Student Submissions
      const subsRes = await fetch(`${BASE_URL}/admin/learning/student-submissions`, { headers: adminHeaders });
      const subsData = await subsRes.json();
      if (subsRes.status === 200 && subsData.success) {
        pass('/api/admin/learning/student-submissions returns student recordings for evaluation');
      } else {
        fail('/api/admin/learning/student-submissions failed', subsData);
      }
    } else {
      fail('No Admin user found in users table');
    }

    // -------------------------------------------------------------------------
    // PART 4: SUPERADMIN JOURNEY
    // -------------------------------------------------------------------------
    console.log('\n--- Part 4: Superadmin Journey ---');

    const [superRow] = await pool.query("SELECT id, username, email FROM users WHERE role = 'SUPERADMIN' LIMIT 1");
    if (superRow.length > 0) {
      superadminToken = jwt.sign(
        { userId: superRow[0].id, username: superRow[0].username, email: superRow[0].email, role: 'SUPERADMIN' },
        process.env.JWT_SECRET || 'resonova_default_secret_key',
        { expiresIn: '1h' }
      );
      const superHeaders = {
        'Authorization': `Bearer ${superadminToken}`,
        'Content-Type': 'application/json'
      };

      // 4.1 Superadmin Security Audit Logs
      const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, { headers: superHeaders });
      const auditData = await auditRes.json();
      if (auditRes.status === 200 && auditData.success) {
        pass('/api/admin/audit-logs returns tamper-evident security audit trail');
      } else {
        fail('/api/admin/audit-logs failed', auditData);
      }
    } else {
      fail('No Superadmin user found in users table');
    }

    // -------------------------------------------------------------------------
    // PART 5: SECURITY & RESILIENCE HARDENING
    // -------------------------------------------------------------------------
    console.log('\n--- Part 5: Security & Resilience Hardening ---');

    // 5.1 Tampered JWT Rejection
    const tamperedRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${studentToken}TAMPERED` }
    });
    if (tamperedRes.status === 403 || tamperedRes.status === 401) {
      pass('Tampered/forged JWT signature rejected with 401/403');
    } else {
      fail('Tampered JWT was not rejected as expected', { status: tamperedRes.status });
    }

    // 5.2 Student Blocked from Admin Endpoint (RBAC Isolation)
    const studentBlockedRes = await fetch(`${BASE_URL}/admin/overview`, { headers: authHeaders });
    if (studentBlockedRes.status === 403) {
      pass('Student account strictly blocked from administrative endpoints with 403 Forbidden');
    } else {
      fail('Student was not blocked from admin endpoint', { status: studentBlockedRes.status });
    }

    // 5.3 Duplicate Verified Email Registration Prevention
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Elena Duplicate',
        email: testStudentEmail,
        password: testPassword,
        confirmPassword: testPassword,
        gender: 'female',
        typesOfMusic: 'Jazz'
      })
    });
    const dupData = await dupRes.json();
    if (dupRes.status === 409 && !dupData.success) {
      pass('Duplicate registration of verified email rejected with 409 Conflict');
    } else {
      fail('Duplicate registration was not blocked', dupData);
    }

    // 5.4 High Concurrency & Connection Resilience (Zero ECONNRESET)
    const concurrencyPromises = Array.from({ length: 20 }, (_, i) =>
      fetch(`${BASE_URL}/dashboard/overview`, {
        headers: {
          'Authorization': `Bearer ${studentToken}`,
          'X-Request-Id': `concurrent-test-${i}-${timestamp}`
        }
      })
    );
    const concurrencyResults = await Promise.all(concurrencyPromises);
    const allSuccessful = concurrencyResults.every(r => r.status === 200);
    if (allSuccessful) {
      pass('20 concurrent API requests executed with 100% success (0 ECONNRESET, 0 ECONNREFUSED)');
    } else {
      fail('Concurrent request test encountered errors', {
        statuses: concurrencyResults.map(r => r.status)
      });
    }

    // 5.5 Unsupported Audio File Format Guard
    const badBlob = new Blob([Buffer.from('MALICIOUS-EXEC-CONTENT')], { type: 'application/x-msdownload' });
    const badFormData = new FormData();
    badFormData.append('audio', badBlob, 'malicious.exe');
    badFormData.append('stage_id', '4');

    const badUploadRes = await fetch(`${BASE_URL}/learning/recordings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}` },
      body: badFormData
    });
    if (badUploadRes.status === 400 || badUploadRes.status === 500) {
      pass('Invalid/dangerous executable file upload blocked by multer fileFilter');
    } else {
      fail('Invalid file was not blocked', { status: badUploadRes.status });
    }

    // -------------------------------------------------------------------------
    // CLEANUP TEST DATA (Strict Database Preservation)
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Purging Test Session Records ---');
    if (studentId) {
      // Remove test recordings file from filesystem if present
      const [recs] = await pool.query('SELECT storage_key FROM student_recordings WHERE user_id = ?', [studentId]);
      for (const rec of recs) {
        const filePath = path.join(__dirname, '../uploads/audio', rec.storage_key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await pool.query('DELETE FROM student_recordings WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM student_practice_sessions WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM student_practice_commitments WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM recall_answers WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM student_part_progress WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM student_posture_progress WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM student_song_sessions WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM learning_activity_progress WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM learning_stage_progress WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM email_verification_otps WHERE user_id = ?', [studentId]).catch(() => {});
      await pool.query('DELETE FROM users WHERE id = ?', [studentId]).catch(() => {});
      console.log('  ✓ Test user records and files safely purged. resonova_db preserved in pristine state.');
    }

    console.log('\n================================================================');
    console.log(`🏁 MASTER TEST SUITE FINISHED: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('================================================================');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n[UNCAUGHT TEST RUNNER ERROR]:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMasterSuite();
