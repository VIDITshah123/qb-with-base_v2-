const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user has required roles
exports.authorizeRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role ${req.user.role} is not authorized to access this resource` 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has required permissions
 * @param {string|string[]} permissions - Single permission or array of permissions to check
 * @param {Object} options - Options for permission checking
 * @param {boolean} options.requireAll - If true, user must have all specified permissions
 * @returns {Function} Express middleware function
 */
exports.checkPermission = (permissions, options = {}) => {
  const { requireAll = false } = options;
  const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Bypass permission check for Admin role
    if (req.user.roles && req.user.roles.map(r => r.toLowerCase()).includes('admin')) {
      return next();
    }

    try {
      const db = req.app.locals.db;
      const userId = req.user.userId;
      const roleNames = req.user.roles || [];

      if (!roleNames.length) {
        return res.status(403).json({ 
          success: false, 
          message: 'No roles assigned to user' 
        });
      }

      // Get all permissions for the user's roles
      const placeholders = roleNames.map(() => '?').join(',');
      const query = `
        SELECT DISTINCT p.permission_name
        FROM base_role_permission_link rp
        JOIN base_master_permissions p ON rp.permission_id = p.permission_id
        JOIN base_master_roles r ON rp.role_id = r.role_id
        WHERE r.role_name IN (${placeholders})
      `;

      const userPermissions = await new Promise((resolve, reject) => {
        db.all(query, roleNames, (err, rows) => {
          if (err) return reject(err);
          resolve(rows.map(row => row.permission_name));
        });
      });

      // Check permissions based on requireAll flag
      const hasPermission = requireAll 
        ? permissionsArray.every(p => userPermissions.includes(p))
        : permissionsArray.some(p => userPermissions.includes(p));

      if (!hasPermission) {
        const message = requireAll
          ? `Requires all of these permissions: ${permissionsArray.join(', ')}`
          : `Requires any of these permissions: ${permissionsArray.join(', ')}`;
        
        return res.status(403).json({ 
          success: false, 
          message,
          requiredPermissions: permissionsArray,
          userPermissions
        });
      }

      // Attach user permissions to request object for later use
      req.user.permissions = userPermissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking permissions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Middleware to check company ownership or admin access
 * @param {string} idParam - Name of the route parameter containing the company ID
 */
exports.checkCompanyOwnership = (idParam = 'companyId') => {
  return async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const companyId = req.params[idParam];
      const userId = req.user.userId;

      // Admin can access any company
      if (req.user.roles && req.user.roles.includes('admin')) {
        return next();
      }

      // Check if user is associated with the company
      const isOwner = await new Promise((resolve, reject) => {
        db.get(
          `SELECT 1 FROM qb_master_companies 
           WHERE company_id = ? AND user_id = ?`,
          [companyId, userId],
          (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
          }
        );
      });

      if (!isOwner) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to access this company' 
        });
      }

      next();
    } catch (error) {
      console.error('Company ownership check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error verifying company ownership',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};
