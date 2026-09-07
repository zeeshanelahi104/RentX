const crypto = require('crypto');
const Driver = require('../models/Driver');
const DriverSubscription = require('../models/DriverSubscription');
const AppConfig = require('../models/AppConfig');

const MONTHLY_FEE = 3000; // PKR
const REFERRER_DISCOUNT_RATE = 0.7; // 30% off
const REFERRED_DISCOUNT_RATE = 0.85; // 15% off
const LAUNCH_DATE = new Date('2026-11-01T00:00:00Z');

// A driver's free-month window runs one month from whichever is later:
// the platform launch date, or their own onboarding date (so a driver who
// joins after launch still gets a genuine first free month, not a
// window that already expired before they signed up).
const isFirstMonthFreeEligible = (driver) => {
  if (driver.firstMonthFreeUsed) return false;
  const anchor = driver.createdAt && driver.createdAt > LAUNCH_DATE ? driver.createdAt : LAUNCH_DATE;
  const freeUntil = new Date(anchor);
  freeUntil.setMonth(freeUntil.getMonth() + 1);
  return new Date() < freeUntil;
};

const generateReferralCode = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const existing = await Driver.findOne({ referralCode: code });
    if (!existing) return code;
  }
  // Extremely unlikely fallback if 5 random collisions happen in a row.
  return `${crypto.randomBytes(4).toString('hex').toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
};

// Lazily refreshes a single driver's subscriptionStatus cache against the
// real authority (subscriptionExpiresAt vs now). Called wherever a driver
// reads their own profile/subscription, so their view is never stale even
// between the bulk sweep runs triggered by getVehicles.
const checkAndRefreshExpiry = async (driver) => {
  if (
    driver.subscriptionStatus === 'active' &&
    driver.subscriptionExpiresAt &&
    driver.subscriptionExpiresAt < new Date()
  ) {
    driver.subscriptionStatus = 'expired';
    await driver.save();
  }
  return driver;
};

// Determines what a driver owes for their next subscription payment.
// Priority: first-month-free > referred-driver's-own-first-month-discount > full price.
// The referrer's 30%-off (pendingReferralDiscount) is applied separately in
// applySubscriptionPayment, since it can land on any future month, not just
// the first — it's a flag consumed once, not part of this priority chain.
const getSubscriptionPrice = async (driver) => {
  if (isFirstMonthFreeEligible(driver)) return 0;

  if (driver.referredBy) {
    const sub = await DriverSubscription.findOne({ driverId: driver._id });
    const hasPaidBefore = sub?.payments?.some((p) => p.status === 'paid');
    if (!hasPaidBefore) return Math.round(MONTHLY_FEE * REFERRED_DISCOUNT_RATE);
  }

  if (driver.pendingReferralDiscount) return Math.round(MONTHLY_FEE * REFERRER_DISCOUNT_RATE);

  return MONTHLY_FEE;
};

// Shared "extend subscription + record payment" logic used by both the
// admin manual mark-paid endpoint and the payment gateway callback, so the
// expiry-extension math lives in exactly one place.
const applySubscriptionPayment = async (driverId, { amount, method, mode, reference, recordedBy, months = 1 }) => {
  const driver = await Driver.findById(driverId);
  if (!driver) throw new Error('Driver not found');

  const now = new Date();
  const base = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now ? driver.subscriptionExpiresAt : now;
  const periodStart = base;
  const periodEnd = new Date(base);
  periodEnd.setMonth(periodEnd.getMonth() + months);

  let sub = await DriverSubscription.findOne({ driverId });
  if (!sub) sub = await DriverSubscription.create({ driverId, payments: [] });

  sub.payments.push({
    amount,
    method,
    mode,
    status: 'paid',
    reference,
    periodStart,
    periodEnd,
    recordedBy: recordedBy || null,
  });
  await sub.save();

  driver.subscriptionStatus = 'active';
  driver.subscriptionExpiresAt = periodEnd;

  // Reward the referrer once, the first time their referred driver pays
  // a real (non-free) subscription — not on every subsequent payment.
  if (driver.referredBy && !driver.referralRewardIssued && method !== 'first_month_free') {
    driver.referralRewardIssued = true;
    await Driver.findByIdAndUpdate(driver.referredBy, { pendingReferralDiscount: true });
  }

  // The 30%-off-next-month reward this driver was owed (as a referrer) has
  // now been consumed by this very payment.
  if (driver.pendingReferralDiscount) {
    driver.pendingReferralDiscount = false;
  }

  await driver.save();
  return driver;
};

const getPaymentMode = async () => {
  const config = await AppConfig.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { upsert: true, new: true }
  );
  return config.subscriptionPaymentMode;
};

module.exports = {
  MONTHLY_FEE,
  LAUNCH_DATE,
  isFirstMonthFreeEligible,
  generateReferralCode,
  checkAndRefreshExpiry,
  getSubscriptionPrice,
  applySubscriptionPayment,
  getPaymentMode,
};
