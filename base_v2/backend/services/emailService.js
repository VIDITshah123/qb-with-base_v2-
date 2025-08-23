const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const ejs = require('ejs');

// Create a test account if in development
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASSWORD || 'password'
  }
});

// In development, log the test account credentials
if (process.env.NODE_ENV === 'development') {
  console.log('Dev Email Credentials:', {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASSWORD || 'ethereal-password'
  });
}

// Load email templates
const loadTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.ejs`);
    const template = await fs.readFile(templatePath, 'utf-8');
    return ejs.render(template, data);
  } catch (error) {
    console.error('Error loading email template:', error);
    throw new Error('Failed to load email template');
  }
};

// Send password reset email
const sendPasswordResetEmail = async ({ to, name, token }) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const html = await loadTemplate('password-reset', { name, resetUrl });

    const mailOptions = {
      from: `"Question Bank" <${process.env.EMAIL_FROM || 'noreply@questionbank.com'}>`,
      to,
      subject: 'Password Reset Request',
      html,
      text: `Hello ${name},\n\nYou requested to reset your password. Please click the following link to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Send password changed confirmation
const sendPasswordChangedEmail = async ({ to, name }) => {
  try {
    const html = await loadTemplate('password-changed', { name });

    const mailOptions = {
      from: `"Question Bank" <${process.env.EMAIL_FROM || 'noreply@questionbank.com'}>`,
      to,
      subject: 'Your Password Has Been Changed',
      html,
      text: `Hello ${name},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact our support team immediately.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password changed email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password changed email:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};
