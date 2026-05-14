const express = require('express');
const router = express.Router();
const {
  getSolutions, getSolution, createSolution, updateSolution, deleteSolution, toggleLike
} = require('../controllers/solutionController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

router.get('/', getSolutions);
router.get('/:id', optionalAuth, getSolution);
router.post('/', protect, adminOnly, createSolution);
router.put('/:id', protect, adminOnly, updateSolution);
router.delete('/:id', protect, adminOnly, deleteSolution);
router.post('/:id/like', protect, toggleLike);

module.exports = router;
