const { body, param, query } = require('express-validator');
const Category = require('../models/category');

// Common validation rules
const commonRules = {
  name: body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
    
  description: body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  parentId: body('parentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent ID must be a positive integer')
    .toInt()
    .custom(async (value, { req }) => {
      if (!value) return true;
      
      // Check if parent category exists and belongs to the same company
      const parent = await Category.findById(value, req.user.company_id);
      if (!parent) {
        throw new Error('Parent category not found or access denied');
      }
      
      // Check for circular references
      if (req.params.categoryId) {
        const currentId = parseInt(req.params.categoryId, 10);
        if (value === currentId) {
          throw new Error('A category cannot be its own parent');
        }
        
        // Check if the parent is a descendant of the current category
        let currentParentId = value;
        const visited = new Set([currentId]);
        
        while (currentParentId) {
          if (visited.has(currentParentId)) {
            throw new Error('Circular reference detected in category hierarchy');
          }
          
          const parentCategory = await Category.findById(currentParentId, req.user.company_id);
          if (!parentCategory || !parentCategory.parent_id) break;
          
          visited.add(currentParentId);
          currentParentId = parentCategory.parent_id;
        }
      }
      
      return true;
    }),
    
  isActive: body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
    
  categoryId: param('categoryId')
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required')
    .toInt(),
    
  targetCategoryId: body('targetCategoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid target category ID is required')
    .toInt()
    .custom(async (value, { req }) => {
      if (!value) return true; // Allow null/undefined (uncategorized)
      
      // Check if target category exists and belongs to the same company
      const targetCategory = await Category.findById(value, req.user.company_id);
      if (!targetCategory) {
        throw new Error('Target category not found or access denied');
      }
      
      // Prevent moving to a descendant category
      let currentId = req.params.categoryId;
      let currentParentId = value;
      
      while (currentParentId) {
        if (currentParentId === parseInt(currentId, 10)) {
          throw new Error('Cannot move category to its own descendant');
        }
        
        const parentCategory = await Category.findById(currentParentId, req.user.company_id);
        if (!parentCategory || !parentCategory.parent_id) break;
        
        currentParentId = parentCategory.parent_id;
      }
      
      return true;
    }),
    
  moveToCategoryId: query('moveToCategoryId')
    .optional()
    .custom(async (value, { req }) => {
      if (value === 'null') return true; // Allow moving to uncategorized
      
      const categoryId = parseInt(value, 10);
      if (isNaN(categoryId) || categoryId < 1) {
        throw new Error('Invalid moveToCategoryId parameter');
      }
      
      // Check if target category exists and belongs to the same company
      const targetCategory = await Category.findById(categoryId, req.user.company_id);
      if (!targetCategory) {
        throw new Error('Target category not found or access denied');
      }
      
      return true;
    }),
    
  parentIdQuery: query('parentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent ID must be a positive integer')
    .toInt(),
    
  includeInactive: query('includeInactive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('includeInactive must be either "true" or "false"'),
    
  asTree: query('asTree')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('asTree must be either "true" or "false"')
};

// Validation rules for creating a category
const createCategoryRules = [
  commonRules.name,
  commonRules.description,
  commonRules.parentId,
  commonRules.isActive
];

// Validation rules for updating a category
const updateCategoryRules = [
  commonRules.categoryId,
  commonRules.name.optional(),
  commonRules.description,
  commonRules.parentId,
  commonRules.isActive
];

// Validation rules for getting a category
const getCategoryRules = [
  commonRules.categoryId
];

// Validation rules for deleting a category
const deleteCategoryRules = [
  commonRules.categoryId,
  commonRules.moveToCategoryId
];

// Validation rules for listing categories
const listCategoriesRules = [
  commonRules.parentIdQuery,
  commonRules.includeInactive,
  commonRules.asTree
];

// Validation rules for moving questions between categories
const moveQuestionsRules = [
  commonRules.categoryId,
  commonRules.targetCategoryId
];

module.exports = {
  createCategory: createCategoryRules,
  updateCategory: updateCategoryRules,
  getCategory: getCategoryRules,
  deleteCategory: deleteCategoryRules,
  listCategories: listCategoriesRules,
  moveQuestions: moveQuestionsRules
};
