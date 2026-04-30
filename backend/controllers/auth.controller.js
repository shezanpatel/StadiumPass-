const User = require('../models/User.model');
const { generateToken } = require('../middleware/auth.middleware');
const { validationResult } = require('express-validator');

// @desc  Register user (client or admin)
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { name, email, password, role, phone, adminCode } = req.body;

    // Admin registration requires a secret code
    if (role === 'admin') {
      const validAdminCode = process.env.ADMIN_REGISTRATION_CODE || 'STADIUMPASS_ADMIN_2024';
      if (adminCode !== validAdminCode) {
        return res.status(403).json({ success: false, message: 'Invalid admin registration code.' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, role: role || 'client', phone });
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: { token, user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email, password, role } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    // Role verification
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This account is not registered as ${role}.`
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);
    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: { token, user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

// @desc  Update profile
// @route PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, favoriteTeams, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, favoriteTeams, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated!', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
