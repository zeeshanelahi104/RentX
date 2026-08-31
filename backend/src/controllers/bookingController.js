const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { notify, NOTIFICATIONS } = require('../services/notificationService');
const { getIO } = require('../socket');

const RATE_MAP = {
  city_day: 'cityPerDay',
  intercity: 'intercityPerDay',
  wedding: 'weddingPerDay',
  airport: 'airportFlat',
};

// POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const { vehicleId, tripType, pickupLocation, dropLocation, startDate, endDate, paymentMethod, notes } = req.body;

    const vehicle = await Vehicle.findById(vehicleId).populate('driverId');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (!vehicle.isAvailable) return res.status(400).json({ success: false, message: 'Vehicle not available' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    const rateKey = RATE_MAP[tripType];
    const totalAmount = vehicle.rates[rateKey] * (tripType === 'airport' ? 1 : totalDays);
    const commission = Math.round(totalAmount * 0.15);
    const driverEarning = totalAmount - commission;

    const booking = await Booking.create({
      riderId: req.user._id,
      driverId: vehicle.driverId._id,
      vehicleId,
      tripType,
      pickupLocation: typeof pickupLocation === 'string' ? { address: pickupLocation } : pickupLocation,
      dropLocation: typeof dropLocation === 'string' ? { address: dropLocation } : dropLocation,
      startDate: start,
      endDate: end,
      totalDays,
      totalAmount,
      commission,
      driverEarning,
      paymentMethod: paymentMethod || 'cash',
      notes,
    });

    // Notify driver
    const driverUser = await User.findById(vehicle.driverId.userId);
    if (driverUser) {
      await notify(driverUser._id, NOTIFICATIONS.newBooking(booking._id));
      // Emit socket event to driver
      getIO()?.to(`user_${driverUser._id}`).emit('new_booking', { booking });
    }

    res.status(201).json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/my-bookings (rider)
const getMyBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { riderId: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('vehicleId', 'make model year photos type')
      .populate({ path: 'driverId', populate: { path: 'userId', select: 'name phone rating' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/driver-bookings (driver)
const getDriverBookings = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const { status } = req.query;
    const filter = { driverId: driver._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('riderId', 'name phone rating profilePhoto')
      .populate('vehicleId', 'make model year photos')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('riderId', 'name phone rating profilePhoto')
      .populate('vehicleId')
      .populate({ path: 'driverId', populate: { path: 'userId', select: 'name phone rating profilePhoto' } });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isOwner =
      booking.riderId._id.toString() === req.user._id.toString() ||
      booking.driverId.userId._id.toString() === req.user._id.toString();

    if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/bookings/:id/accept (driver)
const acceptBooking = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    const booking = await Booking.findOne({ _id: req.params.id, driverId: driver._id, status: 'pending' });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found or already handled' });

    booking.status = 'accepted';
    booking.acceptedAt = new Date();
    await booking.save();

    await notify(booking.riderId, NOTIFICATIONS.bookingAccepted(req.user.name));
    getIO()?.to(`user_${booking.riderId}`).emit('booking_accepted', { bookingId: booking._id });

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/bookings/:id/start (driver)
const startTrip = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    const booking = await Booking.findOne({ _id: req.params.id, driverId: driver._id, status: 'accepted' });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = 'active';
    booking.startedAt = new Date();
    await booking.save();

    await notify(booking.riderId, NOTIFICATIONS.tripStarted());
    getIO()?.to(`user_${booking.riderId}`).emit('trip_started', { bookingId: booking._id });

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/bookings/:id/complete (driver)
const completeTrip = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    const booking = await Booking.findOne({ _id: req.params.id, driverId: driver._id, status: 'active' });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Update driver stats
    await Driver.findByIdAndUpdate(driver._id, {
      $inc: { totalTrips: 1, totalEarnings: booking.driverEarning },
    });

    await notify(booking.riderId, NOTIFICATIONS.tripCompleted());
    getIO()?.to(`user_${booking.riderId}`).emit('trip_completed', { bookingId: booking._id });

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
    }

    const driver = await Driver.findOne({ userId: req.user._id });
    const isRider = booking.riderId.toString() === req.user._id.toString();
    const isDriver = driver && booking.driverId.toString() === driver._id.toString();

    if (!isRider && !isDriver) return res.status(403).json({ success: false, message: 'Access denied' });

    booking.status = 'cancelled';
    booking.cancelledBy = isRider ? 'rider' : 'driver';
    booking.cancellationReason = reason;
    await booking.save();

    const notifyId = isRider ? booking.driverId : booking.riderId;
    await notify(notifyId, NOTIFICATIONS.bookingCancelled());

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/:id/rate
const rateBooking = async (req, res, next) => {
  try {
    const { score, comment } = req.body;
    const booking = await Booking.findById(req.params.id).populate('driverId');

    if (!booking || booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only rate completed bookings' });
    }

    const isRider = booking.riderId.toString() === req.user._id.toString();

    if (isRider) {
      booking.riderRating = { score, comment };
      // Update driver's rating
      const driverUser = await User.findById(booking.driverId.userId);
      await driverUser.updateRating(score);
    } else {
      booking.driverRating = { score, comment };
      const rider = await User.findById(booking.riderId);
      await rider.updateRating(score);
    }

    await booking.save();
    res.json({ success: true, message: 'Rating submitted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getDriverBookings,
  getBookingById,
  acceptBooking,
  startTrip,
  completeTrip,
  cancelBooking,
  rateBooking,
};
