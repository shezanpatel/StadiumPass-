// stadium.routes.js
const express = require('express');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const Stadium = require('../models/Stadium.model');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const stadiums = await Stadium.find({ isActive: true }).select('-sections.seats');
    res.json({ success: true, data: { stadiums } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ success: false, message: 'Stadium not found.' });
    res.json({ success: true, data: { stadium } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const stadium = await Stadium.create(req.body);
    res.status(201).json({ success: true, data: { stadium } });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

module.exports = router;
