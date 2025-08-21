-- Migration: Add route feature toggle permissions
-- This migration adds all route-related permissions and feature toggles

-- First, add all route feature toggles to the database
INSERT OR IGNORE INTO base_feature_toggles (feature_name, description, enabled, created_at, updated_at)
VALUES
  -- Core routes
  ('route_dashboard', 'Feature toggle for Dashboard route', 1, datetime('now'), datetime('now')),
  
  -- User management routes
  ('route_users_list', 'Feature toggle for User List route', 1, datetime('now'), datetime('now')),
  ('route_users_details', 'Feature toggle for User Details route', 1, datetime('now'), datetime('now')),
  ('route_users_create', 'Feature toggle for Create User route', 1, datetime('now'), datetime('now')),
  ('route_users_edit', 'Feature toggle for Edit User route', 1, datetime('now'), datetime('now')),
  ('route_users_bulk_upload', 'Feature toggle for Bulk User Upload route', 1, datetime('now'), datetime('now')),
  
  -- Role management routes
  ('route_roles_list', 'Feature toggle for Role List route', 1, datetime('now'), datetime('now')),
  ('route_roles_details', 'Feature toggle for Role Details route', 1, datetime('now'), datetime('now')),
  ('route_roles_create', 'Feature toggle for Create Role route', 1, datetime('now'), datetime('now')),
  ('route_roles_edit', 'Feature toggle for Edit Role route', 1, datetime('now'), datetime('now')),
  ('route_roles_bulk_upload', 'Feature toggle for Bulk Role Upload route', 1, datetime('now'), datetime('now')),
  ('route_roles_base_feature_toggles', 'Feature toggle for Feature Toggle Management route', 1, datetime('now'), datetime('now')),
  
  -- Permission management routes
  ('route_permissions_list', 'Feature toggle for Permission List route', 1, datetime('now'), datetime('now')),
  ('route_permissions_details', 'Feature toggle for Permission Details route', 1, datetime('now'), datetime('now')),
  ('route_permissions_create', 'Feature toggle for Create Permission route', 1, datetime('now'), datetime('now')),
  ('route_permissions_edit', 'Feature toggle for Edit Permission route', 1, datetime('now'), datetime('now')),
  
  -- System routes
  ('route_activity_logs', 'Feature toggle for Activity Logs route', 1, datetime('now'), datetime('now')),
  ('route_payment_admin', 'Feature toggle for Payment Administration route', 1, datetime('now'), datetime('now')),
  ('route_file_upload_settings', 'Feature toggle for File Upload Configuration route', 1, datetime('now'), datetime('now'));

-- Now add permissions for each route and permission type (view, edit, create, delete)
-- Dashboard permissions
INSERT OR IGNORE INTO permissions (name, description, created_at, updated_at)
VALUES
  ('route_dashboard_view', 'View access for Dashboard', datetime('now'), datetime('now')),
  ('route_dashboard_edit', 'Edit access for Dashboard', datetime('now'), datetime('now')),
  ('route_dashboard_create', 'Create access for Dashboard', datetime('now'), datetime('now')),
  ('route_dashboard_delete', 'Delete access for Dashboard', datetime('now'), datetime('now'));

