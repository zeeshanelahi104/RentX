const express = require('express');
const router = express.Router();
const { protect, requireDriver } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getDriverBookings,
  getBookingById,
  acceptBooking,
  startTrip,
  completeTrip,
  cancelBooking,
  rateBooking,
} = require('../controllers/bookingController');

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/driver-bookings', protect, requireDriver, getDriverBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/accept', protect, requireDriver, acceptBooking);
router.patch('/:id/start', protect, requireDriver, startTrip);
router.patch('/:id/complete', protect, requireDriver, completeTrip);
router.patch('/:id/cancel', protect, cancelBooking);
router.post('/:id/rate', protect, rateBooking);

module.exports = router;
