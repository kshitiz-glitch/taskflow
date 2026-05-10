const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
], register);

router.post('/login', [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], login);

router.get('/me', authenticate, getMe);

router.put('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('avatar').optional().isURL().withMessage('Invalid avatar URL'),
  validate,
], updateProfile);

router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate,
], changePassword);

module.exports = router;
