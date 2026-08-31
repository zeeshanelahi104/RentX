const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['rider', 'driver', 'admin', 'superadmin'],
      default: 'rider',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    permissions: {
      type: [String],
      enum: ['manage_drivers', 'manage_bookings', 'manage_users', 'view_revenue', 'manage_admins'],
      default: [],
    },
    city: {
      type: String,
      default: 'Chiniot',
    },
    profilePhoto: String,
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    fcmToken: String, // For push notifications
    isActive: {
      type: Boolean,
      default: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Recalculate average rating
userSchema.methods.updateRating = async function (newRating) {
  const total = this.totalRatings + 1;
  this.rating = ((this.rating * this.totalRatings) + newRating) / total;
  this.totalRatings = total;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
