-- Create question categories table
CREATE TABLE IF NOT EXISTS qb_question_categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER NOT NULL,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES qb_master_companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES qb_question_categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES base_master_users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES base_master_users(user_id) ON DELETE SET NULL,
    UNIQUE(company_id, name)
);

-- Create questions table
CREATE TABLE IF NOT EXISTS qb_questions (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    category_id INTEGER,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'fill_blank') NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL,
    question_text TEXT NOT NULL,
    explanation TEXT,
    is_active BOOLEAN DEFAULT 1,
    status ENUM('draft', 'pending_review', 'approved', 'rejected', 'archived') DEFAULT 'draft',
    created_by INTEGER NOT NULL,
    updated_by INTEGER,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES qb_master_companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES qb_question_categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES base_master_users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES base_master_users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES base_master_users(user_id) ON DELETE SET NULL
);

-- Create question options table (for multiple choice, true/false, etc.)
CREATE TABLE IF NOT EXISTS qb_question_options (
    option_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT 0,
    option_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES qb_questions(question_id) ON DELETE CASCADE
);

-- Create question tags table
CREATE TABLE IF NOT EXISTS qb_question_tags (
    tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES qb_master_companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES base_master_users(user_id) ON DELETE CASCADE,
    UNIQUE(company_id, name)
);

-- Create question-tag mapping table
CREATE TABLE IF NOT EXISTS qb_question_tag_mapping (
    question_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (question_id, tag_id),
    FOREIGN KEY (question_id) REFERENCES qb_questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES qb_question_tags(tag_id) ON DELETE CASCADE
);

-- Create question versions table (for versioning)
CREATE TABLE IF NOT EXISTS qb_question_versions (
    version_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    question_data JSON NOT NULL,
    change_summary TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES qb_questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES base_master_users(user_id) ON DELETE CASCADE,
    UNIQUE(question_id, version_number)
);

-- Create question reviews table
CREATE TABLE IF NOT EXISTS qb_question_reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'needs_revision') NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES qb_questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES base_master_users(user_id) ON DELETE CASCADE
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_question_categories_timestamp
AFTER UPDATE ON qb_question_categories
FOR EACH ROW
BEGIN
    UPDATE qb_question_categories SET updated_at = CURRENT_TIMESTAMP WHERE category_id = OLD.category_id;
END;

CREATE TRIGGER IF NOT EXISTS update_questions_timestamp
AFTER UPDATE ON qb_questions
FOR EACH ROW
BEGIN
    UPDATE qb_questions SET updated_at = CURRENT_TIMESTAMP WHERE question_id = OLD.question_id;
END;

CREATE TRIGGER IF NOT EXISTS update_question_options_timestamp
AFTER UPDATE ON qb_question_options
FOR EACH ROW
BEGIN
    UPDATE qb_question_options SET updated_at = CURRENT_TIMESTAMP WHERE option_id = OLD.option_id;
END;

CREATE TRIGGER IF NOT EXISTS update_question_tags_timestamp
AFTER UPDATE ON qb_question_tags
FOR EACH ROW
BEGIN
    UPDATE qb_question_tags SET updated_at = CURRENT_TIMESTAMP WHERE tag_id = OLD.tag_id;
END;

CREATE TRIGGER IF NOT EXISTS update_question_reviews_timestamp
AFTER UPDATE ON qb_question_reviews
FOR EACH ROW
BEGIN
    UPDATE qb_question_reviews SET updated_at = CURRENT_TIMESTAMP WHERE review_id = OLD.review_id;
END;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_company ON qb_questions(company_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON qb_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON qb_questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON qb_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON qb_question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_company ON qb_question_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_question_tag_mapping ON qb_question_tag_mapping(question_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_question_versions_question ON qb_question_versions(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reviews_question ON qb_question_reviews(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reviews_reviewer ON qb_question_reviews(reviewer_id);
