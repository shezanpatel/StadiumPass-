// admin.routes.js
const express = require('express');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const User = require('../models/User.model');
const Booking = require('../models/Booking.model');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: { users } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: { user } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('match', 'title team1 team2 dateTime')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: { bookings } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/refund-requests', async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'refund_requested' })
      .populate('user', 'name email')
      .populate('match', 'title team1 team2 dateTime');
    res.json({ success: true, data: { bookings } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
