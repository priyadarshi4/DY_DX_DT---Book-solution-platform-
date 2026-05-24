const express = require('express');
const router = express.Router();
const { getComments, addComment, deleteComment, getRecentComments } = require('../controllers/commentController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/recent', protect, adminOnly, getRecentComments);
router.get('/:solutionId', getComments);
router.post('/:solutionId', protect, addComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
