const Match = require('../models/Match.model');
const Booking = require('../models/Booking.model');

// @desc  Get all matches with filters
// @route GET /api/matches
const getMatches = async (req, res) => {
  try {
    const { tournament, team, venue, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (tournament) query.tournament = tournament;
    if (status) query.status = status;
    else query.status = { $ne: 'cancelled' };
    if (team) query.$or = [
      { team1: new RegExp(team, 'i') },
      { team2: new RegExp(team, 'i') }
    ];
    if (venue) query.venue = venue;

    const total = await Match.countDocuments(query);
    const matches = await Match.find(query)
      .populate('venue', 'name city capacity')
      .sort({ dateTime: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        matches,
        pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single match with seat availability
// @route GET /api/matches/:id
const getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('venue');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });

    // Get booked seat IDs for this match
    const bookings = await Booking.find({
      match: req.params.id,
      status: { $in: ['confirmed', 'pending'] }
    }).select('seats.seatId');

    const bookedSeatIds = bookings.flatMap(b => b.seats.map(s => s.seatId));

    res.json({ success: true, data: { match, bookedSeatIds } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get live scores ticker
// @route GET /api/matches/live-scores
const getLiveScores = async (req, res) => {
  try {
    const liveMatches = await Match.find({ status: 'live' })
      .select('title team1 team2 score status dateTime')
      .limit(10);
    res.json({ success: true, data: { matches: liveMatches } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create match (Admin)
// @route POST /api/matches
const createMatch = async (req, res) => {
  try {
    const match = await Match.create(req.body);
    res.status(201).json({ success: true, message: 'Match created!', data: { match } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Update match (Admin)
// @route PUT /api/matches/:id
const updateMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    res.json({ success: true, message: 'Match updated!', data: { match } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Delete match (Admin)
// @route DELETE /api/matches/:id
const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    res.json({ success: true, message: 'Match cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Revenue analytics (Admin)
// @route GET /api/matches/analytics
const getAnalytics = async (req, res) => {
  try {
    const [revenueData, topMatches] = await Promise.all([
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'refunded'] } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            bookings: { $sum: 1 },
            tickets: { $sum: { $size: '$seats' } }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 12 }
      ]),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: '$match', revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'matches', localField: '_id', foreignField: '_id', as: 'matchInfo' } }
      ])
    ]);

    res.json({ success: true, data: { revenueData, topMatches } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMatches, getMatchById, getLiveScores, createMatch, updateMatch, deleteMatch, getAnalytics };
