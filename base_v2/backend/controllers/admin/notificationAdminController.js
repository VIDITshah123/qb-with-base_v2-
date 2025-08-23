const Notification = require('../../models/notification');
const db = require('../../config/database');

/**
 * @swagger
 * tags:
 *   name: Admin - Notifications
 *   description: Admin endpoints for managing notifications
 */

/**
 * @swagger
 * /api/admin/notifications:
 *   post:
 *     summary: Create a notification (Admin only)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotificationRequest'
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 */
const createNotification = async (req, res, next) => {
  try {
    const { userId, typeName, title, message, relatedEntityType, relatedEntityId, metadata = {} } = req.body;
    
    const notificationId = await Notification.create({
      userId,
      typeName,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      metadata
    });
    
    const [notification] = await Notification.getForUser(userId, { limit: 1 });
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/admin/notifications/types:
 *   get:
 *     summary: Get all notification types (Admin only)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive notification types
 *     responses:
 *       200:
 *         description: List of notification types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationType'
 */
const getNotificationTypes = async (req, res, next) => {
  try {
    const { includeInactive = false } = req.query;
    
    const query = `
      SELECT 
        type_id as id,
        name,
        display_name as displayName,
        description,
        template,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM qb_notification_types
      ${!includeInactive ? 'WHERE is_active = 1' : ''}
      ORDER BY name
    `;
    
    db.all(query, [], (err, types) => {
      if (err) return next(err);
      res.json({
        success: true,
        data: types
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/admin/notifications/types:
 *   post:
 *     summary: Create a new notification type (Admin only)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationTypeRequest'
 *     responses:
 *       201:
 *         description: Notification type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationType'
 */
const createNotificationType = async (req, res, next) => {
  try {
    const { name, displayName, description, template, isActive = true } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO qb_notification_types 
      (name, display_name, description, template, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      [name, displayName, description, template, isActive ? 1 : 0],
      function (err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({
              success: false,
              message: 'A notification type with this name already exists'
            });
          }
          return next(err);
        }
        
        // Get the created notification type
        db.get(
          'SELECT * FROM qb_notification_types WHERE type_id = ?',
          [this.lastID],
          (err, type) => {
            if (err) return next(err);
            
            res.status(201).json({
              success: true,
              data: {
                id: type.type_id,
                name: type.name,
                displayName: type.display_name,
                description: type.description,
                template: type.template,
                isActive: type.is_active === 1,
                createdAt: type.created_at,
                updatedAt: type.updated_at
              }
            });
          }
        );
      }
    );
    
    stmt.finalize();
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/admin/notifications/types/{id}:
 *   put:
 *     summary: Update a notification type (Admin only)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationTypeRequest'
 *     responses:
 *       200:
 *         description: Notification type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationType'
 */
const updateNotificationType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, displayName, description, template, isActive } = req.body;
    
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (displayName !== undefined) {
      updates.push('display_name = ?');
      params.push(displayName);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (template !== undefined) {
      updates.push('template = ?');
      params.push(template);
    }
    
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    params.push(id);
    
    const query = `
      UPDATE qb_notification_types 
      SET ${updates.join(', ')}
      WHERE type_id = ?
    `;
    
    db.run(query, params, function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({
            success: false,
            message: 'A notification type with this name already exists'
          });
        }
        return next(err);
      }
      
      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification type not found'
        });
      }
      
      // Get the updated notification type
      db.get(
        'SELECT * FROM qb_notification_types WHERE type_id = ?',
        [id],
        (err, type) => {
          if (err) return next(err);
          
          res.json({
            success: true,
            data: {
              id: type.type_id,
              name: type.name,
              displayName: type.display_name,
              description: type.description,
              template: type.template,
              isActive: type.is_active === 1,
              createdAt: type.created_at,
              updatedAt: type.updated_at
            }
          });
        }
      );
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/admin/notifications/types/{id}:
 *   delete:
 *     summary: Delete a notification type (Admin only)
 *     tags: [Admin - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification type ID
 *     responses:
 *       200:
 *         description: Notification type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
const deleteNotificationType = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if the notification type is being used
    db.get(
      'SELECT COUNT(*) as count FROM qb_notifications WHERE type_id = ?',
      [id],
      (err, result) => {
        if (err) return next(err);
        
        if (result.count > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete notification type that is in use'
          });
        }
        
        // Delete the notification type
        db.run(
          'DELETE FROM qb_notification_types WHERE type_id = ?',
          [id],
          function (err) {
            if (err) return next(err);
            
            if (this.changes === 0) {
              return res.status(404).json({
                success: false,
                message: 'Notification type not found'
              });
            }
            
            res.json({
              success: true,
              message: 'Notification type deleted successfully'
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotificationTypes,
  createNotificationType,
  updateNotificationType,
  deleteNotificationType
};
