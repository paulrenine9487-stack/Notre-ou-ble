const express = require('express');
const router = express.Router();
const fiveStageCtrl = require('../controllers/fiveStageLearningController');
const reflectionCtrl = require('../controllers/learningReflectionController');
const authenticateToken = require('../middleware/auth');

// All challenge endpoints require authenticated student
router.use(authenticateToken);

// Stage 04: Breathe Right: Fact or Myth? Endpoints
router.get('/challenges/myth-fact', fiveStageCtrl.getMythFactChallenge);
router.post('/challenges/myth-fact/submit-answer', fiveStageCtrl.submitMythFactAnswer);
router.post('/challenges/myth-fact/complete', fiveStageCtrl.completeMythFactChallenge);
router.get('/challenges/myth-fact/progress', fiveStageCtrl.getMythFactProgress);
router.get('/challenges/myth-fact/results', fiveStageCtrl.getMythFactResults);

// Stage 04: Personal Learning Reflection Pinboard Endpoints
router.get('/reflections', reflectionCtrl.getStudentReflection);
router.post('/reflections', reflectionCtrl.submitStudentReflection);
router.put('/reflections', reflectionCtrl.updateStudentReflection);

module.exports = router;
