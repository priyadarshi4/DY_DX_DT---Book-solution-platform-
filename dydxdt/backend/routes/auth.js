const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, signupValidation, loginValidation } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

module.exports = router;
