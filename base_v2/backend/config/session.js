const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');

// Ensure session directory exists
const sessionDir = path.join(__dirname, '..', 'sessions');
const fs = require('fs');
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

const sessionConfig = {
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: sessionDir,
    table: 'sessions',
    concurrentDB: true
  }),
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Enable in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'qb.sid'
};

// Extend session object with user data
const extendSession = (req, user) => {
  req.session.userId = user.userId;
  req.session.roles = user.roles;
  req.session.permissions = user.permissions || [];
  req.session.companyId = user.companyId; // If user is associated with a company
  req.session.lastActivity = new Date();
};

// Middleware to check session activity and extend if valid
const sessionActivity = (req, res, next) => {
  if (req.session && req.session.userId) {
    // Update last activity timestamp
    req.session.lastActivity = new Date();
  }
  next();
};

// Middleware to check if session is active
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Session expired or not authenticated' 
    });
  }
  next();
};

// Middleware to check if user has any of the required roles
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.session || !req.session.roles) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const hasRole = roles.some(role => req.session.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ 
        success: false, 
        message: `Requires one of these roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = {
  sessionConfig,
  extendSession,
  sessionActivity,
  requireAuth,
  requireRole
};
