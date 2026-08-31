const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    tripType: {
      type: String,
      enum: ['city_day', 'intercity', 'wedding', 'airport'],
      required: true,
    },
    pickupLocation: {
      address: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    dropLocation: {
      address: { type: String },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
    },
    driverEarning: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'easypaisa', 'jazzcash'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    notes: String,
    riderRating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
    },
    driverRating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
    },
    cancelledBy: {
      type: String,
      enum: ['rider', 'driver', 'admin'],
    },
    cancellationReason: String,
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

// Calculate commission and driver earning before saving
bookingSchema.pre('save', function (next) {
  if (this.isModified('totalAmount')) {
    this.commission = Math.round(this.totalAmount * 0.15);
    this.driverEarning = this.totalAmount - this.commission;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
