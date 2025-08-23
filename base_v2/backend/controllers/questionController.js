const Question = require('../models/question');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class QuestionController {
  /**
   * Create a new question
   * @route POST /api/questions
   */
  static async createQuestion(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        categoryId, 
        type, 
        difficulty, 
        questionText, 
        explanation, 
        options = [],
        tagIds = []
      } = req.body;

      const questionData = {
        companyId: req.user.company_id,
        categoryId: categoryId || null,
        type,
        difficulty,
        questionText,
        explanation: explanation || null
      };

      const question = await Question.create(
        questionData, 
        req.user.user_id, 
        options,
        tagIds
      );

      res.status(201).json({
        success: true,
        data: question
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get question by ID
   * @route GET /api/questions/:questionId
   */
  static async getQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const question = await Question.findById(questionId, req.user.company_id);

      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      res.json({
        success: true,
        data: question
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a question
   * @route PUT /api/questions/:questionId
   */
  static async updateQuestion(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { questionId } = req.params;
      const { 
        categoryId, 
        type, 
        difficulty, 
        questionText, 
        explanation, 
        status,
        options,
        tagIds,
        changeSummary
      } = req.body;

      const updateData = {
        ...(categoryId !== undefined && { categoryId }),
        ...(type && { type }),
        ...(difficulty && { difficulty }),
        ...(questionText && { questionText }),
        ...(explanation !== undefined && { explanation }),
        ...(status && { status }),
        ...(options && { options }),
        ...(tagIds && { tagIds }),
        ...(changeSummary && { changeSummary })
      };

      const updated = await Question.update(
        questionId,
        updateData,
        req.user.user_id
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Question not found or update failed'
        });
      }

      const question = await Question.findById(questionId, req.user.company_id);

      res.json({
        success: true,
        data: question
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a question (soft delete)
   * @route DELETE /api/questions/:questionId
   */
  static async deleteQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const deleted = await Question.delete(questionId, req.user.user_id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Question not found or already deleted'
        });
      }

      res.json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List questions with filtering and pagination
   * @route GET /api/questions
   */
  static async listQuestions(req, res, next) {
    try {
      const { 
        categoryId,
        type,
        difficulty,
        status,
        userId,
        tagIds,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const filter = {
        companyId: req.user.company_id,
        ...(categoryId && { categoryId: parseInt(categoryId, 10) }),
        ...(type && { type }),
        ...(difficulty && { difficulty }),
        ...(status && { status }),
        ...(userId && { userId: parseInt(userId, 10) }),
        ...(tagIds && { 
          tagIds: Array.isArray(tagIds) 
            ? tagIds.map(id => parseInt(id, 10)) 
            : [parseInt(tagIds, 10)]
        }),
        ...(search && { search })
      };

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const result = await Question.findByFilter(
        filter, 
        parseInt(limit, 10), 
        offset
      );

      res.json({
        success: true,
        data: {
          total: result.total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(result.total / limit),
          data: result.data
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get question versions
   * @route GET /api/questions/:questionId/versions
   */
  static async getQuestionVersions(req, res, next) {
    try {
      const { questionId } = req.params;
      const versions = await Question.getVersions(questionId);

      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific version of a question
   * @route GET /api/questions/:questionId/versions/:versionNumber
   */
  static async getQuestionVersion(req, res, next) {
    try {
      const { questionId, versionNumber } = req.params;
      const version = await Question.getVersion(questionId, parseInt(versionNumber, 10));

      if (!version) {
        return res.status(404).json({
          success: false,
          message: 'Version not found'
        });
      }

      res.json({
        success: true,
        data: version
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get question statistics
   * @route GET /api/questions/statistics
   */
  static async getStatistics(req, res, next) {
    try {
      const stats = await Question.getStatistics(req.user.company_id);
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk import questions from file
   * @route POST /api/questions/import
   */
  static async importQuestions(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const filePath = path.join(__dirname, '../../uploads', req.file.filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse the file content (e.g., CSV, JSON, etc.)
      // This is a simplified example - you'll need to implement the actual parsing logic
      let questions = [];
      
      if (req.file.mimetype === 'application/json') {
        questions = JSON.parse(fileContent);
      } else if (req.file.mimetype === 'text/csv') {
        // Implement CSV parsing logic here
        // For example using csv-parse library
        // const parse = require('csv-parse');
        // questions = await parse(fileContent, { columns: true });
        throw new Error('CSV import not implemented yet');
      } else {
        // Delete the uploaded file
        fs.unlinkSync(filePath);
        return res.status(400).json({
          success: false,
          message: 'Unsupported file format'
        });
      }

      // Process and validate each question
      const results = [];
      for (const q of questions) {
        try {
          const questionData = {
            companyId: req.user.company_id,
            categoryId: q.categoryId || null,
            type: q.type,
            difficulty: q.difficulty,
            questionText: q.questionText,
            explanation: q.explanation || null
          };

          const question = await Question.create(
            questionData,
            req.user.user_id,
            q.options || [],
            q.tagIds || []
          );

          results.push({
            success: true,
            questionId: question.id,
            message: 'Imported successfully'
          });
        } catch (error) {
          results.push({
            success: false,
            questionText: q.questionText,
            error: error.message
          });
        }
      }

      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        data: {
          total: questions.length,
          success: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        }
      });
    } catch (error) {
      // Clean up the uploaded file in case of error
      if (req.file) {
        const filePath = path.join(__dirname, '../../uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      next(error);
    }
  }

  /**
   * Export questions
   * @route GET /api/questions/export
   */
  static async exportQuestions(req, res, next) {
    try {
      const { format = 'json', ...filters } = req.query;
      
      // Get all questions matching filters (no pagination for export)
      const { data: questions } = await Question.findByFilter({
        companyId: req.user.company_id,
        ...filters
      }, 10000, 0);

      // Add options and tags to each question
      const questionsWithDetails = await Promise.all(
        questions.map(async (q) => {
          const question = await Question.findById(q.question_id, req.user.company_id);
          return {
            ...q,
            options: question.options,
            tags: question.tags
          };
        })
      );

      let data;
      let contentType;
      let fileName = `questions-${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        // Convert to CSV format
        // This is a simplified example - you'll need to implement the actual conversion
        const { Parser } = require('json2csv');
        const fields = ['question_id', 'question_type', 'difficulty_level', 'question_text', 'status'];
        const parser = new Parser({ fields });
        data = parser.parse(questions);
        contentType = 'text/csv';
        fileName += '.csv';
      } else {
        // Default to JSON
        data = JSON.stringify(questionsWithDetails, null, 2);
        contentType = 'application/json';
        fileName += '.json';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate question data
   * @param {string} method - HTTP method (create or update)
   */
  static validate(method) {
    const validQuestionTypes = Object.values(Question.TYPES);
    const validDifficulties = Object.values(Question.DIFFICULTY);
    const validStatuses = Object.values(Question.STATUS);

    const validations = [
      body('type')
        .isIn(validQuestionTypes)
        .withMessage(`Type must be one of: ${validQuestionTypes.join(', ')}`),
      body('difficulty')
        .isIn(validDifficulties)
        .withMessage(`Difficulty must be one of: ${validDifficulties.join(', ')}`),
      body('questionText')
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Question text must be between 10 and 5000 characters'),
      body('explanation')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Explanation cannot exceed 5000 characters'),
      body('options')
        .optional()
        .isArray()
        .withMessage('Options must be an array'),
      body('options.*.text')
        .if(body('options').exists())
        .notEmpty()
        .withMessage('Option text is required'),
      body('options.*.isCorrect')
        .if(body('options').exists())
        .isBoolean()
        .withMessage('isCorrect must be a boolean'),
      body('tagIds')
        .optional()
        .isArray()
        .withMessage('tagIds must be an array'),
      body('tagIds.*')
        .if(body('tagIds').exists())
        .isInt({ min: 1 })
        .withMessage('Each tag ID must be a positive integer')
    ];

    if (method === 'update') {
      validations.push(
        body('status')
          .optional()
          .isIn(validStatuses)
          .withMessage(`Status must be one of: ${validStatuses.join(', ')}`)
      );
    }

    return validations;
  }
}

module.exports = QuestionController;
