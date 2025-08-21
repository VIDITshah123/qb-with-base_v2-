-- Command to insert data
-- sqlite3 db/base.db < db/data_update_scripts/base_v2_data.sql

-- Insert default roles
INSERT OR IGNORE INTO base_master_roles (role_name, role_description) VALUES 
    ('Admin', 'Administrator with full system access'),
    ('User', 'Standard user with limited access');

-- Insert default permissions
INSERT OR IGNORE INTO base_master_permissions (permission_name, permission_description) VALUES
    ('user_view', 'Can view user details'),
    ('user_create', 'Can create users'),
    ('user_edit', 'Can edit user details'),
    ('user_delete', 'Can delete users'),
    ('role_view', 'Can view roles'),
    ('role_create', 'Can create roles'),
    ('role_edit', 'Can edit roles'),
    ('role_delete', 'Can delete roles'),
    ('permission_view', 'Can view permissions'),
    ('permission_create', 'Can create permissions'),
    ('permission_edit', 'Can edit permissions'),
    ('permission_delete', 'Can delete permissions'),
    ('feature_toggle_view', 'View feature toggles'),
    ('feature_toggle_manage', 'Create, edit, or delete feature toggles'),
    ('permission_assign', 'Can assign permissions to roles');

-- Assign all permissions to Admin role
INSERT OR IGNORE INTO base_role_permission_link (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_master_roles WHERE role_name = 'Admin'), 
    permission_id 
FROM base_master_permissions;

-- Assign basic permissions to User role
INSERT OR IGNORE INTO base_role_permission_link (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_master_roles WHERE role_name = 'User'), 
    permission_id 
FROM base_master_permissions 
WHERE permission_name IN ('user_view');

-- Insert default admin user with password Admin@123
INSERT OR IGNORE INTO base_master_users (mobile_number, user_email, password_hash, first_name, last_name) 
VALUES ('9999999999', 'admin@employdex.com', '$2a$10$HCJ5Yd0YR1P4TGPJOyyAWe6jVXnjYQLTP8EuoNRPnT4l4XzUKCNbS', 'Admin', 'User');
-- Note: password_hash is for 'Admin@123' using bcrypt

-- Assign Admin role to the admin user
INSERT OR IGNORE INTO base_role_user_link (user_id, role_id)
VALUES (
    (SELECT user_id FROM base_master_users WHERE user_email = 'admin@employdex.com'),
    (SELECT role_id FROM base_master_roles WHERE role_name = 'Admin')
);


-- Add payment feature to feature toggle table
-- This allows the payment integration to be toggled on/off
INSERT OR IGNORE INTO base_feature_toggle (feature_name, feature_description, is_enabled)
VALUES ('payment_integration', 'Enable payment integration with QR code support', 0);

-- Sample data for payment QR codes
INSERT OR IGNORE INTO base_payment_qr (payment_qr_name, payment_description, payment_type, payment_qr_image_location, isActive)
VALUES 
('Default UPI QR', 'Default UPI payment QR code', 'UPI', '/uploads/qr/default_upi.png', 1),
('Corporate Account QR', 'Corporate bank account QR code', 'BANK', '/uploads/qr/corporate.png', 0);

-- Sample data for payment transactions
INSERT OR IGNORE INTO base_payment_transactions (transaction_ref, payment_amount, payment_currency, transaction_status, user_id, payment_external_reference)
VALUES 
('TXN123456789', 1000.00, 'INR', 'COMPLETED', 2, 'Test transaction'),
('TXN987654321', 1500.50, 'INR', 'PENDING', 3, 'Awaiting confirmation'),
('TXN567890123', 750.25, 'INR', 'FAILED', 4, 'Payment gateway error');

-- Insert additional role for full access
INSERT OR IGNORE INTO base_master_roles (role_name, role_description) 
VALUES ('full_access', 'Complete access to all features');

-- Assign all permissions to full_access role
INSERT OR IGNORE INTO base_role_permission_link (role_id, permission_id)
SELECT 
    (SELECT role_id FROM base_master_roles WHERE role_name = 'full_access'), 
    permission_id
FROM base_master_permissions;

-- Create FA user with password User@123
INSERT OR IGNORE INTO base_master_users (mobile_number, user_email, password_hash, first_name, last_name, is_active) 
VALUES ('8888888888', 'fa@employdex.com', '$2a$10$LjZl9CjeQFg1nrz8KvTYlOC.Nvsr5loM2qHbppZrbksSBPbFGVT5S', 'FA', 'User', 1);

-- Assign full_access role to FA user
INSERT OR IGNORE INTO base_role_user_link (user_id, role_id)
VALUES (
    (SELECT user_id FROM base_master_users WHERE mobile_number = '8888888888'),
    (SELECT role_id FROM base_master_roles WHERE role_name = 'full_access')
);
