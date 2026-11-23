const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practiceController');
const stageFivePracticeCtrl = require('../controllers/stageFivePracticeController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// ============================================================================
// Stage 05: Practice Commitment & Learning Journal Kanban
// ============================================================================
router.get('/commitment', stageFivePracticeCtrl.getCommitment);
router.post('/commitment', stageFivePracticeCtrl.saveCommitment);
router.put('/commitment', stageFivePracticeCtrl.saveCommitment);

router.get('/sessions', stageFivePracticeCtrl.getPracticeSessions);
router.post('/sessions', stageFivePracticeCtrl.addManualSession);
router.put('/sessions/:id/status', stageFivePracticeCtrl.updateSessionStatus);
router.put('/sessions/:id', stageFivePracticeCtrl.updateSessionDetails);

router.post('/activities/:activityKey/complete', stageFivePracticeCtrl.completePracticeActivity);

// ============================================================================
// 1. Practice Sessions (Legacy & General Timer)
// ============================================================================
router.post('/start', practiceController.startSession);
router.post('/pause', practiceController.pauseSession);
router.post('/resume', practiceController.resumeSession);
router.post('/complete', practiceController.recordSession);
router.post('/record', practiceController.recordSession);
router.get('/history', practiceController.getSessions);

// Weekly Statistics & Goals
router.get('/weekly-stats', practiceController.getWeeklyStats);
router.get('/weekly-summary', practiceController.getWeeklyStats);
router.get('/goals', practiceController.getGoal);
router.post('/goals', practiceController.setGoal);

// ============================================================================
// 2. Practice Reflections (Log a Practice Session & Recent Practice)
// ============================================================================
router.post('/reflections', practiceController.createReflection);
router.get('/reflections', practiceController.getReflections);
router.get('/reflections/:id', practiceController.getReflectionById);
router.put('/reflections/:id', practiceController.updateReflection);
router.delete('/reflections/:id', practiceController.deleteReflection);

// ============================================================================
// 3. Personal Practice Diary (Kanban: TO DO, DOING, DONE)
// ============================================================================
router.post('/diary/tasks', practiceController.createDiaryTask);
router.get('/diary/tasks', practiceController.getDiaryTasks);
router.patch('/diary/tasks/reorder', practiceController.reorderDiaryTasks);
router.get('/diary/tasks/linked-learning', practiceController.getLinkedLearningTasks);
router.post('/diary/tasks/from-learning', practiceController.createFromLearningTask);
router.get('/diary/tasks/:id', practiceController.getDiaryTaskById);
router.put('/diary/tasks/:id', practiceController.updateDiaryTask);
router.patch('/diary/tasks/:id/status', practiceController.updateDiaryTaskStatus);
router.delete('/diary/tasks/:id', practiceController.deleteDiaryTask);

// ============================================================================
// 4. Practice Analytics & Insights
// ============================================================================
router.get('/analytics', practiceController.getAnalytics);

module.exports = router;
