const Driver = require('../models/Driver');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// POST /api/drivers/onboard
const onboardDriver = async (req, res, next) => {
  try {
    const { cnicNumber, licenseNumber, city, bio } = req.body;
    const userId = req.user._id;

    const existing = await Driver.findOne({ userId });
    if (existing) return res.status(400).json({ success: false, message: 'Driver profile already exists' });

    const driver = await Driver.create({
      userId,
      cnicNumber,
      licenseNumber,
      city,
      bio,
      verificationStatus: 'pending',
    });

    await User.findByIdAndUpdate(userId, { role: 'driver' });

    res.status(201).json({ success: true, driver });
  } catch (err) {
    next(err);
  }
};

// POST /api/drivers/upload-docs
const uploadDocs = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    const updates = {};
    if (req.files?.cnicFront) updates.cnicFrontPhoto = req.files.cnicFront[0].path;
    if (req.files?.cnicBack) updates.cnicBackPhoto = req.files.cnicBack[0].path;
    if (req.files?.license) updates.licensePhoto = req.files.license[0].path;

    if (Object.keys(updates).length > 0) {
      const hasAllDocs = (updates.cnicFrontPhoto || driver.cnicFrontPhoto) &&
        (updates.cnicBackPhoto || driver.cnicBackPhoto);
      if (hasAllDocs) updates.verificationStatus = 'under_review';
    }

    const updated = await Driver.findByIdAndUpdate(driver._id, updates, { new: true });
    res.json({ success: true, driver: updated });
  } catch (err) {
    next(err);
  }
};

// GET /api/drivers/me
const getMyDriverProfile = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id }).populate('vehicles');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });
    res.json({ success: true, driver });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/drivers/toggle-online
const toggleOnline = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    if (!driver.isVerified) return res.status(403).json({ success: false, message: 'Driver not verified yet' });

    driver.isOnline = !driver.isOnline;
    await driver.save();

    res.json({ success: true, isOnline: driver.isOnline });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/drivers/location
const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    await Driver.findOneAndUpdate(
      { userId: req.user._id },
      { currentLocation: { type: 'Point', coordinates: [lng, lat] } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/drivers/:id
const getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('userId', 'name phone rating profilePhoto')
      .populate('vehicles');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, driver });
  } catch (err) {
    next(err);
  }
};

// GET /api/drivers/earnings/summary
const getEarnings = async (req, res, next) => {
  try {
    const Booking = require('../models/Booking');
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayEarnings, monthEarnings, totalCompleted] = await Promise.all([
      Booking.aggregate([
        { $match: { driverId: driver._id, status: 'completed', completedAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$driverEarning' } } },
      ]),
      Booking.aggregate([
        { $match: { driverId: driver._id, status: 'completed', completedAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: '$driverEarning' } } },
      ]),
      Booking.countDocuments({ driverId: driver._id, status: 'completed' }),
    ]);

    res.json({
      success: true,
      earnings: {
        today: todayEarnings[0]?.total || 0,
        thisMonth: monthEarnings[0]?.total || 0,
        total: driver.totalEarnings,
        totalTrips: totalCompleted,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  onboardDriver,
  uploadDocs,
  getMyDriverProfile,
  toggleOnline,
  updateLocation,
  getDriverById,
  getEarnings,
};
