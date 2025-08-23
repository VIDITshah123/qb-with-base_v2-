-- Sample Company Data Insertion Script

-- First, verify we have the required users
SELECT user_id, user_email 
FROM base_master_users 
WHERE user_email IN (
    'admin@employdex.com',
    'aboli.jadhav@skj.ican.in',
    'anshita.baharani@skj.ican.in'
);

-- Insert sample companies
-- Company 1
INSERT OR IGNORE INTO qb_master_companies (
    user_id,
    company_name,
    company_gst_number,
    company_city,
    company_state,
    company_country,
    company_pincode,
    company_address,
    is_active
) VALUES (
    (SELECT user_id FROM base_master_users WHERE user_email = 'admin@employdex.com' LIMIT 1),
    'Tech Solutions Inc.',
    '27AABCT3512Q1Z5',
    'Mumbai',
    'Maharashtra',
    'India',
    '400001',
    '123 Business Avenue, Andheri East',
    1
);

-- Company 2
INSERT OR IGNORE INTO qb_master_companies (
    user_id,
    company_name,
    company_gst_number,
    company_city,
    company_state,
    company_country,
    company_pincode,
    company_address,
    is_active
) VALUES (
    (SELECT user_id FROM base_master_users WHERE user_email = 'aboli.jadhav@skj.ican.in' LIMIT 1),
    'Global Education Services',
    '29AAACG2143P1Z1',
    'Pune',
    'Maharashtra',
    'India',
    '411001',
    '456 Knowledge Park, Hinjewadi',
    1
);

-- Company 3
INSERT OR IGNORE INTO qb_master_companies (
    user_id,
    company_name,
    company_gst_number,
    company_city,
    company_state,
    company_country,
    company_pincode,
    company_address,
    is_active
) VALUES (
    (SELECT user_id FROM base_master_users WHERE user_email = 'anshita.baharani@skj.ican.in' LIMIT 1),
    'Future Tech Labs',
    '30AADCF8078M1Z3',
    'Bangalore',
    'Karnataka',
    'India',
    '560001',
    '789 Innovation Street, Whitefield',
    1
);

-- Add sample question categories
INSERT OR IGNORE INTO qb_master_categories (category_name, category_description) VALUES
    ('Mathematics', 'Questions related to various mathematical concepts and problem-solving'),
    ('Science', 'Questions covering physics, chemistry, and biology topics'),
    ('General Knowledge', 'Questions about current affairs, history, and general awareness'),
    ('English Language', 'Questions on grammar, vocabulary, and language skills'),
    ('Logical Reasoning', 'Questions testing analytical and logical thinking abilities'),
    ('Computer Science', 'Questions about programming, algorithms, and computer fundamentals'),
    ('Aptitude', 'Quantitative and qualitative aptitude questions'),
    ('Current Affairs', 'Questions about recent events and news'),
    ('Verbal Ability', 'Questions testing language and communication skills'),
    ('Data Interpretation', 'Questions involving analysis of data in various formats');

-- Add sample subcategories
-- First, check if the subcategories table exists and has the right structure
CREATE TABLE IF NOT EXISTS qb_master_subcategories (
    subcategory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    subcategory_name TEXT NOT NULL,
    subcategory_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, subcategory_name),
    FOREIGN KEY (category_id) REFERENCES qb_master_categories(category_id) ON DELETE CASCADE
);

-- Insert subcategories for Mathematics
INSERT OR IGNORE INTO qb_master_subcategories (category_id, subcategory_name, subcategory_description)
SELECT 
    (SELECT category_id FROM qb_master_categories WHERE category_name = 'Mathematics' LIMIT 1),
    subcategory_name,
    subcategory_description
FROM (
    SELECT 'Algebra' AS subcategory_name, 'Algebraic expressions and equations' AS subcategory_description UNION ALL
    SELECT 'Geometry', 'Geometric shapes, sizes, and properties' UNION ALL
    SELECT 'Calculus', 'Differentiation, integration, and series' UNION ALL
    SELECT 'Trigonometry', 'Trigonometric functions and identities' UNION ALL
    SELECT 'Statistics', 'Data analysis and probability'
) AS math_subcategories;

-- Insert subcategories for Science
INSERT OR IGNORE INTO qb_master_subcategories (category_id, subcategory_name, subcategory_description)
SELECT 
    (SELECT category_id FROM qb_master_categories WHERE category_name = 'Science' LIMIT 1),
    subcategory_name,
    subcategory_description
FROM (
    SELECT 'Physics' AS subcategory_name, 'Physical laws and phenomena' AS subcategory_description UNION ALL
    SELECT 'Chemistry', 'Chemical elements, compounds, and reactions' UNION ALL
    SELECT 'Biology', 'Study of living organisms and life processes' UNION ALL
    SELECT 'Environmental Science', 'Ecology and environmental studies'
) AS science_subcategories;

-- Insert subcategories for Computer Science
INSERT OR IGNORE INTO qb_master_subcategories (category_id, subcategory_name, subcategory_description)
SELECT 
    (SELECT category_id FROM qb_master_categories WHERE category_name = 'Computer Science' LIMIT 1),
    subcategory_name,
    subcategory_description
FROM (
    SELECT 'Programming' AS subcategory_name, 'Coding and software development' AS subcategory_description UNION ALL
    SELECT 'Algorithms', 'Problem-solving methods and analysis' UNION ALL
    SELECT 'Database', 'Database design and management' UNION ALL
    SELECT 'Networking', 'Computer networks and communication' UNION ALL
    SELECT 'Web Development', 'Building and maintaining websites'
) AS cs_subcategories;

-- Verify the inserted data
SELECT 'Companies' AS data_type, COUNT(*) AS count FROM qb_master_companies
UNION ALL
SELECT 'Categories', COUNT(*) FROM qb_master_categories
UNION ALL
SELECT 'Subcategories', COUNT(*) FROM qb_master_subcategories;

-- View all categories with their subcategories
SELECT 
    c.category_name,
    s.subcategory_name,
    s.subcategory_description
FROM 
    qb_master_categories c
LEFT JOIN 
    qb_master_subcategories s ON c.category_id = s.category_id
ORDER BY 
    c.category_name, s.subcategory_name;
