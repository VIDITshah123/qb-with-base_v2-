const express = require('express');
const router = express.Router();
const PasswordResetController = require('../controllers/passwordResetController');
const { validate } = require('../middleware/validation');
const { body } = require('express-validator');

// Request password reset
router.post('/request', [
  body('email').isEmail().normalizeEmail()
], validate, PasswordResetController.requestReset);

// Reset password with token
router.post('/reset', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], validate, PasswordResetController.resetPassword);

// Validate reset token
router.get('/validate/:token', PasswordResetController.validateToken);

module.exports = router;
