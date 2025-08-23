const db = require('../config/database');
const { format } = require('date-fns');

class Notification {
  /**
   * Create a new notification
   * @param {Object} data - Notification data
   * @param {number} data.userId - ID of the user to notify
   * @param {string} data.typeName - Name of the notification type
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} [data.relatedEntityType] - Type of related entity (e.g., 'question', 'comment')
   * @param {number} [data.relatedEntityId] - ID of the related entity
   * @param {Object} [data.metadata] - Additional metadata as an object
   * @returns {Promise<Object>} Created notification
   */
  static async create({
    userId,
    typeName,
    title,
    message,
    relatedEntityType = null,
    relatedEntityId = null,
    metadata = {}
  }) {
    return new Promise((resolve, reject) => {
      // First, get the type ID
      db.get(
        'SELECT type_id FROM qb_notification_types WHERE name = ?',
        [typeName],
        (err, type) => {
          if (err) return reject(err);
          if (!type) {
            return reject(new Error(`Notification type '${typeName}' not found`));
          }

          // Insert the notification
          const metadataJson = JSON.stringify(metadata);
          const stmt = db.prepare(`
            INSERT INTO qb_notifications 
            (type_id, user_id, title, message, related_entity_type, related_entity_id, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          stmt.run(
            [
              type.type_id,
              userId,
              title,
              message,
              relatedEntityType,
              relatedEntityId,
              metadataJson
            ],
            function (err) {
              if (err) return reject(err);
              resolve(this.lastID);
            }
          );
          stmt.finalize();
        }
      );
    });
  }

  /**
   * Get notifications for a user
   * @param {number} userId - ID of the user
   * @param {Object} [options] - Query options
   * @param {boolean} [options.unreadOnly=false] - Only fetch unread notifications
   * @param {number} [options.limit=20] - Number of notifications to return
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Array>} List of notifications
   */
  static async getForUser(userId, { unreadOnly = false, limit = 20, offset = 0 } = {}) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          n.notification_id as id,
          n.title,
          n.message,
          n.is_read as isRead,
          n.related_entity_type as entityType,
          n.related_entity_id as entityId,
          n.metadata,
          n.created_at as createdAt,
          n.read_at as readAt,
          nt.name as type,
          nt.display_name as displayType
        FROM qb_notifications n
        JOIN qb_notification_types nt ON n.type_id = nt.type_id
        WHERE n.user_id = ?
        ${unreadOnly ? 'AND n.is_read = 0' : ''}
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.all(query, [userId, limit, offset], (err, rows) => {
        if (err) return reject(err);
        
        // Parse metadata JSON
        const notifications = rows.map(notification => ({
          ...notification,
          metadata: notification.metadata ? JSON.parse(notification.metadata) : {},
          createdAt: format(new Date(notification.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          readAt: notification.readAt ? format(new Date(notification.readAt), 'yyyy-MM-dd HH:mm:ss') : null
        }));
        
        resolve(notifications);
      });
    });
  }

  /**
   * Mark a notification as read
   * @param {number} notificationId - ID of the notification
   * @param {number} userId - ID of the user who owns the notification
   * @returns {Promise<boolean>} True if the notification was updated
   */
  static async markAsRead(notificationId, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE qb_notifications 
         SET is_read = 1, read_at = CURRENT_TIMESTAMP 
         WHERE notification_id = ? AND user_id = ?`,
        [notificationId, userId],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - ID of the user
   * @returns {Promise<number>} Number of notifications marked as read
   */
  static async markAllAsRead(userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE qb_notifications 
         SET is_read = 1, read_at = CURRENT_TIMESTAMP 
         WHERE user_id = ? AND is_read = 0`,
        [userId],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  }

  /**
   * Get unread notification count for a user
   * @param {number} userId - ID of the user
   * @returns {Promise<number>} Number of unread notifications
   */
  static async getUnreadCount(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM qb_notifications WHERE user_id = ? AND is_read = 0',
        [userId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row ? row.count : 0);
        }
      );
    });
  }

  /**
   * Get user notification preferences
   * @param {number} userId - ID of the user
   * @returns {Promise<Object>} User's notification preferences
   */
  static async getUserPreferences(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           nt.type_id as typeId,
           nt.name as type,
           nt.display_name as displayName,
           nt.description,
           COALESCE(p.email_enabled, 1) as emailEnabled,
           COALESCE(p.in_app_enabled, 1) as inAppEnabled
         FROM qb_notification_types nt
         LEFT JOIN qb_user_notification_prefs p ON nt.type_id = p.type_id AND p.user_id = ?
         WHERE nt.is_active = 1`,
        [userId],
        (err, rows) => {
          if (err) return reject(err);
          
          const preferences = {};
          rows.forEach(row => {
            preferences[row.type] = {
              typeId: row.typeId,
              displayName: row.displayName,
              description: row.description,
              emailEnabled: Boolean(row.emailEnabled),
              inAppEnabled: Boolean(row.inAppEnabled)
            };
          });
          
          resolve(preferences);
        }
      );
    });
  }

  /**
   * Update user notification preferences
   * @param {number} userId - ID of the user
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<boolean>} True if preferences were updated
   */
  static async updatePreferences(userId, preferences) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const stmt = db.prepare(`
          INSERT INTO qb_user_notification_prefs 
          (user_id, type_id, email_enabled, in_app_enabled)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, type_id) 
          DO UPDATE SET 
            email_enabled = excluded.email_enabled,
            in_app_enabled = excluded.in_app_enabled,
            updated_at = CURRENT_TIMESTAMP
        `);

        try {
          // Process each preference
          const types = Object.keys(preferences);
          types.forEach(typeName => {
            const typePrefs = preferences[typeName];
            stmt.run(
              userId,
              typePrefs.typeId,
              typePrefs.emailEnabled ? 1 : 0,
              typePrefs.inAppEnabled ? 1 : 0
            );
          });

          stmt.finalize();
          db.run('COMMIT', (err) => {
            if (err) return reject(err);
            resolve(true);
          });
        } catch (err) {
          db.run('ROLLBACK');
          reject(err);
        }
      });
    });
  }

  /**
   * Get notifications that need to be emailed
   * @param {number} [limit=50] - Maximum number of notifications to return
   * @returns {Promise<Array>} List of notifications to email
   */
  static async getNotificationsToEmail(limit = 50) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          n.notification_id as id,
          n.user_id as userId,
          u.email,
          n.title,
          n.message,
          n.metadata,
          n.created_at as createdAt,
          nt.name as type
        FROM qb_notifications n
        JOIN base_master_users u ON n.user_id = u.user_id
        JOIN qb_notification_types nt ON n.type_id = nt.type_id
        LEFT JOIN qb_user_notification_prefs p ON 
          n.user_id = p.user_id AND 
          n.type_id = p.type_id
        WHERE 
          n.is_emailed = 0 AND
          (p.email_enabled IS NULL OR p.email_enabled = 1)
        ORDER BY n.created_at
        LIMIT ?
      `;

      db.all(query, [limit], (err, rows) => {
        if (err) return reject(err);
        
        // Parse metadata JSON
        const notifications = rows.map(notification => ({
          ...notification,
          metadata: notification.metadata ? JSON.parse(notification.metadata) : {}
        }));
        
        // Mark notifications as emailed
        if (notifications.length > 0) {
          const ids = notifications.map(n => n.id);
          db.run(
            `UPDATE qb_notifications 
             SET is_emailed = 1 
             WHERE notification_id IN (${ids.map(() => '?').join(',')})`,
            ids,
            (err) => {
              if (err) console.error('Error marking notifications as emailed:', err);
            }
          );
        }
        
        resolve(notifications);
      });
    });
  }
}

module.exports = Notification;
