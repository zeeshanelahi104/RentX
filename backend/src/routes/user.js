const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { getProfile, updateProfile, uploadProfilePhoto } = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.post('/profile-photo', protect, (req, res, next) => {
  req.uploadFolder = 'profiles';
  next();
}, upload.single('photo'), uploadProfilePhoto);

module.exports = router;
