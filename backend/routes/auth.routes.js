// auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

const registerValidators = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name min 2 chars'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone required')
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
