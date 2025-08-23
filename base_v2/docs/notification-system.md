# Notification System

## Overview
The notification system provides real-time and asynchronous notifications to users for various events within the application. It supports both in-app notifications and email notifications, with user-configurable preferences.

## Features

1. **Real-time Notifications**: Instant delivery of notifications via WebSockets
2. **Email Notifications**: Optional email delivery of notifications
3. **User Preferences**: Per-user control over notification types and delivery methods
4. **Notification Types**: Support for different types of notifications with customizable templates
5. **Admin Controls**: Management of notification types and system-wide notifications
6. **Unread Count**: Track and display the number of unread notifications
7. **Mark as Read**: Users can mark notifications as read individually or all at once

## Database Schema

### qb_notification_types
Stores the different types of notifications and their templates.

| Column | Type | Description |
|--------|------|-------------|
| type_id | INTEGER | Primary key |
| name | TEXT | Unique identifier for the notification type |
| display_name | TEXT | Human-readable name for the notification type |
| description | TEXT | Description of when this notification is used |
| template | TEXT | Template for the notification message |
| is_active | BOOLEAN | Whether this notification type is active |
| created_at | TIMESTAMP | When the notification type was created |
| updated_at | TIMESTAMP | When the notification type was last updated |

### qb_notifications
Stores individual notifications sent to users.

| Column | Type | Description |
|--------|------|-------------|
| notification_id | INTEGER | Primary key |
| type_id | INTEGER | Foreign key to qb_notification_types |
| user_id | INTEGER | ID of the user receiving the notification |
| title | TEXT | Notification title |
| message | TEXT | Notification message |
| is_read | BOOLEAN | Whether the notification has been read |
| is_emailed | BOOLEAN | Whether the notification has been sent via email |
| related_entity_type | TEXT | Type of related entity (e.g., 'question', 'answer') |
| related_entity_id | INTEGER | ID of the related entity |
| metadata | TEXT | JSON string with additional data |
| created_at | TIMESTAMP | When the notification was created |
| read_at | TIMESTAMP | When the notification was read (null if unread) |

### qb_user_notification_prefs
Stores user preferences for notification types.

| Column | Type | Description |
|--------|------|-------------|
| pref_id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to base_master_users |
| type_id | INTEGER | Foreign key to qb_notification_types |
| email_enabled | BOOLEAN | Whether email notifications are enabled |
| in_app_enabled | BOOLEAN | Whether in-app notifications are enabled |
| created_at | TIMESTAMP | When the preference was created |
| updated_at | TIMESTAMP | When the preference was last updated |

### qb_notification_delivery_logs
Logs delivery attempts for notifications.

| Column | Type | Description |
|--------|------|-------------|
| log_id | INTEGER | Primary key |
| notification_id | INTEGER | Foreign key to qb_notifications |
| delivery_method | TEXT | Method used for delivery (e.g., 'email', 'in_app') |
| status | TEXT | Delivery status ('pending', 'sent', 'delivered', 'failed') |
| error_message | TEXT | Error message if delivery failed |
| created_at | TIMESTAMP | When the delivery was attempted |
| updated_at | TIMESTAMP | When the delivery status was last updated |

## API Endpoints

### User Endpoints

#### GET /api/notifications
Get a list of notifications for the current user.

**Query Parameters:**
- `limit` (optional, default: 20): Number of notifications to return
- `offset` (optional, default: 0): Number of notifications to skip
- `unreadOnly` (optional, default: false): Only return unread notifications

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "New comment on your question",
      "message": "John Doe commented on your question",
      "isRead": false,
      "entityType": "question",
      "entityId": 123,
      "metadata": {},
      "type": "question_commented",
      "displayType": "New Comment",
      "createdAt": "2023-06-15T10:30:00Z",
      "readAt": null
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0
  }
}
```

#### POST /api/notifications/{id}/read
Mark a notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### POST /api/notifications/read-all
Mark all notifications as read for the current user.

**Response:**
```json
{
  "success": true,
  "count": 3
}
```

#### GET /api/notifications/preferences
Get the current user's notification preferences.

**Response:**
```json
{
  "success": true,
  "data": {
    "question_created": {
      "typeId": 1,
      "type": "question_created",
      "displayName": "New Question Created",
      "description": "Notification when a new question is created",
      "emailEnabled": true,
      "inAppEnabled": true
    },
    "question_commented": {
      "typeId": 2,
      "type": "question_commented",
      "displayName": "New Comment on Question",
      "description": "Notification when a new comment is added to a question",
      "emailEnabled": true,
      "inAppEnabled": true
    }
  }
}
```

#### PUT /api/notifications/preferences
Update the current user's notification preferences.

**Request Body:**
```json
{
  "question_created": {
    "typeId": 1,
    "emailEnabled": true,
    "inAppEnabled": false
  },
  "question_commented": {
    "typeId": 2,
    "emailEnabled": true,
    "inAppEnabled": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully"
}
```

#### GET /api/notifications/unread-count
Get the count of unread notifications for the current user.

**Response:**
```json
{
  "success": true,
  "count": 3
}
```

### Admin Endpoints

#### POST /api/admin/notifications
Create a new notification (admin only).

**Request Body:**
```json
{
  "userId": 123,
  "typeName": "system_announcement",
  "title": "System Maintenance",
  "message": "The system will be down for maintenance on...",
  "metadata": {
    "maintenanceDate": "2023-06-20T02:00:00Z",
    "duration": "2 hours"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "System Maintenance",
    "message": "The system will be down for maintenance on...",
    "isRead": false,
    "entityType": null,
    "entityId": null,
    "metadata": {
      "maintenanceDate": "2023-06-20T02:00:00Z",
      "duration": "2 hours"
    },
    "type": "system_announcement",
    "displayType": "System Announcement",
    "createdAt": "2023-06-15T14:30:00Z",
    "readAt": null
  }
}
```

#### GET /api/admin/notifications/types
Get all notification types (admin only).

**Query Parameters:**
- `includeInactive` (optional, default: false): Include inactive notification types

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "question_created",
      "displayName": "New Question Created",
      "description": "Notification when a new question is created",
      "template": "A new question \"{title}\" has been created by {author}",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/admin/notifications/types
Create a new notification type (admin only).

**Request Body:**
```json
{
  "name": "new_feature",
  "displayName": "New Feature Available",
  "description": "Notification when a new feature is available",
  "template": "A new feature is now available: {featureName}",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "new_feature",
    "displayName": "New Feature Available",
    "description": "Notification when a new feature is available",
    "template": "A new feature is now available: {featureName}",
    "isActive": true,
    "createdAt": "2023-06-15T15:00:00Z",
    "updatedAt": "2023-06-15T15:00:00Z"
  }
}
```

## WebSocket API

The notification system uses WebSockets for real-time updates. Clients can connect to `ws://your-domain.com/ws/notifications` with the user's authentication token to receive real-time notifications.

