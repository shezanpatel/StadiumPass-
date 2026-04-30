const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getMatches, getMatchById, getLiveScores,
  createMatch, updateMatch, deleteMatch, getAnalytics
} = require('../controllers/match.controller');

const router = express.Router();

// Validator: dateTime must be a valid ISO date in the future
const matchDateValidator = [
  body('dateTime')
    .notEmpty().withMessage('Date and time is required.')
    .isISO8601().withMessage('Invalid date format.')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Match date must be in the future.');
      }
      return true;
    }),
  body('team1').notEmpty().withMessage('Team 1 is required.'),
  body('team2').notEmpty().withMessage('Team 2 is required.'),
  body('title').notEmpty().withMessage('Title is required.'),
  body('venue').notEmpty().withMessage('Stadium ID is required.'),
  body('tournament').notEmpty().withMessage('Tournament is required.'),
];

// Middleware to return validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

// Public routes
router.get('/live-scores', getLiveScores);
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/', getMatches);
router.get('/:id', getMatchById);

// Admin-only routes — with validation
router.post('/',    protect, adminOnly, matchDateValidator, validate, createMatch);
router.put('/:id',  protect, adminOnly, matchDateValidator, validate, updateMatch);
router.delete('/:id', protect, adminOnly, deleteMatch);

module.exports = router;
