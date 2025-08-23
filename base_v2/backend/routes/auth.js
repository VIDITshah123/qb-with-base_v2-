const express = require('express');
const router = express.Router();
const { login, getProfile, logout } = require('../controllers/authController');
const { requireAuth } = require('../config/session');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', requireAuth, getProfile);
router.post('/logout', requireAuth, logout);

module.exports = router;
