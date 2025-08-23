-- Start transaction for atomic operations
BEGIN TRANSACTION;

-- 1. Add new roles if they don't exist
INSERT OR IGNORE INTO base_master_roles (role_name, role_description, created_at, updated_at)
VALUES 
    ('company', 'Company role with access to manage their own data', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question_writer', 'Can create and edit questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('reviewer', 'Can review and approve questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Add necessary permissions if they don't exist
INSERT OR IGNORE INTO base_master_permissions (permission_name, permission_description, created_at, updated_at)
VALUES 
    -- Company permissions
    ('company_manage', 'Manage company profile and settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('company_employees_manage', 'Manage company employees', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Question Writer permissions
    ('question_create', 'Create new questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question_edit_own', 'Edit own questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question_view', 'View questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Reviewer permissions
    ('question_edit_all', 'Edit all questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question_approve', 'Approve/reject questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question_review', 'Review questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Create role-permission mappings
-- For Company role
INSERT OR IGNORE INTO base_role_permission_link (role_id, permission_id, created_at)
SELECT 
    r.role_id,
    p.permission_id,
    CURRENT_TIMESTAMP
FROM 
    base_master_roles r
CROSS JOIN 
    base_master_permissions p
WHERE 
    r.role_name = 'company'
    AND p.permission_name IN ('company_manage', 'company_employees_manage', 'question_view');

-- For Question Writer role
INSERT OR IGNORE INTO base_role_permission_link (role_id, permission_id, created_at)
SELECT 
    r.role_id,
    p.permission_id,
    CURRENT_TIMESTAMP
FROM 
    base_master_roles r
CROSS JOIN 
    base_master_permissions p
WHERE 
    r.role_name = 'question_writer'
    AND p.permission_name IN ('question_create', 'question_edit_own', 'question_view');

-- For Reviewer role
INSERT OR IGNORE INTO base_role_permission_link (role_id, permission_id, created_at)
SELECT 
    r.role_id,
    p.permission_id,
    CURRENT_TIMESTAMP
FROM 
    base_master_roles r
CROSS JOIN 
    base_master_permissions p
WHERE 
    r.role_name = 'reviewer'
    AND p.permission_name IN ('question_view', 'question_edit_all', 'question_approve', 'question_review');

-- 4. (Optional) Assign roles to existing users
-- Example: Assign 'company' role to user with ID 1
INSERT OR IGNORE INTO base_role_user_link (user_id, role_id, created_at)
SELECT 
    1,  -- Replace with actual user ID
    role_id,
    CURRENT_TIMESTAMP
FROM 
    base_master_roles
WHERE 
    role_name = 'company';

-- Commit the transaction
COMMIT;

-- Verify the changes
SELECT 
    r.role_name,
    p.permission_name
FROM 
    base_master_roles r
JOIN 
    base_role_permission_link rpl ON r.role_id = rpl.role_id
JOIN 
    base_master_permissions p ON rpl.permission_id = p.permission_id
ORDER BY 
    r.role_name, p.permission_name;