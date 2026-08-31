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
      pendingVerification, totalRiders, todayBookings, thisMonthRevenue,
      bookingsByStatus,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$commission' } } }]),
      Driver.countDocuments({ isVerified: true }),
      Driver.countDocuments({ verificationStatus: { $in: ['pending', 'under_review'] } }),
      User.countDocuments({ role: 'rider' }),
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
        activeDrivers, pendingVerification, totalRiders,
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
      .populate('riderId', 'name phone')
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
    const { status } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;

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

// ── Users / riders (manage_users) ────────────────────────────────────────────
router.get('/users', requirePermission('manage_users'), async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = { role: { $in: ['rider', 'driver'] } };
    if (role && ['rider', 'driver'].includes(role)) filter.role = role;

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

module.exports = router;
