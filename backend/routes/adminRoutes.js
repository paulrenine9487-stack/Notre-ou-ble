const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const fiveStageCtrl = require('../controllers/fiveStageLearningController');
const reflectionCtrl = require('../controllers/learningReflectionController');
const stageFivePracticeCtrl = require('../controllers/stageFivePracticeController');
const transcriptCtrl = require('../controllers/transcriptController');
const authenticateToken = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/adminAuth');
const uploadAudio = require('../middleware/upload');
const { cmsUpload } = require('../middleware/cmsUpload');

// Public route to fetch active branding theme for frontend rendering
router.get('/public-theme', adminController.getBrandingTheme);

// All subsequent admin routes require valid authentication
router.use(authenticateToken);

// Common Admin & Superadmin routes (requires at least ADMIN role)
router.use(requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/practice-reports', adminController.getPracticeReports);
router.get('/practice-commitments', stageFivePracticeCtrl.getAdminPracticeCommitments);
router.get('/modules', adminController.getModules);
router.put('/modules/:id', adminController.updateModule);
router.post('/modules', adminController.createModule);
router.post('/activities', adminController.createActivity);
router.get('/theme', adminController.getBrandingTheme);
router.put('/theme', adminController.updateBrandingTheme);

// 5-Stage Breath Management Curriculum Management
router.get('/learning/curriculum', fiveStageCtrl.getCurriculumForAdmin);
router.put('/learning/stages/:stageId', fiveStageCtrl.updateStageForAdmin);
router.post('/learning/content', fiveStageCtrl.createStageContent);
router.put('/learning/content/:id', fiveStageCtrl.updateStageContent);

// Objectives
router.get('/learning/objectives', fiveStageCtrl.getAdminStageObjectives);
router.get('/learning/stages/:stageId/objectives', fiveStageCtrl.getAdminStageObjectives);
router.post('/learning/objectives', fiveStageCtrl.createObjective);
router.put('/learning/objectives/:id', fiveStageCtrl.updateObjective);
router.delete('/learning/objectives/:id', fiveStageCtrl.deleteObjective);

// Recall questions
router.post('/learning/recall/questions', fiveStageCtrl.createRecallQuestion);
router.put('/learning/recall/questions/:id', fiveStageCtrl.updateRecallQuestion);
router.delete('/learning/recall/questions/:id', fiveStageCtrl.deleteRecallQuestion);

// Breathing tips
router.post('/learning/tips', fiveStageCtrl.createTip);
router.put('/learning/tips/:id', fiveStageCtrl.updateTip);
router.delete('/learning/tips/:id', fiveStageCtrl.deleteTip);

// Songs
router.post('/learning/songs', fiveStageCtrl.createSong);
router.put('/learning/songs/:id', fiveStageCtrl.updateSong);
router.delete('/learning/songs/:id', fiveStageCtrl.deleteSong);

// Challenges
router.post('/learning/challenges', fiveStageCtrl.createChallenge);
router.put('/learning/challenges/:id', fiveStageCtrl.updateChallenge);
router.delete('/learning/challenges/:id', fiveStageCtrl.deleteChallenge);

// Student Submissions & Grading
router.get('/learning/student-submissions', fiveStageCtrl.getStudentSubmissionsForAdmin);
router.post('/learning/assessments/:id/grade', fiveStageCtrl.gradeWrittenAssessment);

// Stage 03 Part 02 Interactive Practice Admin Management
router.get('/learning/parts/:partId', fiveStageCtrl.adminGetPartSection);
router.put('/learning/parts/:partId', fiveStageCtrl.adminUpdatePartSection);
router.put('/learning/parts/:partId/tabs/:tabKey', fiveStageCtrl.adminUpdatePartTab);
router.post('/learning/parts/:partId/indicators', fiveStageCtrl.adminCreatePostureIndicator);
router.put('/learning/indicators/:id', fiveStageCtrl.adminUpdatePostureIndicator);
router.delete('/learning/indicators/:id', fiveStageCtrl.adminDeletePostureIndicator);
router.post('/learning/parts/:partId/checklist', fiveStageCtrl.adminCreatePostureChecklistItem);
router.put('/learning/checklist/:id', fiveStageCtrl.adminUpdatePostureChecklistItem);
router.delete('/learning/checklist/:id', fiveStageCtrl.adminDeletePostureChecklistItem);

// Breathing Practice Levels Admin Configuration (Beginner / Intermediate / Advanced)
router.get('/learning/breathing-levels', fiveStageCtrl.adminGetBreathingLevels);
router.put('/learning/breathing-levels/:level_key', fiveStageCtrl.adminUpdateBreathingLevel);

// Song Practice Module Admin Management (Step 3: Song)
router.get('/song-practice', fiveStageCtrl.adminGetSongPractice);
router.post('/song-practice', fiveStageCtrl.adminUpdateSongPractice);
router.put('/song-practice', fiveStageCtrl.adminUpdateSongPractice);
router.post('/song-practice/audio', uploadAudio.single('audio'), fiveStageCtrl.adminUploadSongAudio);
router.post('/song-practice/levels/:levelId/score', cmsUpload.single('score_file'), fiveStageCtrl.adminUploadSongScore);
router.put('/song-practice/levels/:levelId/score', cmsUpload.single('score_file'), fiveStageCtrl.adminUploadSongScore);
router.put('/song-practice/levels/:levelId/markers', fiveStageCtrl.adminUpdateSongMarkers);
router.get('/song-practice/students', fiveStageCtrl.adminGetStudentSongProgressList);
router.delete('/song-practice/students/:userId', fiveStageCtrl.adminResetStudentSongProgress);

// Stage 04: Breathe Right: Fact or Myth? Admin Management
router.get('/myth-fact/questions', fiveStageCtrl.adminGetMythFactQuestions);
router.put('/myth-fact/questions/:id', fiveStageCtrl.adminUpdateMythFactQuestion);
router.post('/myth-fact/questions', fiveStageCtrl.adminCreateMythFactQuestion);
router.delete('/myth-fact/questions/:id', fiveStageCtrl.adminDeleteMythFactQuestion);
router.get('/myth-fact/student-results', fiveStageCtrl.adminGetMythFactStudentResults);
router.delete('/myth-fact/student-results/:userId', fiveStageCtrl.adminResetStudentMythFact);

// Stage 04: Learning Reflection Pinboard Admin Management
router.get('/learning-reflections', reflectionCtrl.adminGetReflections);
router.delete('/learning-reflections/:userId', reflectionCtrl.adminResetStudentReflection);

// Video Transcript Management (Admin & Superadmin)
router.get('/transcripts/videos', transcriptCtrl.adminGetVideos);
router.get('/transcripts/by-video/:videoId', transcriptCtrl.adminGetTranscriptByVideo);
router.post('/transcripts/generate-draft', transcriptCtrl.adminGenerateDraftTranscript);
router.get('/transcripts', transcriptCtrl.adminGetTranscripts);
router.get('/transcripts/:id', transcriptCtrl.adminGetTranscriptById);
router.post('/transcripts', transcriptCtrl.adminCreateTranscript);
router.put('/transcripts/:id', transcriptCtrl.adminUpdateTranscript);
router.delete('/transcripts/:id', transcriptCtrl.adminDeleteTranscript);

// Superadmin-only restricted routes
router.get('/users', requireSuperAdmin, adminController.getUsers);
router.post('/users', requireSuperAdmin, adminController.createAdminUser);
router.put('/users/:id/role', requireSuperAdmin, adminController.updateUserRole);
router.get('/audit-logs', requireSuperAdmin, adminController.getAuditLogs);
router.get('/security-logs', requireSuperAdmin, adminController.getSecurityAuditLogs);

module.exports = router;
