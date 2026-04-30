const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stadiumpass_secret_2024');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'stadiumpass_secret_2024',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = { protect, adminOnly, generateToken };
