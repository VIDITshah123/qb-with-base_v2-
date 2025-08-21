/**
 * Logging Module - Backend Implementation
 * Created: 2025-06-27
 * Updated: 2025-08-07 - Aligned with new DB schema
 */

const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const { authenticateToken, checkPermissions } = require('../../../middleware/auth');
const { dbMethods } = require('../../database/backend');

// Event listener for logging activities
const logActivity = async (data) => {
    try {
        const db = global.app.locals.db;
        const { 
            user_id = 1, // Default to system user if not provided
            user_action = 'system_action', // Default action if not provided
            activity_details = 'No details provided', // Default details
            user_ip_address = '127.0.0.1', // Default to localhost
            user_agent // Can be null
        } = data || {};
        
        await dbMethods.run(db, 
            `INSERT INTO base_activity_logs (user_id, user_action, activity_details, user_ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, user_action, activity_details, user_ip_address, user_agent]
        );
    } catch (error) {
        console.error('Error in logActivity:', error);
    }
};

// Initialize the module
const init = (app) => {
    if (app.locals.eventBus) {
        global.app = app; // Make app accessible to event handlers
        app.locals.eventBus.on('log:activity', logActivity);
        console.log('Logging module initialized and listening for events.');
    }
};

/**
 * @route GET /api/logging/activity
 * @description Get activity logs with pagination and filtering
 * @access Private - Requires activity_view permission
 */
router.get('/activity', [
    authenticateToken, 
    checkPermissions(['activity_view']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('user_action').optional().isString(),
    query('user_id').optional().isInt({ min: 1 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const db = req.app.locals.db;
        const { page = 1, limit = 50, user_action, user_id, start_date, end_date } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT al.*, u.first_name, u.last_name, u.user_email
            FROM base_activity_logs al
            LEFT JOIN base_master_users u ON al.user_id = u.user_id
        `;
        let countSql = 'SELECT COUNT(*) as total FROM base_activity_logs al';
        const params = [];
        const whereClauses = [];

        if (user_action) { whereClauses.push('al.user_action = ?'); params.push(user_action); }
        if (user_id) { whereClauses.push('al.user_id = ?'); params.push(user_id); }
        if (start_date) { whereClauses.push('al.created_at >= ?'); params.push(start_date); }
        if (end_date) { whereClauses.push('al.created_at <= ?'); params.push(end_date); }

        if (whereClauses.length > 0) {
            const whereString = ` WHERE ${whereClauses.join(' AND ')}`;
            sql += whereString;
            countSql += whereString;
        }

        sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const logs = await dbMethods.all(db, sql, params);
        const totalResult = await dbMethods.get(db, countSql, params.slice(0, -2));
        const total = totalResult.total;

        res.json({ 
            logs, 
            pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } 
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ error: 'Failed to retrieve activity logs' });
    }
});

/**
 * @route GET /api/logging/actions
 * @description Get all unique action types for filtering
 * @access Private - Requires activity_view permission
 */
router.get('/actions', [authenticateToken, checkPermissions(['activity_view'])], async (req, res) => {
    try {
        const db = req.app.locals.db;
        const actions = await dbMethods.all(db, 'SELECT DISTINCT user_action FROM base_activity_logs ORDER BY user_action');
        res.json({ actionTypes: actions.map(a => a.user_action) });
    } catch (error) {
        console.error('Error fetching action types:', error);
        res.status(500).json({ error: 'Failed to retrieve action types' });
    }
});

/**
 * @route GET /api/logging/stats
 * @description Get activity log statistics
 * @access Private - Requires activity_view permission
 */
router.get('/stats', [authenticateToken, checkPermissions(['activity_view'])], async (req, res) => {
    try {
        const db = req.app.locals.db;
        const actionCounts = await dbMethods.all(db, 'SELECT user_action, COUNT(*) as count FROM base_activity_logs GROUP BY user_action ORDER BY count DESC');
        const dailyActivity = await dbMethods.all(db, 
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM base_activity_logs WHERE created_at >= DATE('now', '-7 days') 
             GROUP BY date ORDER BY date`
        );
        const topUsers = await dbMethods.all(db, 
            `SELECT u.user_id, u.first_name, u.last_name, COUNT(*) as action_count
             FROM base_activity_logs al
             JOIN base_master_users u ON al.user_id = u.user_id
             GROUP BY al.user_id ORDER BY action_count DESC LIMIT 5`
        );

        res.json({ actionCounts, dailyActivity, topUsers });
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({ error: 'Failed to retrieve stats' });
    }
});

/**
 * @route GET /api/logging/entities
 * @description Get all unique entity types for filtering
 * @access Private - Requires activity_view permission
 */
router.get('/entities', [authenticateToken, checkPermissions(['activity_view'])], async (req, res) => {
    try {
        const db = req.app.locals.db;
        const entities = await dbMethods.all(db, 'SELECT DISTINCT entity_type FROM base_activity_logs WHERE entity_type IS NOT NULL ORDER BY entity_type');
        res.json({ entityTypes: entities.map(e => e.entity_type) });
    } catch (error) {
        console.error('Error fetching entity types:', error);
        res.status(500).json({ error: 'Failed to retrieve entity types' });
    }
});

module.exports = { router, init };