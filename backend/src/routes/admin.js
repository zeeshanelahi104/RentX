const express = require('express');
const router = express.Router();
const { protect, requireAdmin, requirePermission, requireSuperAdmin } = require('../middleware/auth');
const { adminRegister, adminLogin } = require('../controllers/adminAuthController');
const { listAdmins, createAdmin, updateAdmin, toggleAdminActive } = require('../controllers/adminUsersController');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

// ── Public admin auth ────────────────────────────────────────────────────────
router.post('/auth/register', adminRegister);
router.post('/auth/login', adminLogin);

// ── All routes below require auth + admin/superadmin role ────────────────────
router.use(protect, requireAdmin);

// ── Admin user management (superadmin only) ──────────────────────────────────
router.get('/admins', requireSuperAdmin, listAdmins);
router.post('/admins', requireSuperAdmin, createAdmin);
router.patch('/admins/:id', requireSuperAdmin, updateAdmin);
router.patch('/admins/:id/toggle-active', requireSuperAdmin, toggleAdminActive);

// ── Dashboard stats (any admin) ──────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalBookings, totalRevenue, commission, activeDrivers,
      pendingVerification, totalCustomers, todayBookings, thisMonthRevenue,
      bookingsByStatus,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$commission' } } }]),
      Driver.countDocuments({ isVerified: true }),
      Driver.countDocuments({ verificationStatus: { $in: ['pending', 'under_review'] } }),
      User.countDocuments({ role: 'customer' }),
      Booking.countDocuments({ createdAt: { $gte: today } }),
      Booking.aggregate([{ $match: { status: 'completed', createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const statusMap = {};
    bookingsByStatus.forEach(({ _id, count }) => { statusMap[_id] = count; });

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1);
    const monthlyRevenue = await Booking.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const revenueChart = {
      labels: monthlyRevenue.map(m => `${months[m._id.month - 1]}`),
      data: monthlyRevenue.map(m => m.revenue),
    };

    const topCities = await Booking.aggregate([
      { $group: { _id: '$pickupLocation.address', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 5 },
      { $project: { city: '$_id', count: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalBookings, totalRevenue: totalRevenue[0]?.total || 0,
        commission: commission[0]?.total || 0,
        activeDrivers, pendingVerification, totalCustomers,
        todayBookings, thisMonthRevenue: thisMonthRevenue[0]?.total || 0,
        bookingsByStatus: statusMap, revenueChart, topCities,
      },
    });
  } catch (err) { next(err); }
});

// ── Bookings (manage_bookings) ───────────────────────────────────────────────
router.get('/bookings', requirePermission('manage_bookings'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name phone')
      .populate({ path: 'driverId', populate: { path: 'userId', select: 'name phone' } })
      .populate('vehicleId', 'make model year')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, bookings });
  } catch (err) { next(err); }
});

// ── Drivers (manage_drivers) ─────────────────────────────────────────────────
router.get('/drivers', requirePermission('manage_drivers'), async (req, res, next) => {
  try {
    const { status, subStatus } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;
    if (subStatus) filter.subscriptionStatus = subStatus;

    const drivers = await Driver.find(filter)
      .populate('userId', 'name phone rating')
      .sort({ createdAt: -1 });

    res.json({ success: true, drivers });
  } catch (err) { next(err); }
});

router.patch('/drivers/:id/verify', requirePermission('manage_drivers'), async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, verificationStatus: 'approved' },
      { new: true }
    );
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, driver });
  } catch (err) { next(err); }
});

router.patch('/drivers/:id/reject', requirePermission('manage_drivers'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { isVerified: false, verificationStatus: 'rejected', rejectionReason: reason },
      { new: true }
    );
    res.json({ success: true, driver });
  } catch (err) { next(err); }
});

// ── Users / customers (manage_users) ─────────────────────────────────────────
router.get('/users', requirePermission('manage_users'), async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = { role: { $in: ['customer', 'driver'] } };
    if (role && ['customer', 'driver'].includes(role)) filter.role = role;

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, users });
  } catch (err) { next(err); }
});

// ── Revenue (view_revenue) ───────────────────────────────────────────────────
router.get('/revenue', requirePermission('view_revenue'), async (req, res, next) => {
  try {
    const [revenueByType, revenueByPayment, monthlyData] = await Promise.all([
      Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: '$tripType', revenue: { $sum: '$totalAmount' } } }]),
      Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: '$paymentMethod', amount: { $sum: '$totalAmount' } } }]),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, commission: { $sum: '$commission' }, bookings: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }, { $limit: 12 },
      ]),
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
    const totalCommission = monthlyData.reduce((s, m) => s + m.commission, 0);
    const totalBookings = monthlyData.reduce((s, m) => s + m.bookings, 0);

    const byTripType = {};
    revenueByType.forEach(({ _id, revenue }) => { byTripType[_id] = revenue; });

    const byPaymentMethod = {};
    revenueByPayment.forEach(({ _id, amount }) => { byPaymentMethod[_id] = amount; });

    res.json({
      success: true,
      totalRevenue, totalCommission,
      avgBookingValue: totalBookings ? Math.round(totalRevenue / totalBookings) : 0,
      thisMonth: monthlyData[monthlyData.length - 1]?.revenue || 0,
      thisMonthCommission: monthlyData[monthlyData.length - 1]?.commission || 0,
      byTripType, byPaymentMethod,
      monthlyBreakdown: monthlyData.map(m => ({
        month: `${months[m._id.month - 1]} ${m._id.year}`,
        revenue: m.revenue, commission: m.commission, bookings: m.bookings,
      })),
    });
  } catch (err) { next(err); }
});

