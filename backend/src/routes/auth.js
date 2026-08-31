const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  googleAuth,
  completeProfile,
  updateFCMToken,
  getMe,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.patch('/complete-profile', protect, completeProfile);
router.patch('/fcm-token', protect, updateFCMToken);
router.get('/me', protect, getMe);

module.exports = router;
