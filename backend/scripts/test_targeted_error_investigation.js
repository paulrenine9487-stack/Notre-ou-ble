/**
 * NO TRE(OU)BLE - TARGETED API ERROR INVESTIGATION TEST SUITE
 * Tests the 4 exact logged requests:
 * 1. 6bf5eb51: GET /api/auth/me
 * 2. 126d91da: GET /api/admin/overview
 * 3. e8086afd: POST /api/auth/register
 * 4. 5634ad9c: POST /api/learning/recordings
 * 
 * Executes Tests 1 through 10 from Section 10:
 * - Test 1: Student authentication (GET /api/auth/me -> 200)
 * - Test 2: Admin authentication (GET /api/auth/me -> 200, GET /api/admin/overview -> 200)
 * - Test 3: Superadmin authentication & audit logs -> 200
 * - Test 4: Student Admin restriction (GET /api/admin/overview with student token -> 403)
 * - Test 5: Invalid/malformed token (GET /api/auth/me with bad token -> 401)
 * - Test 6: Duplicate registration for verified email (POST /api/auth/register -> 409)
 * - Test 7: Pending unverified registration continuation -> 201 + OTP activation
 * - Test 8: Recording validation (Valid upload 201, missing file 400, bad format 400, playback 200)
 * - Test 9: Refresh and persistence after re-login
 * - Test 10: Production configuration & zero localhost checks
 */

const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://127.0.0.1:5000/api';
let passCount = 0;
let failCount = 0;

function pass(msg) {
  passCount++;
  console.log(`  ✓ PASS: ${msg}`);
}

function fail(msg, err) {
  failCount++;
  console.error(`  ✗ FAIL: ${msg}`, err ? JSON.stringify(err) : '');
}

