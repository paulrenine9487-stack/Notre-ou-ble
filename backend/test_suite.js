// No Tre(ou)ble Comprehensive Test Suite
// Verifying API Endpoints, MySQL Database, Registration, Login, Token, Learning, Practice

const http = require('http');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = 'http://127.0.0.1:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===========================================================');
  console.log('  No Tre(ou)ble FULL-STACK VERIFICATION TEST SUITE          ');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'API Health Check returns 200 OK');

    // 2. Clear old test user if exists
    const testEmail = `test_singer_${Date.now()}@resonova.com`;
    const testUsername = `testvocal_${Date.now().toString().slice(-6)}`;

    // 3. Test Registration with mandatory fields (Test Case 5)
    console.log('\n--- Testing Registration (Test Case 5) ---');
    const regPayload = {
      username: testUsername,
      gender: 'Female',
      email: testEmail,
      phone: '9876543210',
      types_of_music: ['Carnatic Music', 'Western Classical'],
      vocal_trainer_name: 'Maestro Ramesh',
      password: 'Password123!',
      confirm_password: 'Password123!',
      selected_musical_goal: 'I want to improve my breathing.'
    };

    const regRes = await request('POST', '/api/auth/register', regPayload);
    assert(regRes.status === 201 && regRes.data.success === true, 'User successfully registered (Status 201)');
    assert(regRes.data.userId > 0, 'Returned new user ID from MySQL');

    // Verify directly in MySQL
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'resonova_db'
    });

    const [userRows] = await db.query('SELECT * FROM users WHERE email = ?', [testEmail]);
    assert(userRows.length === 1, 'User record verified in MySQL users table');
    assert(userRows[0].selected_musical_goal === 'I want to improve my breathing.', 'Selected musical goal stored in MySQL');
    assert(userRows[0].password_hash !== 'Password123!' && userRows[0].password_hash.startsWith('$2'), 'Password stored as bcrypt hash, never plain text');

    const [musicRows] = await db.query('SELECT * FROM user_music_preferences WHERE user_id = ?', [userRows[0].id]);
    assert(musicRows.length === 2, 'User music preferences stored in MySQL table');

    // 4. Test Duplicate Email (Test Case 6)
    console.log('\n--- Testing Duplicate Registration (Test Case 6) ---');
    const dupRes = await request('POST', '/api/auth/register', {
      ...regPayload,
      username: `another_${Date.now()}`
    });
    assert(dupRes.status === 409 && dupRes.data.message.includes('already exists'), 'Duplicate email returns 409 and exact expected message');

    // 5. Test Invalid Login (Test Case 8)
    console.log('\n--- Testing Invalid Login (Test Case 8) ---');
    const invalidLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'WrongPassword999'
    });
    assert(invalidLogin.status === 401 && invalidLogin.data.success === false, 'Invalid password returns 401 Unauthorized');

    // 6. Test Valid Login (Test Case 7)
    console.log('\n--- Testing Valid Login (Test Case 7) ---');
    const validLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'Password123!'
    });
    assert(validLogin.status === 200 && validLogin.data.token, 'Valid login returns 200 and JWT token');
    const token = validLogin.data.token;

    // 7. Test Protected Route without token (Test Case 9)
    console.log('\n--- Testing Protected Dashboard Access (Test Case 9) ---');
    const unauthorizedOverview = await request('GET', '/api/dashboard/overview');
    assert(unauthorizedOverview.status === 401, 'Accessing dashboard API without token is rejected (401)');

    // 8. Test Protected Route with valid token
    console.log('\n--- Testing Dashboard Overview with JWT ---');
    const authorizedOverview = await request('GET', '/api/dashboard/overview', null, token);
    assert(authorizedOverview.status === 200 && authorizedOverview.data.success === true, 'Dashboard overview fetched successfully');
    assert(authorizedOverview.data.data.user.selected_musical_goal === 'I want to improve my breathing.', 'Dashboard returns correct selected goal');

    // 9. Test Learning Lessons & Progress
    console.log('\n--- Testing Learning Curriculum & Completion ---');
    const lessonsRes = await request('GET', '/api/learning/lessons', null, token);
    assert(lessonsRes.status === 200 && lessonsRes.data.lessons.length >= 12, 'Lessons fetched from MySQL (12 lessons across 6 categories)');

    const firstLessonId = lessonsRes.data.lessons[0].id;
    const completeRes = await request('POST', '/api/learning/complete', { lessonId: firstLessonId }, token);
    assert(completeRes.status === 200 && completeRes.data.isCompleted === true, 'Marked lesson as completed in MySQL');

    // Verify progress updated in MySQL
    const [progressRows] = await db.query(
      'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?',
      [userRows[0].id, firstLessonId]
    );
    assert(progressRows.length === 1 && progressRows[0].completion_status === 'completed', 'user_lesson_progress recorded in MySQL');

    // 10. Test Practice Session Recording
    console.log('\n--- Testing Practice Session Recording ---');
    const practiceRecord = await request('POST', '/api/practice/sessions', {
      session_type: 'Box Breathing (4-4-4-4)',
      duration_minutes: 10
    }, token);
    assert(practiceRecord.status === 201 && practiceRecord.data.success === true, 'Practice session logged in MySQL');

    const [practiceRows] = await db.query(
      'SELECT * FROM practice_sessions WHERE user_id = ?',
      [userRows[0].id]
    );
    assert(practiceRows.length === 1 && practiceRows[0].duration_minutes === 10, 'practice_sessions row verified in MySQL');

    // 11. Test Forgot & Reset Password workflow
    console.log('\n--- Testing Secure Password Reset Workflow ---');
    const forgotRes = await request('POST', '/api/auth/forgot-password', { email: testEmail });
    assert(forgotRes.status === 200 && forgotRes.data.resetToken, 'Generated real password reset token for account');

    const resetRes = await request('POST', '/api/auth/reset-password', {
      token: forgotRes.data.resetToken,
      newPassword: 'NewPassword456!',
      confirmPassword: 'NewPassword456!'
    });
    assert(resetRes.status === 200 && resetRes.data.success === true, 'Password reset succeeded');

    // Verify new password can log in
    const newLoginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'NewPassword456!'
    });
    assert(newLoginRes.status === 200 && newLoginRes.data.success === true, 'Login with updated password succeeded');

    // 12. Test Logout
    console.log('\n--- Testing Logout (Test Case 10) ---');
    const logoutRes = await request('POST', '/api/auth/logout', null, token);
    assert(logoutRes.status === 200, 'Logout endpoint returns 200');

    // Clean up test user from DB
    await db.query('DELETE FROM users WHERE id = ?', [userRows[0].id]);
    await db.end();

    console.log('\n===========================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runTests();

