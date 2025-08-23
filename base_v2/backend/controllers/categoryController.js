const Category = require('../models/category');
const { validationResult } = require('express-validator');

class CategoryController {
  /**
   * Create a new category
   * @route POST /api/categories
   */
  static async createCategory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, parentId } = req.body;
      
      const category = await Category.create(
        {
          companyId: req.user.company_id,
          name,
          description,
          parentId: parentId || null
        },
        req.user.user_id
      );

      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   * @route GET /api/categories/:categoryId
   */
  static async getCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const category = await Category.findById(categoryId, req.user.company_id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a category
   * @route PUT /api/categories/:categoryId
   */
  static async updateCategory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { categoryId } = req.params;
      const { name, description, parentId, isActive } = req.body;

      const updated = await Category.update(
        categoryId,
        { 
          name, 
          description, 
          parentId,
          isActive,
          companyId: req.user.company_id 
        },
        req.user.user_id
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Category not found or update failed'
        });
      }

      const category = await Category.findById(categoryId, req.user.company_id);

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category
   * @route DELETE /api/categories/:categoryId
   */
  static async deleteCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { moveToCategoryId } = req.query;

      // If moving questions to another category
      if (moveToCategoryId) {
        await Category.moveQuestions(
          categoryId,
          moveToCategoryId === 'null' ? null : moveToCategoryId,
          req.user.company_id,
          req.user.user_id
        );
      }

      const deleted = await Category.delete(
        categoryId,
        req.user.company_id,
        req.user.user_id
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Category not found or already deleted'
        });
      }

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all categories for a company
   * @route GET /api/categories
   */
  static async listCategories(req, res, next) {
    try {
      const { parentId, includeInactive, asTree } = req.query;
      
      const categories = await Category.findByCompany(req.user.company_id, {
        parentId: parentId !== undefined ? parseInt(parentId) : null,
        includeInactive: includeInactive === 'true',
        asTree: asTree === 'true'
      });

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Move questions between categories
   * @route POST /api/categories/:categoryId/move-questions
   */
  static async moveQuestions(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { categoryId } = req.params;
      const { targetCategoryId } = req.body;

      const moved = await Category.moveQuestions(
        categoryId,
        targetCategoryId,
        req.user.company_id,
        req.user.user_id
      );

      if (!moved) {
        return res.status(404).json({
          success: false,
          message: 'No questions found to move or categories not found'
        });
      }

      res.json({
        success: true,
        message: `Questions moved successfully to ${targetCategoryId || 'uncategorized'}`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category statistics
   * @route GET /api/categories/statistics
   */
  static async getStatistics(req, res, next) {
    try {
      const stats = await Category.getStatistics(req.user.company_id);
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;
