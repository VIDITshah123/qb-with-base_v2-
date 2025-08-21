/**
 * User Management Module - Backend Implementation
 * Created: 2025-06-27
 * Updated: 2025-08-07 - Aligned with new DB schema
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
// Import both authenticateToken and checkPermissions from auth.js
const { authenticateToken, checkPermissions } = require('../../../middleware/auth');
const { dbMethods } = require('../../database/backend');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Register module events
const registerModuleEvents = (eventBus) => {
  eventBus.on('user:updated', (data) => {
    console.log('User updated event received:', data);
  });

  eventBus.on('user:deleted', (data) => {
    console.log('User deleted event received:', data);
  });
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Initialize the module
const init = (app) => {
  if (app.locals.eventBus) {
    registerModuleEvents(app.locals.eventBus);
  }
};

/**
 * @route GET /api/user_management/users
 * @description Get all users with filtering and pagination
 * @access Private - Requires user_view permission
 */
router.get('/users', [authenticateToken, checkPermissions(['user_view'])], async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { isActive, search, role, limit = 10, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT u.* FROM base_master_users u
    `;
    const params = [];
    const whereConditions = [];

    if (isActive !== undefined) {
      whereConditions.push('u.is_active = ?');
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (search) {
      whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.user_email LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql.replace(/u.\*/, 'u.user_id')})`;
    const totalResult = await dbMethods.get(db, countSql, params);
    const total = totalResult.total;

    sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const users = await dbMethods.all(db, sql, params);

    for (const user of users) {
      const roles = await dbMethods.all(db, 
        `SELECT r.role_id, r.role_name 
         FROM base_master_roles r 
         JOIN base_role_user_link ur ON r.role_id = ur.role_id 
         WHERE ur.user_id = ?`,
        [user.user_id]
      );
      user.roles = roles;
    }

    res.json({
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @route POST /api/user_management/users
 * @description Create a new user
 * @access Private - Requires user_create permission
 */
router.post('/users', [
  authenticateToken, 
  checkPermissions(['user_create']),
  body('first_name').notEmpty(),
  body('last_name').notEmpty(),
  body('user_email').isEmail(),
  body('mobile_number').notEmpty(),
  body('password').isLength({ min: 8 }),
  body('roles').isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { first_name, last_name, user_email, mobile_number, password, roles } = req.body;
    const db = req.app.locals.db;

    const existingUser = await dbMethods.get(db, 
      'SELECT user_id FROM base_master_users WHERE user_email = ? OR mobile_number = ?', 
      [user_email, mobile_number]
    );
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email or mobile already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await dbMethods.run(db, 
      `INSERT INTO base_master_users (first_name, last_name, user_email, mobile_number, password_hash, is_active) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [first_name, last_name, user_email, mobile_number, hashedPassword]
    );
    const newUserId = result.lastID;

    if (roles && roles.length > 0) {
      for (const roleId of roles) {
        await dbMethods.run(db, 'INSERT INTO base_role_user_link (user_id, role_id) VALUES (?, ?)', [newUserId, roleId]);
      }
    } else {
      const defaultRole = await dbMethods.get(db, 'SELECT role_id FROM base_master_roles WHERE role_name = ?', ['User']);
      if (defaultRole) {
        await dbMethods.run(db, 'INSERT INTO base_role_user_link (user_id, role_id) VALUES (?, ?)', [newUserId, defaultRole.role_id]);
      }
    }

    res.status(201).json({ message: 'User created successfully', user_id: newUserId });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * @route GET /api/user_management/users/:id
 * @description Get user by ID
 * @access Private - Requires user_view permission
 */
router.get('/users/:id', [authenticateToken, checkPermissions(['user_view'])], async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    const user = await dbMethods.get(db, 'SELECT * FROM base_master_users WHERE user_id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roles = await dbMethods.all(db, 
      `SELECT r.role_id, r.role_name 
       FROM base_master_roles r 
       JOIN base_role_user_link ur ON r.role_id = ur.role_id 
       WHERE ur.user_id = ?`,
      [id]
    );

    res.json({ ...user, roles });

  } catch (error) {
    console.error(`Error fetching user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

/**
 * @route PUT /api/user_management/users/:id
 * @description Update user information
 * @access Private - Requires user_edit permission
 */
router.put('/users/:id', [
    authenticateToken, 
    checkPermissions(['user_edit']),
    body('first_name').optional().notEmpty(),
    body('last_name').optional().notEmpty(),
    body('user_email').optional().isEmail(),
    body('mobile_number').optional().notEmpty(),
    body('roles').optional().isArray()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { id } = req.params;
        const { first_name, last_name, user_email, mobile_number, roles } = req.body;
        const db = req.app.locals.db;

        const updateFields = [];
        const updateValues = [];

        if (first_name) { updateFields.push('first_name = ?'); updateValues.push(first_name); }
        if (last_name) { updateFields.push('last_name = ?'); updateValues.push(last_name); }
        if (user_email) { updateFields.push('user_email = ?'); updateValues.push(user_email); }
        if (mobile_number) { updateFields.push('mobile_number = ?'); updateValues.push(mobile_number); }

        if (updateFields.length > 0) {
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(id);
            await dbMethods.run(db, `UPDATE base_master_users SET ${updateFields.join(', ')} WHERE user_id = ?`, updateValues);
        }

        if (roles) {
            await dbMethods.run(db, 'DELETE FROM base_role_user_link WHERE user_id = ?', [id]);
            for (const roleId of roles) {
                await dbMethods.run(db, 'INSERT INTO base_role_user_link (user_id, role_id) VALUES (?, ?)', [id, roleId]);
            }
        }

        res.json({ message: 'User updated successfully' });

    } catch (error) {
        console.error(`Error updating user ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * @route PATCH /api/user_management/users/:id/status
 * @description Toggle user active status
 * @access Private - Requires user_edit permission
 */
router.patch('/users/:id/status', [
    authenticateToken, 
    checkPermissions(['user_edit']),
    body('is_active').isBoolean()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const db = req.app.locals.db;

        await dbMethods.run(db, 
            'UPDATE base_master_users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', 
            [is_active ? 1 : 0, id]
        );

        res.json({ message: `User ${is_active ? 'activated' : 'deactivated'} successfully` });

    } catch (error) {
        console.error(`Error updating user status ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

/**
 * @route DELETE /api/user_management/users/:id
 * @description Delete a user
 * @access Private - Requires user_delete permission
 */
router.delete('/users/:id', [authenticateToken, checkPermissions(['user_delete'])], async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    const userToDelete = await dbMethods.get(db, 'SELECT * FROM base_master_users WHERE user_id = ?', [id]);
    if (!userToDelete) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Simple check to prevent deleting user with ID 1 (commonly admin)
    if (parseInt(id, 10) === 1) {
        return res.status(403).json({ error: 'Cannot delete primary administrator account.' });
    }

    await dbMethods.run(db, 'DELETE FROM base_master_users WHERE user_id = ?', [id]);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error(`Error deleting user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * @route GET /api/user_management/users/template
 * @description Download a CSV template for bulk user upload
 * @access Private - Requires user_create permission
 */
router.get('/users/template', [authenticateToken, checkPermissions(['user_create'])], (req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=user_template.csv');
    res.send('first_name,last_name,user_email,mobile_number,password,roles\n');
});

/**
 * @route POST /api/user_management/users/bulk
 * @description Upload and process multiple users from CSV file
 * @access Private - Requires user_create permission
 */
router.post('/users/bulk', [authenticateToken, checkPermissions(['user_create']), upload.single('file')], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = req.app.locals.db;
    const results = { successful: 0, failed: 0, errors: [] };
    const stream = fs.createReadStream(req.file.path).pipe(csv());

    for await (const row of stream) {
        try {
            const { first_name, last_name, user_email, mobile_number, password, roles } = row;
            if (!first_name || !last_name || !user_email || !password || !roles) {
                throw new Error('Missing required fields in CSV row');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await dbMethods.run(db, 
                `INSERT INTO base_master_users (first_name, last_name, user_email, mobile_number, password_hash) VALUES (?, ?, ?, ?, ?) `,
                [first_name, last_name, user_email, mobile_number, hashedPassword]
            );
            const newUserId = result.lastID;

            const roleNames = roles.split(',').map(r => r.trim());
            for (const roleName of roleNames) {
                const role = await dbMethods.get(db, 'SELECT role_id FROM base_master_roles WHERE role_name = ?', [roleName]);
                if (role) {
                    await dbMethods.run(db, 'INSERT INTO base_role_user_link (user_id, role_id) VALUES (?, ?)', [newUserId, role.role_id]);
                }
            }
            results.successful++;
        } catch (error) {
            results.failed++;
            results.errors.push({ row, error: error.message });
        }
    }

    fs.unlinkSync(req.file.path); // Clean up uploaded file
    res.json(results);
});


// Initialize module when imported
router.init = init;

// Export both the router and init function
module.exports = { router, init };