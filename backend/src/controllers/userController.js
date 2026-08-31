const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// GET /api/users/profile
const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PATCH /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, city } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (city) updates.city = city;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/profile-photo
const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No photo uploaded' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: req.file.path },
      { new: true }
    );

    res.json({ success: true, profilePhoto: user.profilePhoto });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, uploadProfilePhoto };
