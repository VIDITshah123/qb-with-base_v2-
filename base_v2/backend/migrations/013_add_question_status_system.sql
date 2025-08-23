-- Migration: Add Question Status System
-- This migration adds support for question status tracking and workflow

BEGIN TRANSACTION;

-- Create status types table
CREATE TABLE IF NOT EXISTS qb_question_statuses (
    status_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    is_default BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create status transitions table
CREATE TABLE IF NOT EXISTS qb_question_status_transitions (
    transition_id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_status_id INTEGER NOT NULL,
    to_status_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_status_id) REFERENCES qb_question_statuses(status_id) ON DELETE CASCADE,
    FOREIGN KEY (to_status_id) REFERENCES qb_question_statuses(status_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES base_roles(role_id) ON DELETE CASCADE,
    UNIQUE (from_status_id, to_status_id, role_id)
);

-- Create question status history table
CREATE TABLE IF NOT EXISTS qb_question_status_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    from_status_id INTEGER,
    to_status_id INTEGER NOT NULL,
    changed_by INTEGER NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES qb_questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (from_status_id) REFERENCES qb_question_statuses(status_id) ON DELETE SET NULL,
    FOREIGN KEY (to_status_id) REFERENCES qb_question_statuses(status_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES base_master_users(user_id)
);

-- Add status_id to questions table
ALTER TABLE qb_questions ADD COLUMN status_id INTEGER 
    REFERENCES qb_question_statuses(status_id) 
    ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_status ON qb_questions(status_id);
CREATE INDEX IF NOT EXISTS idx_status_transitions_from ON qb_question_status_transitions(from_status_id);
CREATE INDEX IF NOT EXISTS idx_status_transitions_to ON qb_question_status_transitions(to_status_id);
CREATE INDEX IF NOT EXISTS idx_status_history_question ON qb_question_status_history(question_id);
CREATE INDEX IF NOT EXISTS idx_status_history_status ON qb_question_status_history(to_status_id);

-- Insert default statuses
INSERT INTO qb_question_statuses (name, display_name, description, is_default) VALUES
    ('draft', 'Draft', 'Initial draft of the question', 1),
    ('under_review', 'Under Review', 'Question is under review', 0),
    ('approved', 'Approved', 'Question has been approved', 0),
    ('rejected', 'Rejected', 'Question has been rejected', 0),
    ('published', 'Published', 'Question is published', 0),
    ('archived', 'Archived', 'Question has been archived', 0);

-- Set the default status for existing questions
UPDATE qb_questions SET status_id = (SELECT status_id FROM qb_question_statuses WHERE name = 'draft' LIMIT 1);

-- Add sample status transitions (these can be modified through the admin interface)
-- Note: role_ids should match your existing role IDs
INSERT INTO qb_question_status_transitions (from_status_id, to_status_id, role_id) VALUES
    -- Author can submit draft for review
    ((SELECT status_id FROM qb_question_statuses WHERE name = 'draft' LIMIT 1),
     (SELECT status_id FROM qb_question_statuses WHERE name = 'under_review' LIMIT 1),
     (SELECT role_id FROM base_roles WHERE role_name = 'author' LIMIT 1)),
    
    -- Reviewer can approve or reject
    ((SELECT status_id FROM qb_question_statuses WHERE name = 'under_review' LIMIT 1),
     (SELECT status_id FROM qb_question_statuses WHERE name = 'approved' LIMIT 1),
     (SELECT role_id FROM base_roles WHERE role_name = 'reviewer' LIMIT 1)),
     
    ((SELECT status_id FROM qb_question_statuses WHERE name = 'under_review' LIMIT 1),
     (SELECT status_id FROM qb_question_statuses WHERE name = 'rejected' LIMIT 1),
     (SELECT role_id FROM base_roles WHERE role_name = 'reviewer' LIMIT 1)),
     
    -- Admin can publish approved questions
    ((SELECT status_id FROM qb_question_statuses WHERE name = 'approved' LIMIT 1),
     (SELECT status_id FROM qb_question_statuses WHERE name = 'published' LIMIT 1),
     (SELECT role_id FROM base_roles WHERE role_name = 'admin' LIMIT 1)),
     
    -- Admin can archive any question
    (NULL,
     (SELECT status_id FROM qb_question_statuses WHERE name = 'archived' LIMIT 1),
     (SELECT role_id FROM base_roles WHERE role_name = 'admin' LIMIT 1));

-- Make the status_id column required after setting defaults
PRAGMA foreign_keys=off;

-- Create a new table with the NOT NULL constraint
CREATE TABLE qb_questions_new (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    status_id INTEGER NOT NULL,
    -- Include all other columns from qb_questions
    -- ...
    FOREIGN KEY (status_id) REFERENCES qb_question_statuses(status_id)
);

-- Copy data from old table to new table
INSERT INTO qb_questions_new
SELECT * FROM qb_questions;

-- Drop the old table
DROP TABLE qb_questions;

-- Rename the new table to the original name
ALTER TABLE qb_questions_new RENAME TO qb_questions;

-- Recreate indexes and triggers as needed
-- ...

PRAGMA foreign_keys=on;

COMMIT;
