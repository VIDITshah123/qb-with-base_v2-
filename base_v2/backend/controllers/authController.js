const bcrypt = require('bcryptjs');
const db = require('../db');
const { extendSession } = require('../config/session');

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide both email and password' 
      });
    }

    // Find user by email
    const user = await db.get('SELECT * FROM base_master_users WHERE user_email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Get user roles
    const roles = await db.all(
      `SELECT r.role_name 
       FROM base_role_user_link rul
       JOIN base_master_roles r ON rul.role_id = r.role_id
       WHERE rul.user_id = ?`, 
      [user.user_id]
    );

    // Extend session with user data
    const userData = {
      userId: user.user_id,
      email: user.user_email,
      roles: roles.map(r => r.role_name),
      companyId: user.company_id // If available
    };
    
    // Set session data
    extendSession(req, userData);
    
    // Return user data (excluding password)
    const { password_hash, ...safeUserData } = user;
    
    res.json({
      success: true,
      user: {
        ...safeUserData,
        roles: roles.map(r => r.role_name)
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await db.get(
      `SELECT user_id, user_email, first_name, last_name, is_active, 
              created_at, updated_at, company_id 
       FROM base_master_users 
       WHERE user_id = ?`,
      [req.session.userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        ...user,
        roles: req.session.roles || []
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User logout
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Error during logout' });
    }
    
    // Clear the session cookie
    res.clearCookie('qb.sid');
    
    res.json({ success: true, message: 'Successfully logged out' });
  });
};

module.exports = {
  login,
  getProfile,
  logout
};
