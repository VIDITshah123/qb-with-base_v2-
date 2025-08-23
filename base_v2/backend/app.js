/**
 * EmployDEX Base Platform - Main Application Entry Point
 * Created: 2025-06-26
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const fs = require('fs');
const EventEmitter = require('events');
const { sessionConfig, sessionActivity, requireAuth } = require('./config/session');

// Create a global event bus for inter-module communication
const eventBus = new EventEmitter();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session(sessionConfig));
app.use(sessionActivity);

// Make session available in all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure required directories exist
const requiredDirs = [
  'uploads',
  'sessions',
  'templates/emails'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, ...dir.split('/'));
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Database initialization
const dbPath = path.join(__dirname, '..', 'db', process.env.DB_NAME || 'base.db');
const dbExists = fs.existsSync(dbPath);

// Create db directory if it doesn't exist
const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    // If database doesn't exist, initialize it with schema
    if (!dbExists) {
      const sqlScript = fs.readFileSync(path.join(__dirname, '..', 'db', 'data_update_scripts', 'base_v2_db.sql'), 'utf8');
      
      // Split the script by semicolons to execute each statement separately
      const sqlStatements = sqlScript.split(';').filter(stmt => stmt.trim() !== '');
      
      db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON');
        
        // Execute each SQL statement in the script
        sqlStatements.forEach(statement => {
          if (statement.trim()) {
            db.run(statement, (err) => {
              if (err) {
                console.error('Error executing SQL statement:', err.message);
                console.error('Statement:', statement);
              }
            });
          }
        });
        
        console.log('Database initialized successfully');
      });
    }
  }
});

// Make database connection available to all routes
app.locals.db = db;
app.locals.eventBus = eventBus;

// Register module routers
// Load and register all modules from the modules directory
const modulesPath = path.join(__dirname, '..', 'modules');

// Array of module names that should be loaded
const moduleNames = [
  'authentication', 
  'user_management', 
  'role_management', 
  'permission_management', 
  'logging',
  'database',
  'payment'
];

// Import routes
const widgetConfigRoutes = require('./routes/widget-config');
const paymentQrRoutes = require('./routes/payment-qr-codes');
const paymentTransactionRoutes = require('./routes/payment-transactions');
const featureToggleRoutes = require('./routes/feature-toggles');
const featureRequestRoutes = require('./routes/feature-requests');
const authRoutes = require('./routes/auth');
const passwordResetRoutes = require('./routes/passwordReset');
const companyRoutes = require('./routes/company');
const employeeRoutes = require('./routes/employee');
const employeeRoleRoutes = require('./routes/employeeRole');

// Register feature-toggles routes
app.use('/api/feature-toggles', featureToggleRoutes);
console.log('Registered routes for feature-toggles');

// Register feature-requests routes
app.use('/api/feature-requests', featureRequestRoutes);
console.log('Registered routes for feature-requests');

// Register auth routes
app.use('/api/auth', authRoutes);

// Register password reset routes
app.use('/api/password-reset', passwordResetRoutes);

// Register company routes
app.use('/api/companies', companyRoutes);
console.log('Registered routes for companies');

// Register employee routes
app.use('/api/employees', employeeRoutes);
console.log('Registered routes for employees');

// Register employee role routes
app.use('/api/employee-roles', employeeRoleRoutes);
console.log('Registered routes for employee roles');

// Register category routes
const categoryRoutes = require('./routes/category');
app.use('/api/categories', categoryRoutes);
console.log('Registered routes for categories');

// Register review routes
const reviewRoutes = require('./routes/review');
app.use('/api/reviews', reviewRoutes);
console.log('Registered routes for reviews');

// Register vote routes
const voteRoutes = require('./routes/vote');
app.use('/api/votes', voteRoutes);
console.log('Registered routes for votes');

// Register widget-config routes
app.use('/api/widget-config', widgetConfigRoutes);
console.log('Registered routes for widget-config');

// Register admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
console.log('Registered routes for admin');

// Register each module's backend routes
moduleNames.forEach(moduleName => {
  try {
    const modulePath = path.join(modulesPath, moduleName, 'backend', 'index.js');
    if (fs.existsSync(modulePath)) {
      const { router: moduleRouter, init: moduleInit } = require(modulePath);
      if (moduleRouter) {
        // Use original module name with underscores to match frontend API calls
        app.use(`/api/${moduleName}`, moduleRouter);
        console.log(`Registered routes for module: ${moduleName}`);
      }
      if (moduleInit) {
        moduleInit(app);
        console.log(`Initialized module: ${moduleName}`);
      }
    } else {
      console.warn(`Module ${moduleName} does not have a backend/index.js file`);
    }
  } catch (err) {
    console.error(`Error loading module ${moduleName}:`, err);
  }
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const errorLogger = app.locals.eventBus;
  errorLogger.emit('log:error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: {
      message: 'An unexpected error occurred',
      id: Date.now().toString()
    }
  });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  eventBus.emit('system:startup', { timestamp: new Date() });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  // Close database connection
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = app;
