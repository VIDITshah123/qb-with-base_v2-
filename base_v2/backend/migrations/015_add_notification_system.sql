-- Migration: Add Notification System
-- This migration adds support for user notifications

BEGIN TRANSACTION;

-- Notification types table
CREATE TABLE IF NOT EXISTS qb_notification_types (
    type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS qb_notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    is_emailed BOOLEAN DEFAULT 0,
    related_entity_type TEXT,
    related_entity_id INTEGER,
    metadata TEXT, -- JSON string for additional data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES qb_notification_types(type_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id) ON DELETE CASCADE
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS qb_user_notification_prefs (
    pref_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    email_enabled BOOLEAN DEFAULT 1,
    in_app_enabled BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, type_id),
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES qb_notification_types(type_id) ON DELETE CASCADE
);

-- Notification delivery log
CREATE TABLE IF NOT EXISTS qb_notification_delivery_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_id INTEGER NOT NULL,
    delivery_method TEXT NOT NULL, -- 'email', 'in_app', 'push', etc.
    status TEXT NOT NULL, -- 'pending', 'sent', 'delivered', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES qb_notifications(notification_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON qb_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON qb_notifications(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON qb_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON qb_user_notification_prefs(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_notification ON qb_notification_delivery_logs(notification_id);

-- Insert default notification types
INSERT INTO qb_notification_types (name, display_name, description, template) VALUES
    ('question_created', 'New Question Created', 'Notification when a new question is created', 'A new question "{title}" has been created by {author}'),
    ('question_updated', 'Question Updated', 'Notification when a question is updated', 'The question "{title}" has been updated by {updater}'),
    ('question_status_changed', 'Question Status Changed', 'Notification when question status changes', 'The status of question "{title}" has been changed from {old_status} to {new_status}'),
    ('question_commented', 'New Comment on Question', 'Notification when a new comment is added to a question', '{commenter} commented on the question "{title}"'),
    ('answer_posted', 'New Answer Posted', 'Notification when a new answer is posted to a question', '{answerer} posted an answer to the question "{title}"'),
    ('answer_accepted', 'Answer Accepted', 'Notification when an answer is accepted', 'Your answer to "{title}" has been accepted'),
    ('mention', 'Mentioned in Comment', 'Notification when mentioned in a comment', 'You were mentioned in a comment by {commenter}'),
    ('review_requested', 'Review Requested', 'Notification when a review is requested', 'You have been requested to review "{title}"'),
    ('review_submitted', 'Review Submitted', 'Notification when a review is submitted', 'A review has been submitted for "{title}"'),
    ('system_announcement', 'System Announcement', 'System-wide announcements', '{message}');

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_notification_types_timestamp
AFTER UPDATE ON qb_notification_types
BEGIN
    UPDATE qb_notification_types SET updated_at = CURRENT_TIMESTAMP WHERE type_id = NEW.type_id;
END;

-- Create a trigger to update the user notification preferences timestamp
CREATE TRIGGER IF NOT EXISTS update_notification_prefs_timestamp
AFTER UPDATE ON qb_user_notification_prefs
BEGIN
    UPDATE qb_user_notification_prefs SET updated_at = CURRENT_TIMESTAMP WHERE pref_id = NEW.pref_id;
END;

-- Create a view for unread notifications count
CREATE VIEW IF NOT EXISTS vw_user_unread_notifications AS
SELECT 
    user_id, 
    COUNT(*) as unread_count
FROM 
    qb_notifications
WHERE 
    is_read = 0
GROUP BY 
    user_id;

-- Create a view for user notifications with type info
CREATE VIEW IF NOT EXISTS vw_user_notifications AS
SELECT 
    n.notification_id,
    n.user_id,
    nt.name as type_name,
    nt.display_name as type_display_name,
    n.title,
    n.message,
    n.is_read,
    n.is_emailed,
    n.related_entity_type,
    n.related_entity_id,
    n.metadata,
    n.created_at,
    n.read_at
FROM 
    qb_notifications n
JOIN 
    qb_notification_types nt ON n.type_id = nt.type_id;

COMMIT;
