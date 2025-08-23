const WebSocket = require('ws');
const Notification = require('../models/notification');
const { format } = require('date-fns');

class NotificationService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws/notifications' });
    this.clients = new Map(); // userId -> WebSocket
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      // Extract user ID from the query parameters or headers
      const userId = req.headers['user-id'] || new URLSearchParams(req.url.split('?')[1]).get('userId');
      
      if (!userId) {
        console.warn('WebSocket connection attempt without user ID');
        return ws.close(4001, 'User ID is required');
      }

      console.log(`New WebSocket connection for user ${userId}`);
      
      // Store the WebSocket connection with the user ID
      this.clients.set(userId, ws);

      // Send initial unread count
      this.sendUnreadCount(userId);

      // Handle WebSocket close
      ws.on('close', () => {
        console.log(`WebSocket connection closed for user ${userId}`);
        if (this.clients.get(userId) === ws) {
          this.clients.delete(userId);
        }
      });

      // Handle WebSocket errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        if (this.clients.get(userId) === ws) {
          this.clients.delete(userId);
        }
      });
    });
  }

  /**
   * Send a notification to a specific user
   * @param {number} userId - ID of the user to notify
   * @param {Object} notification - Notification data
   * @param {string} notification.type - Notification type
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {Object} [notification.metadata] - Additional metadata
   */
  async sendNotification(userId, { type, title, message, metadata = {} }) {
    try {
      // Create the notification in the database
      const notificationId = await Notification.create({
        userId,
        typeName: type,
        title,
        message,
        metadata,
        ...(metadata.entityType && { relatedEntityType: metadata.entityType }),
        ...(metadata.entityId && { relatedEntityId: metadata.entityId })
      });

      // Get the created notification
      const [notification] = await Notification.getForUser(userId, { limit: 1 });
      
      // Send the notification via WebSocket if the user is connected
      this.sendToUser(userId, {
        event: 'notification',
        data: notification
      });

      // Update unread count for the user
      this.sendUnreadCount(userId);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send a notification to multiple users
   * @param {number[]} userIds - Array of user IDs to notify
   * @param {Object} notification - Notification data
   * @param {string} notification.type - Notification type
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {Object} [notification.metadata] - Additional metadata
   */
  async broadcastToUsers(userIds, notification) {
    try {
      const results = [];
      for (const userId of userIds) {
        try {
          const result = await this.sendNotification(userId, notification);
          results.push({ userId, success: true, notification: result });
        } catch (error) {
          console.error(`Error sending notification to user ${userId}:`, error);
          results.push({ userId, success: false, error: error.message });
        }
      }
      return results;
    } catch (error) {
      console.error('Error in broadcastToUsers:', error);
      throw error;
    }
  }

  /**
   * Send a message to a specific user via WebSocket
   * @param {number} userId - ID of the user
   * @param {Object} message - Message to send
   */
  sendToUser(userId, message) {
    const ws = this.clients.get(userId.toString());
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending WebSocket message to user ${userId}:`, error);
        // Remove the client if there's an error
        if (this.clients.get(userId) === ws) {
          this.clients.delete(userId);
        }
      }
    }
  }

  /**
   * Send the current unread count to a user
   * @param {number} userId - ID of the user
   */
  async sendUnreadCount(userId) {
    try {
      const count = await Notification.getUnreadCount(userId);
      this.sendToUser(userId, {
        event: 'unread_count',
        data: { count }
      });
    } catch (error) {
      console.error(`Error sending unread count to user ${userId}:`, error);
    }
  }

  /**
   * Mark a notification as read
   * @param {number} notificationId - ID of the notification
   * @param {number} userId - ID of the user
   */
  async markAsRead(notificationId, userId) {
    try {
      const updated = await Notification.markAsRead(notificationId, userId);
      if (updated) {
        // Send updated unread count
        this.sendUnreadCount(userId);
      }
      return updated;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - ID of the user
   */
  async markAllAsRead(userId) {
    try {
      const count = await Notification.markAllAsRead(userId);
      if (count > 0) {
        // Send updated unread count
        this.sendUnreadCount(userId);
      }
      return count;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   * @param {number} userId - ID of the user
   */
  async getPreferences(userId) {
    return Notification.getUserPreferences(userId);
  }

  /**
   * Update notification preferences for a user
   * @param {number} userId - ID of the user
   * @param {Object} preferences - Notification preferences
   */
  async updatePreferences(userId, preferences) {
    return Notification.updatePreferences(userId, preferences);
  }
}

// Singleton pattern to ensure only one instance exists
let instance = null;

/**
 * Initialize the notification service
 * @param {Object} server - HTTP server instance
 * @returns {NotificationService} The notification service instance
 */
const initNotificationService = (server) => {
  if (!instance) {
    instance = new NotificationService(server);
  }
  return instance;
};

/**
 * Get the notification service instance
 * @returns {NotificationService} The notification service instance
 */
const getNotificationService = () => {
  if (!instance) {
    throw new Error('Notification service not initialized');
  }
  return instance;
};

module.exports = {
  initNotificationService,
  getNotificationService
};
