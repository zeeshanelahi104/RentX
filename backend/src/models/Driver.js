const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    cnicNumber: {
      type: String,
      required: true,
      unique: true,
    },
    cnicFrontPhoto: String,
    cnicBackPhoto: String,
    licenseNumber: String,
    licensePhoto: String,
    city: {
      type: String,
      required: true,
    },
    bio: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    vehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    subscriptionStatus: {
      type: String,
      enum: ['active', 'expired', 'none'],
      default: 'none',
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    firstMonthFreeUsed: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    referralRewardIssued: {
      type: Boolean,
      default: false,
    },
    pendingReferralDiscount: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ subscriptionStatus: 1, subscriptionExpiresAt: 1 });

module.exports = mongoose.model('Driver', driverSchema);
