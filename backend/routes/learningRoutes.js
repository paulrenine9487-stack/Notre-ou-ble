const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const learningController = require('../controllers/learningController');
const fiveStageCtrl = require('../controllers/fiveStageLearningController');
const reflectionCtrl = require('../controllers/learningReflectionController');
const stageFivePracticeCtrl = require('../controllers/stageFivePracticeController');
const transcriptCtrl = require('../controllers/transcriptController');
const authenticateToken = require('../middleware/auth');
const uploadAudio = require('../middleware/upload');

// Secure authenticated streaming for student recordings (supports Authorization header or ?token= for audio elements)
router.get('/recordings/:recordingId/audio', authenticateToken, fiveStageCtrl.streamRecordingAudio);

router.use(authenticateToken);

// ============================================================================
// STAGE 05 PRACTICE COMMITMENT & MODULE 1 COMPLETION SUMMARY
// ============================================================================
router.get('/stages/unlock-status', stageFivePracticeCtrl.getStagesUnlockStatus);
router.get('/modules/:moduleId/completion-summary', stageFivePracticeCtrl.getModuleCompletionSummary);
router.get('/modules/:moduleId/progress', stageFivePracticeCtrl.getModuleCompletionSummary);
router.get('/1/completion-summary', stageFivePracticeCtrl.getModuleCompletionSummary);
router.get('/1/progress', stageFivePracticeCtrl.getModuleCompletionSummary);

// ============================================================================
// STAGE 04 LEARNING REFLECTION PINBOARD
// ============================================================================
router.get('/reflections/breath-management', reflectionCtrl.getStudentReflection);
router.post('/reflections/breath-management', reflectionCtrl.submitStudentReflection);
router.put('/reflections/breath-management', reflectionCtrl.updateStudentReflection);
router.get('/reflections', reflectionCtrl.getStudentReflection);
router.post('/reflections', reflectionCtrl.submitStudentReflection);
router.put('/reflections', reflectionCtrl.updateStudentReflection);

// ============================================================================
// 5-STAGE BREATH MANAGEMENT LEARNING MODULE ROUTES
// ============================================================================

// 1. Stages & Navigation
router.get('/stages', fiveStageCtrl.getStages);
router.get('/stages/:stageId', fiveStageCtrl.getStageDetails);
router.get('/stages/:stageId/content', fiveStageCtrl.getStageDetails);
router.post('/stages/:stageId/start', fiveStageCtrl.startStage);
router.post('/activity-progress', fiveStageCtrl.recordActivityProgress);

// Stage Objectives (Interactive 3D Flip Cards & Acknowledgement)
router.get('/stages/:stageId/objectives', fiveStageCtrl.getStageObjectives);
router.post('/stages/:stageId/objectives/acknowledge', fiveStageCtrl.acknowledgeStageObjectives);

// 2-Level Learning Modules Navigation Routes
router.get('/modules', fiveStageCtrl.getLearningModules);
router.get('/modules/:moduleId', fiveStageCtrl.getLearningModuleById);
router.get('/modules/:moduleId/progress', fiveStageCtrl.getLearningModuleProgress);
router.get('/modules/:moduleId/stages', fiveStageCtrl.getStages);

// 2. Stage 02 - Stimulate Recall
router.get('/recall/questions', fiveStageCtrl.getRecallQuestions);
router.post('/recall/answers', fiveStageCtrl.saveRecallAnswers);
router.get('/recall/answers', fiveStageCtrl.getRecallAnswers);
router.get('/recall/peer-board', fiveStageCtrl.getPeerPinBoard);
router.get('/recall/peer-board/:questionId', fiveStageCtrl.getPeerPinBoard);

// 3. Stage 03 - Present Content & Part 02 Interactive Practice (Posture, Breathe, Song)
router.get('/videos', fiveStageCtrl.getVideos);
router.get('/stages/:stageId/videos/:videoId/transcript', transcriptCtrl.getStudentTranscript);
router.get('/videos/:videoId/transcript', transcriptCtrl.getStudentTranscript);
router.get('/tips', fiveStageCtrl.getBreathingTips);
router.get('/songs', fiveStageCtrl.getSongs);
router.post('/songs/:songId/practice', fiveStageCtrl.recordSongPractice);

