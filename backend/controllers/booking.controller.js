const QRCode = require('qrcode');
const Booking = require('../models/Booking.model');
const Match = require('../models/Match.model');
const User = require('../models/User.model');

// @desc  Create booking
// @route POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { matchId, seats, paymentMethod, paymentInfo } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    if (match.status !== 'upcoming') return res.status(400).json({ success: false, message: 'Booking not available for this match.' });
    if (match.dateTime < new Date()) return res.status(400).json({ success: false, message: 'Match has already started.' });

    // Check for seat conflicts
    const seatIds = seats.map(s => s.seatId);
    const conflict = await Booking.findOne({
      match: matchId,
      'seats.seatId': { $in: seatIds },
      status: { $in: ['confirmed', 'pending'] }
    });
    if (conflict) return res.status(409).json({ success: false, message: 'One or more seats are already booked.' });

    // Build priced seats — use seat.price if already calculated, otherwise apply multiplier
    const pricedSeats = seats.map(seat => ({
      seatId: seat.seatId,
      section: seat.section,
      row: seat.row,
      number: seat.number,
      tier: seat.tier,
      price: seat.price
        ? Math.round(seat.price)
        : Math.round((seat.basePrice || 0) * (match.ticketPricing.dynamicMultiplier || 1))
    }));

    const subtotal = pricedSeats.reduce((sum, s) => sum + s.price, 0);
    const convenienceFee = Math.round(subtotal * 0.02);
    const taxes = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + convenienceFee + taxes;

    // Generate QR code
    const bookingRefTemp = `SP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const qrData = JSON.stringify({ ref: bookingRefTemp, match: match.title, user: req.user._id });
    const qrCode = await QRCode.toDataURL(qrData);

    // Create booking document
    const booking = await Booking.create({
      bookingRef: bookingRefTemp,
      user: req.user._id,
      match: matchId,
      seats: pricedSeats,
      payment: {
        method: paymentMethod,
        status: 'completed',
        maskedPaymentInfo: paymentInfo?.masked || '',
        paidAt: new Date()
      },
      subtotal,
      convenienceFee,
      taxes,
      totalAmount,
      status: 'confirmed',
      eTicket: { qrCode, issuedAt: new Date() }
    });

    // Update match booked seat count
    await Match.findByIdAndUpdate(matchId, { $inc: { bookedSeats: seats.length } });

    // Add booking to user record
    await User.findByIdAndUpdate(req.user._id, { $push: { bookings: booking._id } });

    // Notify via WebSocket if available
    req.io?.emit('seats_booked', { matchId, seatIds, status: 'booked' });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('match', 'title team1 team2 dateTime venue tournament')
      .populate('user', 'name email');

    res.status(201).json({ success: true, message: 'Booking confirmed!', data: { booking: populatedBooking } });
  } catch (error) {
    console.error('[createBooking ERROR]', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// @desc  Request refund — 24-hour rule enforced
// @route POST /api/bookings/:id/refund
const requestRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('match', 'dateTime title status');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: `Cannot refund a booking with status: ${booking.status}` });
    }

    const now = new Date();
    const matchDate = new Date(booking.match.dateTime);
    const hoursUntilMatch = (matchDate - now) / (1000 * 60 * 60);

    if (hoursUntilMatch < 24) {
      return res.status(400).json({
        success: false,
        message: 'Refund window has closed. Cancellations must be made at least 24 hours before the match.',
        data: {
          matchDateTime: matchDate,
          hoursRemaining: Math.max(0, Math.round(hoursUntilMatch)),
          refundDeadline: new Date(matchDate.getTime() - 24 * 60 * 60 * 1000)
        }
      });
    }

    const cancellationFee = Math.round(booking.totalAmount * 0.05);
    const refundAmount = booking.totalAmount - cancellationFee;

    booking.status = 'refund_requested';
    booking.refund = {
      requestedAt: now,
      amount: refundAmount,
      reason: req.body.reason || 'Customer requested cancellation',
      status: 'requested'
    };
    await booking.save();

    res.json({
      success: true,
      message: 'Refund request submitted. Processing within 5-7 business days.',
      data: { bookingRef: booking.bookingRef, refundAmount, cancellationFee, processingDays: '5-7 business days', refundStatus: 'requested' }
    });
  } catch (error) {
    console.error('[requestRefund ERROR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Process refund (Admin)
// @route PUT /api/bookings/:id/process-refund
const processRefund = async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    const booking = await Booking.findById(req.params.id).populate('match');

    if (!booking || booking.status !== 'refund_requested') {
      return res.status(400).json({ success: false, message: 'No pending refund for this booking.' });
    }

    if (action === 'approve') {
      booking.status = 'refunded';
      booking.refund.status = 'processed';
      booking.refund.processedAt = new Date();
      booking.refund.refundTransactionId = `RFD-${Date.now()}`;
      booking.refund.adminNote = adminNote;
      booking.payment.status = 'refunded';

      await User.findByIdAndUpdate(booking.user, { $inc: { walletBalance: booking.refund.amount } });
      await Match.findByIdAndUpdate(booking.match._id, { $inc: { bookedSeats: -booking.seats.length } });
    } else {
      booking.status = 'confirmed';
      booking.refund.status = 'rejected';
      booking.refund.adminNote = adminNote;
    }

    await booking.save();
    res.json({ success: true, message: `Refund ${action}d successfully.`, data: { booking } });
  } catch (error) {
    console.error('[processRefund ERROR]', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// @desc  Get user bookings
// @route GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('match', 'title team1 team2 dateTime venue tournament thumbnail status')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { bookings } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get booking by ID
// @route GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('match')
      .populate('user', 'name email phone');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    res.json({ success: true, data: { booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createBooking, requestRefund, processRefund, getMyBookings, getBookingById };
