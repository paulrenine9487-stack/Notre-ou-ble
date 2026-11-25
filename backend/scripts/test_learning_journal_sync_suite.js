/**
 * TEST SUITE: NO TRE(OU)BLE LEARNING JOURNAL DATABASE SYNCHRONIZATION
 * Tests:
 * 1. PLANNED -> PRACTISING (Start Doing)
 * 2. PRACTISING -> DONE with actual_duration & reflection notes
 * 3. Status normalization ('completed', 'in_progress', 'doing', 'todo', etc.)
 * 4. Safe truncation of long activity names (prevent ER_DATA_TOO_LONG)
 * 5. Idempotent completion (no duplicate rows in practice_sessions)
 * 6. Student data isolation (prevent modifying other user's session)
 * 7. Activity completion upsert (journal_kanban_tracker -> completed)
 * 8. Stage 5 progress recalculation
 * 9. Persistence verification across page reloads / queries
 */

const pool = require('../config/db');
const ctrl = require('../controllers/stageFivePracticeController');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING LEARNING JOURNAL DATABASE SYNCHRONIZATION TEST SUITE');
  console.log('================================================================\n');

  const testUserId = 3; // Renin test user
  const otherUserId = 999999;
  let testSessionId = null;

  try {
    // PREPARATION: Create a test session
    const longActivityName = 'Very Long Breathing Exercise Activity Name Designed To Exceed 150 Characters In Length If Not Properly Truncated By The Controller During The MySQL Insert Operation Into Practice Sessions Table Column';
    const [ins] = await pool.query(`
      INSERT INTO student_practice_sessions (
        user_id, session_number, session_title, activity, planned_duration, status
      ) VALUES (?, 888, 'Sync Test Session', ?, 15, 'planned')
    `, [testUserId, longActivityName]);
    testSessionId = ins.insertId;
    console.log(`Created test session ID: ${testSessionId} with activity length: ${longActivityName.length} chars`);

    // TEST 1: PLANNED -> PRACTISING (Start Doing)
    console.log('\n--- Test 1: PLANNED -> PRACTISING (Start Doing) ---');
    {
      const req = {
        user: { id: testUserId },
        params: { id: String(testSessionId) },
        body: { status: 'practising' }
      };
      let resStatus = null;
      let resJson = null;
      const res = {
        status(s) { resStatus = s; return this; },
        json(j) { resJson = j; return this; }
      };
      const next = (err) => { console.error('Next called with error:', err); };

      await ctrl.updateSessionStatus(req, res, next);
      assert(resStatus === 200, 'HTTP status is 200 OK');
      assert(resJson && resJson.success === true, 'Response JSON success is true');
      assert(resJson && resJson.session.status === 'practising', 'Session status in response is practising');
      assert(resJson && resJson.session.started_at !== null, 'Session started_at timestamp is populated');

      const [dbRow] = await pool.query('SELECT * FROM student_practice_sessions WHERE id = ?', [testSessionId]);
      assert(dbRow[0].status === 'practising', 'Database status persisted as practising');
    }

    // TEST 2: STATUS NORMALIZATION ('in_progress', 'doing', 'completed')
    console.log('\n--- Test 2: Status Normalization ---');
    {
      const req = {
        user: { id: testUserId },
        params: { id: String(testSessionId) },
        body: { status: 'in_progress' } // should normalize to 'practising'
      };
      let resStatus = null;
      let resJson = null;
      const res = {
        status(s) { resStatus = s; return this; },
        json(j) { resJson = j; return this; }
      };
      await ctrl.updateSessionStatus(req, res, () => {});
      assert(resStatus === 200, 'Accepts in_progress and returns 200');
      assert(resJson.session.status === 'practising', 'Normalized in_progress to practising');
    }

    // TEST 3: PRACTISING -> DONE (with long activity name, duration & notes)
    console.log('\n--- Test 3: PRACTISING -> DONE with actual duration & reflection notes ---');
    {
      const req = {
        user: { id: testUserId },
        params: { id: String(testSessionId) },
        body: {
          status: 'completed', // Should normalize to 'done'
          actual_duration: 20,
          notes: 'Felt deep diaphragmatic expansion and great tone sustain.'
        }
      };
      let resStatus = null;
      let resJson = null;
      const res = {
        status(s) { resStatus = s; return this; },
        json(j) { resJson = j; return this; }
      };
      let nextError = null;
      const next = (err) => { nextError = err; };

      await ctrl.updateSessionStatus(req, res, next);
      assert(!nextError, 'No unhandled database exception (no ER_DATA_TOO_LONG)');
      assert(resStatus === 200, 'HTTP status is 200 OK');
      assert(resJson && resJson.success === true, 'Response JSON success is true');
      assert(resJson && resJson.session.status === 'done', 'Session status is done');
      assert(resJson && resJson.session.actual_duration === 20, 'actual_duration is 20');
      assert(resJson && resJson.session.notes === 'Felt deep diaphragmatic expansion and great tone sustain.', 'Reflection notes saved correctly');
      assert(resJson && resJson.session.completed_at !== null, 'completed_at is populated');

      // Verify database persistence
      const [dbRow] = await pool.query('SELECT * FROM student_practice_sessions WHERE id = ?', [testSessionId]);
      assert(dbRow[0].status === 'done', 'Database student_practice_sessions row status is done');
      assert(dbRow[0].actual_duration === 20, 'Database actual_duration persisted as 20');

      // Verify practice_sessions row exists with truncated exercise_name <= 150 chars
      const [psRows] = await pool.query(`
        SELECT * FROM practice_sessions
        WHERE user_id = ? AND session_type = 'Learning Journal'
        ORDER BY id DESC LIMIT 1
      `, [testUserId]);
      assert(psRows.length > 0, 'Row created in practice_sessions table');
      assert(psRows[0].exercise_name.length <= 150, `exercise_name truncated to <= 150 chars (${psRows[0].exercise_name.length} chars)`);
      assert(psRows[0].duration_minutes === 20, 'duration_minutes matches actual_duration');

      // Verify student_practice_activity_completions
      const [actComp] = await pool.query(`
        SELECT * FROM student_practice_activity_completions
        WHERE user_id = ? AND module_id = 1 AND activity_key = 'journal_kanban_tracker'
      `, [testUserId]);
      assert(actComp.length > 0 && actComp[0].completion_status === 'completed', 'journal_kanban_tracker marked as completed in student_practice_activity_completions');
    }

    // TEST 4: IDEMPOTENT COMPLETION (No Duplicate Rows in practice_sessions)
    console.log('\n--- Test 4: Idempotent Completion (Duplicate Request Handling) ---');
    {
      const [beforeCount] = await pool.query(`
        SELECT COUNT(*) as cnt FROM practice_sessions WHERE user_id = ? AND session_type = 'Learning Journal'
      `, [testUserId]);

      const req = {
        user: { id: testUserId },
        params: { id: String(testSessionId) },
        body: {
          status: 'done',
          actual_duration: 25,
          notes: 'Updated reflection notes on retry.'
        }
      };
      let resStatus = null;
      let resJson = null;
      const res = {
        status(s) { resStatus = s; return this; },
        json(j) { resJson = j; return this; }
      };

      await ctrl.updateSessionStatus(req, res, () => {});
      assert(resStatus === 200, 'Idempotent request returns 200 OK');

      const [afterCount] = await pool.query(`
        SELECT COUNT(*) as cnt FROM practice_sessions WHERE user_id = ? AND session_type = 'Learning Journal'
      `, [testUserId]);
      assert(beforeCount[0].cnt === afterCount[0].cnt, `No duplicate row inserted in practice_sessions (${beforeCount[0].cnt} === ${afterCount[0].cnt})`);

      const [updatedSession] = await pool.query('SELECT * FROM student_practice_sessions WHERE id = ?', [testSessionId]);
      assert(updatedSession[0].actual_duration === 25, 'actual_duration safely updated to 25');
      assert(updatedSession[0].notes === 'Updated reflection notes on retry.', 'notes safely updated');
    }

    // TEST 5: MULTI-STUDENT SECURITY ISOLATION
    console.log('\n--- Test 5: Multi-Student Security Isolation ---');
    {
      const req = {
        user: { id: otherUserId }, // Different student
        params: { id: String(testSessionId) },
        body: { status: 'done' }
      };
      let resStatus = null;
      let resJson = null;
      const res = {
        status(s) { resStatus = s; return this; },
        json(j) { resJson = j; return this; }
      };

      await ctrl.updateSessionStatus(req, res, () => {});
      assert(resStatus === 404, 'Unauthorized student cannot update other student session (returns 404)');
      assert(resJson.success === false, 'Response success is false');
    }

    // TEST 6: INVALID STATUS VALIDATION
    console.log('\n--- Test 6: Invalid Status Validation ---');
    {
      const req = {
        user: { id: testUserId },
        params: { id: String(testSessionId) },
        body: { status: 'invalid_status_xyz' }
      };
      let resStatus = null;
      let resJson = null;
      const res = {
        status(s) { resStatus = s; return this; },
        json(j) { resJson = j; return this; }
      };

      await ctrl.updateSessionStatus(req, res, () => {});
      assert(resStatus === 400, 'Invalid status rejected with 400 Bad Request');
      assert(resJson.success === false, 'Response success is false');
    }

    // TEST 7: MODULE COMPLETION SUMMARY PERSISTENCE
    console.log('\n--- Test 7: Module Completion Summary Calculation ---');
    {
      const req = { user: { id: testUserId }, params: { moduleId: '1' } };
      let resStatus = null;
      let resJson = null;
      const res = {
        status(s) { resStatus = s; return this; },
        json(j) { resJson = j; return this; }
      };
      await ctrl.getModuleCompletionSummary(req, res, () => {});
      assert(resStatus === 200, 'getModuleCompletionSummary returns 200 OK');
      assert(resJson.success === true, 'getModuleCompletionSummary success is true');
      assert(typeof resJson.journal.completedSessions === 'number', 'journal metrics include completedSessions count');
      assert(resJson.practice.completedActivities >= 1, 'practice metrics reflect completed journal_kanban_tracker');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failedTests++;
  } finally {
    // CLEANUP
    if (testSessionId) {
      await pool.query('DELETE FROM student_practice_sessions WHERE id = ?', [testSessionId]);
      await pool.query("DELETE FROM practice_sessions WHERE user_id = 3 AND exercise_name LIKE 'Very Long Breathing Exercise%'");
      console.log('\nCleaned up test session and practice records.');
    }
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`🏁 TEST SUITE FINISHED: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
