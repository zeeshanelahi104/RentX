const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'global',
    },
    subscriptionPaymentMode: {
      type: String,
      enum: ['manual', 'gateway'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppConfig', appConfigSchema);
