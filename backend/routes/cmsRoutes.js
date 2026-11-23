const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { cmsUpload } = require('../middleware/cmsUpload');
const authenticateToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// Public route: User-facing frontend fetches published page content
router.get('/public/:pageSlug', cmsController.getPublicPageSections);

// All subsequent CMS endpoints require Admin or Superadmin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard Statistics
router.get('/stats', cmsController.getCmsDashboardStats);

// Page Sections CRUD
router.get('/sections', cmsController.getAllSections);
router.get('/sections/:id', cmsController.getSectionById);
router.post('/sections', cmsController.createSection);
router.put('/sections/:id', cmsController.updateSection);
router.delete('/sections/:id', cmsController.deleteSection);
router.post('/sections/:id/publish', cmsController.publishSection);
router.post('/sections/:id/unpublish', cmsController.unpublishSection);

// Media Library CRUD
router.get('/media', cmsController.getMediaAssets);
router.post('/media', cmsUpload.single('file'), cmsController.uploadMediaAsset);
router.put('/media/:id', cmsController.updateMediaAsset);
router.delete('/media/:id', cmsController.deleteMediaAsset);

// Modules Management
router.get('/modules', cmsController.getCmsModules);
router.put('/modules/:id', cmsController.updateCmsModule);

// Stages Management
router.get('/stages', cmsController.getCmsStages);
router.put('/stages/:id', cmsController.updateCmsStage);

// Revisions & Rollback
router.get('/revisions', cmsController.getCmsRevisions);
router.post('/revisions/:id/rollback', cmsController.rollbackRevision);

module.exports = router;
