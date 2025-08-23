-- Create review workflow tables
BEGIN TRANSACTION;

-- Review status enum table
CREATE TABLE IF NOT EXISTS qb_review_status (
    status_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial review statuses
INSERT OR IGNORE INTO qb_review_status (status_id, name, description) VALUES 
(1, 'pending', 'Waiting for review'),
(2, 'in_review', 'Currently being reviewed'),
(3, 'approved', 'Approved and published'),
(4, 'rejected', 'Rejected and needs revision'),
(5, 'archived', 'Archived and no longer active');

-- Review workflow table
CREATE TABLE IF NOT EXISTS qb_reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    status_id INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER NOT NULL,
    assigned_to INTEGER,
    due_date TIMESTAMP,
    priority INTEGER DEFAULT 2, -- 1: Low, 2: Medium, 3: High
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES qb_questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES qb_review_status(status_id),
    FOREIGN KEY (created_by) REFERENCES base_master_users(user_id),
    FOREIGN KEY (assigned_to) REFERENCES base_master_users(user_id)
);

-- Review history table
CREATE TABLE IF NOT EXISTS qb_review_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    status_id INTEGER NOT NULL,
    changed_by INTEGER NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES qb_reviews(review_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES qb_review_status(status_id),
    FOREIGN KEY (changed_by) REFERENCES base_master_users(user_id)
);

-- Review comments table
CREATE TABLE IF NOT EXISTS qb_review_comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment_text TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT 0,
    resolved_by INTEGER,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES qb_reviews(review_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id),
    FOREIGN KEY (resolved_by) REFERENCES base_master_users(user_id)
);

-- Review assignments table
CREATE TABLE IF NOT EXISTS qb_review_assignments (
    assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (review_id) REFERENCES qb_reviews(review_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id),
    FOREIGN KEY (assigned_by) REFERENCES base_master_users(user_id)
);

-- Add review_id to questions table if it doesn't exist
-- This will be used to track the current review status of a question
PRAGMA foreign_keys=off;

-- Create temporary table for qb_questions
CREATE TABLE IF NOT EXISTS qb_questions_new (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER,
    -- ... (other existing columns) ...
    FOREIGN KEY (review_id) REFERENCES qb_reviews(review_id)
);

-- Copy data from old table to new table
INSERT INTO qb_questions_new 
SELECT q.*, NULL as review_id 
FROM qb_questions q;

-- Drop old table and rename new one
DROP TABLE IF EXISTS qb_questions_old;
ALTER TABLE qb_questions RENAME TO qb_questions_old;
ALTER TABLE qb_questions_new RENAME TO qb_questions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_questions_company ON qb_questions(company_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON qb_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON qb_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_review ON qb_questions(review_id);

-- Create indexes for review tables
CREATE INDEX IF NOT EXISTS idx_reviews_question ON qb_reviews(question_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON qb_reviews(status_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_by ON qb_reviews(created_by);
CREATE INDEX IF NOT EXISTS idx_reviews_assigned_to ON qb_reviews(assigned_to);
CREATE INDEX IF NOT EXISTS idx_review_history_review ON qb_review_history(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_review ON qb_review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_review ON qb_review_assignments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_user ON qb_review_assignments(user_id);

-- Create triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_qb_reviews_updated_at
AFTER UPDATE ON qb_reviews
FOR EACH ROW
BEGIN
    UPDATE qb_reviews SET updated_at = CURRENT_TIMESTAMP WHERE review_id = NEW.review_id;
END;

-- Create trigger to log review status changes
CREATE TRIGGER IF NOT EXISTS log_review_status_change
AFTER UPDATE OF status_id ON qb_reviews
FOR EACH ROW
WHEN OLD.status_id IS NOT NEW.status_id
BEGIN
    INSERT INTO qb_review_history (review_id, status_id, changed_by, comments)
    VALUES (NEW.review_id, NEW.status_id, NEW.updated_by, 'Status changed from ' || 
            (SELECT name FROM qb_review_status WHERE status_id = OLD.status_id) || ' to ' ||
            (SELECT name FROM qb_review_status WHERE status_id = NEW.status_id));
END;

-- Create trigger to update question status when review is approved
CREATE TRIGGER IF NOT EXISTS update_question_on_approval
AFTER UPDATE OF status_id ON qb_reviews
FOR EACH ROW
WHEN NEW.status_id = 3  -- Approved status
BEGIN
    UPDATE qb_questions 
    SET status = 'published',
        published_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = NEW.updated_by
    WHERE question_id = NEW.question_id;
END;

PRAGMA foreign_keys=on;

COMMIT;
