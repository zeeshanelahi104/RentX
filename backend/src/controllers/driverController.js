const Driver = require('../models/Driver');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const subscriptionService = require('../services/subscriptionService');

// POST /api/drivers/onboard
// body may include an optional referralCode from another driver — an
// unknown/invalid code is ignored silently rather than blocking onboarding,
// since referral is a bonus, not a signup gate.
const onboardDriver = async (req, res, next) => {
  try {
    const { cnicNumber, licenseNumber, city, bio, referralCode } = req.body;
    const userId = req.user._id;

    const existing = await Driver.findOne({ userId });
    if (existing) return res.status(400).json({ success: false, message: 'Driver profile already exists' });

    let referredBy = null;
    if (referralCode) {
      const referrer = await Driver.findOne({ referralCode: referralCode.trim().toUpperCase() });
      if (referrer) referredBy = referrer._id;
    }

    const ownReferralCode = await subscriptionService.generateReferralCode();

    const driver = await Driver.create({
      userId,
      cnicNumber,
      licenseNumber,
      city,
      bio,
      verificationStatus: 'pending',
      referralCode: ownReferralCode,
      referredBy,
    });

    // First month free — live at launch, anchored to whichever is later:
    // the platform's Nov 1 2026 launch date, or this driver's own signup.
    if (subscriptionService.isFirstMonthFreeEligible(driver)) {
      await subscriptionService.applySubscriptionPayment(driver._id, {
        amount: 0,
        method: 'first_month_free',
        mode: 'manual',
      });
    }

    await User.findByIdAndUpdate(userId, { role: 'driver' });

    const finalDriver = await Driver.findById(driver._id);
    res.status(201).json({ success: true, driver: finalDriver });
  } catch (err) {
    next(err);
  }
};

// POST /api/drivers/upload-docs
const uploadDocs = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    if (!req.files?.cnicFront && !req.files?.cnicBack && !req.files?.license) {
      return res.status(400).json({ success: false, message: 'کوئی تصویر موصول نہیں ہوئی، براہ کرم دوبارہ کوشش کریں' });
    }

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

// PATCH /api/drivers/profile
// Lets an already-onboarded driver edit their info. Changing cnicNumber or
// licenseNumber re-flags the account for review, same as re-uploading docs —
// those fields are what verification actually vouches for.
const updateDriverProfile = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    const { cnicNumber, licenseNumber, city, bio } = req.body;
    const updates = {};
    if (city) updates.city = city;
    if (bio !== undefined) updates.bio = bio;
    if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;

    const identityChanged = cnicNumber && cnicNumber !== driver.cnicNumber;
    if (identityChanged) {
      updates.cnicNumber = cnicNumber;
      updates.isVerified = false;
      updates.verificationStatus = 'under_review';
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
    await subscriptionService.checkAndRefreshExpiry(driver);
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

// GET /api/drivers/subscription
const getSubscriptionStatus = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    await subscriptionService.checkAndRefreshExpiry(driver);
    const nextPaymentAmount = await subscriptionService.getSubscriptionPrice(driver);

    const daysRemaining = driver.subscriptionExpiresAt
      ? Math.max(0, Math.ceil((driver.subscriptionExpiresAt - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;

    res.json({
      success: true,
      subscription: {
        status: driver.subscriptionStatus,
        expiresAt: driver.subscriptionExpiresAt,
        firstMonthFreeUsed: driver.firstMonthFreeUsed,
        daysRemaining,
        nextPaymentAmount,
        pendingReferralDiscount: driver.pendingReferralDiscount,
        referralCode: driver.referralCode,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/drivers/subscription/pay
const initiateSubscriptionPayment = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });

    const mode = await subscriptionService.getPaymentMode();
    const amount = await subscriptionService.getSubscriptionPrice(driver);

    if (amount === 0) {
      const updated = await subscriptionService.applySubscriptionPayment(driver._id, {
        amount: 0,
        method: 'first_month_free',
        mode: 'manual',
      });
      return res.json({ success: true, mode: 'free', driver: updated });
    }

    if (mode === 'manual') {
      const DriverSubscription = require('../models/DriverSubscription');
      let sub = await DriverSubscription.findOne({ driverId: driver._id });
      if (!sub) sub = await DriverSubscription.create({ driverId: driver._id, payments: [] });
      sub.payments.push({ amount, method: 'manual', mode: 'manual', status: 'pending' });
      await sub.save();

      return res.json({
        success: true,
        mode: 'manual',
        amount,
        instructions: 'براہ کرم PKR ' + amount + ' JazzCash/EasyPaisa کے ذریعے ادا کریں اور ایڈمن سے تصدیق کروائیں۔',
      });
    }

    // Gateway mode
    const { createPayProInvoice, createEasypaisaOTC, createJazzCashPayment } = require('../services/paymentService');
    const orderId = `SUB-${driver._id.toString().slice(-8)}-${Date.now()}`;
    const { method } = req.body;

    const DriverSubscription = require('../models/DriverSubscription');
    let sub = await DriverSubscription.findOne({ driverId: driver._id });
    if (!sub) sub = await DriverSubscription.create({ driverId: driver._id, payments: [] });
    sub.payments.push({ amount, method: method || 'paypro', mode: 'gateway', status: 'pending', reference: orderId });
    await sub.save();

    let result;
    if (method === 'easypaisa') {
      result = await createEasypaisaOTC({ orderId, amount, customerPhone: req.user.phone });
    } else if (method === 'jazzcash') {
      result = await createJazzCashPayment({ orderId, amount, customerPhone: req.user.phone });
    } else {
      result = await createPayProInvoice({
        orderId,
        amount,
        customerName: req.user.name,
        customerPhone: req.user.phone,
        description: `RentX Subscription #${orderId}`,
      });
    }

    res.json({ success: true, mode: 'gateway', orderId, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
