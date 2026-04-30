// user.routes.js
const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/User.model');

const router = express.Router();

router.get('/wallet', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');
    res.json({ success: true, data: { walletBalance: user.walletBalance } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/wallet/add', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0 || amount > 50000) {
      return res.status(400).json({ success: false, message: 'Invalid amount. Max ₹50,000.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: amount } },
      { new: true }
    ).select('walletBalance');
    res.json({ success: true, message: `₹${amount} added to wallet!`, data: { walletBalance: user.walletBalance } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
