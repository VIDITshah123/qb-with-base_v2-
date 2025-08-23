-- Create voting system tables
BEGIN TRANSACTION;

-- Vote types table
CREATE TABLE IF NOT EXISTS qb_vote_types (
    vote_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    score_impact INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial vote types
INSERT OR IGNORE INTO qb_vote_types (vote_type_id, name, display_name, description, score_impact) VALUES 
(1, 'upvote', 'Upvote', 'Indicates the content is useful or high quality', 1),
(2, 'downvote', 'Downvote', 'Indicates the content is not useful or low quality', -1),
(3, 'favorite', 'Favorite', 'Marks the content as a favorite', 0),
(4, 'report', 'Report', 'Reports the content as inappropriate', -2);

-- Vote targets table
CREATE TABLE IF NOT EXISTS qb_vote_targets (
    target_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Initial vote targets
INSERT OR IGNORE INTO qb_vote_targets (target_id, name, description) VALUES 
(1, 'question', 'Vote on a question'),
(2, 'answer', 'Vote on an answer'),
(3, 'comment', 'Vote on a comment');

-- Main votes table
CREATE TABLE IF NOT EXISTS qb_votes (
    vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    vote_type_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vote_type_id) REFERENCES qb_vote_types(vote_type_id),
    FOREIGN KEY (target_type_id) REFERENCES qb_vote_targets(target_id),
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id),
    UNIQUE(target_type_id, target_id, user_id) -- One vote per user per target
);

-- Vote history table for audit trail
CREATE TABLE IF NOT EXISTS qb_vote_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vote_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    changed_by INTEGER NOT NULL,
    vote_type_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vote_id) REFERENCES qb_votes(vote_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id),
    FOREIGN KEY (changed_by) REFERENCES base_master_users(user_id),
    FOREIGN KEY (vote_type_id) REFERENCES qb_vote_types(vote_type_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_votes_target ON qb_votes(target_type_id, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON qb_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_type ON qb_votes(vote_type_id);
CREATE INDEX IF NOT EXISTS idx_vote_history_vote ON qb_vote_history(vote_id);

-- Add vote counts to questions table
PRAGMA foreign_keys=off;

-- Create temporary table for qb_questions
CREATE TABLE IF NOT EXISTS qb_questions_new (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    -- ... (other existing columns) ...
    FOREIGN KEY (review_id) REFERENCES qb_reviews(review_id)
);

-- Copy data from old table to new table
INSERT INTO qb_questions_new 
SELECT q.*, 0, 0, 0, 0 
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
CREATE INDEX IF NOT EXISTS idx_questions_score ON qb_questions(score);

-- Create triggers for vote updates
CREATE TRIGGER IF NOT EXISTS update_question_votes_after_insert
AFTER INSERT ON qb_votes
FOR EACH ROW
WHEN NEW.target_type_id = 1  -- Question votes
BEGIN
    -- Update vote counts based on vote type
    UPDATE qb_questions
    SET 
        upvotes = upvotes + (NEW.vote_type_id = 1),
        downvotes = downvotes + (NEW.vote_type_id = 2),
        favorite_count = favorite_count + (NEW.vote_type_id = 3),
        score = score + (SELECT score_impact FROM qb_vote_types WHERE vote_type_id = NEW.vote_type_id)
    WHERE question_id = NEW.target_id;
    
    -- Log the vote in history
    INSERT INTO qb_vote_history (vote_id, user_id, vote_type_id)
    VALUES (NEW.vote_id, NEW.user_id, NEW.vote_type_id);
END;

CREATE TRIGGER IF NOT EXISTS update_question_votes_after_update
AFTER UPDATE ON qb_votes
FOR EACH ROW
WHEN NEW.target_type_id = 1  -- Question votes
BEGIN
    -- First, remove the old vote impact
    UPDATE qb_questions
    SET 
        upvotes = upvotes - (OLD.vote_type_id = 1) + (NEW.vote_type_id = 1),
        downvotes = downvotes - (OLD.vote_type_id = 2) + (NEW.vote_type_id = 2),
        favorite_count = favorite_count - (OLD.vote_type_id = 3) + (NEW.vote_type_id = 3),
        score = score - (SELECT score_impact FROM qb_vote_types WHERE vote_type_id = OLD.vote_type_id)
                     + (SELECT score_impact FROM qb_vote_types WHERE vote_type_id = NEW.vote_type_id)
    WHERE question_id = NEW.target_id;
    
    -- Log the vote change in history
    INSERT INTO qb_vote_history (vote_id, user_id, vote_type_id)
    VALUES (NEW.vote_id, NEW.user_id, NEW.vote_type_id);
    
    -- Update the updated_at timestamp
    UPDATE qb_votes 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE vote_id = NEW.vote_id;
END;

CREATE TRIGGER IF NOT EXISTS update_question_votes_after_delete
AFTER DELETE ON qb_votes
FOR EACH ROW
WHEN OLD.target_type_id = 1  -- Question votes
BEGIN
    -- Remove the vote impact
    UPDATE qb_questions
    SET 
        upvotes = upvotes - (OLD.vote_type_id = 1),
        downvotes = downvotes - (OLD.vote_type_id = 2),
        favorite_count = favorite_count - (OLD.vote_type_id = 3),
        score = score - (SELECT score_impact FROM qb_vote_types WHERE vote_type_id = OLD.vote_type_id)
    WHERE question_id = OLD.target_id;
    
    -- Log the vote removal in history (with vote_type_id = 0 for removal)
    INSERT INTO qb_vote_history (vote_id, user_id, vote_type_id)
    VALUES (OLD.vote_id, OLD.user_id, 0);
END;

-- Create view for question scores
CREATE VIEW IF NOT EXISTS vw_question_scores AS
SELECT 
    q.question_id,
    q.question_text,
    q.upvotes,
    q.downvotes,
    q.score,
    q.favorite_count,
    (SELECT COUNT(*) FROM qb_votes v 
     WHERE v.target_type_id = 1 AND v.target_id = q.question_id AND v.vote_type_id = 4) as report_count,
    u.user_email as created_by_email,
    u.first_name as created_by_first_name,
    u.last_name as created_by_last_name,
    c.name as category_name
FROM qb_questions q
JOIN base_master_users u ON q.created_by = u.user_id
LEFT JOIN qb_question_categories c ON q.category_id = c.category_id
WHERE q.is_active = 1;

PRAGMA foreign_keys=on;

COMMIT;
