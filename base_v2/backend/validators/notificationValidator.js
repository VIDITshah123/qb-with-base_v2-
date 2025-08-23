const { body, param, query } = require('express-validator');

// Validation for getting notifications
const getNotificationsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a positive integer'),
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean')
    .toBoolean()
];

// Validation for marking a notification as read
const markAsReadValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a positive integer')
];

// Validation for notification preferences
const notificationPreferenceValidation = {
  typeId: body('*.typeId')
    .isInt({ min: 1 })
    .withMessage('Type ID must be a positive integer'),
  emailEnabled: body('*.emailEnabled')
    .optional()
    .isBoolean()
    .withMessage('emailEnabled must be a boolean')
    .toBoolean(),
  inAppEnabled: body('*.inAppEnabled')
    .optional()
    .isBoolean()
    .withMessage('inAppEnabled must be a boolean')
    .toBoolean()
};

// Validation for updating notification preferences
const updatePreferencesValidation = [
  body()
    .isObject()
    .withMessage('Preferences must be an object'),
  body('*')
    .isObject()
    .withMessage('Each preference must be an object')
    .custom((value, { req }) => {
      // Validate that the key is a valid notification type
      const validTypes = [
        'question_created',
        'question_updated',
        'question_status_changed',
        'question_commented',
        'answer_posted',
        'answer_accepted',
        'mention',
        'review_requested',
        'review_submitted',
        'system_announcement'
      ];
      
      return validTypes.includes(req.path.split('/').pop()) || 
        validTypes.includes(Object.keys(req.body)[0]);
    })
    .withMessage('Invalid notification type'),
  ...Object.values(notificationPreferenceValidation)
];

// Validation for creating a notification (admin only)
const createNotificationValidation = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('typeName')
    .isString()
    .isIn([
      'question_created',
      'question_updated',
      'question_status_changed',
      'question_commented',
      'answer_posted',
      'answer_accepted',
      'mention',
      'review_requested',
      'review_submitted',
      'system_announcement'
    ])
    .withMessage('Invalid notification type'),
  body('title')
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('message')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Message is required'),
  body('relatedEntityType')
    .optional()
    .isString()
    .isIn(['question', 'answer', 'comment', 'review'])
    .withMessage('Invalid entity type'),
  body('relatedEntityId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Entity ID must be a positive integer')
    .custom((value, { req }) => {
      // If relatedEntityType is provided, relatedEntityId must also be provided
      if (req.body.relatedEntityType && !value) {
        throw new Error('Entity ID is required when entity type is provided');
      }
      return true;
    }),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// Validation for getting notification types (admin only)
const getNotificationTypesValidation = [
  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('includeInactive must be a boolean')
    .toBoolean()
];

// Validation for creating/updating notification types (admin only)
const notificationTypeValidation = [
  body('name')
    .isString()
    .trim()
    .matches(/^[a-z_]+$/)
    .withMessage('Name must be lowercase with underscores'),
  body('displayName')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('template')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Template is required'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean()
];

module.exports = {
  getNotificationsValidation,
  markAsReadValidation,
  updatePreferencesValidation,
  createNotificationValidation,
  getNotificationTypesValidation,
  notificationTypeValidation
};
