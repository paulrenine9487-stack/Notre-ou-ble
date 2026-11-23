const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authenticateToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// All teacher endpoints require authentication and admin/teacher permissions
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/submissions', teacherController.getSubmissions);
router.get('/submissions/:submissionId', teacherController.getSubmissionById);
router.post('/submissions/:submissionId/assess', teacherController.assessSubmission);
router.post('/submissions/:submissionId/request-revision', teacherController.requestRevision);

module.exports = router;
