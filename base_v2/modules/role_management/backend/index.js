/**
 * Role Management Module - Backend Implementation
 * Created: 2025-06-27
 * Updated: 2025-08-07 - Aligned with new DB schema
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, checkPermissions } = require('../../../middleware/auth');
const { dbMethods } = require('../../database/backend');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Multer setup
const upload = multer({ dest: path.join(__dirname, '../../../uploads/') });

/**
 * @route GET /api/role_management/roles
 * @description Get all roles with permissions and user counts
 * @access Private - Requires role_view permission
 */
router.get('/roles', [authenticateToken, checkPermissions(['role_view'])], async (req, res) => {
  try {
    const db = req.app.locals.db;
    const roles = await dbMethods.all(db, 'SELECT * FROM base_master_roles ORDER BY role_name');

    for (const role of roles) {
      const permissions = await dbMethods.all(db, 
        `SELECT p.* FROM base_master_permissions p
         JOIN base_role_permission_link rp ON p.permission_id = rp.permission_id
         WHERE rp.role_id = ?`,
        [role.role_id]
      );
      role.permissions = permissions;

      const userCount = await dbMethods.get(db,
        'SELECT COUNT(user_id) as count FROM base_role_user_link WHERE role_id = ?',
        [role.role_id]
      );
      role.user_count = userCount.count;
    }

    res.json({ count: roles.length, roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to retrieve roles' });
  }
});

/**
 * @route GET /api/role_management/roles/:id
 * @description Get a specific role by ID
 * @access Private - Requires role_view permission
 */
router.get('/roles/:id', [authenticateToken, checkPermissions(['role_view'])], async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    const role = await dbMethods.get(db, 'SELECT * FROM base_master_roles WHERE role_id = ?', [id]);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const permissions = await dbMethods.all(db, 
      `SELECT p.* FROM base_master_permissions p
       JOIN base_role_permission_link rp ON p.permission_id = rp.permission_id
       WHERE rp.role_id = ?`,
      [id]
    );
    role.permissions = permissions;

    const users = await dbMethods.all(db, 
      `SELECT u.user_id, u.first_name, u.last_name, u.user_email
       FROM base_master_users u
       JOIN base_role_user_link ur ON u.user_id = ur.user_id
       WHERE ur.role_id = ? LIMIT 100`,
      [id]
    );
    role.users = users;

    res.json(role);
  } catch (error) {
    console.error(`Error fetching role ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve role details' });
  }
});

/**
 * @route POST /api/role_management/roles
 * @description Create a new role
 * @access Private - Requires role_create permission
 */
router.post('/roles', [
  authenticateToken, 
  checkPermissions(['role_create']),
  body('role_name').notEmpty(),
  body('permissions').isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { role_name, role_description, permissions } = req.body;
    const db = req.app.locals.db;

    const existingRole = await dbMethods.get(db, 'SELECT role_id FROM base_master_roles WHERE role_name = ?', [role_name]);
    if (existingRole) {
      return res.status(409).json({ error: 'A role with this name already exists' });
    }

    const result = await dbMethods.run(db, 
      'INSERT INTO base_master_roles (role_name, role_description) VALUES (?, ?)', 
      [role_name, role_description || '']
    );
    const newRoleId = result.lastID;

    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await dbMethods.run(db, 'INSERT INTO base_role_permission_link (role_id, permission_id) VALUES (?, ?)', [newRoleId, permissionId]);
      }
    }

    res.status(201).json({ message: 'Role created successfully', role_id: newRoleId });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

/**
 * @route PUT /api/role_management/roles/:id
 * @description Update role information
 * @access Private - Requires role_edit permission
 */
router.put('/roles/:id', [
  authenticateToken, 
  checkPermissions(['role_edit']),
  body('role_name').optional().notEmpty(),
  body('permissions').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { role_name, role_description, permissions } = req.body;
    const db = req.app.locals.db;

    const updateFields = [];
    const updateValues = [];

    if (role_name) { updateFields.push('role_name = ?'); updateValues.push(role_name); }
    if (role_description !== undefined) { updateFields.push('role_description = ?'); updateValues.push(role_description); }

    if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);
        await dbMethods.run(db, `UPDATE base_master_roles SET ${updateFields.join(', ')} WHERE role_id = ?`, updateValues);
    }

    if (permissions) {
        await dbMethods.run(db, 'DELETE FROM base_role_permission_link WHERE role_id = ?', [id]);
        for (const permissionId of permissions) {
            await dbMethods.run(db, 'INSERT INTO base_role_permission_link (role_id, permission_id) VALUES (?, ?)', [id, permissionId]);
        }
    }

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error(`Error updating role ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

/**
 * @route DELETE /api/role_management/roles/:id
 * @description Delete a role
 * @access Private - Requires role_delete permission
 */
router.delete('/roles/:id', [authenticateToken, checkPermissions(['role_delete'])], async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    if (parseInt(id, 10) <= 2) { // Prevent deletion of Admin/User roles
        return res.status(403).json({ error: 'Cannot delete system roles.' });
    }

    const userCount = await dbMethods.get(db, 'SELECT COUNT(*) as count FROM base_role_user_link WHERE role_id = ?', [id]);
    if (userCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete role with assigned users.' });
    }

    await dbMethods.run(db, 'DELETE FROM base_master_roles WHERE role_id = ?', [id]);

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error(`Error deleting role ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

/**
 * @route GET /api/role_management/roles/template
 * @description Download a CSV template for bulk role upload
 * @access Private - Requires role_create permission
 */
router.get('/roles/template', [authenticateToken, checkPermissions(['role_create'])], (req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=role-template.csv');
    res.send('role_name,role_description,permissions\n');
});

/**
 * @route POST /api/role_management/roles/bulk
 * @description Upload and process multiple roles from CSV file
 * @access Private - Requires role_create permission
 */
router.post('/roles/bulk', [authenticateToken, checkPermissions(['role_create']), upload.single('file')], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = req.app.locals.db;
    const results = { successful: 0, failed: 0, errors: [] };
    const stream = fs.createReadStream(req.file.path).pipe(csv());

    for await (const row of stream) {
        try {
            const { role_name, role_description, permissions } = row;
            if (!role_name) throw new Error('Missing role_name in CSV row');

            const result = await dbMethods.run(db, 
                'INSERT INTO base_master_roles (role_name, role_description) VALUES (?, ?)', 
                [role_name, role_description || '']
            );
            const newRoleId = result.lastID;

            if (permissions) {
                const permissionNames = permissions.split(';').map(p => p.trim()).filter(p => p);
                for (const permName of permissionNames) {
                    const permission = await dbMethods.get(db, 'SELECT permission_id FROM base_master_permissions WHERE permission_name = ?', [permName]);
                    if (permission) {
                        await dbMethods.run(db, 'INSERT INTO base_role_permission_link (role_id, permission_id) VALUES (?, ?)', [newRoleId, permission.permission_id]);
                    }
                }
            }
            results.successful++;
        } catch (error) {
            results.failed++;
            results.errors.push({ row, error: error.message });
        }
    }

    fs.unlinkSync(req.file.path);
    res.json(results);
});

// Define empty init function to maintain consistent module structure
const init = () => {};

// Export both router and init function for consistent module structure
module.exports = { router, init };