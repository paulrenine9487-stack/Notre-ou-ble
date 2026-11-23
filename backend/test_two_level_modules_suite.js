// ============================================================================
// No Tre(ou)ble - TWO-LEVEL LEARNING MODULE NAVIGATION SUITE
// ============================================================================

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('===========================================================');
  console.log('  No Tre(ou)ble TWO-LEVEL LEARNING MODULE VERIFICATION     ');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

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
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'Backend API health check returns 200 OK');

    // 2. Register a fresh test user
    const testUsername = `mod_user_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const testPassword = 'Password123!';

    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        gender: 'female',
        email: testEmail,
        phone: '9876543210',
        types_of_music: ['Carnatic Music', 'Gospel Music'],
        password: testPassword,
        confirm_password: testPassword
      })
    });
    const regData = await regRes.json();
    assert(regData.success, `Registered test user ${testUsername}`);

    // 3. Login to get JWT
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    assert(Boolean(token), 'Authenticated with JWT token');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 4. Test GET /api/learning/modules
    const modulesRes = await fetch(`${BASE_URL}/learning/modules`, { headers: authHeaders });
    assert(modulesRes.status === 200, 'GET /api/learning/modules returns 200 OK');
    const modulesData = await modulesRes.json();
    assert(modulesData.success && Array.isArray(modulesData.modules), 'Modules array returned successfully');
    assert(modulesData.modules.length === 5, 'Exactly 5 modules returned in list');

    // Verify module order and titles
    const m1 = modulesData.modules[0];
    const m2 = modulesData.modules[1];
    const m3 = modulesData.modules[2];
    const m4 = modulesData.modules[3];
    const m5 = modulesData.modules[4];

    assert(m1.module_number === 1 && m1.category === 'Breath', 'Module 01 is Breath');
    assert(m1.title === 'The Hidden Engine: Breath Control & Vocal Stamina', 'Module 01 has official title');
    assert(m1.is_available === true, 'Module 01 is AVAILABLE (is_available = true)');
    assert(m1.button_text === 'START', 'New user sees START button on Module 01');
    assert(m1.progress_percentage === 0, 'New user has 0% progress on Module 01');

    assert(m2.module_number === 2 && m2.category === 'Pitch Correction', 'Module 02 is Pitch Correction');
    assert(m2.is_available === false && m2.status === 'COMING_SOON', 'Module 02 is COMING_SOON (is_available = false)');

    assert(m3.module_number === 3 && m3.category === 'High Notes', 'Module 03 is High Notes');
    assert(m3.is_available === false && m3.status === 'COMING_SOON', 'Module 03 is COMING_SOON');

    assert(m4.module_number === 4 && m4.category === 'Pronunciation & Diction', 'Module 04 is Pronunciation & Diction');
    assert(m4.is_available === false && m4.status === 'COMING_SOON', 'Module 04 is COMING_SOON');

    assert(m5.module_number === 5 && m5.category === 'Style of the Song', 'Module 05 is Style of the Song');
    assert(m5.is_available === false && m5.status === 'COMING_SOON', 'Module 05 is COMING_SOON');

    // 5. Test GET /api/learning/modules/1 (Module 01 details)
    const m1DetailRes = await fetch(`${BASE_URL}/learning/modules/1`, { headers: authHeaders });
    assert(m1DetailRes.status === 200, 'GET /api/learning/modules/1 returns 200');
    const m1Detail = await m1DetailRes.json();
    assert(m1Detail.module.is_available === true, 'Module 01 detail confirms is_available = true');
    assert(Array.isArray(m1Detail.module.stages) && m1Detail.module.stages.length === 5, 'Module 01 contains 5 stages');

    // 6. Test GET /api/learning/modules/2 (Locked Module rejection)
    const m2DetailRes = await fetch(`${BASE_URL}/learning/modules/2`, { headers: authHeaders });
    assert(m2DetailRes.status === 403, 'GET /api/learning/modules/2 returns 403 Forbidden');
    const m2Detail = await m2DetailRes.json();
    assert(m2Detail.is_locked === true, 'Response specifies is_locked = true');
    assert(m2Detail.message.includes('available soon'), 'Response specifies module will be available soon');

    // 7. Test GET /api/learning/modules/3, 4, 5 also rejected
    for (const num of [3, 4, 5]) {
      const res = await fetch(`${BASE_URL}/learning/modules/${num}`, { headers: authHeaders });
      assert(res.status === 403, `GET /api/learning/modules/${num} correctly rejected with 403`);
    }

    // 8. Progress calculation verification:
    // Mark stage 1 activities complete for this user
    await fetch(`${BASE_URL}/learning/activity-progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ stage_id: 1, activity_id: 's1_intro', activity_type: 'intro' })
    });
    await fetch(`${BASE_URL}/learning/activity-progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ stage_id: 1, activity_id: 's1_video', activity_type: 'video' })
    });
    await fetch(`${BASE_URL}/learning/activity-progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ stage_id: 1, activity_id: 's1_objectives', activity_type: 'objectives' })
    });

    // 9. Re-check /api/learning/modules to verify dynamic progress update (1/5 stages = 20%)
    const modulesUpdatedRes = await fetch(`${BASE_URL}/learning/modules`, { headers: authHeaders });
    const modulesUpdated = await modulesUpdatedRes.json();
    const updatedM1 = modulesUpdated.modules[0];
    assert(updatedM1.completed_stages === 1, 'Stage 1 completion dynamically reflected: completed_stages = 1');
    assert(updatedM1.progress_percentage === 20, 'Progress percentage dynamically calculated as 20% (1/5 stages)');
    assert(updatedM1.status === 'IN_PROGRESS', 'Status transitioned to IN_PROGRESS');
    assert(updatedM1.button_text === 'CONTINUE', 'Button text transitioned to CONTINUE');

    // 10. Dashboard overview reflects Module 1 progress
    const dashRes = await fetch(`${BASE_URL}/dashboard/overview`, { headers: authHeaders });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, 'GET /api/dashboard/overview returns 200');
    assert(dashData.data.learningProgress.completedStages === 1, 'Dashboard reflects 1 completed stage');
    assert(dashData.data.learningProgress.percentage === 20, 'Dashboard reflects 20% progress');

    // 11. Unauthorized access (no JWT) is rejected
    const noAuthRes = await fetch(`${BASE_URL}/learning/modules`);
    assert(noAuthRes.status === 401, 'Unauthenticated request to /api/learning/modules rejected with 401');

    console.log('===========================================================');
    console.log(`  MODULE SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
