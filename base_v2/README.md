# EmployDEX Base Platform

A foundational system providing essential user management capabilities, including user registration, authentication, role-based access control, and an administrative dashboard.

## Project Structure

```
base_v1/
├── backend/             # Express.js API
│   ├── config/          # Configuration files
│   ├── controllers/     # API route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
│
├── modules/             # Modular functionality
│   └── payment/         # Payment integration module
│       ├── backend/     # Payment backend API
│       └── frontend/    # Payment frontend components
│
├── frontend/            # React frontend
│   ├── public/          # Static files
│   ├── src/             # Source files
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── utils/       # Utility functions
│   │   ├── App.js       # Main app component
│   │   └── index.js     # Entry point
│   └── package.json     # Frontend dependencies
│
├── database/            # SQLite database
│   └── migrations/      # Database migrations
│
├── base_v1.MD           # Project PRD
├── CHANGELOG.md         # Project changelog
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## Features

- **Bug Fixes**:
  - Fixed a `403 Forbidden` error in the feature toggles API by adding the `full_access` role to the permission checks.
  - Fixed a `404 Not Found` error by adding the missing `/api/logging/entities` route.
  - Resolved a React warning related to missing `key` props in the Activity Logs table.
- **API and Authentication Fixes**:
  - Resolved a `401 Unauthorized` error for the default admin login by implementing correct password handling.
  - Fixed a `404 Not Found` error for the `/api/widget-config` endpoint by properly registering its route.

- **Improved Build Configuration**:
  - Enhanced webpack configuration via CRACO to properly handle source maps
  - Exclusion of node_modules from source map processing to eliminate console warnings
  - Clean development console output without sacrificing debugging capabilities
  - Optimized build performance by avoiding unnecessary source map processing

- **Route Feature Toggles**:
  - Comprehensive feature toggle system for all application routes
  - Role-based access control with permission checks
  - Admin role automatically granted full access to all routes
  - Other roles granted view-only permissions by default
  - Frontend routes protected by feature toggle status
  - SQL migration script for easy setup of all feature toggles

- **Role-Based Dashboards**:
  - Each user role is now assigned a dedicated dashboard, which serves as the landing page after login.
  - Dashboards are dynamically generated based on the user's role, providing a tailored experience.
  - Each dashboard includes four placeholder cards for future content and features.

- **Enhanced User Management Interface**:
  - **User Profile Page**: A dedicated profile page for each user, accessible from the user list, displaying their role, permissions, and other details.
  - **Accurate Data Display**: Corrected data mapping to ensure `user_email` and `mobile_number` are displayed accurately. Aligned filtering and sorting logic with the database schema for a consistent user experience.
  - Interactive status toggle buttons for instant user activation/deactivation
  - Visual status indicators with toggle buttons for authorized users
  - Protection for system accounts from accidental deactivation

- **Enhanced Table Sorting and Management**:
  - Sort any column in user and role tables with intuitive click-to-sort functionality
  - Clear visual indicators showing current sort direction (ascending/descending)
  - Consistent sorting behavior across all data grids

- **Role Management in User Table**: View and manage user roles directly from the user list:
  - Display user roles in a dedicated column for easy identification
  - Change user roles directly from the user table with inline role editing
  - Quick access to role management via dedicated role change button

- **Multi-Selection and Bulk Operations**: Efficiently manage users and roles with powerful bulk operations:
  - Select multiple users or roles with checkbox selection and "select all" capability
  - Perform bulk deletion of users and roles with confirmation dialogs
  - Assign roles to multiple users simultaneously
  - Toggle status (activate/deactivate) for multiple users at once
  - Support for optional mobile number in bulk user uploads
  - System protection prevents deletion of critical system roles (Admin, System)
  - Clear UI feedback with toast notifications for all operations

- **Payment Integration Module**: A comprehensive payment integration system with QR code management and transaction tracking. Admins can upload, activate, and manage payment QR codes through an intuitive UI. The module automatically creates required database tables on initialization.

- **Feature Request Module**: Allows any authenticated user to submit feature requests through a dedicated form, accessible via a link in the sidebar. Administrators can view, manage, and update the status of all submitted requests from a separate admin page.

- **Feature Toggle System**: Comprehensive feature management with role-based access control:
  - **Route-Based Feature Toggles**: All application routes are protected by feature toggles that can be enabled/disabled
  - **Role-Based Access Control**:
    - **Admin Full Access**: The `Admin` role bypasses all permission and feature toggle checks, granting unrestricted access to all application features and routes.
    - This ensures administrators can manage the system without being affected by feature flags or specific permission requirements.
  - **Permission Structure**: Non-admin users have view permissions only for enabled routes
  - **Admin UI**: Admin and Full Access roles can manage feature flags via a dedicated UI
  - **API Integration**: Complete API for managing feature toggles programmatically
  - **Controlled Rollout**: Enable/disable features and routes for controlled deployment

- **Activity Logging**: Activity Log page displays timestamps in a readable format and includes a 'IP Address / Port' column, showing the source of each activity if available.

- **2025-07-10:** Fixed JSX syntax errors in `frontend/src/components/roles/RoleList.js` (missing/mismatched `<tr>` closing tag and action button structure) that caused rendering issues on the Roles List page.
- **2025-07-10:** Improved the Role Management table UI for clarity and modern appearance (better alignment, action buttons, permission badges, and custom styles).


## Database Schema

The project uses SQLite with a standardized schema defined in `base_v2_db.sql`. All database tables follow a consistent naming convention with the `base_` prefix:

- **Users & Authentication**
  - `base_master_users` - User accounts with authentication credentials
  - `base_master_roles` - System roles (Admin, User, etc.)
  - `base_master_permissions` - Available permissions in the system
  - `base_role_user_link` - Junction table linking users to roles
  - `base_role_permission_link` - Junction table linking roles to permissions

- **Activity Tracking**
  - `base_activity_logs` - System activity logs for auditing

- **Payment System**
  - `base_payment_qr` - QR codes for payment processing
  - `base_payment_transactions` - Payment transaction records

- **System Configuration**
  - `base_feature_toggle` - Feature toggle settings for the application
  - `base_feature_requests` - Stores user-submitted feature requests

All backend API routes have been aligned with this schema to ensure consistent data access patterns.

- User registration and authentication with JWT
- Role-based access control (RBAC) system
- User dashboard with activity metrics
- Administrative interface with comprehensive controls
- User, role, and permission management
  - Individual user creation and editing
  - Role management directly from user edit page
  - Bulk user upload via CSV file
  - Bulk role upload via CSV file with permission assignment
  - CSV template download for easy onboarding
- Payment integration with QR code management
  - Upload and manage QR codes for payment collection
  - Activate/deactivate payment methods
  - Track payment transactions
  - Feature toggle for enabling/disabling payment features
- System activity logging and monitoring
- Permission-based UI components
- Role-based dashboard with adaptive cards based on user permissions
  - Dashboard components displayed dynamically based on user's permissions
  - Users without any permissions see a clean "No permissions" message
  - API calls prevented for unauthorized components for improved performance
  - Clear visual indicators for available functionality

## Technology Stack

- **Backend**: Express.js
- **Frontend**: React.js
- **Database**: SQLite
- **Authentication**: JWT

## Getting Started

### Local Development Proxy

The React frontend is configured to proxy API requests to the Express backend:

```
"proxy": "http://localhost:5000"
```

This allows you to use `/api/*` endpoints in your frontend code without specifying the backend port. If you encounter 404 errors for `/api` requests, ensure the proxy is set and restart the React dev server.


### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later)

### Installation

1. Clone the repository
2. Install all dependencies using the provided script:
   ```
   npm run install:all
   ```
   This will install both frontend and backend dependencies.

### Running the Application

1. Start both backend and frontend concurrently:
   ```
   npm run start
   ```
   This will start the backend API on port 5000 and the frontend on port 3000.

### Using the Virtual Environment (for Python modules)

The project uses a Python virtual environment for certain backend modules:

1. Activate the virtual environment:
   ```
   source /Users/alokk/EmployDEX/Applications/venv/bin/activate
   ```

2. Install any required Python dependencies within the activated environment.


### Access Information

After starting the application:

- Backend API: http://localhost:5000
- Frontend application: http://localhost:3000


## Testing

This project uses Puppeteer for end-to-end testing. The test scripts are located in the `test/` directory, with subdirectories for each module. Test data is stored in CSV files alongside the test scripts.

### Running Tests

To run the entire test suite, use the following npm command:

```bash
npm test
```

This command will automatically discover and execute all test files (`*.test.js`) within the `test/` directory.

After running the tests, screenshots for each test case will be saved in the `test/screenshots/` directory. The filenames will indicate the test and its outcome (passed/failed).

An HTML report named `test-report.html` will also be generated in the `test/` directory. This report provides a summary of the test run (total, passed, failed) and a detailed table with the status of each test and direct links to any screenshots taken.


## Database Structure

Refer to the PRD (`base_v1.MD`) for detailed database structure information.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Development Notes

- 2025-08-15: Frontend lint cleanup in `frontend/src/App.js` (removed unused imports and unused auth variables to resolve no-unused-vars warnings).
