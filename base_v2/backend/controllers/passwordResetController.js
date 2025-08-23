const bcrypt = require('bcryptjs');
const db = require('../db');
const PasswordResetToken = require('../models/passwordResetToken');
const { sendPasswordResetEmail } = require('../services/emailService');

class PasswordResetController {
  // Request password reset
  static async requestReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Find user by email
      const user = await new Promise((resolve, reject) => {
        db.get(
          'SELECT user_id, user_email, first_name, last_name FROM base_master_users WHERE user_email = ?',
          [email],
          (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
          }
        );
      });

      // If user exists, generate and send reset token
      if (user) {
        const token = await PasswordResetToken.create(user.user_id);
        
        // Send email with reset link
        await sendPasswordResetEmail({
          to: user.user_email,
          name: `${user.first_name} ${user.last_name}`.trim() || 'User',
          token
        });
      }

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while processing your request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Reset password with token
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
      }

      // Find valid token
      const resetToken = await PasswordResetToken.findValid(token);
      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user password
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE base_master_users SET password_hash = ? WHERE user_id = ?',
          [hashedPassword, resetToken.user_id],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      // Mark token as used
      await PasswordResetToken.markAsUsed(token);

      // Invalidate all user sessions
      // (Implementation depends on your session store)

      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while resetting your password',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Validate reset token
  static async validateToken(req, res) {
    try {
      const { token } = req.params;
      
      const resetToken = await PasswordResetToken.findValid(token);
      
      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      res.json({
        success: true,
        email: resetToken.email
      });

    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = PasswordResetController;
