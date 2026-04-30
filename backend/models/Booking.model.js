const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * IBooking Interface:
 * { bookingRef: string, user: ObjectId, match: ObjectId, seats: IBookedSeat[],
 *   payment: IPayment, totalAmount: number, status: BookingStatus,
 *   refund: IRefund, eTicket: IETicket, createdAt: Date }
 */

const bookedSeatSchema = new mongoose.Schema({
  seatId: { type: String, required: true },
  section: { type: String, required: true },
  row: { type: String, required: true },
  number: { type: Number, required: true },
  tier: { type: String, required: true },
  price: { type: Number, required: true }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'wallet', 'net_banking'],
    required: true
  },
  transactionId: { type: String, default: () => uuidv4() },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partial_refund'],
    default: 'pending'
  },
  gatewayResponse: { type: String, default: '' },
  paidAt: { type: Date },
  // Masked card/UPI info for display
  maskedPaymentInfo: { type: String, default: '' }
}, { _id: false });

const refundSchema = new mongoose.Schema({
  requestedAt: { type: Date },
  processedAt: { type: Date },
  amount: { type: Number, default: 0 },
  reason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'processed'],
    default: 'none'
  },
  refundTransactionId: { type: String },
  adminNote: { type: String }
}, { _id: false });

const eTicketSchema = new mongoose.Schema({
  qrCode: { type: String, default: '' }, // Base64 QR image
  issuedAt: { type: Date, default: Date.now },
  isScanned: { type: Boolean, default: false },
  scannedAt: { type: Date }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingRef: {
    type: String,
    unique: true,
    default: () => `SP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true
  },
  seats: {
    type: [bookedSeatSchema],
    validate: [
      { validator: (arr) => arr.length > 0, message: 'At least one seat required' },
      { validator: (arr) => arr.length <= 10, message: 'Max 10 seats per booking' }
    ]
  },
  payment: { type: paymentSchema, required: true },
  subtotal: { type: Number, required: true },
  convenienceFee: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'refund_requested', 'refunded'],
    default: 'pending',
    index: true
  },
  refund: { type: refundSchema, default: () => ({ status: 'none' }) },
  eTicket: { type: eTicketSchema, default: () => ({}) },
  notes: { type: String, default: '' }
}, { timestamps: true });

// ATOMIC TRANSACTION: Prevent double-booking via pre-save hook
bookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    const session = this.$session();
    const seatIds = this.seats.map(s => s.seatId);

    // Check for existing confirmed bookings with same seats for same match
    const existing = await mongoose.model('Booking').findOne({
      match: this.match,
      'seats.seatId': { $in: seatIds },
      status: { $in: ['confirmed', 'pending'] }
    }).session(session);

    if (existing) {
      const err = new Error('One or more seats are already booked. Please refresh and try again.');
      err.status = 409;
      return next(err);
    }
  }
  next();
});

// Index for atomic seat checking
bookingSchema.index({ match: 1, 'seats.seatId': 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
