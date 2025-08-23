const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const notificationValidator = require('../validators/notificationValidator');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The notification ID
 *         title:
 *           type: string
 *           description: The notification title
 *         message:
 *           type: string
 *           description: The notification message
 *         isRead:
 *           type: boolean
 *           description: Whether the notification has been read
 *         entityType:
 *           type: string
 *           description: Type of the related entity (e.g., 'question', 'answer')
 *         entityId:
 *           type: integer
 *           description: ID of the related entity
 *         metadata:
 *           type: object
 *           description: Additional metadata for the notification
 *         type:
 *           type: string
 *           description: Notification type
 *         displayType:
 *           type: string
 *           description: Human-readable notification type
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was created
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was read (null if unread)
 * 
 *     NotificationPreference:
 *       type: object
 *       properties:
 *         typeId:
 *           type: integer
 *           description: The notification type ID
 *         type:
 *           type: string
 *           description: The notification type name
 *         displayName:
 *           type: string
 *           description: Human-readable notification type
 *         description:
 *           type: string
 *           description: Description of the notification type
 *         emailEnabled:
 *           type: boolean
 *           description: Whether email notifications are enabled
 *         inAppEnabled:
 *           type: boolean
 *           description: Whether in-app notifications are enabled
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of items
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         offset:
 *           type: integer
 *           description: Current offset
 */

// Get user notifications
router.get(
  '/',
  authenticate,
  validate(notificationValidator.getNotificationsValidation),
  notificationController.getNotifications
);

// Mark a notification as read
router.post(
  '/:id/read',
  authenticate,
  validate(notificationValidator.markAsReadValidation),
  notificationController.markAsRead
);

// Mark all notifications as read
router.post(
  '/read-all',
  authenticate,
  notificationController.markAllAsRead
);

// Get notification preferences
router.get(
  '/preferences',
  authenticate,
  notificationController.getPreferences
);

// Update notification preferences
router.put(
  '/preferences',
  authenticate,
  validate(notificationValidator.updatePreferencesValidation),
  notificationController.updatePreferences
);

// Get unread notifications count
router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount
);

// Admin routes
if (process.env.NODE_ENV === 'development') {
  const adminController = require('../controllers/admin/notificationAdminController');
  
  // Create a notification (admin only)
  router.post(
    '/',
    authenticate,
    authorize(['admin']),
    validate(notificationValidator.createNotificationValidation),
    adminController.createNotification
  );
  
  // Get all notification types (admin only)
  router.get(
    '/types',
    authenticate,
    authorize(['admin']),
    validate(notificationValidator.getNotificationTypesValidation),
    adminController.getNotificationTypes
  );
  
  // Create a notification type (admin only)
  router.post(
    '/types',
    authenticate,
    authorize(['admin']),
    validate(notificationValidator.notificationTypeValidation),
    adminController.createNotificationType
  );
  
  // Update a notification type (admin only)
  router.put(
    '/types/:id',
    authenticate,
    authorize(['admin']),
    validate([
      param('id').isInt().withMessage('Invalid notification type ID')
    ]),
    validate(notificationValidator.notificationTypeValidation),
    adminController.updateNotificationType
  );
  
  // Delete a notification type (admin only)
  router.delete(
    '/types/:id',
    authenticate,
    authorize(['admin']),
    validate([
      param('id').isInt().withMessage('Invalid notification type ID')
    ]),
    adminController.deleteNotificationType
  );
}

module.exports = router;
