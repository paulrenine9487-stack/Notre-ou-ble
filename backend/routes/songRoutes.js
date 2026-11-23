const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// Song management
router.get('/', songController.getSongs);
router.post('/', songController.createSong);
router.delete('/:id', songController.deleteSong);

// Phrases
router.get('/:songId/phrases', songController.getSongPhrases);
router.post('/:songId/phrases', songController.addPhrase);
router.put('/phrases/:phraseId', songController.updatePhrase);
router.delete('/phrases/:phraseId', songController.deletePhrase);

module.exports = router;
