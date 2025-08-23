const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const db = require('../config/database');
const { Op } = require('sequelize');

// Admin middleware - requires admin role
const requireAdmin = [authenticateToken, authorizeRoles(['admin'])];

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private/Admin
 */
router.get('/dashboard/stats', requireAdmin, async (req, res) => {
  try {
    // Get counts from database
    const [
      totalUsers,
      activeCompanies,
      pendingApprovals,
      totalQuestions,
      recentUsers,
      recentCompanies
    ] = await Promise.all([
      db.User.count(),
      db.Company.count({ where: { isActive: true } }),
      db.Company.count({ where: { isApproved: false } }),
      db.Question.count(),
      db.User.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'email', 'firstName', 'lastName', 'createdAt']
      }),
      db.Company.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        where: { isApproved: false },
        attributes: ['id', 'name', 'email', 'createdAt']
      })
    ]);

    // Calculate growth percentages (example calculation - adjust as needed)
    const userGrowth = 5.2; // This would come from analytics in a real app
    const companyGrowth = 2.1; // This would come from analytics in a real app
    const newApprovals = pendingApprovals; // This would be calculated based on time period

    res.json({
      success: true,
      data: {
        totalUsers,
        activeCompanies,
        pendingApprovals,
        totalQuestions,
        userGrowth,
        companyGrowth,
        newApprovals,
        systemStatus: 'Operational', // This would come from system health check
        recentUsers,
        recentCompanies
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/activity
 * @desc    Get recent system activity
 * @access  Private/Admin
 */
router.get('/activity', requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // In a real app, you would have an Activity model to track this
    const activities = await db.sequelize.query(`
      (
        SELECT 
          id, 
          'question' as type,
          'created' as action,
          title as description,
          created_at as timestamp,
          'system' as source
        FROM questions
        ORDER BY created_at DESC
        LIMIT :limit
      )
      UNION ALL
      (
        SELECT 
          id, 
          'user' as type,
          'registered' as action,
          email as description,
          created_at as timestamp,
          'system' as source
        FROM users
        ORDER BY created_at DESC
        LIMIT :limit
      )
      ORDER BY timestamp DESC
      LIMIT :limit
    `, {
      replacements: { limit: parseInt(limit) },
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status
 * @access  Private/Admin
 */
router.get('/system/health', requireAdmin, async (req, res) => {
  try {
    // Check database connection
    await db.sequelize.authenticate();
    
    // Check if database is responsive
    await db.sequelize.query('SELECT 1');
    
    // Get system metrics (example - expand based on your needs)
    const metrics = {
      database: 'Connected',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      // Add more metrics as needed
    };

    res.json({
      success: true,
      data: {
        status: 'Operational',
        lastChecked: new Date().toISOString(),
        metrics
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'Degraded',
      message: 'System health check failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/system/backup
 * @desc    Trigger a system backup
 * @access  Private/Admin
 */
router.post('/system/backup', requireAdmin, async (req, res) => {
  try {
    // In a real app, you would implement actual backup logic here
    // This is just a placeholder that simulates a backup
    const backupResult = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          timestamp: new Date().toISOString(),
          backupId: `backup-${Date.now()}`,
          message: 'Backup completed successfully'
        });
      }, 2000); // Simulate backup time
    });

    // Log the backup event
    await db.ActivityLog.create({
      userId: req.user.id,
      action: 'system_backup',
      details: 'System backup was performed',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: backupResult
    });
  } catch (error) {
    console.error('Backup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Backup failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/system/alerts
 * @desc    Get system alerts
 * @access  Private/Admin
 */
router.get('/system/alerts', requireAdmin, async (req, res) => {
  try {
    // In a real app, this would check for actual system issues
    const alerts = [];
    
    // Example: Check for pending backups
    const lastBackup = await db.Backup.findOne({
      order: [['createdAt', 'DESC']]
    });

    if (!lastBackup || (new Date() - lastBackup.createdAt) > 24 * 60 * 60 * 1000) {
      alerts.push({
        id: 'backup-required',
        title: 'Backup Required',
        message: 'No backup has been taken in the last 24 hours',
        severity: 'warning',
        action: 'backup',
        timestamp: new Date().toISOString()
      });
    }

    // Add more alert checks as needed

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system alerts',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/quick-links
 * @desc    Get quick links for admin dashboard
 * @access  Private/Admin
 */
router.get('/quick-links', requireAdmin, async (req, res) => {
  try {
    // In a real app, these might come from a database or config
    const links = [
      { 
        name: 'User Management', 
        description: 'Manage user accounts and permissions',
        icon: 'users',
        path: '/admin/users'
      },
      { 
        name: 'Company Management', 
        description: 'View and manage all companies',
        icon: 'briefcase',
        path: '/admin/companies'
      },
      { 
        name: 'System Settings', 
        description: 'Configure system preferences',
        icon: 'settings',
        path: '/admin/settings'
      },
      { 
        name: 'Audit Logs', 
        description: 'View system activity logs',
        icon: 'file-text',
        path: '/admin/audit-logs'
      },
      { 
        name: 'Role Management', 
        description: 'Manage user roles and permissions',
        icon: 'shield',
        path: '/admin/roles'
      },
      { 
        name: 'System Health', 
        description: 'Monitor system performance',
        icon: 'activity',
        path: '/admin/health'
      }
    ];

    res.json({
      success: true,
      data: links
    });
  } catch (error) {
    console.error('Error fetching quick links:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick links',
      error: error.message
    });
  }
});

module.exports = router;
