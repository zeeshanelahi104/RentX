const express = require('express');
const router = express.Router();
const { protect, requireDriver } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  onboardDriver,
  updateDriverProfile,
  uploadDocs,
  getMyDriverProfile,
  toggleOnline,
  updateLocation,
  getDriverById,
  getEarnings,
  getSubscriptionStatus,
  initiateSubscriptionPayment,
} = require('../controllers/driverController');

router.post('/onboard', protect, onboardDriver);
router.patch('/profile', protect, requireDriver, updateDriverProfile);
router.get('/subscription', protect, requireDriver, getSubscriptionStatus);
router.post('/subscription/pay', protect, requireDriver, initiateSubscriptionPayment);

router.post('/upload-docs', protect, (req, res, next) => {
  req.uploadFolder = 'driver_docs';
  next();
}, upload.fields([
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 },
  { name: 'license', maxCount: 1 },
]), uploadDocs);

router.get('/me', protect, requireDriver, getMyDriverProfile);
router.patch('/toggle-online', protect, requireDriver, toggleOnline);
router.patch('/location', protect, requireDriver, updateLocation);
router.get('/earnings/summary', protect, requireDriver, getEarnings);
router.get('/:id', protect, getDriverById);

module.exports = router;
