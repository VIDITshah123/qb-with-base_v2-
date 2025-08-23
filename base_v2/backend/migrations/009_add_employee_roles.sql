-- Create table for employee role assignments
CREATE TABLE IF NOT EXISTS qb_employee_roles (
    employee_role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES qb_master_employees(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES base_master_roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES base_master_users(user_id) ON DELETE SET NULL,
    UNIQUE(employee_id, role_id)
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_employee_role_timestamp
AFTER UPDATE ON qb_employee_roles
FOR EACH ROW
BEGIN
    UPDATE qb_employee_roles 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE employee_role_id = OLD.employee_role_id;
END;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_qb_employee_roles_employee_id ON qb_employee_roles(employee_id);
CREATE INDEX IF NOT EXISTS idx_qb_employee_roles_role_id ON qb_employee_roles(role_id);

-- Insert default roles for employees if they don't exist
INSERT OR IGNORE INTO base_master_roles (role_name, role_description, is_active, created_at, updated_at)
VALUES 
    ('company_admin', 'Company Administrator - Can manage company settings and employees', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question_editor', 'Question Editor - Can create and edit questions', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question_reviewer', 'Question Reviewer - Can review and approve questions', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('report_viewer', 'Report Viewer - Can view reports and analytics', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create a view to simplify querying employee roles
CREATE VIEW IF NOT EXISTS vw_employee_roles AS
SELECT 
    er.employee_role_id,
    e.employee_id,
    e.user_id,
    u.user_email,
    u.first_name,
    u.last_name,
    e.company_id,
    c.company_name,
    r.role_id,
    r.role_name,
    r.role_description,
    er.assigned_by,
    er.created_at as role_assigned_at,
    er.updated_at as role_updated_at
FROM 
    qb_employee_roles er
    JOIN qb_master_employees e ON er.employee_id = e.employee_id
    JOIN base_master_users u ON e.user_id = u.user_id
    JOIN qb_master_companies c ON e.company_id = c.company_id
    JOIN base_master_roles r ON er.role_id = r.role_id
WHERE 
    e.is_active = 1 
    AND r.is_active = 1;
