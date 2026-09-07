const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');

// POST /api/vehicles
const addVehicle = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    // One vehicle per driver account — each subscription covers exactly one
    // listing, so a driver wanting a second vehicle needs a second account.
    const existingVehicle = await Vehicle.findOne({ driverId: driver._id });
    if (existingVehicle) {
      return res.status(400).json({ success: false, message: 'ہر ڈرائیور صرف ایک گاڑی رجسٹر کر سکتا ہے' });
    }

    const { make, model, year, color, plateNumber, type, seats, features, rates, city } = req.body;

    const vehicle = await Vehicle.create({
      driverId: driver._id,
      make,
      model,
      year,
      color,
      plateNumber,
      type,
      seats,
      features: features || [],
      rates,
      city: city || driver.city,
    });

    // Link vehicle to driver
    await Driver.findByIdAndUpdate(driver._id, { $push: { vehicles: vehicle._id } });

    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
};

// POST /api/vehicles/:id/photos
const uploadVehiclePhotos = async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No photos uploaded' });

    const photoUrls = req.files.map(f => f.path);
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $push: { photos: { $each: photoUrls } } },
      { new: true }
    );

    res.json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
};

// GET /api/vehicles — search with filters
const getVehicles = async (req, res, next) => {
  try {
    const { city, type, tripType, date, seats } = req.query;

    // Lazy expiry sweep: flip any driver whose subscription has silently
    // lapsed since we last checked. Runs on this endpoint specifically
    // because it's the highest-traffic read, so this keeps the cached
    // subscriptionStatus field correct without a cron job.
    await Driver.updateMany(
      { subscriptionStatus: 'active', subscriptionExpiresAt: { $lt: new Date() } },
      { subscriptionStatus: 'expired' }
    );

    const filter = { isAvailable: true };
    if (city) filter.city = city;
    if (type) filter.type = type;
    if (seats) filter.seats = { $gte: parseInt(seats) };

    const vehicles = await Vehicle.find(filter)
      .populate({
        path: 'driverId',
        match: { isVerified: true, subscriptionStatus: 'active' },
        populate: { path: 'userId', select: 'name rating profilePhoto' },
      })
      .sort({ rating: -1 });

    // Filter out vehicles whose driver is not verified or not subscribed
    const verified = vehicles.filter(v => v.driverId !== null);

    res.json({ success: true, count: verified.length, vehicles: verified });
  } catch (err) {
    next(err);
  }
};

// GET /api/vehicles/:id
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate({
      path: 'driverId',
      populate: { path: 'userId', select: 'name phone rating profilePhoto totalRatings' },
    });

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    res.json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/vehicles/:id
const updateVehicle = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    const vehicle = await Vehicle.findOne({ _id: req.params.id, driverId: driver._id });

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    // plateNumber is intentionally excluded — it's the vehicle's legal identity
    // and shouldn't be silently swapped without a re-verification step.
    const allowed = ['make', 'model', 'year', 'color', 'type', 'seats', 'city', 'features', 'rates', 'isAvailable'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) vehicle[field] = req.body[field];
    });

    await vehicle.save();
    res.json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/vehicles/:id
const deleteVehicle = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    const vehicle = await Vehicle.findOne({ _id: req.params.id, driverId: driver._id });

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const activeBooking = await Booking.findOne({
      vehicleId: vehicle._id,
      status: { $in: ['pending', 'accepted', 'active'] },
    });
    if (activeBooking) {
      return res.status(400).json({ success: false, message: 'جاری بکنگ کے دوران گاڑی حذف نہیں کی جا سکتی' });
    }

    await Vehicle.deleteOne({ _id: vehicle._id });
    await Driver.findByIdAndUpdate(driver._id, { $pull: { vehicles: vehicle._id } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/vehicles/my-vehicles
const getMyVehicles = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const vehicles = await Vehicle.find({ driverId: driver._id });
    res.json({ success: true, vehicles });
  } catch (err) {
    next(err);
  }
};

module.exports = { addVehicle, uploadVehiclePhotos, getVehicles, getVehicleById, updateVehicle, deleteVehicle, getMyVehicles };
