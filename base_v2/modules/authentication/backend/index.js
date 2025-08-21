/**
 * Authentication Module - Backend Implementation
 * Created: 2025-06-26
 * Updated: 2025-08-07 - Aligned with new DB schema
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbMethods } = require('../../database/backend');

const JWT_SECRET = process.env.JWT_SECRET || 'employdex-base-v1-secure-jwt-secret';
const JWT_EXPIRES_IN = '24h';

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token is required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// User registration
router.post('/register', [
    body('user_email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('mobile_number').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { user_email, password, first_name, last_name, mobile_number } = req.body;
        const db = req.app.locals.db;

        const existingUser = await dbMethods.get(db, 'SELECT user_id FROM base_master_users WHERE user_email = ? OR mobile_number = ?', [user_email, mobile_number]);
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email or mobile number already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await dbMethods.run(db, 
            'INSERT INTO base_master_users (user_email, password_hash, first_name, last_name, mobile_number) VALUES (?, ?, ?, ?, ?)',
            [user_email, hashedPassword, first_name, last_name, mobile_number]
        );
        const newUserId = result.lastID;

        const defaultRole = await dbMethods.get(db, 'SELECT role_id FROM base_master_roles WHERE role_name = ?', ['User']);
        if (defaultRole) {
            await dbMethods.run(db, 'INSERT INTO base_role_user_link (user_id, role_id) VALUES (?, ?)', [newUserId, defaultRole.role_id]);
        }

        res.status(201).json({ message: 'User registered successfully', userId: newUserId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login
router.post('/login', [
    body('username').notEmpty(),
    body('password').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password } = req.body;
        const db = req.app.locals.db;

        // Fetch user record
        let user = null;
        if (username === 'admin') {
            // Special-case: default admin credentials use username 'admin'
            user = await dbMethods.get(
                db,
                `SELECT u.*
                 FROM base_master_users u
                 JOIN base_role_user_link ur ON u.user_id = ur.user_id
                 JOIN base_master_roles r ON ur.role_id = r.role_id
                 WHERE r.role_name = 'Admin'
                 ORDER BY u.user_id
                 LIMIT 1`
            );
        } else {
            user = await dbMethods.get(
                db,
                'SELECT * FROM base_master_users WHERE user_email = ? OR mobile_number = ?',
                [username, username]
            );
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // If the user is the default admin, check the password directly
        const isDefaultAdmin = username === 'admin' && password === 'Admin@123';
        const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');

        if (!isDefaultAdmin && !isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is disabled' });
        }

        const rolesAndPermissions = await dbMethods.all(db, 
            `SELECT r.role_name, p.permission_name
             FROM base_role_user_link ur
             JOIN base_master_roles r ON ur.role_id = r.role_id
             LEFT JOIN base_role_permission_link rp ON r.role_id = rp.role_id
             LEFT JOIN base_master_permissions p ON rp.permission_id = p.permission_id
             WHERE ur.user_id = ?`,
            [user.user_id]
        );

        const roles = [...new Set(rolesAndPermissions.map(item => item.role_name))];
        const permissions = [...new Set(rolesAndPermissions.filter(item => item.permission_name).map(item => item.permission_name))];

        const token = jwt.sign({ user: { id: user.user_id, user_email: user.user_email, roles, permissions } }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.json({ token, user: { id: user.user_id, user_email: user.user_email, first_name: user.first_name, last_name: user.last_name, roles, permissions } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = await dbMethods.get(db, 'SELECT user_id, user_email, first_name, last_name, mobile_number, is_active FROM base_master_users WHERE user_id = ?', [req.user.id]);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: { ...user, roles: req.user.roles, permissions: req.user.permissions } });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Initialize module
const init = (app) => {
    // Event bus listeners can be registered here if needed
};

module.exports = { router, init, authenticateToken };