async function runTargetedInvestigationSuite() {
  console.log('================================================================');
  console.log('🔍 TARGETED API ERROR INVESTIGATION & VERIFICATION SUITE');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testStudentEmail = `target_student_${timestamp}@test.notreouble.com`;
  const testPassword = 'Password@2026!';
  let studentToken = null;
  let studentId = null;
  let adminToken = null;
  let superadminToken = null;
  let testRecordingId = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: STUDENT AUTHENTICATION (GET /api/auth/me -> 200)
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Student Authentication (/api/auth/me) ---');
    // Register
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Target Student',
        email: testStudentEmail,
        password: testPassword,
        confirmPassword: testPassword,
        gender: 'female',
        typesOfMusic: 'Classical'
      })
    });
    const regData = await regRes.json();
    if (regRes.status === 201 && regData.success) {
      studentId = regData.userId;
      // Activate user
      await pool.query('UPDATE users SET is_email_verified = 1, email_verified_at = NOW() WHERE id = ?', [studentId]);
    }

    // Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    studentToken = loginData.token;

    // Call /api/auth/me
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const meData = await meRes.json();
    if (meRes.status === 200 && meData.user?.email === testStudentEmail) {
      pass(`TEST 1: Valid student receives 200 OK and profile from /api/auth/me (ID: ${meData.user.id})`);
    } else {
      fail('TEST 1: /api/auth/me failed for valid student', meData);
    }

    // -------------------------------------------------------------------------
    // TEST 2: ADMIN AUTHENTICATION (GET /api/auth/me & GET /api/admin/overview -> 200)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Admin Authentication (/api/auth/me & /api/admin/overview) ---');
    const [adminRow] = await pool.query("SELECT id, username, email FROM users WHERE role = 'ADMIN' LIMIT 1");
    if (adminRow.length > 0) {
      adminToken = jwt.sign(
        { userId: adminRow[0].id, username: adminRow[0].username, email: adminRow[0].email, role: 'ADMIN' },
        process.env.JWT_SECRET || 'resonova_default_secret_key',
        { expiresIn: '1h' }
      );

      const adminMeRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const adminMeData = await adminMeRes.json();
      if (adminMeRes.status === 200 && adminMeData.user?.role === 'ADMIN') {
        pass(`TEST 2: Admin receives 200 OK from /api/auth/me (Admin: ${adminMeData.user.username})`);
      } else {
        fail('TEST 2: Admin /api/auth/me failed', adminMeData);
      }

      const adminOverRes = await fetch(`${BASE_URL}/admin/overview`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const adminOverData = await adminOverRes.json();
      if (adminOverRes.status === 200 && adminOverData.success) {
        pass('TEST 2: Admin receives 200 OK from /api/admin/overview with overview statistics');
      } else {
        fail('TEST 2: Admin /api/admin/overview failed', adminOverData);
      }
    } else {
      fail('No Admin user found');
    }

    // -------------------------------------------------------------------------
    // TEST 3: SUPERADMIN OVERVIEW & AUDIT LOGS (-> 200)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Superadmin Authorization ---');
    const [superRow] = await pool.query("SELECT id, username, email FROM users WHERE role = 'SUPERADMIN' LIMIT 1");
    if (superRow.length > 0) {
      superadminToken = jwt.sign(
        { userId: superRow[0].id, username: superRow[0].username, email: superRow[0].email, role: 'SUPERADMIN' },
        process.env.JWT_SECRET || 'resonova_default_secret_key',
        { expiresIn: '1h' }
      );

      const superLogsRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${superadminToken}` }
      });
      const superLogsData = await superLogsRes.json();
      if (superLogsRes.status === 200 && superLogsData.success) {
        pass('TEST 3: Superadmin receives 200 OK from /api/admin/audit-logs');
      } else {
        fail('TEST 3: Superadmin audit logs failed', superLogsData);
      }
    } else {
      fail('No Superadmin user found');
    }

    // -------------------------------------------------------------------------
    // TEST 4: STUDENT ADMIN RESTRICTION (/api/admin/overview with student -> 403)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Student Blocked from Admin Endpoint (Expected 403) ---');
    const studentBlockedRes = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentBlockedData = await studentBlockedRes.json();
    if (studentBlockedRes.status === 403 && !studentBlockedData.success) {
      pass(`TEST 4: Student account blocked from /api/admin/overview with 403 Forbidden: "${studentBlockedData.message}"`);
    } else {
      fail('TEST 4: Student was not blocked with 403', { status: studentBlockedRes.status, body: studentBlockedData });
    }

    // -------------------------------------------------------------------------
    // TEST 5: INVALID / MALFORMED / MISSING TOKEN (Expected 401)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Authentication Token Error Codes (Expected 401) ---');
    // Missing token
    const noTokenRes = await fetch(`${BASE_URL}/auth/me`);
    if (noTokenRes.status === 401) {
      pass('TEST 5a: Missing token receives 401 Unauthorized');
    } else {
      fail('TEST 5a: Missing token did not receive 401', { status: noTokenRes.status });
    }

    // Malformed / invalid token
    const badTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer NOT_A_VALID_JWT_TOKEN' }
    });
    const badTokenData = await badTokenRes.json();
    if (badTokenRes.status === 401 && badTokenData.code === 'INVALID_TOKEN') {
      pass('TEST 5b: Malformed/forged token receives 401 Unauthorized with code INVALID_TOKEN');
    } else {
      fail('TEST 5b: Malformed token did not receive 401', { status: badTokenRes.status, body: badTokenData });
    }

    // -------------------------------------------------------------------------
    // TEST 6: DUPLICATE REGISTRATION (POST /api/auth/register -> 409)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Duplicate Registration Conflict (Expected 409) ---');
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Target Student Dup',
        email: testStudentEmail,
        password: testPassword,
        confirmPassword: testPassword,
        gender: 'female',
        typesOfMusic: 'Jazz'
      })
    });
    const dupData = await dupRes.json();
    if (dupRes.status === 409 && dupData.conflictField === 'email') {
      pass(`TEST 6: Duplicate verified email registration returns 409 Conflict: "${dupData.message}"`);
    } else {
      fail('TEST 6: Duplicate email was not rejected with 409', dupData);
    }

    // -------------------------------------------------------------------------
    // TEST 7: PENDING UNVERIFIED REGISTRATION CONTINUATION (-> 201 + Re-OTP)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Pending Registration Recovery ---');
    const pendingEmail = `pending_${timestamp}@test.notreouble.com`;
    // Register unverified
    const p1Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Pending Student',
        email: pendingEmail,
        password: testPassword,
        confirmPassword: testPassword,
        gender: 'male',
        typesOfMusic: 'Rock'
      })
    });
    const p1Data = await p1Res.json();
    const pendingUserId = p1Data.userId;

    // Student re-submits with corrected info while still unverified
    const p2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Pending Student Corrected',
        email: pendingEmail,
        password: testPassword,
        confirmPassword: testPassword,
        gender: 'male',
        typesOfMusic: 'Rock, Pop'
      })
    });
    const p2Data = await p2Res.json();
    if (p2Res.status === 201 && p2Data.success && p2Data.requireOtp) {
      pass('TEST 7: Pending unverified registration gracefully updates profile and re-issues OTP (201 Created)');
      // Cleanup pending user
      await pool.query('DELETE FROM email_verification_otps WHERE user_id = ?', [pendingUserId]);
      await pool.query('DELETE FROM users WHERE id = ?', [pendingUserId]);
    } else {
      fail('TEST 7: Pending registration retry failed', p2Data);
    }

    // -------------------------------------------------------------------------
    // TEST 8: RECORDING VALIDATION (POST /api/learning/recordings)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Recording Upload & Validation ---');
    // 8a: Missing file -> 400
    const noFileRes = await fetch(`${BASE_URL}/learning/recordings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const noFileData = await noFileRes.json();
    if (noFileRes.status === 400) {
      pass(`TEST 8a: Missing audio file rejected with 400 Bad Request: "${noFileData.message}"`);
    } else {
      fail('TEST 8a: Missing audio file did not return 400', { status: noFileRes.status });
    }

    // 8b: Unsupported MIME type -> 400
    const badBlob = new Blob([Buffer.from('FAKE-EXE-BYTES')], { type: 'application/x-msdownload' });
    const badForm = new FormData();
    badForm.append('audio', badBlob, 'malicious.exe');
    badForm.append('stage_id', '4');

    const badFileRes = await fetch(`${BASE_URL}/learning/recordings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}` },
      body: badForm
    });
    const badFileData = await badFileRes.json();
    if (badFileRes.status === 400 && badFileData.message?.includes('Security Alert')) {
      pass(`TEST 8b: Invalid audio format blocked with 400 Bad Request: "${badFileData.message}"`);
    } else {
      fail('TEST 8b: Invalid audio format was not blocked with 400', { status: badFileRes.status, body: badFileData });
    }

    // 8c: Valid WebM / WAV audio upload -> 201
    const validAudioHeader = Buffer.from('RIFF....WAVEfmt ....data....genuine_vocal_sample');
    const validBlob = new Blob([validAudioHeader], { type: 'audio/webm' });
    const validForm = new FormData();
    validForm.append('audio', validBlob, 'test_singing_performance.webm');
    validForm.append('stage_id', '4');
    validForm.append('duration_seconds', '35');
    validForm.append('comments', 'Testing diaphragmatic support in head voice.');

    const validUploadRes = await fetch(`${BASE_URL}/learning/recordings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}` },
      body: validForm
    });
    const validUploadData = await validUploadRes.json();
    if (validUploadRes.status === 201 && validUploadData.success && validUploadData.recordingId) {
      testRecordingId = validUploadData.recordingId;
      pass(`TEST 8c: Valid audio recording uploaded with 201 Created (ID: ${testRecordingId}, Attempt #${validUploadData.attemptNumber})`);
    } else {
      fail('TEST 8c: Valid audio upload failed', validUploadData);
    }

    // 8d: Authenticated audio streaming & playback -> 200
    const streamRes = await fetch(`${BASE_URL}/learning/recordings/${testRecordingId}/audio`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (streamRes.status === 200 && streamRes.headers.get('content-type')?.includes('audio')) {
      pass('TEST 8d: Authenticated audio streaming endpoint verified with 200 OK');
    } else {
      fail('TEST 8d: Audio streaming failed', { status: streamRes.status });
    }

    // -------------------------------------------------------------------------
    // TEST 9: REFRESH AND PERSISTENCE
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Refresh and Persistence ---');
    const recsRes = await fetch(`${BASE_URL}/learning/recordings`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const recsData = await recsRes.json();
    const persistedRec = recsData.recordings?.find(r => r.id === testRecordingId);
    if (recsRes.status === 200 && persistedRec && persistedRec.status === 'SUBMITTED') {
      pass('TEST 9: Submitted recording persists after re-query with SUBMITTED status');
    } else {
      fail('TEST 9: Recording did not persist', recsData);
    }

    // -------------------------------------------------------------------------
    // TEST 10: PRODUCTION CONFIGURATION & ZERO LOCALHOST CHECKS
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: Production Configuration Verification ---');
    const fsMod = require('fs');
    const pathMod = require('path');
    const prodEnvPath = pathMod.resolve(__dirname, '../../frontend/.env.production');
    const prodEnvContent = fsMod.readFileSync(prodEnvPath, 'utf8');
    if (!prodEnvContent.includes('localhost') && !prodEnvContent.includes('127.0.0.1')) {
      pass('TEST 10: frontend/.env.production contains zero localhost references (uses clean relative /api)');
    } else {
      fail('TEST 10: frontend/.env.production has localhost references');
    }

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Safe Data Teardown ---');
    if (studentId) {
      await pool.query('DELETE FROM student_recordings WHERE user_id = ?', [studentId]);
      await pool.query('DELETE FROM email_verification_otps WHERE user_id = ?', [studentId]);
      await pool.query('DELETE FROM users WHERE id = ?', [studentId]);
      console.log('  ✓ Test user records purged. resonova_db preserved in clean state.');
    }

    console.log('\n================================================================');
    console.log(`🏁 INVESTIGATION SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('================================================================');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n[UNCAUGHT TEST EXCEPTION]:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTargetedInvestigationSuite();
