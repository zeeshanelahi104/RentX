const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    amount: Number,
    method: {
      type: String,
      enum: ['manual', 'paypro', 'easypaisa', 'jazzcash', 'first_month_free'],
    },
    mode: {
      type: String,
      enum: ['manual', 'gateway'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    reference: String,
    periodStart: Date,
    periodEnd: Date,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const driverSubscriptionSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      unique: true,
    },
    payments: [paymentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('DriverSubscription', driverSubscriptionSchema);
