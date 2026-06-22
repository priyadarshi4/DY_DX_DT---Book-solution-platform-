const express = require('express');
const router = express.Router();
const {
  createTest, updateTest, deleteTest, togglePublish,
  adminGetTests, adminGetSubmissions, adminGetSubmission, evaluateSubmission,
  getTests, getTest, submitTest, getResult, getLeaderboard
} = require('../controllers/testController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/all', protect, adminOnly, adminGetTests);
router.get('/admin/submissions', protect, adminOnly, adminGetSubmissions);
router.get('/admin/submissions/:id', protect, adminOnly, adminGetSubmission);
router.post('/admin/evaluate/:submissionId', protect, adminOnly, evaluateSubmission);

router.post('/', protect, adminOnly, createTest);
router.put('/:id', protect, adminOnly, updateTest);
router.delete('/:id', protect, adminOnly, deleteTest);
router.patch('/:id/publish', protect, adminOnly, togglePublish);

// ─── User routes ──────────────────────────────────────────────────────────────
router.get('/', optionalAuth, getTests);
router.get('/:id/result', protect, getResult);
router.get('/:id/leaderboard', protect, getLeaderboard);
router.get('/:id', protect, getTest);
router.post('/:id/submit', protect, submitTest);

module.exports = router;
