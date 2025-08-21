## [Unreleased]

### Removed
- **File Upload Feature**: Removed the `FileUploadWidget` component from the frontend and the corresponding `/api/file-upload` route from the backend.

### Added
- **HTML Test Report Generation**:
  - The main test runner script (`test/run-all-tests.js`) now generates an HTML report (`test/test-report.html`) summarizing test results.
  - The report includes pass/fail status for each test suite and provides direct links to any screenshots captured during the tests.
- **Feature Toggle Management E2E Tests**:
  - Added a Puppeteer test suite for creating, enabling, and disabling feature toggles.
  - Tests are data-driven using `test/feature-toggles/feature_toggles_test_data.csv`.
- **Role-Permission Assignment E2E Tests**:
  - Added a Puppeteer test suite for assigning permissions to roles.
  - Tests are data-driven using `test/role-permissions/role_permissions_test_data.csv`.
- **User-Role Assignment E2E Tests**:
  - Added a Puppeteer test suite for assigning roles to users.
  - Tests are data-driven using `test/user-roles/user_roles_test_data.csv`.
- **Permission Management E2E Tests**:
  - Added a Puppeteer test suite for creating, editing, and deleting permissions.
  - Tests are data-driven using `test/permissions/permissions_test_data.csv`.
- **Role Management E2E Tests**:
  - Added a Puppeteer test suite for creating, editing, and deleting roles.
  - Tests are data-driven using `test/roles/roles_test_data.csv`.
- **User Management E2E Tests**:
  - Added a Puppeteer test suite for creating, editing, and deleting users.
  - Tests are data-driven using `test/users/users_test_data.csv`.
- **Automated Test Runner**:
  - Created a parent test script (`test/run-all-tests.js`) that automatically discovers and executes all test suites.
  - Added an `npm test` command to `package.json` to simplify running the entire test suite.
- **Puppeteer Testing Framework**:
  - Set up Puppeteer for end-to-end testing.
  - Created initial test suite for the authentication module.
  - Tests are data-driven, using a CSV file for test cases (valid, invalid, and edge cases).
  - Screenshots are automatically captured for each test case, indicating pass/fail status.

### Fixed
- Corrected a bug on the user edit page where role names were not displayed next to the assignment checkboxes.
- **E2E Test Suite Stability**:
  - Corrected logout functionality in authentication tests by updating selectors and adding robust waits.
  - Replaced all deprecated `page.waitForXPath()` calls with the modern `page.waitForSelector()` and `page.$x()` syntax across all test suites (`roles`, `permissions`, `feature-toggles`, `users`, `role-permissions`, `user-roles`), resolving numerous test failures and timeout errors.
  - Fixed incorrect selectors for create/edit actions and form fields in user and feature-toggle tests.
- Corrected a `403 Forbidden` error by adding the `full_access` role to the permission checks in the feature toggles API.
- Added the missing `/api/logging/entities` route to resolve a `404 Not Found` error in the Activity Logs page.
- Resolved a React warning by ensuring a unique `key` prop is used for each item in the Activity Logs list.

### 2025-08-21
- **Fixed Authentication and API Route Errors**
  - Resolved `401 Unauthorized` error during admin login by correctly handling default credentials.
  - Fixed `404 Not Found` for `/api/widget-config` by registering the route in `app.js`.

### 2025-08-18
- **Added "Request a Feature" to Sidebar**
  - A direct link to the feature request page has been added to the main sidebar for easy access by all users.

### 2025-08-18
- **Added Feature Request Module**
  - Implemented a new database table and API endpoints for creating and managing feature requests.
  - Created a frontend page for all users to submit feature requests.
  - Added an admin page for viewing and managing all submitted feature requests.

### 2025-08-18
- **Fixed Admin Access to Payment Page**
  - Removed a redundant frontend permission check on the Payment Admin page that was incorrectly blocking `Admin` users.
  - Made the role check in the authentication context case-insensitive to prevent authorization issues.

### 2025-08-18
- **Enhanced Admin Privileges**
  - Updated the backend permission middleware to bypass checks for the `Admin` role, granting administrators full access to all resources.
  - Modified the frontend feature toggle context to ensure that `Admin` users can view all features, regardless of their toggle state.

