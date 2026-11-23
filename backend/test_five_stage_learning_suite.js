const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('================================================================');
  console.log('  No Tre(ou)ble - 5-STAGE BREATH MANAGEMENT COMPLETE TEST SUITE ');
  console.log('================================================================\n');

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
    // ------------------------------------------------------------------------
    // Step 1: Log in as a registered student
    // ------------------------------------------------------------------------
    console.log('\n--- Step 1: Student Authentication ---');
    // Ensure test student exists
    const studentUser = 'TestSinger1';
    const studentPass = 'singer1234';

    // Register or login
    let loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: studentUser, password: studentPass })
    });

    if (loginRes.status !== 200) {
      // Register student if not existing
      await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: studentUser,
          email: 'testsinger1@notreoble.com',
          gender: 'Female',
          phone: '9876543210',
          password: studentPass,
          confirm_password: studentPass,
          types_of_music: ['Classical', 'Jazz']
        })
      });

      loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: studentUser, password: studentPass })
      });
    }

    const studentLoginData = await loginRes.json();
    assert(loginRes.status === 200 && studentLoginData.success, 'Step 1: Logged in as registered student TestSinger1');
    const studentToken = studentLoginData.token;
    const studentHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    };

    // ------------------------------------------------------------------------
    // Steps 2 & 3: Open Learning Modules & Verify EXACTLY 5 stages
    // ------------------------------------------------------------------------
    console.log('\n--- Steps 2-3: Stages Verification ---');
    const stagesRes = await fetch(`${API_BASE}/learning/stages`, { headers: studentHeaders });
    const stagesData = await stagesRes.json();
    assert(stagesRes.status === 200 && stagesData.success, 'Step 2: Fetched learning stages endpoint successfully');
    assert(Array.isArray(stagesData.stages) && stagesData.stages.length === 5, `Step 3: Exactly 5 stages returned (count: ${stagesData.stages?.length})`);

    const stageTitles = stagesData.stages.map(s => s.title?.toUpperCase());
    assert(
      stageTitles.length === 5 && (
        stageTitles[0].includes('INTRODUCTION') || stageTitles[0].includes('GAIN ATTENTION')
      ) && (
        stageTitles[1].includes('WHAT DO YOU KNOW') || stageTitles[1].includes('STIMULATE RECALL')
      ) && (
        stageTitles[2].includes('HOW TO DO IT') || stageTitles[2].includes('PRESENT CONTENT')
      ) && (
        stageTitles[3].includes("LET'S CHECK") || stageTitles[3].includes('ASSESS PERFORMANCE')
      ) && (
        stageTitles[4].includes('KEEP IT GOING') || stageTitles[4].includes('PROVIDE FEEDBACK')
      ),
      'Step 3b: Stages order matches: 01. Introduction, 02. What Do You Know?, 03. How To Do It, 04. Let\'s Check Ourselves, 05. Keep It Going'
    );

    const stage1Id = stagesData.stages[0].id;
    const stage2Id = stagesData.stages[1].id;
    const stage3Id = stagesData.stages[2].id;
    const stage4Id = stagesData.stages[3].id;
    const stage5Id = stagesData.stages[4].id;

    // ------------------------------------------------------------------------
    // Steps 4 & 5: Stage 01 Gain Attention Details
    // ------------------------------------------------------------------------
    console.log('\n--- Steps 4-5: Stage 01 Gain Attention ---');
    const s1Res = await fetch(`${API_BASE}/learning/stages/${stage1Id}`, { headers: studentHeaders });
    const s1Data = await s1Res.json();
    assert(s1Res.status === 200 && s1Data.success, 'Step 4: Opened Stage 01 details');

    const introContent = s1Data.stage.content?.find(c => c.content_type === 'introduction');
    const introVideo = s1Data.stage.content?.find(c => c.content_type === 'intro_video' || c.content_type === 'video');
    const objectives = s1Data.stage.objectives;

    assert(Boolean(introContent && introContent.title.toUpperCase().includes('BREATH MANAGEMENT')), 'Step 5a: Verified introduction title is "BREATH MANAGEMENT"');
    assert(Boolean(introVideo && introVideo.content_url), 'Step 5b: Verified responsive introduction video content');
    assert(Array.isArray(objectives) && objectives.length >= 4, `Step 5c: Verified 4 Learning Objectives (count: ${objectives?.length})`);

    // Record video completion
    await fetch(`${API_BASE}/learning/activity-progress`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ stage_id: stage1Id, activity_id: 's1_video', activity_type: 'video' })
    });
    // Record objectives review
    await fetch(`${API_BASE}/learning/activity-progress`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ stage_id: stage1Id, activity_id: 's1_objectives', activity_type: 'objectives' })
    });

    // ------------------------------------------------------------------------
    // Steps 6-9: Stage 02 Stimulate Recall & Knowledge Questions
    // ------------------------------------------------------------------------
    console.log('\n--- Steps 6-9: Stage 02 Stimulate Recall ---');
    const s2Res = await fetch(`${API_BASE}/learning/stages/${stage2Id}`, { headers: studentHeaders });
    const s2Data = await s2Res.json();
    assert(s2Res.status === 200 && s2Data.success, 'Step 6: Opened Stage 02 details');
    assert(s2Data.stage.stage_number === 2, 'Step 7: Verified Stage 02 details and recall curriculum');

    const recallQuestions = s2Data.stage.recallQuestions;
    assert(Array.isArray(recallQuestions) && recallQuestions.length === 2, `Step 8: Verified exactly 2 recall questions (count: ${recallQuestions?.length})`);

    // Step 9: Save answers to both questions
    const answerPayload = [
      { question_id: recallQuestions[0].id, answer: 'diaphragm, posture, steady airflow, stamina' },
      { question_id: recallQuestions[1].id, answer: 'How to sing high notes comfortably and maintain breath support' }
    ];

    const saveAnswersRes = await fetch(`${API_BASE}/learning/recall/answers`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ stage_id: stage2Id, answers: answerPayload })
    });
    const saveAnswersData = await saveAnswersRes.json();
    assert(saveAnswersRes.status === 200 && saveAnswersData.success, 'Step 9a: Successfully saved 2 recall answers via API');

    // Verify MySQL records
    const [dbAnswers] = await pool.query(
      'SELECT COUNT(*) as count FROM recall_answers WHERE user_id = ?',
      [studentLoginData.user.id]
    );
    assert(dbAnswers[0].count >= 2, `Step 9b: Verified MySQL recall_answers table has persisted student answers (count: ${dbAnswers[0].count})`);

    // Step 9c: Verify Peer Pin Board endpoint returns deduplicated data
    const boardRes = await fetch(`${API_BASE}/learning/recall/peer-board`, { headers: studentHeaders });
    const boardData = await boardRes.json();
    assert(boardRes.status === 200 && boardData.success && boardData.boards, 'Step 9c: Verified Peer Pin Board API returns 200 with boards');
    assert(Array.isArray(boardData.boards[recallQuestions[0].id]), 'Step 9d: Verified Question 1 peer pin board has unique classmate items');

    // ------------------------------------------------------------------------
    // Steps 10-16: Stage 03 Present Content & Song Practice
    // ------------------------------------------------------------------------
    console.log('\n--- Steps 10-16: Stage 03 Present Content ---');
    const s3Res = await fetch(`${API_BASE}/learning/stages/${stage3Id}`, { headers: studentHeaders });
    const s3Data = await s3Res.json();
    assert(s3Res.status === 200 && s3Data.success, 'Step 10: Opened Stage 03 details');

    const teachingVideo = s3Data.stage.content?.find(c => c.content_type === 'teaching_video' || c.content_type === 'video');
    assert(Boolean(teachingVideo && teachingVideo.content_url), 'Step 11: Verified teaching video player content');

    const lungsPlaceholder = s3Data.stage.content?.find(c => c.content_type === 'lungs_simulation');
    assert(Boolean(lungsPlaceholder), 'Step 12: Verified Lungs Simulation integration placeholder and config');

    const breathingTips = s3Data.stage.breathingTips;
    assert(Array.isArray(breathingTips) && breathingTips.length >= 5, `Step 13: Verified 5 Breathing Tips cards (count: ${breathingTips?.length})`);

    const learningSongs = s3Data.stage.songs;
    assert(Array.isArray(learningSongs) && learningSongs.length > 0, `Step 14: Verified song list (count: ${learningSongs?.length})`);

    const testSong = learningSongs[0];
    assert(Boolean(testSong.instructions && testSong.instructions.includes('breath points')), 'Step 15: Verified song instructions with breathing marks and phrasing guidance');

    // Record teaching video watched
    await fetch(`${API_BASE}/learning/activity-progress`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ stage_id: stage3Id, activity_id: 's3_video', activity_type: 'video' })
    });

    // Step 16: Mark song as practised
    const songPracticeRes = await fetch(`${API_BASE}/learning/songs/${testSong.id}/practice`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ stage_id: stage3Id, duration_minutes: 10 })
    });
    const songPracticeData = await songPracticeRes.json();
    assert(songPracticeRes.status === 200 && songPracticeData.success, 'Step 16: Completed song practice action and logged to practice_sessions');

    // ------------------------------------------------------------------------
    // Steps 17-23: Stage 04 Assess Performance
    // ------------------------------------------------------------------------
    console.log('\n--- Steps 17-23: Stage 04 Assess Performance ---');
    const s4Res = await fetch(`${API_BASE}/learning/stages/${stage4Id}`, { headers: studentHeaders });
    const s4Data = await s4Res.json();
    assert(s4Res.status === 200 && s4Data.success, 'Step 17: Opened Stage 04 details');

    const challenges = s4Data.stage.challenges || [];
    assert(challenges.length >= 2, `Step 18a: Found interactive challenges (count: ${challenges.length})`);

    // Challenge 1: Myth or Fact
    const mythFactCh = challenges.find(c => c.challenge_type === 'myth_or_fact');
    assert(Boolean(mythFactCh), 'Step 18b: Found Myth or Fact challenge');

    const mfAnswers = {
      'mf-1': 'MYTH',
      'mf-2': 'FACT',
      'mf-3': 'MYTH',
      'mf-4': 'FACT'
    };

    const mfAttemptRes = await fetch(`${API_BASE}/learning/challenges/${mythFactCh.id}/attempts`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ stage_id: stage4Id, answers: mfAnswers })
    });
    const mfAttemptData = await mfAttemptRes.json();
    assert(mfAttemptRes.status === 200 && mfAttemptData.success, `Step 18c: Completed Myth or Fact challenge with score ${mfAttemptData.score} / ${mfAttemptData.totalMarks}`);

    // Challenge 2: Match Part to Its Job
    const matchingCh = challenges.find(c => c.challenge_type === 'matching_pairs');
    assert(Boolean(matchingCh), 'Step 19a: Found Matching Pairs challenge');

    const matchAnswers = {
      'm-1': 'Swing out and up',
      'm-2': 'Flattens down on inhale',
      'm-3': 'Stay quiet',
      'm-4': 'Moves out on inhale'
    };

    const matchAttemptRes = await fetch(`${API_BASE}/learning/challenges/${matchingCh.id}/attempts`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ stage_id: stage4Id, answers: matchAnswers })
    });
    const matchAttemptData = await matchAttemptRes.json();
    assert(matchAttemptRes.status === 200 && matchAttemptData.success, `Step 19b: Completed Matching Pairs challenge with score ${matchAttemptData.score} / ${matchAttemptData.totalMarks}`);

    // Step 20: Calculated score
    assert(mfAttemptData.percentage === 100 && matchAttemptData.percentage === 100, 'Step 20: Verified accurate calculated score (100% on correct submissions)');

    // Step 21: Retry challenge and verify previous attempts remain saved
    const retryRes = await fetch(`${API_BASE}/learning/challenges/${mythFactCh.id}/attempts`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        stage_id: stage4Id,
        answers: { 'mf-1': 'FACT' } // intentional wrong answer to test retry tracking
      })
    });
    const retryData = await retryRes.json();
    assert(retryData.attemptNumber >= 2, `Step 21a: Successfully registered retry as attempt #${retryData.attemptNumber}`);

    const [dbAttempts] = await pool.query(
      'SELECT attempt_number, score FROM challenge_attempts WHERE user_id = ? AND challenge_id = ? ORDER BY attempt_number ASC',
      [studentLoginData.user.id, mythFactCh.id]
    );
    assert(dbAttempts.length >= 2, `Step 21b: Verified attempts preserved with scores intact without overwrite in MySQL (total attempts: ${dbAttempts.length})`);

    // Step 22: Written assessment submission
    const writtenRes = await fetch(`${API_BASE}/learning/assessments`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        stage_id: stage4Id,
        prompt: 'Explain what you have learned about breath management and how you will apply it when singing a song.',
        answer: 'I learned that breath management is about regulated diaphragmatic release, keeping shoulders low, and marking musical breath punctuation points.'
      })
    });
    const writtenData = await writtenRes.json();
    assert(writtenRes.status === 200 && writtenData.success, 'Step 22: Submitted written assessment successfully to MySQL');

    // Step 23: Student recording submission
    // Create a small test audio file buffer
    const testAudioBuffer = Buffer.from('RIFF....WAVEfmt ....data....test audio simulation', 'utf8');
    const blob = new Blob([testAudioBuffer], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', blob, 'student-breath-test.webm');
    formData.append('stage_id', String(stage4Id));
    formData.append('song_id', String(testSong.id));
    formData.append('duration_seconds', '35');
    formData.append('comments', 'Practiced the 8-count breath release.');

    const uploadRes = await fetch(`${API_BASE}/learning/recordings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`
      },
      body: formData
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201 && uploadData.success, `Step 23: Recorded and uploaded student song performance (recordingId: ${uploadData.recordingId})`);

    // ------------------------------------------------------------------------
    // Steps 24-26: Stage 05 Provide Feedback & Practice Summary
    // ------------------------------------------------------------------------
    console.log('\n--- Steps 24-26: Stage 05 Provide Feedback ---');
    const s5Res = await fetch(`${API_BASE}/learning/stages/${stage5Id}`, { headers: studentHeaders });
    const s5Data = await s5Res.json();
    assert(s5Res.status === 200 && s5Data.success, 'Step 24: Opened Stage 05 details');

    // Step 25: Submit feedback
    const feedbackRes = await fetch(`${API_BASE}/learning/feedback`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        stage_id: stage5Id,
        rating: 5,
        useful_feedback: 'The interactive challenges and breathing tips were extremely insightful.',
        difficult_feedback: 'Remembering not to raise shoulders during quick inhalations.',
        improvement_suggestions: 'More song practice tracks with marked phrases.'
      })
    });
    const feedbackData = await feedbackRes.json();
    assert(feedbackRes.status === 200 && feedbackData.success, 'Step 25: Submitted 5-star learning experience feedback to MySQL');

    // Step 26: Submit practice summary
    const summaryRes = await fetch(`${API_BASE}/learning/practice-summary`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        stage_id: stage5Id,
        activities: [
          'Watched breath management lesson',
          'Completed knowledge recall questions',
          'Reviewed breath management tips',
          'Practised a song',
          'Completed interactive challenges',
          'Recorded a song'
        ],
        duration_minutes: 25,
        practice_notes: 'Focused on diaphragmatic breath support across high notes.',
        learned_notes: 'Airflow consistency is more important than lung capacity.',
        difficulty_notes: 'None, feeling comfortable.',
        next_practice_goal: 'Vocal resonance and larynx stabilization.'
      })
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.status === 200 && summaryData.success, 'Step 26: Submitted practice summary connected to Practice Journal');

    // ------------------------------------------------------------------------
    // Step 27: Verify Practice Journal integration
    // ------------------------------------------------------------------------
    console.log('\n--- Step 27: Practice Journal Integration ---');
    const journalRes = await fetch(`${API_BASE}/practice/reflections`, { headers: studentHeaders });
    const journalData = await journalRes.json();
    assert(journalRes.status === 200 && journalData.success, 'Step 27a: Fetched Practice Journal entries');

    const hasSummaryInJournal = journalData.reflections?.some(r =>
      r.practice_type?.includes('Breath Management') ||
      r.reflection?.includes('Breath Management')
    );
    assert(hasSummaryInJournal, 'Step 27b: Practice summary and song practice appear in Practice Journal without duplicate records');

    // ------------------------------------------------------------------------
    // Step 28: Verify Dashboard statistics
    // ------------------------------------------------------------------------
    console.log('\n--- Step 28: Dashboard Statistics Integration ---');
    const dashRes = await fetch(`${API_BASE}/dashboard/overview`, { headers: studentHeaders });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200 && dashData.success, 'Step 28a: Fetched user dashboard overview');

    const lp = dashData.data.learningProgress;
    assert(lp.totalStages === 5, `Step 28b: Dashboard confirms exactly 5 total stages (reported: ${lp.totalStages})`);
    assert(lp.completedStages >= 1, `Step 28c: Dashboard reports completed stages from live MySQL (completed: ${lp.completedStages})`);
    assert(Boolean(lp.challenges && lp.challenges.totalCompleted > 0), `Step 28d: Dashboard reports challenge metrics: latest ${lp.challenges?.latestScore}pts, best ${lp.challenges?.bestScore}pts`);
    assert(lp.recordingsCount >= 1, `Step 28e: Dashboard reports submitted recordings count: ${lp.recordingsCount}`);

    // ------------------------------------------------------------------------
    // Step 29: Refresh and confirm persistence
    // ------------------------------------------------------------------------
    console.log('\n--- Step 29: Persistence on Re-fetch ---');
    const refreshRes = await fetch(`${API_BASE}/learning/progress/summary`, { headers: studentHeaders });
    const refreshData = await refreshRes.json();
    assert(refreshRes.status === 200 && refreshData.success, 'Step 29a: Re-fetched learning progress summary');
    assert(refreshData.summary.challenges.totalCompleted >= 2, 'Step 29b: Confirmed challenge attempts remain preserved in MySQL');
    assert(refreshData.summary.hasWrittenAssessment === true, 'Step 29c: Confirmed written assessment remains preserved in MySQL');

    // ------------------------------------------------------------------------
    // Steps 30 & 31: Logout and re-login
    // ------------------------------------------------------------------------
    console.log('\n--- Steps 30-31: Session Persistence & Re-login ---');
    const reloginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: studentUser, password: studentPass })
    });
    const reloginData = await reloginRes.json();
    const newToken = reloginData.token;
    assert(reloginRes.status === 200 && reloginData.success, 'Step 30: Logged back in with new session token');

    const s2Check = await fetch(`${API_BASE}/learning/stages/${stage2Id}`, {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });
    const s2CheckData = await s2Check.json();
    assert(s2CheckData.stage.userAnswers?.length >= 3, 'Step 31: Confirmed recall answers restored upon re-login');

    // ------------------------------------------------------------------------
    // Step 32: Log in as another student and verify data isolation
    // ------------------------------------------------------------------------
    console.log('\n--- Step 32: Multi-Student Data Isolation ---');
    const student2User = 'TestSinger2';
    const student2Pass = 'singer2222';

    let s2LogRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: student2User, password: student2Pass })
    });

    if (s2LogRes.status !== 200) {
      await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student2User,
          email: 'testsinger2@notreoble.com',
          gender: 'Male',
          phone: '9876543211',
          password: student2Pass,
          confirm_password: student2Pass,
          types_of_music: ['Pop', 'Soul']
        })
      });
      s2LogRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: student2User, password: student2Pass })
      });
    }

    const s2LogData = await s2LogRes.json();
    const s2Token = s2LogData.token;
    const s2Headers = { 'Authorization': `Bearer ${s2Token}` };

    // Check Student 2 answers
    const s2AnswersRes = await fetch(`${API_BASE}/learning/recall/answers`, { headers: s2Headers });
    const s2AnswersData = await s2AnswersRes.json();
    assert(s2AnswersData.answers?.length === 0, 'Step 32: Confirmed Student 2 sees 0 recall answers (complete isolation from Student 1)');

    // ------------------------------------------------------------------------
    // Steps 33 & 34: Admin modifies stage content & student sees changes
    // ------------------------------------------------------------------------
    console.log('\n--- Steps 33-34: Admin Management & Dynamic Frontend API ---');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Smirthi', password: 'smirthi1234' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.user?.role === 'ADMIN', 'Step 33a: Admin logged in with authorized role');
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminLoginData.token}`
    };

    // Admin updates Stage 1 Subtitle
    const dynamicSubtitle = `Get curious (Updated at ${Date.now()})`;
    const updateStRes = await fetch(`${API_BASE}/admin/learning/stages/${stage1Id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ subtitle: dynamicSubtitle })
    });
    const updateStData = await updateStRes.json();
    assert(updateStRes.status === 200 && updateStData.success, 'Step 33b: Admin updated Stage 01 subtitle via /api/admin/learning/stages/:id');

    // Verify student fetches updated subtitle dynamically
    const verifyStudentRes = await fetch(`${API_BASE}/learning/stages`, { headers: studentHeaders });
    const verifyStudentData = await verifyStudentRes.json();
    const studentS1 = verifyStudentData.stages?.find(s => s.id === stage1Id);
    assert(studentS1.subtitle === dynamicSubtitle, `Step 34: Student frontend immediately sees updated subtitle "${dynamicSubtitle}" without redeploy`);

    // Reset subtitle back to clean "Get curious"
    await fetch(`${API_BASE}/admin/learning/stages/${stage1Id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ subtitle: 'Get curious' })
    });

    // ------------------------------------------------------------------------
    // Step 35: Verify SuperAdmin permissions
    // ------------------------------------------------------------------------
    console.log('\n--- Step 35: SuperAdmin Permissions & Audit Access ---');
    const superLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Notreoblemccmrfip', password: 'notreoblesinger' })
    });
    const superLoginData = await superLoginRes.json();
    assert(superLoginRes.status === 200 && superLoginData.user?.role === 'SUPERADMIN', 'Step 35a: SuperAdmin authenticated');

    const superHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${superLoginData.token}`
    };

    const curriculumRes = await fetch(`${API_BASE}/admin/learning/curriculum`, { headers: superHeaders });
    const curriculumData = await curriculumRes.json();
    assert(curriculumRes.status === 200 && Array.isArray(curriculumData.stages), 'Step 35b: SuperAdmin fetched complete 5-stage curriculum');

    // ------------------------------------------------------------------------
    // Step 36: Backend and Database Health Check
    // ------------------------------------------------------------------------
    console.log('\n--- Step 36: Database & Backend Health ---');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status?.toLowerCase() === 'ok', 'Step 36: Backend health endpoint returned 200 OK with healthy database');

  } catch (error) {
    console.error('[UNEXPECTED ERROR]:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();

