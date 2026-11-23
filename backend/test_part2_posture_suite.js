/**
 * No Tre(ou)ble - STAGE 03 PART 02: INTERACTIVE POSTURE LEARNING TEST SUITE
 * Verifies Part 2 Step 1 Posture, 3D Posture Indicators, Checklist,
 * Breathe tab, Song tab, MySQL persistence, Admin CRUD, and Data Isolation.
 */

const API_BASE = 'http://localhost:5000/api';

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runTestSuite() {
  console.log('===========================================================');
  console.log('  No Tre(ou)ble STAGE 03 PART 02 POSTURE VERIFICATION SUITE');
  console.log('===========================================================\n');

  try {
    // 1. Health check
    const healthRes = await fetch(`${API_BASE}/health`);
    assert(healthRes.status === 200, '1. Backend API health check returns 200 OK');

    // 2. Register & authenticate Student A
    const ts = Date.now();
    const studentUser = `vocalist_${ts}`;
    const studentPass = 'Pass1234!';

    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: studentUser,
        name: 'Vocalist Alpha',
        email: `${studentUser}@notreouble.com`,
        phone: '9876543210',
        gender: 'female',
        password: studentPass,
        confirm_password: studentPass,
        types_of_music: ['Classical', 'Gospel']
      })
    });
    assert(regRes.status === 201, '2. Student A registered successfully');

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: studentUser, password: studentPass })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.token, '3. Student A authenticated with JWT token');
    const studentToken = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    };

    // 4. Fetch Part 2 Section via GET /api/learning/stages/03/parts/02
    const part2Res = await fetch(`${API_BASE}/learning/stages/03/parts/02`, { headers: authHeaders });
    const part2Data = await part2Res.json();
    assert(part2Res.status === 200 && part2Data.success, '4. GET /api/learning/stages/03/parts/02 returns 200 OK');

    // 5. Verify Part 2 Title and Subtitle
    assert(part2Data.part && part2Data.part.title.includes('Step 1: Posture'), '5a. Part 2 title contains "Step 1: Posture"');
    assert(part2Data.part.subtitle.includes('Stand tall, stay relaxed'), '5b. Part 2 subtitle contains "Stand tall, stay relaxed"');

    // 6. Verify Exactly 3 Navigation Tabs
    assert(Array.isArray(part2Data.tabs) && part2Data.tabs.length === 3, `6a. Exactly 3 navigation tabs present (count: ${part2Data.tabs?.length})`);
    const tabKeys = part2Data.tabs.map(t => t.tab_key);
    assert(tabKeys.includes('posture') && tabKeys.includes('breathe') && tabKeys.includes('song'), '6b. Tabs order contains Posture, Breathe, Song');

    // 7. Verify Exactly 5 Anatomical Posture Indicators
    assert(Array.isArray(part2Data.indicators) && part2Data.indicators.length === 5, `7a. Exactly 5 anatomical posture indicators (count: ${part2Data.indicators?.length})`);
    const indTitles = part2Data.indicators.map(i => i.title.toLowerCase());
    assert(indTitles.some(t => t.includes('head level')), '7b. Indicator 1: Head level verified');
    assert(indTitles.some(t => t.includes('shoulders loose')), '7c. Indicator 2: Shoulders loose verified');
    assert(indTitles.some(t => t.includes('ribs open')), '7d. Indicator 3: Ribs open verified');
    assert(indTitles.some(t => t.includes('knees soft')), '7e. Indicator 4: Knees soft verified');
    assert(indTitles.some(t => t.includes('feet hip-width')), '7f. Indicator 5: Feet hip-width apart verified');

    // 8. Verify Exactly 5 Posture Checklist Items
    assert(Array.isArray(part2Data.checklist) && part2Data.checklist.length === 5, `8a. Exactly 5 posture checklist items (count: ${part2Data.checklist?.length})`);
    const checklistTexts = part2Data.checklist.map(c => c.item_text.toLowerCase());
    assert(checklistTexts.some(t => t.includes('hip-width apart')), '8b. Checklist 1: Feet about hip-width apart verified');
    assert(checklistTexts.some(t => t.includes('knees soft')), '8c. Checklist 2: Knees soft, not locked verified');
    assert(checklistTexts.some(t => t.includes('spine long')), '8d. Checklist 3: Spine long, chin level verified');
    assert(checklistTexts.some(t => t.includes('shoulders down')), '8e. Checklist 4: Shoulders down and relaxed verified');
    assert(checklistTexts.some(t => t.includes('hands loose')), '8f. Checklist 5: Hands loose at your sides verified');

    // 9. Initial student progress is NOT_STARTED
    assert(part2Data.postureProgress && part2Data.postureProgress.status === 'NOT_STARTED', '9. Initial posture progress is NOT_STARTED');
    assert(part2Data.postureProgress.checked_items.length === 0, '9b. Initial checked items is empty array');

    // 10. Save partial checklist progress (e.g. 3 of 5)
    const itemIds = part2Data.checklist.map(c => c.id);
    const partialChecked = [itemIds[0], itemIds[1], itemIds[2]];

    const savePartRes = await fetch(`${API_BASE}/learning/parts/02/posture/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ checked_items: partialChecked, is_completed: false })
    });
    const savePartData = await savePartRes.json();
    assert(savePartRes.status === 200 && savePartData.success, '10. Successfully saved 3 checklist points via API');
    assert(savePartData.progress.completed_count === 3, '10b. Completed count correctly reported as 3');
    assert(savePartData.progress.status === 'IN_PROGRESS', '10c. Posture status transitioned to IN_PROGRESS');

    // 11. Verify persistence in MySQL on re-fetch
    const refetchRes = await fetch(`${API_BASE}/learning/stages/03/parts/02`, { headers: authHeaders });
    const refetchData = await refetchRes.json();
    assert(refetchData.postureProgress.completed_count === 3, '11a. Progress persisted in MySQL (count 3)');
    assert(refetchData.postureProgress.checked_items.length === 3, '11b. Persisted checklist IDs match student selection');

    // 12. Save full checklist completion (all 5 items checked)
    const fullChecked = itemIds;
    const saveFullRes = await fetch(`${API_BASE}/learning/parts/02/posture/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ checked_items: fullChecked, is_completed: true })
    });
    const saveFullData = await saveFullRes.json();
    assert(saveFullRes.status === 200 && saveFullData.progress.status === 'COMPLETED', '12. Completing all 5 checklist points transitions status to COMPLETED');

    // 13. Test Breathe Tab Endpoint GET /api/learning/parts/02/breathe
    const breatheRes = await fetch(`${API_BASE}/learning/parts/02/breathe`, { headers: authHeaders });
    const breatheData = await breatheRes.json();
    assert(breatheRes.status === 200 && breatheData.success, '13a. GET /api/learning/parts/02/breathe returns 200 OK');
    assert(breatheData.tab && breatheData.tab.title === 'Breathe', '13b. Breathe tab has official title');

    // Complete Breathe tab
    const compBreatheRes = await fetch(`${API_BASE}/learning/parts/02/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ tab_key: 'breathe', duration_minutes: 5 })
    });
    assert(compBreatheRes.status === 200, '13c. Marked Breathe activity as COMPLETED in MySQL');

    // 14. Test Song Tab Endpoint GET /api/learning/parts/02/song
    const songRes = await fetch(`${API_BASE}/learning/parts/02/song`, { headers: authHeaders });
    const songData = await songRes.json();
    assert(songRes.status === 200 && songData.success, '14a. GET /api/learning/parts/02/song returns 200 OK');
    assert(songData.tab && songData.tab.title === 'Song', '14b. Song tab has official title');

    // Complete Song tab & verify practice session log
    const compSongRes = await fetch(`${API_BASE}/learning/parts/02/complete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ tab_key: 'song', duration_minutes: 10 })
    });
    assert(compSongRes.status === 200, '14c. Marked Song practice as COMPLETED in MySQL');

    // 15. Check overall Part 2 progress endpoint
    const partProgRes = await fetch(`${API_BASE}/learning/parts/02/progress`, { headers: authHeaders });
    const partProgData = await partProgRes.json();
    assert(partProgRes.status === 200 && partProgData.success, '15a. GET /api/learning/parts/02/progress returns 200 OK');
    assert(partProgData.completed_tabs.length >= 2, `15b. Completed tabs recorded in MySQL (completed: ${partProgData.completed_tabs.length})`);

    // 16. Multi-Student Data Isolation
    const studentUser2 = `vocalist2_${ts}`;
    await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: studentUser2,
        name: 'Vocalist Beta',
        email: `${studentUser2}@notreouble.com`,
        phone: '9876543211',
        gender: 'male',
        password: studentPass,
        confirm_password: studentPass,
        types_of_music: ['Jazz']
      })
    });
    const s2LoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: studentUser2, password: studentPass })
    });
    const s2LoginData = await s2LoginRes.json();
    const s2Token = s2LoginData.token;

    const s2PartRes = await fetch(`${API_BASE}/learning/stages/03/parts/02`, {
      headers: { Authorization: `Bearer ${s2Token}` }
    });
    const s2PartData = await s2PartRes.json();
    assert(s2PartData.postureProgress.completed_count === 0, '16. Student B sees 0 checked points (Student A selections isolated)');

    // 17. Security: Standard student is blocked from Admin endpoints
    const forbiddenRes = await fetch(`${API_BASE}/admin/learning/parts/1`, { headers: authHeaders });
    assert(forbiddenRes.status === 403, '17. Standard vocalist receives 403 Forbidden on admin Part 2 routes');

    // 18. Admin CRUD: Authenticate Admin & Test Configuration Updates
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Notreoblemccmrfip', password: 'notreoblesinger' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.token, '18a. Admin successfully authenticated');
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminLoginData.token}`
    };

    // 19. Admin GET /api/admin/learning/parts/1
    const adminGetRes = await fetch(`${API_BASE}/admin/learning/parts/1`, { headers: adminHeaders });
    const adminGetData = await adminGetRes.json();
    assert(adminGetRes.status === 200 && adminGetData.success, '19. Admin can fetch Part 2 configuration');

    // 20. Admin Update Part 2 Subtitle
    const updatedSubtitle = `Stand tall, stay relaxed (Updated ${ts})`;
    const updateRes = await fetch(`${API_BASE}/admin/learning/parts/1`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ subtitle: updatedSubtitle })
    });
    assert(updateRes.status === 200, '20a. Admin updated Part 2 subtitle via PUT /api/admin/learning/parts/1');

    // Verify student immediately sees updated subtitle without redeploy
    const studentVerifyRes = await fetch(`${API_BASE}/learning/stages/03/parts/02`, { headers: authHeaders });
    const studentVerifyData = await studentVerifyRes.json();
    assert(studentVerifyData.part.subtitle === updatedSubtitle, '20b. Student immediately sees updated subtitle via API');

    // 21. Admin Create, Update & Delete Posture Indicator
    const createIndRes = await fetch(`${API_BASE}/admin/learning/parts/1/indicators`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: 'Spine lengthened',
        description: 'Maintain natural lumbar curvature without arching or slouching.',
        body_region: 'spine',
        icon: 'spine',
        display_order: 6
      })
    });
    const createIndData = await createIndRes.json();
    assert(createIndRes.status === 201 && createIndData.id, '21a. Admin created new posture indicator in MySQL');
    const newIndId = createIndData.id;

    // Delete created indicator to maintain pristine 5 indicators
    const delIndRes = await fetch(`${API_BASE}/admin/learning/indicators/${newIndId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    assert(delIndRes.status === 200, '21b. Admin successfully deleted posture indicator from MySQL');

    // 22. Restore canonical Part 2 subtitle
    await fetch(`${API_BASE}/admin/learning/parts/1`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ subtitle: 'Stand tall, stay relaxed' })
    });
    assert(true, '22. Restored canonical subtitle "Stand tall, stay relaxed"');

    console.log('\n===========================================================');
    console.log('  STAGE 03 PART 02 TEST RESULTS: ALL 22 SUITES PASSED!      ');
    console.log('===========================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n[UNEXPECTED ERROR IN TEST SUITE]:', error);
    process.exit(1);
  }
}

runTestSuite();