### 2025-08-19
- **Added Role-Based Dashboards**
  - Created a generic `RoleDashboard.js` component to serve as a template for role-specific dashboards.
  - Implemented a dynamic route `/dashboard/:roleName` to render dashboards based on user roles.
  - Updated application routing to automatically redirect logged-in users to their specific dashboard based on their assigned role.

### 2025-08-18
- **Added User Profile Page**
  - Created a new `UserProfile.js` component to display user details, including their assigned role and permissions.
  - Added a new route `/users/profile/:userId` to make the profile page accessible.
  - Added a "View Profile" button to the `UserList` component to allow easy navigation to each user's profile.
  - Connected the top menu profile link to the user's profile page.

### 2025-08-19
- **Fixed Activity Log Display Errors**
  - Added a null check in `frontend/src/components/logging/ActivityLogs.js` to prevent a `TypeError` when an activity log is missing the `action` property.
  - Added a fallback display value for missing actions to improve UI robustness.

### 2025-08-19
- **Fixed Permission List Display Errors**
  - Corrected data mapping in `frontend/src/components/permissions/PermissionList.js` to use `permission_name`, `permission_description`, and `role_name` properties, resolving incorrect display of permission and role data.
  - Updated all related logic, including sorting and filtering, to use the correct property names for consistent behavior.

### 2025-08-18
- **Fixed User Management Display Issues**
  - Corrected data mapping in `frontend/src/components/users/UserList.js` to use `user_email` and `mobile_number` properties, resolving incorrect display of user data.
  - Updated filtering and sorting logic to use correct property names (`user_email`, `mobile_number`, `role_name`) for consistent behavior.
  - Ensured all user-related actions correctly reference `user_email` to prevent issues with protected accounts like the admin user.

### 2025-08-15
- **Fixed API Errors**
  - Resolved `404 Not Found` error for `/api/widget-config` by correctly mounting the `file-upload` router in `app.js`.
  - Fixed `403 Forbidden` error for the Admin user by making the role check in the authentication middleware case-insensitive.

### 2025-08-15
- **Fixed Admin Login and Database Seeding**
  - Resolved database seeding failures by modifying `base_v2.sql` to use `INSERT OR IGNORE`, making the script idempotent and preventing `UNIQUE` constraint errors.
  - Recreated the database from a corrected schema to ensure a clean and consistent state.
  - Verified the default admin user exists with the correct role, enabling successful login.

### 2025-08-15
- Frontend lint cleanup
  - Removed unused imports and variables in `frontend/src/App.js`
  - Resolved no-unused-vars warnings for Router/Link/Nav/FeatureProtectedRoute and unused auth values

### 2025-08-11
- Implemented Admin role full access bypass for permissions
  - Modified hasPermission function in AuthContext to automatically grant access to Admin users
  - Admins now have complete access to all features regardless of specific permission assignments
  - Improved system security with proper role-based authorization hierarchy
  - Enhanced user experience for administrators by removing unnecessary permission restrictions

### 2025-08-10
- Fixed TypeError in RolePermissionsContent when managing role permissions
  - Added comprehensive null checks for role.permissions arrays
  - Resolved "Cannot read properties of undefined (reading 'length')" error
  - Added fallback values for role names, permission counts, and permission names
  - Improved handling of potentially malformed role and permission data
- Fixed TypeError in PermissionList component when viewing permissions page
  - Added null check before calling substring() on permission names
  - Resolved "Cannot read properties of undefined (reading 'substring')" error
  - Added empty string fallback for actions when permission name is missing
  - Improved handling of malformed permission data throughout the component
- Fixed TypeError in RoleList component when viewing roles page
  - Added null check before calling split() on permission names
  - Resolved "Cannot read properties of undefined (reading 'split')" error
  - Improved error handling for permissions with missing name properties
  - Added fallback category 'other' for permissions without proper naming convention
- Completely eliminated source map warnings by disabling source maps in development
  - Created frontend/.env file with GENERATE_SOURCEMAP=false setting
  - Fixed all React Datepicker and other library source map warnings
  - Improved development experience with clean console output
  - Enhanced build performance by removing source map generation overhead
