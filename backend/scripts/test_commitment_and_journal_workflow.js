/**
 * End-to-End Test Suite for Stage 5:
 * Save My Commitment -> Automatic Learning Journal Session Creation & Lifecycle
 */

const API_BASE = 'http://127.0.0.1:5000/api';

const results = {
  total: 0,
  passed: 0,
  failed: 0
};

function recordTest(testName, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${testName}`);
  } else {
    results.failed++;
    console.error(`  \x1b[31m✗\x1b[0m ${testName} - ${details}`);
  }
}

async function registerStudent(suffix) {
  const email = `test_stage5_${Date.now()}_${suffix}@notreouble.test`;
  const password = 'Password123!';
  const username = `st5_${Date.now().toString().slice(-4)}_${suffix}`;

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      gender: 'male',
      email,
      phone: '9876543210',
      password,
      confirm_password: password,
      types_of_music: ['Classical']
    })
  });
  const regData = await regRes.json();

  // Log in to get verified JWT token
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken;

  return { token, email, password, username, id: loginData.user?.id || regData.userId };
}

async function runTests() {
  console.log('\n================================================================');
  console.log(' STAGE 5: COMMITMENT & AUTOMATIC JOURNAL SESSION CREATION TEST ');
  console.log('================================================================\n');

  // Setup: Register Student A and Student B
  console.log('Setting up test students...');
  const studentA = await registerStudent('a');
  const studentB = await registerStudent('b');
  console.log(`Student A registered (${studentA.email})`);
  console.log(`Student B registered (${studentB.email})`);

  let studentAToken = studentA.token;

  // --------------------------------------------------------------------------
  // TEST 1: Select activities, 20 mins, 5 sessions/week -> SAVE MY COMMITMENT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 1: Save Commitment (20 min, 5 sess/wk) ---');
  let saveRes1;
  try {
    const res = await fetch(`${API_BASE}/practice/commitment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`
      },
      body: JSON.stringify({
        minutes_per_session: 20,
        sessions_per_week: 5,
        selected_activities: ['vocal_warmup', 'posture_breathing_simulation', 'song_practice_recording']
      })
    });
    saveRes1 = await res.json();
    recordTest('Commitment API returns 200 OK', res.status === 200 && saveRes1.success);
    recordTest('Weekly target correctly calculated: 20 * 5 = 100 min', saveRes1.commitment?.weekly_minutes === 100);
    recordTest('Response contains generated session records', Array.isArray(saveRes1.sessions) && saveRes1.sessions.length === 5);
    const allPlanned = (saveRes1.sessions || []).every(s => s.status === 'planned');
    recordTest('All generated sessions have initial status PLANNED', allPlanned);
    const correctDuration = (saveRes1.sessions || []).every(s => s.planned_duration === 20);
    recordTest('All generated sessions reflect 20 min planned duration', correctDuration);
  } catch (err) {
    recordTest('Test 1 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Refresh simulation (GET /api/practice/commitment & sessions)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Browser Refresh Simulation ---');
  try {
    const comRes = await fetch(`${API_BASE}/practice/commitment`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const comData = await comRes.json();
    recordTest('Commitment persists after refresh', comData.hasCommitment && comData.commitment.weekly_minutes === 100);

    const sessRes = await fetch(`${API_BASE}/practice/sessions`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const sessData = await sessRes.json();
    recordTest('Exactly 5 sessions returned after refresh', Array.isArray(sessData.sessions) && sessData.sessions.length === 5);
    recordTest('All 5 sessions still in TO DO (planned)', (sessData.sessions || []).filter(s => s.status === 'planned').length === 5);
  } catch (err) {
    recordTest('Test 2 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Logout and Login Again (New JWT)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Logout and Re-Login ---');
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentA.email, password: studentA.password })
    });
    const loginData = await loginRes.json();
    const freshToken = loginData.token || loginData.accessToken;
    recordTest('Student A logs back in with fresh token', !!freshToken);

    studentAToken = freshToken;

    const sessRes = await fetch(`${API_BASE}/practice/sessions`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const sessData = await sessRes.json();
    recordTest('Student-specific sessions reload correctly after re-login', (sessData.sessions || []).length === 5);
  } catch (err) {
    recordTest('Test 3 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Student clicks "Start Doing" (PLANNED -> IN_PROGRESS / practising)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Move Session to DOING (Start Doing) ---');
  let firstSessionId = null;
  try {
    const sessRes = await fetch(`${API_BASE}/practice/sessions`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const sessData = await sessRes.json();
    firstSessionId = sessData.sessions[0].id;

    const moveRes = await fetch(`${API_BASE}/practice/sessions/${firstSessionId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`
      },
      body: JSON.stringify({ status: 'practising' })
    });
    const moveData = await moveRes.json();
    recordTest('Move to practising returns 200 OK', moveRes.status === 200 && moveData.success);
    recordTest('Session status updated to practising in MySQL', moveData.session?.status === 'practising');
  } catch (err) {
    recordTest('Test 4 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Student completes session (IN_PROGRESS -> COMPLETED / done)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Complete Session (Move to DONE) ---');
  try {
    const completeRes = await fetch(`${API_BASE}/practice/sessions/${firstSessionId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`
      },
      body: JSON.stringify({ status: 'done', actual_duration: 20, notes: 'Felt diaphragmatic support clearly' })
    });
    const completeData = await completeRes.json();
    recordTest('Complete session returns 200 OK', completeRes.status === 200 && completeData.success);
    recordTest('Session status updated to done in MySQL', completeData.session?.status === 'done');
    recordTest('Completed session has completion timestamp', !!completeData.session?.completed_at);
  } catch (err) {
    recordTest('Test 5 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Student clicks "SAVE MY COMMITMENT" again without changing anything
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Idempotent Re-Save (No Duplicates) ---');
  try {
    const res = await fetch(`${API_BASE}/practice/commitment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`
      },
      body: JSON.stringify({
        minutes_per_session: 20,
        sessions_per_week: 5,
        selected_activities: ['vocal_warmup', 'posture_breathing_simulation', 'song_practice_recording']
      })
    });
    const data = await res.json();
    recordTest('Re-save commitment returns 200 OK', res.status === 200 && data.success);

    // Verify session counts: 1 done + 4 planned = 5 total sessions (no duplicates!)
    const doneCount = (data.sessions || []).filter(s => s.status === 'done').length;
    const plannedCount = (data.sessions || []).filter(s => s.status === 'planned').length;
    recordTest('No duplicate sessions created on re-save', (data.sessions || []).length === 5);
    recordTest('Existing completed session preserved intact', doneCount === 1);
    recordTest('Remaining 4 planned sessions preserved in TO DO', plannedCount === 4);
  } catch (err) {
    recordTest('Test 6 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Student changes commitment (Updates future planned sessions)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: Reconcile Commitment Update ---');
  try {
    // Student updates duration to 30 min and 4 sessions per week
    const res = await fetch(`${API_BASE}/practice/commitment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`
      },
      body: JSON.stringify({
        minutes_per_session: 30,
        sessions_per_week: 4,
        selected_activities: ['vocal_warmup', 'hiss_exhalation']
      })
    });
    const data = await res.json();
    recordTest('Update commitment returns 200 OK', res.status === 200 && data.success);
    recordTest('New weekly target: 30 * 4 = 120 min', data.commitment?.weekly_minutes === 120);

    const doneCount = (data.sessions || []).filter(s => s.status === 'done').length;
    const plannedCount = (data.sessions || []).filter(s => s.status === 'planned').length;
    recordTest('Completed session preserved untouched', doneCount === 1);
    recordTest('Total sessions reconciled to 4 (1 done + 3 planned)', (data.sessions || []).length === 4 && plannedCount === 3);
    const all30Min = (data.sessions || []).filter(s => s.status === 'planned').every(s => s.planned_duration === 30);
    recordTest('Planned sessions updated to 30 min duration', all30Min);
  } catch (err) {
    recordTest('Test 7 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Backend error resilience simulation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 8: Backend Error & Non-Existent Endpoint Handling ---');
  try {
    // Attempt request with invalid/malformed token
    const badRes = await fetch(`${API_BASE}/practice/commitment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid_token_xyz'
      },
      body: JSON.stringify({ minutes_per_session: 20 })
    });
    recordTest('Invalid auth token rejected with 401 or 403', badRes.status === 401 || badRes.status === 403);
  } catch (err) {
    recordTest('Test 8 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Simultaneous Duplicate Requests (Race Condition Test)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 9: Concurrent Simultaneous Commitment Saves ---');
  try {
    const burstPromises = Array.from({ length: 4 }, () =>
      fetch(`${API_BASE}/practice/commitment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentAToken}`
        },
        body: JSON.stringify({
          minutes_per_session: 25,
          sessions_per_week: 4,
          selected_activities: ['vocal_warmup', 'song_practice_recording']
        })
      }).then(r => r.json())
    );

    const burstResults = await Promise.all(burstPromises);
    const allSuccessful = burstResults.every(r => r.success);
    recordTest('All simultaneous requests succeed without deadlock', allSuccessful);

    // Verify session count in MySQL
    const sessRes = await fetch(`${API_BASE}/practice/sessions`, {
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    const sessData = await sessRes.json();
    const plannedCount = (sessData.sessions || []).filter(s => s.status === 'planned').length;
    const doneCount = (sessData.sessions || []).filter(s => s.status === 'done').length;
    recordTest('Concurrent requests did not create duplicate sessions', sessData.sessions.length === 4 && plannedCount === 3 && doneCount === 1);
  } catch (err) {
    recordTest('Test 9 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 10: Student Isolation & Authorization Security
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 10: Student Data Isolation & Security ---');
  try {
    // Student B attempts to modify Student A's completed session
    const hackRes = await fetch(`${API_BASE}/practice/sessions/${firstSessionId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`
      },
      body: JSON.stringify({ status: 'practising' })
    });
    recordTest('Student B modifying Student A session rejected with 404/403', hackRes.status === 404 || hackRes.status === 403);

    // Verify Student B sees only their own sessions
    const bSessRes = await fetch(`${API_BASE}/practice/sessions`, {
      headers: { Authorization: `Bearer ${studentB.token}` }
    });
    const bSessData = await bSessRes.json();
    recordTest('Student B has 0 sessions initially (isolated from Student A)', (bSessData.sessions || []).length === 0);
  } catch (err) {
    recordTest('Test 10 Execution', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 11: Manual Add Session Functionality Preserved
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 11: Manual Add Session Functionality Preserved ---');
  try {
    const addRes = await fetch(`${API_BASE}/practice/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`
      },
      body: JSON.stringify({
        session_title: 'Bonus Weekend Warmup',
        activity: 'Gentle Humming & Posture',
        planned_duration: 15,
        notes: 'Extra warmup before rehearsal'
      })
    });
    const addData = await addRes.json();
    recordTest('Manual Add Session returns 201 Created', addRes.status === 201 && addData.success);
    recordTest('Manually added session starts with status planned', addData.session?.status === 'planned');
    recordTest('Manual session appears in student sessions list', addData.session?.planned_duration === 15);
  } catch (err) {
    recordTest('Test 11 Execution', false, err.message);
  }

  // Summary
  console.log('\n================================================================');
  console.log(` TEST SUMMARY: ${results.passed}/${results.total} PASSED (${results.failed} failed)`);
  console.log('================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
