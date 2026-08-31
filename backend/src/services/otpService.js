const twilio = require('twilio');
const OTP = require('../models/OTP');

const sid = process.env.TWILIO_ACCOUNT_SID;
const client = sid && sid.startsWith('AC')
  ? twilio(sid, process.env.TWILIO_AUTH_TOKEN)
  : null;

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (phone) => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

  // Invalidate any existing OTPs for this phone
  await OTP.deleteMany({ phone });

  await OTP.create({ phone, code, expiresAt });

  if (client) {
    await client.messages.create({
      body: `Your RentX verification code is: ${code}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } else {
    // Development mode: log OTP to console
    console.log(`[DEV OTP] Phone: ${phone} | Code: ${code}`);
  }

  return { success: true };
};

const verifyOTP = async (phone, code) => {
  const otp = await OTP.findOne({ phone, code, isUsed: false });

  if (!otp) return { valid: false, message: 'Invalid OTP' };
  if (new Date() > otp.expiresAt) return { valid: false, message: 'OTP has expired' };

  otp.isUsed = true;
  await otp.save();

  return { valid: true };
};

module.exports = { sendOTP, verifyOTP };