// ── Driver subscriptions (manage_drivers / view_revenue) ─────────────────────
const AppConfig = require('../models/AppConfig');
const DriverSubscription = require('../models/DriverSubscription');
const subscriptionService = require('../services/subscriptionService');

router.get('/subscriptions', requirePermission('manage_drivers'), async (req, res, next) => {
  try {
    const { status } = req.query;

    // Same lazy sweep as getVehicles, so this list is never stale.
    await Driver.updateMany(
      { subscriptionStatus: 'active', subscriptionExpiresAt: { $lt: new Date() } },
      { subscriptionStatus: 'expired' }
    );

    const filter = {};
    if (status) filter.subscriptionStatus = status;

    const drivers = await Driver.find(filter)
      .populate('userId', 'name phone')
      .sort({ subscriptionExpiresAt: 1 });

    res.json({ success: true, drivers });
  } catch (err) { next(err); }
});

router.patch('/subscriptions/:driverId/mark-paid', requirePermission('manage_drivers'), async (req, res, next) => {
  try {
    const { months = 1, reference } = req.body;
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const amount = await subscriptionService.getSubscriptionPrice(driver);
    const updated = await subscriptionService.applySubscriptionPayment(driver._id, {
      amount,
      method: 'manual',
      mode: 'manual',
      reference,
      recordedBy: req.user._id,
      months: Number(months),
    });

    res.json({ success: true, driver: updated });
  } catch (err) { next(err); }
});

router.patch('/subscriptions/:driverId/extend', requirePermission('manage_drivers'), async (req, res, next) => {
  try {
    const { days } = req.body;
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const now = new Date();
    const base = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now ? driver.subscriptionExpiresAt : now;
    const newExpiry = new Date(base);
    newExpiry.setDate(newExpiry.getDate() + Number(days));

    driver.subscriptionExpiresAt = newExpiry;
    driver.subscriptionStatus = 'active';
    await driver.save();

    res.json({ success: true, driver });
  } catch (err) { next(err); }
});

router.get('/subscriptions/config', requirePermission('manage_drivers'), async (req, res, next) => {
  try {
    const mode = await subscriptionService.getPaymentMode();
    res.json({ success: true, subscriptionPaymentMode: mode });
  } catch (err) { next(err); }
});

router.patch('/subscriptions/config', requirePermission('manage_drivers'), async (req, res, next) => {
  try {
    const { subscriptionPaymentMode } = req.body;
    if (!['manual', 'gateway'].includes(subscriptionPaymentMode)) {
      return res.status(400).json({ success: false, message: 'Invalid mode' });
    }
    const config = await AppConfig.findOneAndUpdate(
      { key: 'global' },
      { subscriptionPaymentMode },
      { upsert: true, new: true }
    );
    res.json({ success: true, subscriptionPaymentMode: config.subscriptionPaymentMode });
  } catch (err) { next(err); }
});

router.get('/subscriptions/stats', requirePermission('view_revenue'), async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalActive, totalExpired, totalNone, revenueAgg, thisMonthAgg] = await Promise.all([
      Driver.countDocuments({ subscriptionStatus: 'active' }),
      Driver.countDocuments({ subscriptionStatus: 'expired' }),
      Driver.countDocuments({ subscriptionStatus: 'none' }),
      DriverSubscription.aggregate([
        { $unwind: '$payments' },
        { $match: { 'payments.status': 'paid', 'payments.method': { $ne: 'first_month_free' } } },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } },
      ]),
      DriverSubscription.aggregate([
        { $unwind: '$payments' },
        { $match: { 'payments.status': 'paid', 'payments.method': { $ne: 'first_month_free' }, 'payments.createdAt': { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        activeDrivers: totalActive,
        expiredDrivers: totalExpired,
        unsubscribedDrivers: totalNone,
        totalRevenue: revenueAgg[0]?.total || 0,
        thisMonthRevenue: thisMonthAgg[0]?.total || 0,
      },
    });
  } catch (err) { next(err); }
});

router.post('/subscriptions/grant-free-month-bulk', requireSuperAdmin, async (req, res, next) => {
  try {
    const freeUntil = new Date(subscriptionService.LAUNCH_DATE);
    freeUntil.setMonth(freeUntil.getMonth() + 1);

    const result = await Driver.updateMany(
      { firstMonthFreeUsed: { $ne: true } },
      { subscriptionStatus: 'active', subscriptionExpiresAt: freeUntil, firstMonthFreeUsed: true }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) { next(err); }
});

module.exports = router;
