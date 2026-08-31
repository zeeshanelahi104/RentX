const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');

// POST /api/vehicles
const addVehicle = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

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

    const filter = { isAvailable: true };
    if (city) filter.city = city;
    if (type) filter.type = type;
    if (seats) filter.seats = { $gte: parseInt(seats) };

    const vehicles = await Vehicle.find(filter)
      .populate({
        path: 'driverId',
        match: { isVerified: true },
        populate: { path: 'userId', select: 'name rating profilePhoto' },
      })
      .sort({ rating: -1 });

    // Filter out vehicles whose driver is not verified
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

    const allowed = ['color', 'features', 'rates', 'isAvailable'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) vehicle[field] = req.body[field];
    });

    await vehicle.save();
    res.json({ success: true, vehicle });
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

module.exports = { addVehicle, uploadVehiclePhotos, getVehicles, getVehicleById, updateVehicle, getMyVehicles };
