const Company = require('../models/company');
const { validationResult } = require('express-validator');

class CompanyController {
  // Get all companies (admin only)
  static async getAllCompanies(req, res) {
    try {
      // Check if user is admin
      if (!req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can view all companies'
        });
      }

      const companies = await Company.findAll();
      res.json({
        success: true,
        data: companies
      });
    } catch (error) {
      console.error('Get all companies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch companies',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get companies owned by the current user
  static async getMyCompanies(req, res) {
    try {
      const companies = await Company.findByUserId(req.user.userId);
      res.json({
        success: true,
        data: companies
      });
    } catch (error) {
      console.error('Get my companies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your companies',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get company by ID
  static async getCompanyById(req, res) {
    try {
      const company = await Company.findById(
        req.params.id,
        req.user.roles.includes('admin') ? null : req.user.userId
      );

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found or access denied'
        });
      }

      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      console.error('Get company by ID error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch company',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create a new company
  static async createCompany(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const companyData = {
        userId: req.user.userId,
        companyName: req.body.companyName,
        gstNumber: req.body.gstNumber,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        pincode: req.body.pincode,
        address: req.body.address
      };

      const companyId = await Company.create(companyData);
      
      // Get the newly created company
      const company = await Company.findById(companyId);

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: company
      });
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create company',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update company
  static async updateCompany(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const companyId = req.params.id;
      const updateData = {
        companyName: req.body.companyName,
        gstNumber: req.body.gstNumber,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        pincode: req.body.pincode,
        address: req.body.address,
        isActive: req.body.isActive
      };

      const updated = await Company.update(
        companyId,
        req.user.userId,
        updateData
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Company not found or access denied'
        });
      }

      // Get the updated company
      const company = await Company.findById(companyId);

      res.json({
        success: true,
        message: 'Company updated successfully',
        data: company
      });
    } catch (error) {
      console.error('Update company error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to update company',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete company (soft delete)
  static async deleteCompany(req, res) {
    try {
      const companyId = req.params.id;
      const deleted = await Company.delete(companyId, req.user.userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Company not found or access denied'
        });
      }

      res.json({
        success: true,
        message: 'Company deleted successfully'
      });
    } catch (error) {
      console.error('Delete company error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to delete company',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get company statistics (admin only)
  static async getCompanyStats(req, res) {
    try {
      // Check if user is admin
      if (!req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can view company statistics'
        });
      }

      const stats = await Company.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get company stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch company statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update company status (admin only)
  static async updateCompanyStatus(req, res) {
    try {
      // Check if user is admin
      if (!req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can update company status'
        });
      }

      const companyId = req.params.id;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }

      const updated = await Company.updateStatus(companyId, isActive, req.user.userId);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Company not found or access denied'
        });
      }

      res.json({
        success: true,
        message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Update company status error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to update company status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get recent companies (admin only)
  static async getRecentCompanies(req, res) {
    try {
      // Check if user is admin
      if (!req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can view recent companies'
        });
      }

      const limit = parseInt(req.query.limit) || 5;
      const companies = await Company.getRecentCompanies(limit);
      
      res.json({
        success: true,
        data: companies
      });
    } catch (error) {
      console.error('Get recent companies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent companies',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get companies with pagination and filters (admin only)
  static async getCompaniesPaginated(req, res) {
    try {
      // Check if user is admin
      if (!req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can view companies list'
        });
      }

      const { 
        page = 1, 
        pageSize = 10, 
        search = '', 
        status = 'all',
        sortBy = 'company_name',
        sortOrder = 'asc'
      } = req.query;

      const result = await Company.findAll({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        status,
        sortBy,
        sortOrder
      });
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get companies paginated error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch companies',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = CompanyController;
