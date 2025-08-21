const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../modules/authentication/backend');
const { checkPermission } = require('../middleware/auth');
const { dbMethods } = require('../../modules/database/backend');

// POST: Create a new feature request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { main_function, sub_function, feature_name, feature_description, benefits, priority } = req.body;
    const requested_by_user_id = req.user.id;

    if (!main_function || !feature_name || !feature_description || !priority) {
      return res.status(400).json({ error: 'Missing required fields: main_function, feature_name, feature_description, priority' });
    }

    const db = req.app.locals.db;
    const sql = `
      INSERT INTO base_feature_requests (main_function, sub_function, feature_name, feature_description, benefits, priority, requested_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await dbMethods.run(db, sql, [main_function, sub_function, feature_name, feature_description, benefits, priority, requested_by_user_id]);
    const newRequest = await dbMethods.get(db, 'SELECT * FROM base_feature_requests WHERE feature_request_id = ?', [result.lastID]);

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Failed to create feature request' });
  }
});

// GET: Retrieve all feature requests (Admin only)
router.get('/', [authenticateToken, checkPermission('admin')], async (req, res) => {
  try {
    const db = req.app.locals.db;
    const sql = 'SELECT * FROM base_feature_requests ORDER BY created_at DESC';
    const requests = await dbMethods.all(db, sql);
    res.json(requests);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Failed to retrieve feature requests' });
  }
});

// PUT: Update a feature request (Admin only)
router.put('/:id', [authenticateToken, checkPermission('admin')], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, denial_reason } = req.body;

    if (!status && !priority && !denial_reason) {
      return res.status(400).json({ error: 'No updateable fields provided' });
    }

    const db = req.app.locals.db;
    let setClauses = [];
    let params = [];

    if (status) {
      setClauses.push('status = ?');
      params.push(status);
    }
    if (priority) {
      setClauses.push('priority = ?');
      params.push(priority);
    }
    if (denial_reason !== undefined) {
      setClauses.push('denial_reason = ?');
      params.push(denial_reason);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE base_feature_requests SET ${setClauses.join(', ')} WHERE feature_request_id = ?`;
    const result = await dbMethods.run(db, sql, params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Feature request not found' });
    }

    const updatedRequest = await dbMethods.get(db, 'SELECT * FROM base_feature_requests WHERE feature_request_id = ?', [id]);
    res.json(updatedRequest);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Failed to update feature request' });
  }
});

module.exports = router;
