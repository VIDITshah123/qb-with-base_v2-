const express = require('express');
const router = express.Router();
const { checkPermission } = require('../middleware/rbac');
const { authenticate } = require('../middleware/auth');
const { dataIsolation } = require('../middleware/dataIsolation');
const { 
  createCategory, 
  updateCategory, 
  getCategory, 
  deleteCategory, 
  listCategories, 
  moveQuestions,
  getStatistics
} = require('../validators/categoryValidator');
const CategoryController = require('../controllers/categoryController');

// Apply authentication middleware to all category routes
router.use(authenticate);

// Apply data isolation middleware to ensure users can only access their company's data
router.use(dataIsolation.companyDataAccess);

// Create a new category
router.post(
  '/', 
  checkPermission('category:create'),
  createCategory,
  CategoryController.createCategory
);

// Get category by ID
router.get(
  '/:categoryId', 
  checkPermission('category:read'),
  getCategory,
  CategoryController.getCategory
);

// Update a category
router.put(
  '/:categoryId', 
  checkPermission('category:update'),
  updateCategory,
  CategoryController.updateCategory
);

// Delete a category
router.delete(
  '/:categoryId', 
  checkPermission('category:delete'),
  deleteCategory,
  CategoryController.deleteCategory
);

// List all categories
router.get(
  '/', 
  checkPermission('category:read'),
  listCategories,
  CategoryController.listCategories
);

// Move questions between categories
router.post(
  '/:categoryId/move-questions',
  checkPermission('category:update'),
  moveQuestions,
  CategoryController.moveQuestions
);

// Get category statistics
router.get(
  '/statistics',
  checkPermission('category:read'),
  CategoryController.getStatistics
);

module.exports = router;
