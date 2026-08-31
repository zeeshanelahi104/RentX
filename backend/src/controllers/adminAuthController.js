const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  permissions: user.permissions,
});

// POST /api/admin/auth/register
// Only works when no superadmin exists yet (first-time setup)
const adminRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const superadminExists = await User.findOne({ role: 'superadmin' });
    if (superadminExists)
      return res.status(403).json({ success: false, message: 'Setup already complete. Ask your superadmin to create admin accounts.' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      password: hashed,
      role: 'superadmin',
      isProfileComplete: true,
    });

    const token = generateToken(admin._id);

    res.status(201).json({ success: true, token, user: formatUser(admin) });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/auth/login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const admin = await User.findOne({ email, role: { $in: ['admin', 'superadmin'] } }).select('+password');
    if (!admin)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!admin.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated' });

    const token = generateToken(admin._id);

    res.json({ success: true, token, user: formatUser(admin) });
  } catch (err) {
    next(err);
  }
};

module.exports = { adminRegister, adminLogin };
