-- Migration: Add status_id to questions table
-- This migration adds the status_id column to the qb_questions table
-- and sets a default value for existing records.

BEGIN TRANSACTION;

-- Add status_id column to qb_questions
ALTER TABLE qb_questions ADD COLUMN status_id INTEGER 
    REFERENCES qb_question_statuses(status_id) 
    ON DELETE SET NULL;

-- Set default status for existing questions (using 'draft' status)
UPDATE qb_questions 
SET status_id = (SELECT status_id FROM qb_question_statuses WHERE name = 'draft' LIMIT 1)
WHERE status_id IS NULL;

-- Create an index on status_id for better query performance
CREATE INDEX IF NOT EXISTS idx_qb_questions_status_id ON qb_questions(status_id);

-- Update the qb_questions table to make status_id NOT NULL after setting defaults
-- This requires creating a new table and copying data
PRAGMA foreign_keys=off;

-- Create a new table with the NOT NULL constraint
CREATE TABLE qb_questions_new (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    difficulty_level TEXT CHECK(difficulty_level IN ('easy', 'medium', 'hard')),
    category_id INTEGER,
    subcategory_id INTEGER,
    status_id INTEGER,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES qb_categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES qb_subcategories(subcategory_id) ON DELETE SET NULL,
    FOREIGN KEY (status_id) REFERENCES qb_question_statuses(status_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES base_master_users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES base_master_users(user_id) ON DELETE SET NULL
);

-- Copy data from old table to new table
INSERT INTO qb_questions_new
SELECT * FROM qb_questions;

-- Drop the old table
DROP TABLE qb_questions;

-- Rename the new table to the original name
ALTER TABLE qb_questions_new RENAME TO qb_questions;

-- Recreate indexes and triggers as needed
CREATE INDEX IF NOT EXISTS idx_qb_questions_category ON qb_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_qb_questions_subcategory ON qb_questions(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_qb_questions_created_by ON qb_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_qb_questions_updated_by ON qb_questions(updated_by);

-- Recreate triggers if they existed
-- (Add your existing triggers here if needed)

PRAGMA foreign_keys=on;

-- Add a trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_qb_questions_timestamp
AFTER UPDATE ON qb_questions
FOR EACH ROW
BEGIN
    UPDATE qb_questions SET updated_at = CURRENT_TIMESTAMP
    WHERE question_id = NEW.question_id;
END;

-- Add a trigger to log status changes
CREATE TRIGGER IF NOT EXISTS log_question_status_change
AFTER UPDATE OF status_id ON qb_questions
FOR EACH ROW
WHEN OLD.status_id IS NOT NEW.status_id
BEGIN
    INSERT INTO qb_question_status_history (
        question_id, 
        from_status_id, 
        to_status_id, 
        changed_by,
        comments
    ) VALUES (
        NEW.question_id,
        OLD.status_id,
        NEW.status_id,
        NEW.updated_by,
        'Status updated via database trigger'
    );
END;

COMMIT;
