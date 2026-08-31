const express = require('express');
const router = express.Router();
const { protect, requireDriver } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  addVehicle,
  uploadVehiclePhotos,
  getVehicles,
  getVehicleById,
  updateVehicle,
  getMyVehicles,
} = require('../controllers/vehicleController');

router.get('/', protect, getVehicles);
router.post('/', protect, requireDriver, addVehicle);
router.get('/my-vehicles', protect, requireDriver, getMyVehicles);
router.get('/:id', protect, getVehicleById);
router.patch('/:id', protect, requireDriver, updateVehicle);
router.post('/:id/photos', protect, requireDriver, (req, res, next) => {
  req.uploadFolder = 'vehicles';
  next();
}, upload.array('photos', 6), uploadVehiclePhotos);

module.exports = router;
