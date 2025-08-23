const DataIsolation = require('./dataIsolation');

class DataFilter {
  // Middleware to filter questions by company
  static filterQuestions(req, res, next) {
    return DataIsolation.filterByCompany(req, res, () => {
      // Add additional question-specific filtering logic here if needed
      next();
    });
  }

  // Middleware to filter categories by company
  static filterCategories(req, res, next) {
    return DataIsolation.filterByCompany(req, res, () => {
      // Add additional category-specific filtering logic here if needed
      next();
    });
  }

  // Middleware to filter tests by company
  static filterTests(req, res, next) {
    return DataIsolation.filterByCompany(req, res, () => {
      // Add additional test-specific filtering logic here if needed
      next();
    });
  }

  // Middleware to filter results by company
  static filterResults(req, res, next) {
    return DataIsolation.filterByCompany(req, res, () => {
      // Add additional result-specific filtering logic here if needed
      next();
    });
  }

  // Middleware to filter employees by company
  static filterEmployees(req, res, next) {
    return DataIsolation.filterByCompany(req, res, async () => {
      try {
        const { companyId } = req.params;
        const userId = req.user.userId;

        // For non-admin users, filter out sensitive employee information
        const isAdmin = await DataIsolation.isUserAdmin(userId);
        const isOwner = await DataIsolation.isCompanyOwner(companyId, userId);
        
        if (!isAdmin && !isOwner) {
          // Non-admin, non-owner users can only see basic employee info
          req.employeeFields = [
            'e.employee_id',
            'u.user_id',
            'u.first_name',
            'u.last_name',
            'u.user_email',
            'e.department',
            'e.position',
            'e.hire_date',
            'e.is_active',
            'e.created_at',
            'e.updated_at'
          ];
        }
        
        next();
      } catch (error) {
        console.error('Employee filtering error:', error);
        return res.status(500).json({
          success: false,
          message: 'An error occurred while filtering employee data'
        });
      }
    });
  }

  // Middleware to filter user data based on role and company
  static filterUserData(req, res, next) {
    // Skip if no user data in response
    if (!res.locals.userData) {
      return next();
    }

    const userData = res.locals.userData;
    const requestingUserId = req.user.userId;

    // If the user is viewing their own data, return all fields
    if (userData.user_id === requestingUserId) {
      return next();
    }

    // Filter out sensitive fields for non-admin users
    const filteredUser = { ...userData };
    const sensitiveFields = [
      'password_hash',
      'reset_password_token',
      'reset_password_expires',
      'verification_token',
      'is_verified',
      'last_login_ip',
      'failed_login_attempts',
      'account_locked_until'
    ];

    sensitiveFields.forEach(field => {
      if (field in filteredUser) {
        delete filteredUser[field];
      }
    });

    res.locals.userData = filteredUser;
    next();
  }

  // Middleware to filter company data based on user role
  static filterCompanyData(req, res, next) {
    // Skip if no company data in response
    if (!res.locals.companyData) {
      return next();
    }

    const companyData = res.locals.companyData;
    const userId = req.user.userId;

    // Check if user is admin or company owner
    Promise.all([
      DataIsolation.isUserAdmin(userId),
      DataIsolation.isCompanyOwner(companyData.company_id, userId)
    ]).then(([isAdmin, isOwner]) => {
      // If user is admin or owner, return all fields
      if (isAdmin || isOwner) {
        return next();
      }

      // For non-admin, non-owner users, filter sensitive fields
      const filteredCompany = { ...companyData };
      const sensitiveFields = [
        'billing_email',
        'billing_address',
        'tax_id',
        'subscription_id',
        'payment_method_id',
        'billing_status',
        'settings',
        'api_keys',
        'webhook_urls',
        'custom_fields'
      ];

      sensitiveFields.forEach(field => {
        if (field in filteredCompany) {
          delete filteredCompany[field];
        }
      });

      res.locals.companyData = filteredCompany;
      next();
    }).catch(error => {
      console.error('Error filtering company data:', error);
      next();
    });
  }
}

module.exports = DataFilter;
