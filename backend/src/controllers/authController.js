const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  city: user.city,
  profilePhoto: user.profilePhoto,
  rating: user.rating,
  isProfileComplete: user.isProfileComplete,
});

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, city } = req.body;

    if (!name || !email || !password || !role || !city) {
      return res.status(400).json({ success: false, message: 'Name, email, password, role, and city are required' });
    }

    if (!['rider', 'driver'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      city,
      isProfileComplete: true,
    });

    const token = generateToken(user._id);

    res.status(201).json({ success: true, token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = generateToken(user._id);

    res.json({ success: true, token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/google
// body: { idToken, role?, city? } — role/city required only the first time a
// Google account signs in and still needs to pick one (isProfileComplete: false).
const googleAuth = async (req, res, next) => {
  try {
    const { idToken, role, city } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'Google ID token required' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

    if (!user) {
      if (role && !['rider', 'driver'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        profilePhoto: payload.picture,
        role: role || undefined, // falls back to the schema default ('rider') until they pick one
        city: city || undefined,
        isProfileComplete: !!(role && city),
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = generateToken(user._id);

    res.json({ success: true, token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/complete-profile
// Finishes setup for a Google account that signed in without picking a role/city yet.
const completeProfile = async (req, res, next) => {
  try {
    const { role, city } = req.body;

    if (!role || !city) {
      return res.status(400).json({ success: false, message: 'Role and city are required' });
    }
    if (!['rider', 'driver'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role, city, isProfileComplete: true },
      { new: true }
    );

    res.json({ success: true, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/update-fcm-token
const updateFCMToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: formatUser(req.user) });
};

module.exports = { register, login, googleAuth, completeProfile, updateFCMToken, getMe };