- Improved source map handling in webpack configuration
  - Enhanced CRACO configuration to properly exclude all node_modules from source map processing
  - Fixed React Datepicker source map warnings by implementing more robust source-map-loader rule exclusion
  - Eliminated console warnings while preserving source map functionality for project files

### 2025-08-09
- Fixed database constraint errors in logging module
  - Added default values to prevent NULL constraint failures
  - Updated feature-toggles event emission with correct field names
- Fixed user_management API 404 errors
  - Updated import statement to use checkPermissions from auth.js instead of rbac.js
- Fixed React Datepicker source map warnings by implementing CRACO configuration
  - Added @craco/craco to override Create React App webpack settings
  - Created craco.config.js to exclude node_modules from source-map-loader
  - Updated package.json scripts to use CRACO instead of react-scripts
  - Eliminated console warnings without ejecting from Create React App
- Fixed backend error with checkPermissions function
  - Added missing checkPermissions function in auth middleware
  - Maintained backward compatibility with existing checkPermission function
  - Implemented improved permission checking for routes requiring multiple permissions
- Fixed API route 404 errors
  - Updated module registration in app.js to keep underscore paths consistent between frontend and backend
  - Fixed module exports in role_management and user_management modules
  - Standardized module export pattern across all modules with { router, init } structure

### 2025-08-07
- Updated all backend API routes to match SQLite database schema with base_ prefix
  - Updated user management module routes to reference base_master_users, base_master_roles, base_role_user_link
  - Updated role management module routes to reference base_master_roles, base_master_permissions, base_role_permission_link
  - Updated feature toggles routes to use base_feature_toggle table
  - Updated payment QR codes routes to use base_payment_qr table with correct column names
  - Updated payment transactions routes to use base_payment_transactions and join with base_master_users
  - Updated permission management module routes to use base_master_permissions and base_role_permission_link with proper column names
  - Updated authentication module to reference base_master_users, base_master_roles, base_role_user_link, and correct column names
  - Updated logging module to use base_activity_logs table for activity tracking
  - Updated payment module to align all table references with the base_ prefix schema
  - Fixed all column references in SQL queries to match the current schema
  - Ensured consistent response formatting across all API endpoints

### 2025-08-07
- Updated data update scripts to align with current database schema
  - Fixed column names in base_v2_data.sql to match base_v2_db.sql schema
  - Updated table names from legacy naming to current base_ prefix naming convention
  - Fixed insert statements for payment tables to use correct field names
  - Corrected permission descriptions in base_master_permissions table
  - Updated feature toggle table insert statements to match current schema
- Refactored database initialization script for improved functionality
  - Reorganized DROP TABLE statements to respect foreign key constraints
  - Improved documentation with clearer section headers
  - Fixed transaction safety by ensuring proper table creation order
  - Successfully tested database schema creation and data insertion

### 2025-07-25
- Fixed admin role permissions to ensure complete access to all system features
  - Added missing permissions for bulk upload user functionality
  - Added missing permissions for feature toggle management
  - Created migration script (007_fix_missing_admin_permissions.sql) to ensure admin role has all permissions
  - Verified admin role now has complete access to all system functionality
- Implemented route feature toggles for access control across application
  - Added feature toggle functionality for all application routes
  - Implemented role-based access with admin having full access
  - Other roles granted view permissions for applicable routes
  - Created script to initialize all route feature toggles in database
  - Added context-based feature toggle system for frontend routes

- Added script for bulk updating user mobile numbers and roles from CSV file
  - Created utility script to process CSV data and update existing users
  - Supports updating mobile numbers and assigning new roles in batch
  - Provides detailed logging and success/failure reporting
- Added interactive status toggle in user management table
  - Converted static status badges to interactive toggle buttons
  - Added ability to instantly activate/deactivate users with a single click
  - Protected system admin account from accidental deactivation
  - Implemented optimistic UI updates with error handling
- Enhanced table sorting functionality across all columns in user and role management
  - Added clickable column headers with sort indicators (ascending/descending)
  - Implemented sorting for all data columns including ID, name, email, mobile, role, and status
  - Added consistent visual indicators showing current sort direction
