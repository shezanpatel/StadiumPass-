const express = require('express');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  createBooking, requestRefund, processRefund,
  getMyBookings, getBookingById
} = require('../controllers/booking.controller');

const router = express.Router();

router.get('/my', protect, getMyBookings);
router.post('/', protect, createBooking);
router.get('/:id', protect, getBookingById);
router.post('/:id/refund', protect, requestRefund);
router.put('/:id/process-refund', protect, adminOnly, processRefund);

module.exports = router;
