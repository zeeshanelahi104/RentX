const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ALL_PERMISSIONS = ['manage_drivers', 'manage_bookings', 'manage_users', 'view_revenue', 'manage_admins'];

// GET /api/admin/admins
const listAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, admins });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/admins
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, permissions = [] } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const invalid = permissions.filter(p => !ALL_PERMISSIONS.includes(p));
    if (invalid.length)
      return res.status(400).json({ success: false, message: `Invalid permissions: ${invalid.join(', ')}` });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      password: hashed,
      role: 'admin',
      permissions,
      isProfileComplete: true,
    });

    res.status(201).json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/admins/:id
const updateAdmin = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;

    // Prevent modifying a superadmin
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Admin not found' });
    if (target.role === 'superadmin')
      return res.status(403).json({ success: false, message: 'Cannot modify superadmin account' });

    if (permissions) {
      const invalid = permissions.filter(p => !ALL_PERMISSIONS.includes(p));
      if (invalid.length)
        return res.status(400).json({ success: false, message: `Invalid permissions: ${invalid.join(', ')}` });
    }

    const updates = {};
    if (name) updates.name = name;
    if (permissions) updates.permissions = permissions;

    const admin = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json({ success: true, admin });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/admins/:id/toggle-active
const toggleAdminActive = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Admin not found' });
    if (target.role === 'superadmin')
      return res.status(403).json({ success: false, message: 'Cannot deactivate superadmin account' });

    // Prevent self-deactivation
    if (target._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });

    target.isActive = !target.isActive;
    await target.save();

    res.json({ success: true, admin: { _id: target._id, name: target.name, isActive: target.isActive } });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAdmins, createAdmin, updateAdmin, toggleAdminActive };