- Added role column and inline role editing functionality in user management table
- Added mobile number field as optional in user bulk upload CSV template
- Added multi-selection and bulk operations functionality for user and role management
  - Implemented checkboxes for user and role selection with "select all" capability
  - Added bulk delete functionality for users and roles with confirmation modals
  - Added bulk role assignment functionality for users
  - Added bulk status toggle (activate/deactivate) for users
  - Implemented system role protection to prevent deletion of critical roles (Admin, System)
  - Added appropriate UI feedback with toast notifications for all bulk operations
- Added rows per page selector (10, 20, 50, 100 options) for all data grids in the application
- Added column-based filtering and sorting capabilities to UserList and RoleList components
- Added 20 new users (5 each for Director, Senior Manager, Manager, and Article roles)
- Fixed role creation and edit functionality by correcting API payload field from 'permission_ids' to 'permissions'
- Enhanced dashboard UI to display components based on user's role and permissions
- Added permission-based filtering for dashboard cards (Users, Roles, Permissions, Activities)
- Added permission-based access control for activity charts and logs section
- Updated dashboard to display a simple "No permissions" card for users without any permissions
- Fixed permission checking logic to avoid infinite loops and redundant API calls
- Removed user_view permission from User role to ensure proper separation of access levels
- Added permission check for file upload widget visibility

### 2025-07-15
- Fixed QR code fetching error (500 Internal Server Error) by adding database table initialization for payment_qr_codes and payment_transactions tables
- Fixed QR code upload error (500 Internal Server Error) by correcting the path mismatch between multer storage destination and Express static file serving
- Added improved error handling for file uploads in the payment QR code module with better error messages
- Enhanced file validation to ensure only supported image types are accepted
- Added automatic creation of upload directories to prevent errors
- Fixed database column name mismatch by renaming 'enabled' to 'is_enabled' in feature_toggles table
- Updated SQL queries in payment module and feature toggles routes to use correct column names ('feature_name' and 'is_enabled')
- Updated migration scripts and data update scripts to use consistent column names

### 2025-07-12
- Fixed 403 Forbidden errors by updating feature toggle routes to allow Admin users access without requiring specific permissions
- Added missing `/api/logging/entities` endpoint to support the ActivityLogs component
- Fixed source map warnings from react-datepicker by adding GENERATE_SOURCEMAP=false to frontend/.env
- Fixed dependency issues by installing missing packages (express, express-validator, jsonwebtoken, @mui/material, @mui/icons-material)
- Fixed middleware import path in payment-transactions.js
- Added checkPermission function to auth middleware
- Resolved module resolution issues for both frontend and backend
- Fixed 500 Server Error in payment module by correcting the feature toggle check middleware to properly handle SQLite integer representation of boolean values

### 2025-07-11
- Added Payment Integration Module with QR code upload/management functionality and feature toggle support
- Added dedicated API endpoints for payment QR code CRUD operations
- Added frontend components for payment settings and QR code management
- Added database schema for payment transactions and QR code storage
- Extended feature toggle system to include payment integration toggle

### 2025-07-10
- Added `proxy` configuration to `frontend/package.json` to forward API requests to Express backend on port 5000. This resolves 404 errors for `/api` requests from React development server.

### Added
- Feature Toggle system: backend API (CRUD, admin/full_access only), DB migration, and frontend admin UI for managing feature flags.
### Fixed
- ActivityLogList: Timestamp now always displays in a readable format using formatTimestamp utility.
- ActivityLogList: Added 'IP Address / Port' column to activity log table. Now displays the source IP/port for each activity log if available.

### Fixed
- Fixed JSX syntax errors in `frontend/src/components/roles/RoleList.js`, specifically the missing or mismatched `<tr>` closing tag and incorrect button/action JSX structure, which caused rendering issues on the Roles List page.

### Improved
- Enhanced the Role Management table UI in `RoleList.js` for better clarity and aesthetics: improved alignment, better action buttons, permission badge wrapping, and custom styles for a modern look.

### Changed
- Role List: Replaced the "View role" action in the Actions column with an "Edit Role" action. The button now navigates to the edit role page and uses the edit icon with text for clarity.

