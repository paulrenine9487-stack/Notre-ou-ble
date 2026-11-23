// Comprehensive Dashboard & Role Security Verification Suite
const http = require('http');
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
      headers: { 'Content-Type': 'application/json' }
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTestSuite() {
  console.log('===========================================================');
  console.log('  No Tre(ou)ble DASHBOARD & ADMIN VERIFICATION SUITE       ');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(cond, name) {
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const userAEmail = `vocalist_a_${timestamp}@example.com`;
    const userBEmail = `vocalist_b_${timestamp}@example.com`;
    const testPassword = 'Password123';

    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200, 'Backend API health check returns 200 OK');

    // 2. Register User A
    const regResA = await request('POST', '/api/auth/register', {
      username: `Aria_${timestamp}`,
      gender: 'Female',
      email: userAEmail,
      phone: '9876543210',
      password: testPassword,
      confirm_password: testPassword,
      selected_musical_goal: 'I want to develop my vocal technique.',
      types_of_music: ['Carnatic', 'Western Classical']
    });
    assert(regResA.status === 201, 'User A registered successfully');

    // 3. Login User A
    const loginResA = await request('POST', '/api/auth/login', {
      email: userAEmail,
      password: testPassword
    });
    assert(loginResA.status === 200 && loginResA.data.token, 'User A login succeeded with JWT');
    const tokenA = loginResA.data.token;
    assert(loginResA.data.user.role === 'USER', 'Public registration properly defaults role to USER');

    // 4. User A Dashboard Overview Initial State
    const dashInitialA = await request('GET', '/api/dashboard/overview', null, tokenA);
    assert(dashInitialA.status === 200, 'Dashboard overview API returns 200 for User A');
    assert(dashInitialA.data.data.user.username === `Aria_${timestamp}`, 'Dashboard returns authenticated username from MySQL');
    assert(dashInitialA.data.data.header.dateDisplay.includes('YOUR LEARNING SPACE'), 'Header has dynamic date banner');
    assert(dashInitialA.data.data.statistics.practiceThisWeek.rawMinutes === 0, 'Initial weekly practice minutes are 0');
    assert(dashInitialA.data.data.statistics.sessionsCompleted.rawCount === 0, 'Initial weekly completed sessions are 0');
    assert(dashInitialA.data.data.statistics.weeklyGoalReached.rawPercent === 0, 'Initial weekly goal reached is 0%');

    // 5. User A Records a 35-minute Practice Session (Like reference image)
    const practiceLogRes = await request('POST', '/api/practice/complete', {
      session_type: 'Breath Management',
      exercise_name: 'Diaphragmatic Expansion',
      duration_minutes: 35,
      notes: 'Initial test session: 360 degree rib expansion'
    }, tokenA);
    assert(practiceLogRes.status === 201, 'Practice session (35 min) logged to MySQL');

    // 6. User A Dashboard Overview After Practice
    const dashAfterPracticeA = await request('GET', '/api/dashboard/overview', null, tokenA);
    assert(dashAfterPracticeA.data.data.statistics.practiceThisWeek.rawMinutes === 35, 'Weekly practice minutes dynamically calculated as 35 min from MySQL');
    assert(dashAfterPracticeA.data.data.statistics.sessionsCompleted.rawCount === 1, 'Completed sessions dynamically updated to 1');
    assert(dashAfterPracticeA.data.data.statistics.weeklyGoalReached.rawPercent === 58, 'Weekly goal correctly calculated as 58% (35 / 60 target)');

    // 7. Learning Stages & Progress Exploration (5-Stage Curriculum)
    const stagesRes = await request('GET', '/api/learning/stages', null, tokenA);
    assert(stagesRes.status === 200 && stagesRes.data.stages.length === 5, 'Fetched exactly 5 learning stages');
    const stage1 = stagesRes.data.stages[0];
    assert(stage1.title === 'Introduction', 'Stage 01 is Introduction');

    // Complete Stage 1 video activity
    await request('POST', '/api/learning/activity-progress', {
      stage_id: stage1.id,
      activity_id: 's1_video',
      activity_type: 'video'
    }, tokenA);

    // Check dashboard learning progress
    const dashAfterLearningA = await request('GET', '/api/dashboard/overview', null, tokenA);
    assert(dashAfterLearningA.data.data.learningProgress.totalStages === 5, 'Dashboard reflects exactly 5 total stages');

    // 8. Song Phrase Mapping Workflow (Section 8)
    const createSongRes = await request('POST', '/api/songs', {
      song_title: 'Caro Mio Ben',
      language: 'Italian',
      song_type: 'Classical Aria',
      notes: 'Focus on Appoggio and catch-breaths',
      initial_phrases: [
        { phrase_number: 1, phrase_text: 'Caro mio ben, credimi almen', inhale_position: 'Before phrase (360° inhale)', exhale_guidance: 'Appoggio sustained flow' },
        { phrase_number: 2, phrase_text: 'Senza di te languisce il cor', inhale_position: 'Catch-breath between lines', exhale_guidance: 'Controlled abdominal support' }
      ]
    }, tokenA);
    assert(createSongRes.status === 201, 'Created song with 2 phrases for breath mapping');
    const songId = createSongRes.data.song.id;

    const phrasesRes = await request('GET', `/api/songs/${songId}/phrases`, null, tokenA);
    assert(phrasesRes.status === 200 && phrasesRes.data.phrases.length === 2, 'Retrieved mapped phrases with inhale/exhale markers');

    // Mark phrase 1 as completed
    const phrase1Id = phrasesRes.data.phrases[0].id;
    const updatePhraseRes = await request('PUT', `/api/songs/phrases/${phrase1Id}`, { completion_status: 'completed' }, tokenA);
    assert(updatePhraseRes.status === 200, 'Updated phrase completion status in MySQL');

    // 9. User Isolation Check (User B sees only their own data)
    await request('POST', '/api/auth/register', {
      username: `Baritone_${timestamp}`,
      gender: 'Male',
      email: userBEmail,
      phone: '9876543211',
      password: testPassword,
      confirm_password: testPassword,
      types_of_music: ['Hindustani']
    });
    const loginResB = await request('POST', '/api/auth/login', { email: userBEmail, password: testPassword });
    const tokenB = loginResB.data.token;
    const dashB = await request('GET', '/api/dashboard/overview', null, tokenB);
    assert(dashB.data.data.statistics.practiceThisWeek.rawMinutes === 0, 'User B sees 0 practice minutes (User A data properly isolated)');
    assert(dashB.data.data.learningProgress.completedStages === 0, 'User B sees 0 completed learning events');

    // User B cannot access User A song phrases
    const bAccessA = await request('GET', `/api/songs/${songId}/phrases`, null, tokenB);
    assert(bAccessA.status === 404, 'User B is blocked from viewing User A songs/phrases');

    // 10. Role-Based Access Control on /api/admin/
    // Normal User A tries to access admin overview
    const userAdminAttempt = await request('GET', '/api/admin/overview', null, tokenA);
    assert(userAdminAttempt.status === 403, 'Normal USER is rejected with 403 from /api/admin/overview');

    // SuperAdmin Login
    const superAdminLogin = await request('POST', '/api/auth/login', {
      username: 'Notreoblemccmrfip',
      password: 'notreoblesinger'
    });
    assert(superAdminLogin.status === 200 && superAdminLogin.data.user.role === 'SUPERADMIN', 'Superadmin login succeeded with role SUPERADMIN');
    const superToken = superAdminLogin.data.token;

    // Superadmin accesses overview
    const adminOverview = await request('GET', '/api/admin/overview', null, superToken);
    assert(adminOverview.status === 200 && adminOverview.data.data.totalUsers >= 2, 'Superadmin can access platform-wide overview metrics');

    // Superadmin creates an ADMIN account
    const newAdminEmail = `admin_assistant_${timestamp}@notreoble.com`;
    const createAdminRes = await request('POST', '/api/admin/users', {
      username: `Assistant_${timestamp}`,
      email: newAdminEmail,
      password: testPassword,
      role: 'ADMIN'
    }, superToken);
    assert(createAdminRes.status === 201, 'Superadmin successfully created an ADMIN account');

    // Login as the new ADMIN
    const adminLoginRes = await request('POST', '/api/auth/login', {
      email: newAdminEmail,
      password: testPassword
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.user.role === 'ADMIN', 'New admin logged in with role ADMIN');
    const adminToken = adminLoginRes.data.token;

    // ADMIN can access admin overview
    const adminView = await request('GET', '/api/admin/overview', null, adminToken);
    assert(adminView.status === 200, 'ADMIN can view administrative overview');

    // ADMIN is BLOCKED from Superadmin-only actions (cannot create another admin)
    const adminCreateAttempt = await request('POST', '/api/admin/users', {
      username: 'HackerAdmin',
      email: 'hack@hack.com',
      password: testPassword,
      role: 'ADMIN'
    }, adminToken);
    assert(adminCreateAttempt.status === 403, 'ADMIN is blocked (403) from Superadmin-only provisioning');

    // 11. Practice Reports & Audit Trail
    const reportsRes = await request('GET', '/api/admin/practice-reports', null, adminToken);
    assert(reportsRes.status === 200 && reportsRes.data.reports.length > 0, 'Admin can view practice session reports');

    const auditRes = await request('GET', '/api/admin/audit-logs', null, superToken);
    assert(auditRes.status === 200 && auditRes.data.logs.length > 0, 'Superadmin can view audit logs');

    console.log('===========================================================');
    console.log(`  DASHBOARD SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTestSuite();