-- User management permissions
INSERT OR IGNORE INTO permissions (name, description, created_at, updated_at)
VALUES
  ('route_users_list_view', 'View access for User List', datetime('now'), datetime('now')),
  ('route_users_list_edit', 'Edit access for User List', datetime('now'), datetime('now')),
  ('route_users_list_create', 'Create access for User List', datetime('now'), datetime('now')),
  ('route_users_list_delete', 'Delete access for User List', datetime('now'), datetime('now')),
  
  ('route_users_details_view', 'View access for User Details', datetime('now'), datetime('now')),
  ('route_users_details_edit', 'Edit access for User Details', datetime('now'), datetime('now')),
  ('route_users_details_create', 'Create access for User Details', datetime('now'), datetime('now')),
  ('route_users_details_delete', 'Delete access for User Details', datetime('now'), datetime('now')),
  
  ('route_users_create_view', 'View access for Create User', datetime('now'), datetime('now')),
  ('route_users_create_edit', 'Edit access for Create User', datetime('now'), datetime('now')),
  ('route_users_create_create', 'Create access for Create User', datetime('now'), datetime('now')),
  ('route_users_create_delete', 'Delete access for Create User', datetime('now'), datetime('now')),
  
  ('route_users_edit_view', 'View access for Edit User', datetime('now'), datetime('now')),
  ('route_users_edit_edit', 'Edit access for Edit User', datetime('now'), datetime('now')),
  ('route_users_edit_create', 'Create access for Edit User', datetime('now'), datetime('now')),
  ('route_users_edit_delete', 'Delete access for Edit User', datetime('now'), datetime('now')),
  
  ('route_users_bulk_upload_view', 'View access for Bulk User Upload', datetime('now'), datetime('now')),
  ('route_users_bulk_upload_edit', 'Edit access for Bulk User Upload', datetime('now'), datetime('now')),
  ('route_users_bulk_upload_create', 'Create access for Bulk User Upload', datetime('now'), datetime('now')),
  ('route_users_bulk_upload_delete', 'Delete access for Bulk User Upload', datetime('now'), datetime('now'));

-- Role management permissions
INSERT OR IGNORE INTO permissions (name, description, created_at, updated_at)
VALUES
  ('route_roles_list_view', 'View access for Role List', datetime('now'), datetime('now')),
  ('route_roles_list_edit', 'Edit access for Role List', datetime('now'), datetime('now')),
  ('route_roles_list_create', 'Create access for Role List', datetime('now'), datetime('now')),
  ('route_roles_list_delete', 'Delete access for Role List', datetime('now'), datetime('now')),
  
  ('route_roles_details_view', 'View access for Role Details', datetime('now'), datetime('now')),
  ('route_roles_details_edit', 'Edit access for Role Details', datetime('now'), datetime('now')),
  ('route_roles_details_create', 'Create access for Role Details', datetime('now'), datetime('now')),
  ('route_roles_details_delete', 'Delete access for Role Details', datetime('now'), datetime('now')),
  
  ('route_roles_create_view', 'View access for Create Role', datetime('now'), datetime('now')),
  ('route_roles_create_edit', 'Edit access for Create Role', datetime('now'), datetime('now')),
  ('route_roles_create_create', 'Create access for Create Role', datetime('now'), datetime('now')),
  ('route_roles_create_delete', 'Delete access for Create Role', datetime('now'), datetime('now')),
  
  ('route_roles_edit_view', 'View access for Edit Role', datetime('now'), datetime('now')),
  ('route_roles_edit_edit', 'Edit access for Edit Role', datetime('now'), datetime('now')),
  ('route_roles_edit_create', 'Create access for Edit Role', datetime('now'), datetime('now')),
  ('route_roles_edit_delete', 'Delete access for Edit Role', datetime('now'), datetime('now')),
  
  ('route_roles_bulk_upload_view', 'View access for Bulk Role Upload', datetime('now'), datetime('now')),
  ('route_roles_bulk_upload_edit', 'Edit access for Bulk Role Upload', datetime('now'), datetime('now')),
  ('route_roles_bulk_upload_create', 'Create access for Bulk Role Upload', datetime('now'), datetime('now')),
  ('route_roles_bulk_upload_delete', 'Delete access for Bulk Role Upload', datetime('now'), datetime('now')),
  
  ('route_roles_base_feature_toggles_view', 'View access for Feature Toggle Management', datetime('now'), datetime('now')),
  ('route_roles_base_feature_toggles_edit', 'Edit access for Feature Toggle Management', datetime('now'), datetime('now')),
  ('route_roles_base_feature_toggles_create', 'Create access for Feature Toggle Management', datetime('now'), datetime('now')),
  ('route_roles_base_feature_toggles_delete', 'Delete access for Feature Toggle Management', datetime('now'), datetime('now'));