router.get('/stages/:stageId/parts/:partNumber', fiveStageCtrl.getPartSection);
router.get('/parts/:partNumber', fiveStageCtrl.getPartSection);
router.get('/parts/:partNumber/posture', fiveStageCtrl.getPostureTab);
router.get('/parts/:partNumber/breathe', fiveStageCtrl.getBreatheTab);
router.get('/parts/:partNumber/song', fiveStageCtrl.getSongTab);
router.get('/parts/:partNumber/song/levels', fiveStageCtrl.getSongLevels);
router.get('/parts/:partNumber/song/levels/:levelId/score', fiveStageCtrl.getSongScore);
router.post('/parts/:partNumber/song/progress', fiveStageCtrl.saveSongProgress);
router.post('/parts/:partNumber/song/session/start', fiveStageCtrl.startSongSession);
router.post('/parts/:partNumber/song/session/complete', fiveStageCtrl.completeSongSession);
router.get('/parts/:partNumber/song/progress', fiveStageCtrl.getSongProgress);

router.post('/parts/:partNumber/posture/progress', fiveStageCtrl.savePostureProgress);
router.post('/parts/:partNumber/complete', fiveStageCtrl.completePartTab);
router.get('/parts/:partNumber/progress', fiveStageCtrl.getPartProgress);

// Breathing Practice Levels & Sessions (Step 2: Breathe)
router.get('/breathing-levels', fiveStageCtrl.getBreathingLevels);
router.post('/parts/:partNumber/breathe/session', fiveStageCtrl.saveBreathingSession);
router.get('/parts/:partNumber/breathe/sessions', fiveStageCtrl.getBreathingSessions);

// 4. Stage 04 - Assess Performance
router.get('/challenges/myth-fact', fiveStageCtrl.getMythFactChallenge);
router.post('/challenges/myth-fact/submit-answer', fiveStageCtrl.submitMythFactAnswer);
router.post('/challenges/myth-fact/complete', fiveStageCtrl.completeMythFactChallenge);
router.get('/challenges/myth-fact/progress', fiveStageCtrl.getMythFactProgress);
router.get('/challenges/myth-fact/results', fiveStageCtrl.getMythFactResults);

router.get('/challenges', fiveStageCtrl.getChallenges);
router.get('/challenges/:challengeId', fiveStageCtrl.getChallenges);
router.post('/challenges/:challengeId/attempts', fiveStageCtrl.submitChallengeAttempt);
router.get('/challenges/:challengeId/attempts', fiveStageCtrl.getChallenges);

router.post('/assessments', fiveStageCtrl.submitWrittenAssessment);
router.get('/assessments', fiveStageCtrl.getWrittenAssessments);

router.post('/recordings', uploadAudio.single('audio'), fiveStageCtrl.uploadRecording);
router.get('/recordings', fiveStageCtrl.getRecordings);

// 5. Stage 05 - Provide Feedback & Practice Summary
router.post('/feedback', fiveStageCtrl.submitFeedback);
router.get('/feedback', fiveStageCtrl.getFeedback);

router.post('/practice-summary', fiveStageCtrl.submitPracticeSummary);
router.get('/practice-summary', fiveStageCtrl.getPracticeSummary);

// 6. Progress & Dashboard
router.get('/progress/summary', fiveStageCtrl.getProgressSummary);
router.get('/progress', fiveStageCtrl.getProgressSummary);
router.get('/progress/:moduleId', fiveStageCtrl.getProgressSummary);

// 7. Legacy Tasks & Lessons Support (Non-breaking)
router.get('/tasks/:taskId', learningController.getTaskById);
router.post('/tasks/:taskId/start', learningController.startTask);
router.post('/tasks/:taskId/submit', learningController.submitTask);
router.post('/tasks/:taskId/audio', uploadAudio.single('audio'), learningController.uploadAudioTask);
router.get('/tasks/:taskId/submissions', learningController.getTaskSubmissions);
router.get('/tasks/:taskId/score', learningController.getTaskScore);
router.get('/submissions/:submissionId/audio', learningController.streamSubmissionAudio);
router.get('/lessons', learningController.getLessons);
router.post('/complete', learningController.toggleLessonComplete);

module.exports = router;
