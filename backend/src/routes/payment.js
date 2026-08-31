const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPayProInvoice, createEasypaisaOTC, createJazzCashPayment, recordManualPayment } = require('../services/paymentService');
const Booking = require('../models/Booking');

// POST /api/payments/initiate
router.post('/initiate', protect, async (req, res, next) => {
  try {
    const { bookingId, method } = req.body;
    const booking = await Booking.findById(bookingId).populate('riderId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const rider = booking.riderId;
    const orderId = `RX-${bookingId.slice(-8).toUpperCase()}`;

    let result;
    if (method === 'paypro') {
      result = await createPayProInvoice({
        orderId,
        amount: booking.totalAmount,
        customerName: rider.name,
        customerPhone: rider.phone,
        description: `RentX Booking #${orderId}`,
      });
    } else if (method === 'easypaisa') {
      result = await createEasypaisaOTC({ orderId, amount: booking.totalAmount, customerPhone: rider.phone });
    } else if (method === 'jazzcash') {
      result = await createJazzCashPayment({ orderId, amount: booking.totalAmount, customerPhone: rider.phone });
    } else {
      return res.status(400).json({ success: false, message: 'Unknown payment method' });
    }

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/paypro-callback (PayPro webhook)
router.post('/paypro-callback', async (req, res) => {
  const { MerchantOrderId, TransactionStatus, TransactionId } = req.body;
  if (TransactionStatus === 'SUCCESS') {
    const bookingId = MerchantOrderId.replace('RX-', '');
    await Booking.findOneAndUpdate({ _id: { $regex: bookingId } }, { paymentStatus: 'paid' });
  }
  res.json({ success: true });
});

// POST /api/payments/manual (cash/offline confirmation — admin only)
router.post('/manual', protect, async (req, res, next) => {
  try {
    const { bookingId, reference } = req.body;
    await recordManualPayment(bookingId, 'manual', reference);
    res.json({ success: true, message: 'Payment recorded' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
