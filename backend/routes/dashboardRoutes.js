const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/overview', dashboardController.getOverview);
router.get('/practice-summary', dashboardController.getPracticeSummary);
router.get('/learning-summary', dashboardController.getLearningSummary);
router.get('/task-performance', dashboardController.getTaskPerformance);
router.get('/recent-activity', dashboardController.getRecentActivity);

module.exports = router;
