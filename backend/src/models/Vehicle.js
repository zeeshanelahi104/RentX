const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    make: {
      type: String,
      required: true, // Toyota, Honda, Suzuki
    },
    model: {
      type: String,
      required: true, // Corolla, Prado, Hiace
    },
    year: {
      type: Number,
      required: true,
    },
    color: String,
    plateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['car', 'suv', 'van', 'coaster'],
      required: true,
    },
    seats: {
      type: Number,
      required: true,
    },
    photos: [String], // Cloudinary URLs
    features: [String], // ['AC', 'WiFi', 'Child Seat', 'GPS']
    rates: {
      cityPerDay: { type: Number, required: true },
      intercityPerDay: { type: Number, required: true },
      weddingPerDay: { type: Number, required: true },
      airportFlat: { type: Number, required: true },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    city: {
      type: String,
      required: true,
    },
    registrationDoc: String,
    rating: {
      type: Number,
      default: 5.0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
