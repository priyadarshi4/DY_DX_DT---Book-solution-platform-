const express = require('express');
const router = express.Router();
const { getStats, getUsers, toggleUserStatus } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUserStatus);

module.exports = router;
