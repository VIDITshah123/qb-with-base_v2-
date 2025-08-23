-- Create company table
CREATE TABLE IF NOT EXISTS qb_master_companies (
    company_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_name TEXT NOT NULL,
    company_gst_number TEXT,
    company_city TEXT,
    company_state TEXT,
    company_country TEXT,
    company_pincode TEXT,
    company_address TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id) ON DELETE CASCADE
);

-- Create company employees table
CREATE TABLE IF NOT EXISTS qb_master_employees (
    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES qb_master_companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id) ON DELETE CASCADE,
    UNIQUE(company_id, user_id)
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_company_timestamp
AFTER UPDATE ON qb_master_companies
FOR EACH ROW
BEGIN
    UPDATE qb_master_companies 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE company_id = OLD.company_id;
END;

-- Create trigger to update employee timestamp
CREATE TRIGGER IF NOT EXISTS update_employee_timestamp
AFTER UPDATE ON qb_master_employees
FOR EACH ROW
BEGIN
    UPDATE qb_master_employees 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE employee_id = OLD.employee_id;
END;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_qb_master_companies_user_id ON qb_master_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_qb_master_employees_company_id ON qb_master_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_qb_master_employees_user_id ON qb_master_employees(user_id);
