const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('===========================================================');
  console.log('  No Tre(ou)ble STAGE 01 3D FLIP OBJECTIVES VERIFICATION   ');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function pass(msg) {
    console.log(`[PASS] ${msg}`);
    passed++;
  }

  function fail(msg, err) {
    console.error(`[FAIL] ${msg}`);
    if (err) console.error(err);
    failed++;
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${API_BASE}/health`);
    assert(healthRes.status === 200, 'Health check failed');
    pass('1. Backend API health check returns 200 OK');

    // 2. Register/Login Vocalist User
    const timestamp = Date.now();
    const testEmail = `vocal_flip_${timestamp}@vocalpath.test`;
    const testPass = 'Password123!';
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `vocal_flip_${timestamp}`,
        gender: 'Female',
        email: testEmail,
        phone: '9876543210',
        password: testPass,
        confirm_password: testPass,
        selected_musical_goal: 'I want to develop my vocal technique.',
        types_of_music: ['Gospel Music']
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success, `Registration failed: ${JSON.stringify(regData)}`);

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPass
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.token, 'Login failed');
    const userToken = loginData.token;
    pass('2. Registered and authenticated new vocalist user');

    // 3. GET /api/learning/stages/1/objectives
    const objRes = await fetch(`${API_BASE}/learning/stages/1/objectives`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const objData = await objRes.json();
    assert(objRes.status === 200 && objData.success, 'Failed to fetch Stage 01 objectives');
    pass('3. GET /api/learning/stages/1/objectives returns 200 OK');

    // 4. Exactly 4 cards returned
    const cards = objData.objectives;
    assert(cards.length === 4, `Expected exactly 4 cards, found ${cards.length}`);
    pass('4. Exactly FOUR objective cards present in Stage 01');

    // 5. Verify Card 01
    const card1 = cards[0];
    assert(card1.title === 'Maintain POSTURE', `Card 1 title was "${card1.title}"`);
    assert(card1.title_line_1 === 'Maintain', `Card 1 title_line_1 was "${card1.title_line_1}"`);
    assert(card1.title_line_2 === 'POSTURE', `Card 1 title_line_2 was "${card1.title_line_2}"`);
    assert(card1.description === 'Demonstrate correct singing posture and diaphragmatic breathing techniques independently.', `Card 1 description mismatch: ${card1.description}`);
    assert(card1.icon === 'Lightbulb', `Card 1 icon was "${card1.icon}"`);
    pass('5. Card 01 verified: "Maintain POSTURE" with correct description and Lightbulb icon');

    // 6. Verify Card 02
    const card2 = cards[1];
    assert(card2.title === 'Manage BREATHING', `Card 2 title was "${card2.title}"`);
    assert(card2.title_line_1 === 'Manage', `Card 2 title_line_1 was "${card2.title_line_1}"`);
    assert(card2.title_line_2 === 'BREATHING', `Card 2 title_line_2 was "${card2.title_line_2}"`);
    assert(card2.description === 'Perform controlled inhalation and exhalation exercises to regulate your airflow.', `Card 2 description mismatch: ${card2.description}`);
    assert(['Wind', 'Compass'].includes(card2.icon), `Card 2 icon was "${card2.icon}"`);
    pass('6. Card 02 verified: "Manage BREATHING" with correct description and Compass/Wind icon');

    // 7. Verify Card 03
    const card3 = cards[2];
    assert(card3.title === 'Apply VOCAL TECHNIQUES', `Card 3 title was "${card3.title}"`);
    assert(card3.title_line_1 === 'Apply', `Card 3 title_line_1 was "${card3.title_line_1}"`);
    assert(card3.title_line_2 === 'VOCAL TECHNIQUES', `Card 3 title_line_2 was "${card3.title_line_2}"`);
    assert(card3.description === 'Apply breath management techniques to a song!', `Card 3 description mismatch: ${card3.description}`);
    assert(card3.icon === 'Megaphone', `Card 3 icon was "${card3.icon}"`);
    pass('7. Card 03 verified: "Apply VOCAL TECHNIQUES" with correct description and Megaphone icon');

    // 8. Verify Card 04
    const card4 = cards[3];
    assert(card4.title.toLowerCase().includes('practice routine'), `Card 4 title was "${card4.title}"`);
    assert(['Organize', 'Organise'].includes(card4.title_line_1), `Card 4 title_line_1 was "${card4.title_line_1}"`);
    assert(card4.title_line_2 === 'PRACTICE ROUTINE', `Card 4 title_line_2 was "${card4.title_line_2}"`);
    assert(card4.description === 'Develop and maintain a structured weekly breathing practice journal to track your exercises and progress.', `Card 4 description mismatch: ${card4.description}`);
    assert(['CalendarCheck', 'GitFork', 'Arrows'].includes(card4.icon), `Card 4 icon was "${card4.icon}"`);
    pass('8. Card 04 verified: "Organise/Organize PRACTICE ROUTINE" with correct description and icon');

    // 9. Initial acknowledgement status is false
    assert(objData.acknowledged === false, 'Expected initial acknowledged to be false');
    pass('9. Initial objective acknowledgement state is FALSE for new vocalist');

    // 10. Student acknowledges objectives
    const ackRes = await fetch(`${API_BASE}/learning/stages/1/objectives/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      }
    });
    const ackData = await ackRes.json();
    assert(ackRes.status === 200 && ackData.success && ackData.acknowledged === true, 'Failed to acknowledge objectives');
    pass('10. POST /api/learning/stages/1/objectives/acknowledge successfully saves in MySQL');

    // 11. Re-query objectives and verify acknowledgement persists
    const objRes2 = await fetch(`${API_BASE}/learning/stages/1/objectives`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const objData2 = await objRes2.json();
    assert(objData2.acknowledged === true, 'Acknowledgement status did not persist');
    pass('11. Objective acknowledgement status PERSISTS in MySQL on reload');

    // 12. Normal user is rejected from admin objectives CRUD (Security check)
    const unauthorizedRes = await fetch(`${API_BASE}/admin/learning/objectives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ stage_id: 1, title: 'Hacked Objective' })
    });
    assert(unauthorizedRes.status === 403, `Expected 403 Forbidden, got ${unauthorizedRes.status}`);
    pass('12. Standard vocalist is blocked with HTTP 403 from admin objectives modification');

    // 13. Admin Login
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Smirthi',
        password: 'smirthi1234'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginData.success, 'Admin login failed');
    const adminToken = adminLoginData.token;
    pass('13. Admin login succeeded (role ADMIN)');

    // 14. Admin fetch stage objectives
    const adminObjsRes = await fetch(`${API_BASE}/admin/learning/stages/1/objectives`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminObjsData = await adminObjsRes.json();
    assert(adminObjsRes.status === 200 && adminObjsData.success, 'Admin fetch failed');
    assert(adminObjsData.objectives.length === 4, 'Expected 4 objectives in admin query');
    pass('14. Admin can retrieve Stage 01 objectives via /api/admin/learning/stages/1/objectives');

    // 15. Admin update objective card (Edit functionality)
    const targetObjId = cards[0].id;
    const updateRes = await fetch(`${API_BASE}/admin/learning/objectives/${targetObjId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title_line_1: 'Maintain',
        title_line_2: 'POSTURE',
        description: 'Demonstrate correct singing posture and diaphragmatic breathing techniques independently.',
        icon: 'Lightbulb',
        display_order: 1,
        is_active: true
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200 && updateData.success, 'Admin update failed');
    pass('15. Admin can update objective card details via PUT /api/admin/learning/objectives/:id');

    // 16. Admin create and delete temporary card to test full CRUD
    const createRes = await fetch(`${API_BASE}/admin/learning/objectives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        stage_id: 1,
        title_line_1: 'Bonus',
        title_line_2: 'DRILL',
        description: 'Temporary bonus practice drill.',
        icon: 'Sparkles',
        display_order: 5,
        is_active: false
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.success, 'Admin create failed');
    const tempId = createData.id;
    pass('16. Admin can create new objective card via POST /api/admin/learning/objectives');

    const deleteRes = await fetch(`${API_BASE}/admin/learning/objectives/${tempId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200 && deleteData.success, 'Admin delete failed');
    pass('17. Admin can delete objective card via DELETE /api/admin/learning/objectives/:id');

    // 17. Verify Stage Details API includes 4 objectives
    const stageDetailsRes = await fetch(`${API_BASE}/learning/stages/1`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const stageDetailsData = await stageDetailsRes.json();
    assert(stageDetailsRes.status === 200 && stageDetailsData.success, 'Stage details failed');
    assert(stageDetailsData.stage?.objectives?.length === 4, `Expected 4 objectives in stage details, got ${stageDetailsData.stage?.objectives?.length}`);
    pass('18. GET /api/learning/stages/1 details payload includes exactly the 4 objective cards');

  } catch (err) {
    fail('Unhandled error during test suite execution', err);
  }

  console.log('===========================================================');
  console.log(`  FLIP OBJECTIVES TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) process.exit(1);
}

runTestSuite();
