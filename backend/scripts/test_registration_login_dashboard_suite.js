/**
 * End-to-End Verification Suite for No Tre(ou)ble Portal:
 * - Registration workflow & password hashing
 * - Login workflow & JWT issuance
 * - Password confidentiality & masking
 * - Dashboard Overview & Widget APIs
 * - Multi-student data isolation
 * - Concurrency & connection resilience (0 ECONNRESET / ECONNREFUSED)
 */

const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';

async function runSuite() {
  console.log('========================================================');
  console.log('NO TRE(OU)BLE PORTAL - REGISTRATION, LOGIN & DASHBOARD SUITE');
  console.log('========================================================\n');

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
    const testUsername = 'Dashboard Test Student';
    const testEmail = `test_${timestamp}@notrouble.test`;
    const testPassword = `SecurePass${timestamp}!`;

    // -----------------------------------------------------------------
    // TEST 1: Password Strength Validation (Reject < 8 chars)
    // -----------------------------------------------------------------
    console.log('\n--- 1. Testing Registration Validation ---');
    const weakRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Valid Weak User',
        gender: 'Male',
        email: `weak_${timestamp}@notrouble.test`,
        types_of_music: ['Carnatic Music'],
        password: 'short',
        confirm_password: 'short'
      })
    });
    const weakRegData = await weakRegRes.json();
    assert(weakRegRes.status === 400 && weakRegData.message.includes('8 characters'), 'Short password (<8 chars) is rejected with 400 Bad Request');

    // -----------------------------------------------------------------
    // TEST 2: Successful Registration
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Registration Endpoint ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: testUsername,
        gender: 'Female',
        email: testEmail,
        types_of_music: ['Western Classical', 'Light Music'],
        vocal_trainer_name: 'Instructor Test',
        password: testPassword,
        confirm_password: testPassword,
        selected_musical_goal: 'Develop vocal control and steady breath support.'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success === true, 'Registration succeeds with status 201 Created');
    assert(!regData.token && !regData.password && !regData.password_hash, 'Registration response never returns plaintext password or JWT token');

    // -----------------------------------------------------------------
    // TEST 3: Database Verification (Bcrypt Hash & No Plaintext)
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing MySQL Database Storage & Hashing ---');
    const [dbRows] = await pool.query('SELECT * FROM users WHERE email = ?', [testEmail]);
    assert(dbRows.length === 1, 'User account is created in MySQL users table');
    const userRow = dbRows[0];
    testIdsToCleanup.push(userRow.id);

    // Verify email so login can be tested
    await pool.query('UPDATE users SET is_email_verified = 1 WHERE id = ?', [userRow.id]);

    assert(userRow.password_hash && userRow.password_hash.startsWith('$2'), 'Password is stored as a bcrypt hash ($2a$ / $2b$)');
    assert(userRow.password_hash !== testPassword, 'Password is NEVER stored in plaintext in MySQL');

    const isMatch = await bcrypt.compare(testPassword, userRow.password_hash);
    assert(isMatch === true, 'Bcrypt password comparison matches the entered password');

    // -----------------------------------------------------------------
    // TEST 4: Login with Invalid Password
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Login Authentication ---');
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!'
      })
    });
    const badLoginData = await badLoginRes.json();
    assert(badLoginRes.status === 401 && badLoginData.success === false, 'Invalid credentials return 401 Unauthorized');

    // -----------------------------------------------------------------
    // TEST 5: Login with Valid Password (Manual Login Flow)
    // -----------------------------------------------------------------
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success === true, 'Valid credentials return 200 OK');
    assert(Boolean(loginData.token), 'Login issues a valid signed JWT access token');
    assert(!loginData.user.password && !loginData.user.password_hash, 'Login response strictly deletes password_hash from user object');

    const authToken = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-Request-Id': `req-${timestamp}`
    };

    // -----------------------------------------------------------------
    // TEST 6: Authenticated Profile (/api/auth/me)
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Profile & Token Verification ---');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: authHeaders
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user.email === testEmail, '/api/auth/me returns the authenticated student profile');

    // -----------------------------------------------------------------
    // TEST 7: Dashboard Overview API (/api/dashboard/overview)
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Dashboard APIs ---');
    const overviewRes = await fetch(`${BASE_URL}/dashboard/overview`, {
      headers: authHeaders
    });
    const overviewData = await overviewRes.json();
    assert(overviewRes.status === 200 && overviewData.success === true, 'GET /api/dashboard/overview returns 200 OK');
    assert(overviewData.data.header && overviewData.data.header.greeting, 'Dashboard includes dynamic time-of-day greeting');
    assert(overviewData.data.statistics !== undefined, 'Dashboard includes practice statistics');
    assert(overviewData.data.learningProgress && overviewData.data.learningProgress.moduleId === 1, 'Dashboard includes Module 01 learning progress');
    assert(Array.isArray(overviewData.data.learningPathway) && overviewData.data.learningPathway.length === 3, 'Dashboard includes 3-module learning pathway');

    // -----------------------------------------------------------------
    // TEST 8: Other Dashboard Endpoints
    // -----------------------------------------------------------------
    const practiceSummaryRes = await fetch(`${BASE_URL}/dashboard/practice-summary`, { headers: authHeaders });
    const practiceSummaryData = await practiceSummaryRes.json();
    assert(practiceSummaryRes.status === 200 && practiceSummaryData.success === true, 'GET /api/dashboard/practice-summary returns 200 OK');

    const learningSummaryRes = await fetch(`${BASE_URL}/dashboard/learning-summary`, { headers: authHeaders });
    const learningSummaryData = await learningSummaryRes.json();
    assert(learningSummaryRes.status === 200 && learningSummaryData.success === true, 'GET /api/dashboard/learning-summary returns 200 OK');

    const taskPerfRes = await fetch(`${BASE_URL}/dashboard/task-performance`, { headers: authHeaders });
    const taskPerfData = await taskPerfRes.json();
    assert(taskPerfRes.status === 200 && taskPerfData.success === true, 'GET /api/dashboard/task-performance returns 200 OK');

    const recentActRes = await fetch(`${BASE_URL}/dashboard/recent-activity`, { headers: authHeaders });
    const recentActData = await recentActRes.json();
    assert(recentActRes.status === 200 && recentActData.success === true, 'GET /api/dashboard/recent-activity returns 200 OK');

    // -----------------------------------------------------------------
    // TEST 9: Student Data Isolation (No cross-student leaks)
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Student Data Isolation ---');
    const isolatedUser = 'Isolated Student Test';
    const isolatedEmail = `isolated_${timestamp}@notrouble.test`;
    const isoRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: isolatedUser,
        gender: 'Male',
        email: isolatedEmail,
        types_of_music: ['Carnatic Music'],
        password: testPassword,
        confirm_password: testPassword
      })
    });

    const [isoDbRows] = await pool.query('SELECT id FROM users WHERE email = ?', [isolatedEmail]);
    if (isoDbRows.length > 0) {
      testIdsToCleanup.push(isoDbRows[0].id);
      await pool.query('UPDATE users SET is_email_verified = 1 WHERE id = ?', [isoDbRows[0].id]);
    }

    const isoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: isolatedEmail, password: testPassword })
    });
    const isoLoginData = await isoLoginRes.json();
    const isoToken = isoLoginData.token;

    const isoOverviewRes = await fetch(`${BASE_URL}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${isoToken}` }
    });
    const isoOverviewData = await isoOverviewRes.json();
    assert(isoOverviewData.data.user.id === isoLoginData.user.id, 'Dashboard query is strictly scoped to authenticated user ID');
    assert(isoOverviewData.data.user.email !== testEmail, 'User 2 never receives User 1 profile or records');

    // -----------------------------------------------------------------
    // TEST 10: Concurrency & Resilience (15 Parallel Requests)
    // -----------------------------------------------------------------
    console.log('\n--- 8. Testing Concurrency & Gateway Resilience ---');
    const concurrentRequests = Array.from({ length: 15 }, (_, i) =>
      fetch(`${BASE_URL}/dashboard/overview`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Request-Id': `burst-${i}-${timestamp}`
        }
      })
    );
    const burstResponses = await Promise.all(concurrentRequests);
    const all200 = burstResponses.every(r => r.status === 200);
    assert(all200, '15 concurrent requests to /api/dashboard/overview succeed with 0 ECONNRESET and 0 ECONNREFUSED');

  } catch (err) {
    console.error('[UNCAUGHT ERROR]:', err);
    failed++;
  } finally {
    // Clean up test accounts
    if (testIdsToCleanup.length > 0) {
      console.log('\nCleaning up test user accounts from resonova_db...');
      await pool.query('DELETE FROM users WHERE id IN (?)', [testIdsToCleanup]);
      console.log(`Cleaned up ${testIdsToCleanup.length} test records. Database remains pristine.`);
    }
    await pool.end();

    console.log('\n========================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runSuite();