-- Permission management permissions
INSERT OR IGNORE INTO permissions (name, description, created_at, updated_at)
VALUES
  ('route_permissions_list_view', 'View access for Permission List', datetime('now'), datetime('now')),
  ('route_permissions_list_edit', 'Edit access for Permission List', datetime('now'), datetime('now')),
  ('route_permissions_list_create', 'Create access for Permission List', datetime('now'), datetime('now')),
  ('route_permissions_list_delete', 'Delete access for Permission List', datetime('now'), datetime('now')),
  
  ('route_permissions_details_view', 'View access for Permission Details', datetime('now'), datetime('now')),
  ('route_permissions_details_edit', 'Edit access for Permission Details', datetime('now'), datetime('now')),
  ('route_permissions_details_create', 'Create access for Permission Details', datetime('now'), datetime('now')),
  ('route_permissions_details_delete', 'Delete access for Permission Details', datetime('now'), datetime('now')),
  
  ('route_permissions_create_view', 'View access for Create Permission', datetime('now'), datetime('now')),
  ('route_permissions_create_edit', 'Edit access for Create Permission', datetime('now'), datetime('now')),
  ('route_permissions_create_create', 'Create access for Create Permission', datetime('now'), datetime('now')),
  ('route_permissions_create_delete', 'Delete access for Create Permission', datetime('now'), datetime('now')),
  
  ('route_permissions_edit_view', 'View access for Edit Permission', datetime('now'), datetime('now')),
  ('route_permissions_edit_edit', 'Edit access for Edit Permission', datetime('now'), datetime('now')),
  ('route_permissions_edit_create', 'Create access for Edit Permission', datetime('now'), datetime('now')),
  ('route_permissions_edit_delete', 'Delete access for Edit Permission', datetime('now'), datetime('now'));

-- System route permissions
INSERT OR IGNORE INTO permissions (name, description, created_at, updated_at)
VALUES
  ('route_activity_logs_view', 'View access for Activity Logs', datetime('now'), datetime('now')),
  ('route_activity_logs_edit', 'Edit access for Activity Logs', datetime('now'), datetime('now')),
  ('route_activity_logs_create', 'Create access for Activity Logs', datetime('now'), datetime('now')),
  ('route_activity_logs_delete', 'Delete access for Activity Logs', datetime('now'), datetime('now')),
  
  ('route_payment_admin_view', 'View access for Payment Administration', datetime('now'), datetime('now')),
  ('route_payment_admin_edit', 'Edit access for Payment Administration', datetime('now'), datetime('now')),
  ('route_payment_admin_create', 'Create access for Payment Administration', datetime('now'), datetime('now')),
  ('route_payment_admin_delete', 'Delete access for Payment Administration', datetime('now'), datetime('now')),
  
  ('route_file_upload_settings_view', 'View access for File Upload Configuration', datetime('now'), datetime('now')),
  ('route_file_upload_settings_edit', 'Edit access for File Upload Configuration', datetime('now'), datetime('now')),
  ('route_file_upload_settings_create', 'Create access for File Upload Configuration', datetime('now'), datetime('now')),
  ('route_file_upload_settings_delete', 'Delete access for File Upload Configuration', datetime('now'), datetime('now'));

-- Assign view permission to all roles for all routes
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  r.role_id,
  p.permission_id,
  datetime('now')
FROM 
  roles r,
  permissions p
WHERE 
  p.name LIKE 'route_%_view';

-- For the admin role, assign all permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  r.role_id,
  p.permission_id,
  datetime('now')
FROM 
  roles r,
  permissions p
WHERE 
  r.name = 'admin' AND
  p.name LIKE 'route_%';
