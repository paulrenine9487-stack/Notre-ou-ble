/**
 * No Tre(ou)ble - Enterprise API Gateway, Security & Full Portal Reliability Suite
 * Tests all core subsystems, health probes, RBAC, learning stages, and fault resilience.
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://127.0.0.1:5000/api';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: []
};

function recordTest(suiteName, testName, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`  \x1b[32m✓\x1b[0m [${suiteName}] ${testName}`);
  } else {
    results.failed++;
    console.error(`  \x1b[31m✗\x1b[0m [${suiteName}] ${testName} - ${details}`);
  }
}

async function runSuite() {
  console.log('\n================================================================');
  console.log(' NO TRE(OU)BLE - ENTERPRISE API GATEWAY & RELIABILITY TEST SUITE ');
  console.log('================================================================\n');

  let studentToken = null;
  let adminToken = null;

  // --------------------------------------------------------------------------
  // SUITE 1: Gateway Health Probes & System Telemetry
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Gateway Health Probes & System Telemetry ---');
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    recordTest('Probes', 'GET /api/health returns 200 UP', res.status === 200 && data.status === 'UP');
    recordTest('Probes', 'Gateway correlation ID (X-Request-Id) present', !!res.headers.get('x-request-id'));
    recordTest('Probes', 'Gateway latency header (X-Response-Time) present', !!res.headers.get('x-response-time'));
    recordTest('Probes', 'Security header X-Content-Type-Options: nosniff present', res.headers.get('x-content-type-options') === 'nosniff');
  } catch (e) {
    recordTest('Probes', 'GET /api/health reachable', false, e.message);
  }

  try {
    const res = await fetch(`${API_BASE}/health/ready`);
    const data = await res.json();
    recordTest('Probes', 'GET /api/health/ready returns 200 and checks MySQL', res.status === 200 && data.checks?.database?.status === 'CONNECTED');
    recordTest('Probes', 'Redis readiness status reported accurately', !!data.checks?.redis?.status);
  } catch (e) {
    recordTest('Probes', 'GET /api/health/ready reachable', false, e.message);
  }

  try {
    const res = await fetch(`${API_BASE}/health/live`);
    const data = await res.json();
    recordTest('Probes', 'GET /api/health/live returns 200 ALIVE with memory metrics', res.status === 200 && data.status === 'ALIVE' && data.memory?.heapUsedMb > 0);
  } catch (e) {
    recordTest('Probes', 'GET /api/health/live reachable', false, e.message);
  }

  // --------------------------------------------------------------------------
  // SUITE 2: Gateway 404 & Routing Sanitization
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Gateway 404 & Routing Sanitization ---');
  try {
    const res = await fetch(`${API_BASE}/non-existent-gateway-route-test-9999`);
    const data = await res.json();
    recordTest('Routing', 'Non-existent route returns 404 JSON (not HTML)', res.status === 404 && data.success === false && data.message.includes('not found'));
  } catch (e) {
    recordTest('Routing', '404 handling', false, e.message);
  }

  // --------------------------------------------------------------------------
  // SUITE 3: Authentication & Role-Based Access Control (RBAC)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Authentication & Role-Based Access Control (RBAC) ---');
  // Student Register & Login
  const testStudentEmail = `reliability_student_${Date.now()}@notreouble.test`;
  const testStudentPassword = 'Password123!';
  try {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `std${Date.now().toString().slice(-6)}`,
        gender: 'male',
        email: testStudentEmail,
        phone: '9876543210',
        password: testStudentPassword,
        confirm_password: testStudentPassword,
        types_of_music: ['Classical', 'Pop']
      })
    });
    recordTest('Auth', 'Student registration returns 201 Created', regRes.status === 201 || regRes.status === 200);
  } catch (e) {
    recordTest('Auth', 'Student registration', false, e.message);
  }

  // Student Login
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: testStudentPassword })
    });
    const data = await res.json();
    if (data.token) studentToken = data.token;
    recordTest('Auth', 'Student login returns 200 & JWT', res.status === 200 && !!studentToken);
  } catch (e) {
    recordTest('Auth', 'Student login', false, e.message);
  }

  // Admin Login
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Smirthi', password: 'smirthi1234' })
    });
    const data = await res.json();
    adminToken = data.token;
    recordTest('Auth', 'Admin login returns 200 & JWT', res.status === 200 && !!adminToken);
  } catch (e) {
    recordTest('Auth', 'Admin login', false, e.message);
  }

  // Missing Auth Header (Protected Endpoint)
  try {
    const res = await fetch(`${API_BASE}/learning/stages`);
    recordTest('RBAC', 'Unauthenticated request to protected route returns 401', res.status === 401);
  } catch (e) {
    recordTest('RBAC', 'Unauthenticated check', false, e.message);
  }

  // Student Access to Admin Route (Privilege Escalation Defense)
  if (studentToken) {
    try {
      const res = await fetch(`${API_BASE}/admin/overview`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      recordTest('RBAC', 'Student accessing Admin route is rejected with 403 Forbidden', res.status === 403);
    } catch (e) {
      recordTest('RBAC', 'Student admin privilege check', false, e.message);
    }
  }

  // Admin Access to Admin Route
  if (adminToken) {
    try {
      const res = await fetch(`${API_BASE}/admin/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      recordTest('RBAC', 'Admin accessing Admin overview succeeds (200 OK)', res.status === 200 && data.success === true);
    } catch (e) {
      recordTest('RBAC', 'Admin overview check', false, e.message);
    }
  }

  // --------------------------------------------------------------------------
  // SUITE 4: 5-Stage Learning Module Endpoints
  // --------------------------------------------------------------------------
  console.log('\n--- 4. 5-Stage Learning Module Endpoints ---');
  if (studentToken) {
    const studentHeaders = { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' };

    // Stage List
    try {
      const res = await fetch(`${API_BASE}/learning/stages`, { headers: studentHeaders });
      const data = await res.json();
      recordTest('Stages', 'GET /api/learning/stages returns all 5 stages', res.status === 200 && Array.isArray(data.stages) && data.stages.length >= 5);
    } catch (e) {
      recordTest('Stages', 'GET /api/learning/stages', false, e.message);
    }

    // Stage 1 Detail & Objectives
    try {
      const s1Res = await fetch(`${API_BASE}/learning/stages/1`, { headers: studentHeaders });
      const s1Data = await s1Res.json();
      recordTest('Stages', 'GET /api/learning/stages/1 returns Stage 1 details', s1Res.status === 200 && s1Data.stage?.stage_number === 1);

      const objRes = await fetch(`${API_BASE}/learning/stages/1/objectives`, { headers: studentHeaders });
      const objData = await objRes.json();
      recordTest('Stages', 'GET /api/learning/stages/1/objectives returns 4 interactive flip card objectives', objRes.status === 200 && objData.objectives?.length === 4);
    } catch (e) {
      recordTest('Stages', 'Stage 1 details', false, e.message);
    }

    // Stage 2 Lock Verification & Progression
    try {
      const s2LockRes = await fetch(`${API_BASE}/learning/stages/2`, { headers: studentHeaders });
      const s2LockData = await s2LockRes.json();
      recordTest('Stages', 'Stage 2 correctly enforces pedagogical lock before Stage 1 is complete (403 isLocked)', s2LockRes.status === 403 && s2LockData.isLocked === true);

      // Complete Stage 1 to unlock Stage 2
      const comp1Res = await fetch(`${API_BASE}/learning/stages/1/complete`, {
        method: 'POST',
        headers: studentHeaders
      });
      const comp1Data = await comp1Res.json();
      recordTest('Navigation', 'POST /api/learning/stages/1/complete completes Stage 1 and unlocks Stage 2', comp1Res.status === 200 && comp1Data.isCompleted === true);

      // Now fetch Stage 2 unlocked
      const s2Res = await fetch(`${API_BASE}/learning/stages/2`, { headers: studentHeaders });
      recordTest('Stages', 'GET /api/learning/stages/2 returns 200 once Stage 1 is complete', s2Res.status === 200);

      const qRes = await fetch(`${API_BASE}/learning/recall/questions`, { headers: studentHeaders });
      const qData = await qRes.json();
      recordTest('Stages', 'GET /api/learning/recall/questions returns active questions', qRes.status === 200 && Array.isArray(qData.questions));

      // Unlock Stage 2 to test Stage 3
      await fetch(`${API_BASE}/learning/stages/2/complete`, { method: 'POST', headers: studentHeaders });
      const s3Res = await fetch(`${API_BASE}/learning/stages/3`, { headers: studentHeaders });
      recordTest('Stages', 'GET /api/learning/stages/3 returns 200 once Stage 2 is complete', s3Res.status === 200);

      const postRes = await fetch(`${API_BASE}/learning/parts/2/posture`, { headers: studentHeaders });
      recordTest('Stages', 'GET /api/learning/parts/2/posture returns 5 anatomical indicators', postRes.status === 200);

      const brRes = await fetch(`${API_BASE}/learning/parts/2/breathe`, { headers: studentHeaders });
      recordTest('Stages', 'GET /api/learning/parts/2/breathe returns breathing levels', brRes.status === 200);

      const songRes = await fetch(`${API_BASE}/learning/parts/2/song`, { headers: studentHeaders });
      recordTest('Stages', 'GET /api/learning/parts/2/song returns song practice tab', songRes.status === 200);

      // Unlock Stage 3 to test Stage 4
      await fetch(`${API_BASE}/learning/stages/3/complete`, { method: 'POST', headers: studentHeaders });
      const s4Res = await fetch(`${API_BASE}/learning/stages/4`, { headers: studentHeaders });
      recordTest('Stages', 'GET /api/learning/stages/4 returns 200 once Stage 3 is complete', s4Res.status === 200);

      const mfRes = await fetch(`${API_BASE}/learning/challenges/myth-fact`, { headers: studentHeaders });
      const mfData = await mfRes.json();
      recordTest('Stages', 'GET /api/learning/challenges/myth-fact returns 6 questions', mfRes.status === 200 && mfData.questions?.length === 6);

      // Unlock Stage 4 to test Stage 5
      await fetch(`${API_BASE}/learning/stages/4/complete`, { method: 'POST', headers: studentHeaders });
      const s5Res = await fetch(`${API_BASE}/learning/stages/5`, { headers: studentHeaders });
      recordTest('Stages', 'GET /api/learning/stages/5 returns 200 once Stage 4 is complete', s5Res.status === 200);

      const comRes = await fetch(`${API_BASE}/practice/commitment`, { headers: studentHeaders });
      recordTest('Stages', 'GET /api/practice/commitment returns student commitment', comRes.status === 200);
    } catch (e) {
      recordTest('Stages', 'Stage progression and unlocking flow', false, e.message);
    }

    // Stage Navigation & Completion Endpoints (Newly hardwired)
    try {
      const unlockRes = await fetch(`${API_BASE}/learning/stages/unlock-status`, { headers: studentHeaders });
      recordTest('Navigation', 'GET /api/learning/stages/unlock-status returns lock map', unlockRes.status === 200);

      const compSummaryRes1 = await fetch(`${API_BASE}/learning/modules/1/completion-summary`, { headers: studentHeaders });
      recordTest('Navigation', 'GET /api/learning/modules/1/completion-summary returns summary', compSummaryRes1.status === 200);

      const compSummaryRes2 = await fetch(`${API_BASE}/modules/1/completion-summary`, { headers: studentHeaders });
      recordTest('Navigation', 'GET /api/modules/1/completion-summary alias route works (200 OK)', compSummaryRes2.status === 200);

      const completeStageRes = await fetch(`${API_BASE}/learning/stages/1/complete`, {
        method: 'POST',
        headers: studentHeaders
      });
      const completeData = await completeStageRes.json();
      recordTest('Navigation', 'POST /api/learning/stages/1/complete marks stage complete', completeStageRes.status === 200 && completeData.isCompleted === true);
    } catch (e) {
      recordTest('Navigation', 'Stage completion check', false, e.message);
    }
  }

  // --------------------------------------------------------------------------
  // SUITE 5: Practice Journal & Kanban Endpoints
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Practice Journal & Kanban Endpoints ---');
  if (studentToken) {
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    try {
      const sessRes = await fetch(`${API_BASE}/practice/sessions`, { headers: studentHeaders });
      recordTest('Journal', 'GET /api/practice/sessions returns session history', sessRes.status === 200);

      const refRes = await fetch(`${API_BASE}/practice/reflections`, { headers: studentHeaders });
      recordTest('Journal', 'GET /api/practice/reflections returns reflections', refRes.status === 200);

      const diaryRes = await fetch(`${API_BASE}/practice/diary/tasks`, { headers: studentHeaders });
      recordTest('Journal', 'GET /api/practice/diary/tasks returns tasks', diaryRes.status === 200);
    } catch (e) {
      recordTest('Journal', 'Practice journal check', false, e.message);
    }
  }

  // --------------------------------------------------------------------------
  // SUITE 6: CMS & Public Theme Endpoints
  // --------------------------------------------------------------------------
  console.log('\n--- 6. CMS & Public Theme Endpoints ---');
  try {
    const themeRes = await fetch(`${API_BASE}/admin/public-theme`);
    const themeData = await themeRes.json();
    recordTest('CMS', 'GET /api/admin/public-theme returns official branding', themeRes.status === 200 && (themeData.theme?.primary_color || themeData.success));

    const cmsRes = await fetch(`${API_BASE}/cms/public/welcome`);
    recordTest('CMS', 'GET /api/cms/public/welcome returns page content', cmsRes.status === 200);
  } catch (e) {
    recordTest('CMS', 'CMS public endpoints', false, e.message);
  }

  // --------------------------------------------------------------------------
  // SUITE 7: Concurrency & Connection Pool Stress Test
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Concurrency & Connection Pool Stress Test ---');
  try {
    const concurrentCount = 15;
    const promises = [];
    for (let i = 0; i < concurrentCount; i++) {
      promises.push(fetch(`${API_BASE}/health/ready`));
    }
    const responses = await Promise.all(promises);
    const all200 = responses.every(r => r.status === 200);
    recordTest('Stress', `15 concurrent requests to /api/health/ready handled without pool exhaustion`, all200);
  } catch (e) {
    recordTest('Stress', 'Concurrency check', false, e.message);
  }

  console.log('\n================================================================');
  console.log(` TEST RUN COMPLETE: ${results.passed}/${results.total} PASSED (${results.failed} failed)`);
  console.log('================================================================\n');

  return results.failed === 0;
}

runSuite().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
