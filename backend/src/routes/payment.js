const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPayProInvoice, createEasypaisaOTC, createJazzCashPayment, recordManualPayment } = require('../services/paymentService');
const Booking = require('../models/Booking');

// POST /api/payments/initiate
router.post('/initiate', protect, async (req, res, next) => {
  try {
    const { bookingId, method } = req.body;
    const booking = await Booking.findById(bookingId).populate('customerId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const customer = booking.customerId;
    const orderId = `RX-${bookingId.slice(-8).toUpperCase()}`;

    let result;
    if (method === 'paypro') {
      result = await createPayProInvoice({
        orderId,
        amount: booking.totalAmount,
        customerName: customer.name,
        customerPhone: customer.phone,
        description: `RentX Booking #${orderId}`,
      });
    } else if (method === 'easypaisa') {
      result = await createEasypaisaOTC({ orderId, amount: booking.totalAmount, customerPhone: customer.phone });
    } else if (method === 'jazzcash') {
      result = await createJazzCashPayment({ orderId, amount: booking.totalAmount, customerPhone: customer.phone });
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
    if (MerchantOrderId.startsWith('SUB-')) {
      // Subscription payment — look up the pending payment record by its
      // stored orderId reference and apply it via the shared service, same
      // extend-and-activate logic as the admin manual mark-paid path.
      const DriverSubscription = require('../models/DriverSubscription');
      const subscriptionService = require('../services/subscriptionService');
      const sub = await DriverSubscription.findOne({ 'payments.reference': MerchantOrderId });
      if (sub) {
        const payment = sub.payments.find(p => p.reference === MerchantOrderId);
        if (payment && payment.status === 'pending') {
          await subscriptionService.applySubscriptionPayment(sub.driverId, {
            amount: payment.amount,
            method: payment.method,
            mode: 'gateway',
            reference: MerchantOrderId,
          });
        }
      }
    } else {
      const bookingId = MerchantOrderId.replace('RX-', '');
      await Booking.findOneAndUpdate({ _id: { $regex: bookingId } }, { paymentStatus: 'paid' });
    }
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