### Connection

1. **URL**: `ws://your-domain.com/ws/notifications?token={JWT_TOKEN}`
2. **Headers**: 
   - `Authorization: Bearer {JWT_TOKEN}` (alternative to query parameter)

### Events

#### Notification Event
Sent when a new notification is received.

```json
{
  "event": "notification",
  "data": {
    "id": 1,
    "title": "New comment on your question",
    "message": "John Doe commented on your question",
    "isRead": false,
    "entityType": "question",
    "entityId": 123,
    "metadata": {},
    "type": "question_commented",
    "displayType": "New Comment",
    "createdAt": "2023-06-15T10:30:00Z",
    "readAt": null
  }
}
```

#### Unread Count Event
Sent when the unread count changes.

```json
{
  "event": "unread_count",
  "data": {
    "count": 3
  }
}
```

## Integration Guide

### Sending Notifications

To send a notification from anywhere in your application:

```javascript
const { getNotificationService } = require('../services/notificationService');

// Get the notification service
const notificationService = getNotificationService();

// Send to a single user
await notificationService.sendNotification(userId, {
  type: 'question_commented',
  title: 'New comment on your question',
  message: 'John Doe commented on your question',
  metadata: {
    entityType: 'question',
    entityId: 123,
    commentId: 456
  }
});

// Send to multiple users
await notificationService.broadcastToUsers([userId1, userId2, userId3], {
  type: 'system_announcement',
  title: 'System Maintenance',
  message: 'The system will be down for maintenance at...',
  metadata: {
    maintenanceDate: '2023-06-20T02:00:00Z',
    duration: '2 hours'
  }
});
```

### Handling Notifications on the Frontend

1. **Connect to WebSocket**:
   ```javascript
   const connectWebSocket = (token) => {
     const ws = new WebSocket(`ws://your-domain.com/ws/notifications?token=${token}`);
     
     ws.onopen = () => {
       console.log('WebSocket connected');
     };
     
     ws.onmessage = (event) => {
       const data = JSON.parse(event.data);
       
       switch (data.event) {
         case 'notification':
           // Handle new notification
           showNotification(data.data);
           updateUnreadCount();
           break;
           
         case 'unread_count':
           // Update unread count in UI
           updateUnreadCountUI(data.data.count);
           break;
           
         default:
           console.warn('Unknown event type:', data.event);
       }
     };
     
     ws.onclose = () => {
       console.log('WebSocket disconnected');
       // Attempt to reconnect after a delay
       setTimeout(() => connectWebSocket(token), 5000);
     };
     
     return ws;
   };
   ```

2. **Mark as Read**:
   ```javascript
   const markAsRead = async (notificationId) => {
     try {
       await fetch(`/api/notifications/${notificationId}/read`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${getAuthToken()}`,
           'Content-Type': 'application/json'
         }
       });
       
       // Update UI
       updateUnreadCount();
     } catch (error) {
       console.error('Error marking notification as read:', error);
     }
   };
   ```

## Security Considerations

1. **Authentication**: All notification endpoints require authentication.
2. **Authorization**: Users can only access their own notifications.
3. **Rate Limiting**: Implement rate limiting to prevent abuse.
4. **Data Validation**: Always validate input data to prevent injection attacks.
5. **WebSocket Security**: Use WSS (WebSocket Secure) in production.

## Performance Considerations

1. **Indexing**: Ensure proper indexing on frequently queried columns.
2. **Pagination**: Always use pagination for notification lists.
3. **Batch Updates**: Use batch updates when marking multiple notifications as read.
4. **WebSocket Connections**: Manage WebSocket connections efficiently to prevent resource exhaustion.

## Error Handling

Handle the following error scenarios:

1. **WebSocket Disconnection**: Implement reconnection logic.
2. **Failed Notifications**: Log failed notification deliveries and retry if necessary.
3. **Rate Limiting**: Handle 429 (Too Many Requests) responses gracefully.

## Testing

Test the following scenarios:

1. Sending notifications to a single user
2. Sending notifications to multiple users
3. Marking notifications as read
4. Updating notification preferences
5. WebSocket reconnection
6. Error conditions (invalid input, unauthorized access, etc.)

## Future Enhancements

1. **Push Notifications**: Add support for mobile push notifications.
2. **SMS Notifications**: Add support for SMS notifications.
3. **Muting**: Allow users to mute specific notification types.
4. **Snooze**: Allow users to temporarily snooze notifications.
5. **Notification Digest**: Send a daily/weekly digest of notifications.
6. **Advanced Filtering**: Add more filtering options for notifications.
7. **Custom Templates**: Allow admins to customize notification templates.
