-- EmployDEX Base Platform - Database Initialization Script
-- Created: 2025-06-26
-- Last Updated: 2025-08-07

-- Enable foreign keys for constraint enforcement
PRAGMA foreign_keys = ON;

-- Drop existing tables if they exist (in reverse order to respect foreign key constraints)
-- First drop junction/dependent tables
DROP TABLE IF EXISTS base_role_user_link;
DROP TABLE IF EXISTS base_role_permission_link;
DROP TABLE IF EXISTS base_activity_logs;
DROP TABLE IF EXISTS base_payment_transactions;

-- Then drop tables with no dependencies
DROP TABLE IF EXISTS base_payment_qr;
DROP TABLE IF EXISTS base_feature_toggle;

-- Finally drop master tables
DROP TABLE IF EXISTS base_master_users;
DROP TABLE IF EXISTS base_master_roles;
DROP TABLE IF EXISTS base_master_permissions;
DROP TABLE IF EXISTS base_feature_requests;



-- Create users table (master data)
CREATE TABLE IF NOT EXISTS base_master_users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT UNIQUE NOT NULL,
    mobile_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table (master data)
CREATE TABLE IF NOT EXISTS base_master_roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL,
    role_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table (master data)
CREATE TABLE IF NOT EXISTS base_master_permissions (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_name TEXT UNIQUE NOT NULL,
    permission_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_roles junction table (transaction data)
CREATE TABLE IF NOT EXISTS base_role_user_link (
    user_role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES base_master_roles(role_id) ON DELETE CASCADE
);

-- Create role_permissions junction table (transaction data)
CREATE TABLE IF NOT EXISTS base_role_permission_link (
    role_permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES base_master_roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES base_master_permissions(permission_id) ON DELETE CASCADE
);

-- Create activity_logs table (transaction data)
CREATE TABLE IF NOT EXISTS base_activity_logs (
    activity_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_action TEXT NOT NULL,
    activity_details TEXT,
    user_ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id) ON DELETE SET NULL
);


-- Create QR codes table for payment processing
CREATE TABLE IF NOT EXISTS base_payment_qr (
    payment_qr_code_id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_qr_name VARCHAR(100) NOT NULL,
    payment_description TEXT,
    payment_type VARCHAR(50) NOT NULL, -- e.g., 'UPI', 'BANK', 'WALLET'
    payment_qr_image_location VARCHAR(255),   -- File system path to the QR code image
    isActive BOOLEAN DEFAULT 0, -- Only one QR code can be active at a time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on payment type for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_type ON base_payment_qr(payment_type);


CREATE TABLE IF NOT EXISTS base_payment_transactions (
    payment_transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_ref VARCHAR(100) NOT NULL UNIQUE, -- Unique reference number for the transaction
    user_id INTEGER, -- User who initiated the transaction
    verified BOOLEAN DEFAULT 0,
    payment_amount number,
    payment_currency text, 
    payment_source text, 
    transaction_status text,
    payment_external_reference text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id)
);

-- Create index on transaction reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_reference ON base_payment_transactions(transaction_ref);

-- Create index on creation date for reporting
CREATE INDEX IF NOT EXISTS idx_transaction_date ON base_payment_transactions(created_at);

-- Create index on transaction_status for filtering
CREATE INDEX IF NOT EXISTS idx_transaction_status ON base_payment_transactions(transaction_status);

-- Feature toggle table for enabling/disabling features
CREATE TABLE IF NOT EXISTS base_feature_toggle (
    feature_toggle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT UNIQUE NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 0,
    feature_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- Migration to create the base_feature_requests table

CREATE TABLE IF NOT EXISTS base_feature_requests (
    feature_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    main_function TEXT NOT NULL,
    sub_function TEXT,
    feature_name TEXT NOT NULL,
    feature_description TEXT NOT NULL,
    benefits TEXT,
    priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested', 'reviewed', 'approved', 'denied', 'under_implementation', 'implemented')),
    denial_reason TEXT,
    requested_by_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by_user_id) REFERENCES base_master_users(user_id)
);
