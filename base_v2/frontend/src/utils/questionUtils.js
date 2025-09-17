/**
 * Format a question type for display
 * @param {string} type - The question type (e.g., 'multiple_choice', 'true_false')
 * @returns {string} Formatted question type
 */
export const formatQuestionType = (type) => {
  if (!type) return '';
  
  const typeMap = {
    'multiple_choice': 'Multiple Choice',
    'true_false': 'True/False',
    'short_answer': 'Short Answer',
    'essay': 'Essay',
    'matching': 'Matching',
    'fill_in_the_blank': 'Fill in the Blank',
    'ordering': 'Ordering',
    'hotspot': 'Hotspot',
    'drag_and_drop': 'Drag and Drop'
  };
  
  return typeMap[type] || type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

/**
 * Get the color for a difficulty level
 * @param {string} difficulty - The difficulty level (e.g., 'easy', 'medium', 'hard')
 * @returns {string} Color code or name
 */
export const getDifficultyColor = (difficulty) => {
  const colors = {
    'easy': 'success',
    'medium': 'warning',
    'hard': 'error'
  };
  
  return colors[difficulty.toLowerCase()] || 'default';
};

/**
 * Format a date string for display
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @param {boolean} addEllipsis - Whether to add '...' at the end
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100, addEllipsis = true) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return addEllipsis 
    ? `${text.substring(0, maxLength)}...` 
    : text.substring(0, maxLength);
};

/**
 * Generate a unique ID for a question option
 * @returns {string} A unique ID
 */
export const generateOptionId = () => {
  return `opt_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate question data before submission
 * @param {object} questionData - The question data to validate
 * @returns {object} Object with isValid flag and error messages
 */
export const validateQuestion = (questionData) => {
  const errors = {};
  let isValid = true;
  
  // Validate question text
  if (!questionData.questionText || questionData.questionText.trim() === '') {
    errors.questionText = 'Question text is required';
    isValid = false;
  }
  
  // Validate question type
  if (!questionData.type) {
    errors.type = 'Question type is required';
    isValid = false;
  }
  
  // Validate difficulty
  if (!questionData.difficulty) {
    errors.difficulty = 'Difficulty level is required';
    isValid = false;
  }
  
  // Validate category if required
  if (questionData.requireCategory && !questionData.categoryId) {
    errors.categoryId = 'Category is required';
    isValid = false;
  }
  
  // Validate options for multiple choice and true/false questions
  if (['multiple_choice', 'true_false'].includes(questionData.type)) {
    if (!questionData.options || questionData.options.length === 0) {
      errors.options = 'At least one option is required';
      isValid = false;
    } else {
      // Check each option
      questionData.options.forEach((option, index) => {
        if (!option.text || option.text.trim() === '') {
          errors[`option_${index}`] = 'Option text cannot be empty';
          isValid = false;
        }
      });
      
      // Check if at least one option is marked as correct
      const hasCorrectOption = questionData.options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        errors.options = 'At least one correct option is required';
        isValid = false;
      }
    }
  }
  
  return { isValid, errors };
};

/**
 * Calculate a question's score based on its difficulty
 * @param {string} difficulty - The difficulty level
 * @returns {number} The score value
 */
export const calculateQuestionScore = (difficulty) => {
  const scores = {
    'easy': 1,
    'medium': 2,
    'hard': 3
  };
  
  return scores[difficulty.toLowerCase()] || 1;
};

/**
 * Parse a CSV string into question objects
 * @param {string} csvString - The CSV string to parse
 * @returns {Array} Array of question objects
 */
export const parseQuestionsFromCSV = (csvString) => {
  if (!csvString) return [];
  
  const lines = csvString.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return []; // Header + at least one question
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const questions = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const question = {};
    
    headers.forEach((header, index) => {
      if (values[index]) {
        question[header] = values[index];
      }
    });
    
    // Convert string values to appropriate types
    if (question.difficulty) {
      question.difficulty = question.difficulty.toLowerCase();
    }
    
    if (question.options) {
      try {
        question.options = JSON.parse(question.options);
      } catch (e) {
        console.error('Error parsing options:', e);
        question.options = [];
      }
    } else {
      question.options = [];
    }
    
    if (question.tags) {
      try {
        question.tags = JSON.parse(question.tags);
      } catch (e) {
        console.error('Error parsing tags:', e);
        question.tags = [];
      }
    } else {
      question.tags = [];
    }
    
    questions.push(question);
  }
  
  return questions;
};

/**
 * Generate a CSV string from an array of questions
 * @param {Array} questions - Array of question objects
 * @returns {string} CSV string
 */
export const generateCSVFromQuestions = (questions) => {
  if (!questions || questions.length === 0) return '';
  
  // Extract all possible headers from questions
  const headers = new Set(['questionText', 'type', 'difficulty', 'category', 'explanation']);
  
  // Add all possible option and tag fields
  questions.forEach(question => {
    if (question.options) {
      question.options.forEach((option, index) => {
        headers.add(`option_${index + 1}_text`);
        headers.add(`option_${index + 1}_correct`);
        headers.add(`option_${index + 1}_explanation`);
      });
    }
    
    if (question.tags && question.tags.length > 0) {
      headers.add('tags');
    }
  });
  
  const headerArray = Array.from(headers);
  
  // Generate CSV rows
  const rows = [headerArray.join(',')];
  
  questions.forEach(question => {
    const row = [];
    
    headerArray.forEach(header => {
      if (header.startsWith('option_')) {
        // Handle option fields
        const parts = header.split('_');
        const optionIndex = parseInt(parts[1]) - 1;
        const field = parts[2];
        
        if (question.options && question.options[optionIndex]) {
          row.push(`"${String(question.options[optionIndex][field] || '').replace(/"/g, '""')}"`);
        } else {
          row.push('');
        }
      } else if (header === 'tags') {
        // Handle tags array
        if (question.tags && question.tags.length > 0) {
          row.push(`"${JSON.stringify(question.tags).replace(/"/g, '""')}"`);
        } else {
          row.push('');
        }
      } else {
        // Handle regular fields
        row.push(`"${String(question[header] || '').replace(/"/g, '""')}"`);
      }
    });
    
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
};

/**
 * Filter questions based on search criteria
 * @param {Array} questions - Array of question objects
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered questions
 */
export const filterQuestions = (questions, filters = {}) => {
  if (!questions || !Array.isArray(questions)) return [];
  
  return questions.filter(question => {
    // Filter by search text
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        (question.questionText && question.questionText.toLowerCase().includes(searchLower)) ||
        (question.explanation && question.explanation.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Filter by type
    if (filters.type && question.type !== filters.type) {
      return false;
    }
    
    // Filter by difficulty
    if (filters.difficulty && question.difficulty !== filters.difficulty) {
      return false;
    }
    
    // Filter by category
    if (filters.categoryId && question.categoryId !== filters.categoryId) {
      return false;
    }
    
    // Filter by status
    if (filters.statusId && question.statusId !== filters.statusId) {
      return false;
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(tag => 
        question.tags && question.tags.some(t => t.id === tag || t === tag)
      );
      
      if (!hasAllTags) return false;
    }
    
    // Filter by date range
    if (filters.startDate || filters.endDate) {
      const questionDate = new Date(question.createdAt);
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        if (questionDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        if (questionDate > endDate) return false;
      }
    }
    
    return true;
  });
};

/**
 * Sort questions based on sort criteria
 * @param {Array} questions - Array of question objects
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - 'asc' or 'desc'
 * @returns {Array} Sorted questions
 */
export const sortQuestions = (questions, sortBy = 'createdAt', sortOrder = 'desc') => {
  if (!questions || !Array.isArray(questions)) return [];
  
  return [...questions].sort((a, b) => {
    let valueA, valueB;
    
    // Handle nested properties
    if (sortBy.includes('.')) {
      const [parent, child] = sortBy.split('.');
      valueA = a[parent] ? a[parent][child] : '';
      valueB = b[parent] ? b[parent][child] : '';
    } else {
      valueA = a[sortBy];
      valueB = b[sortBy];
    }
    
    // Handle undefined/null values
    if (valueA === undefined || valueA === null) valueA = '';
    if (valueB === undefined || valueB === null) valueB = '';
    
    // Convert to string for comparison if not already
    const strA = String(valueA).toLowerCase();
    const strB = String(valueB).toLowerCase();
    
    // Handle dates
    if (sortBy.includes('At') || sortBy.includes('date')) {
      const dateA = new Date(strA);
      const dateB = new Date(strB);
      
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    }
    
    // Handle numbers
    if (!isNaN(Number(strA)) && !isNaN(Number(strB))) {
      const numA = Number(strA);
      const numB = Number(strB);
      
      if (sortOrder === 'asc') {
        return numA - numB;
      } else {
        return numB - numA;
      }
    }
    
    // Default string comparison
    if (sortOrder === 'asc') {
      return strA.localeCompare(strB);
    } else {
      return strB.localeCompare(strA);
    }
  });
};

/**
 * Calculate statistics for a set of questions
 * @param {Array} questions - Array of question objects
 * @returns {object} Statistics object
 */
export const calculateQuestionStats = (questions) => {
  if (!questions || !questions.length) {
    return {
      total: 0,
      byType: {},
      byDifficulty: { easy: 0, medium: 0, hard: 0 },
      byCategory: {},
      byStatus: {},
      averageScore: 0,
      totalScore: 0
    };
  }
  
  const stats = {
    total: questions.length,
    byType: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byCategory: {},
    byStatus: {},
    totalScore: 0
  };
  
  questions.forEach(question => {
    // Count by type
    if (question.type) {
      stats.byType[question.type] = (stats.byType[question.type] || 0) + 1;
    }
    
    // Count by difficulty
    if (question.difficulty) {
      const difficulty = question.difficulty.toLowerCase();
      if (['easy', 'medium', 'hard'].includes(difficulty)) {
        stats.byDifficulty[difficulty]++;
      }
    }
    
    // Count by category
    if (question.categoryId) {
      const categoryName = question.category?.name || question.categoryId;
      stats.byCategory[categoryName] = (stats.byCategory[categoryName] || 0) + 1;
    }
    
    // Count by status
    if (question.statusId) {
      const statusName = question.status?.name || question.statusId;
      stats.byStatus[statusName] = (stats.byStatus[statusName] || 0) + 1;
    }
    
    // Calculate score
    stats.totalScore += calculateQuestionScore(question.difficulty);
  });
  
  // Calculate average score
  stats.averageScore = stats.total > 0 ? stats.totalScore / stats.total : 0;
  
  return stats;
};

/**
 * Generate a unique ID for a question
 * @returns {string} A unique ID
 */
export const generateQuestionId = () => {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format a question for display in a list or table
 * @param {object} question - The question object
 * @returns {object} Formatted question data
 */
export const formatQuestionForDisplay = (question) => {
  if (!question) return {};
  
  return {
    ...question,
    typeDisplay: formatQuestionType(question.type),
    difficultyDisplay: question.difficulty ? question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) : '',
    difficultyColor: getDifficultyColor(question.difficulty),
    createdAtDisplay: formatDate(question.createdAt),
    updatedAtDisplay: formatDate(question.updatedAt),
    shortQuestionText: truncateText(question.questionText, 100, true),
    hasExplanation: Boolean(question.explanation && question.explanation.trim() !== ''),
    hasOptions: Array.isArray(question.options) && question.options.length > 0,
    correctOptions: Array.isArray(question.options) 
      ? question.options.filter(opt => opt.isCorrect).length 
      : 0,
    tagsDisplay: Array.isArray(question.tags) 
      ? question.tags.map(tag => typeof tag === 'string' ? tag : tag.name || tag.id).join(', ')
      : ''
  };
};

/**
 * Prepare question data for submission to the API
 * @param {object} question - The question data
 * @returns {object} Prepared question data
 */
export const prepareQuestionForSubmit = (question) => {
  if (!question) return {};
  
  // Create a clean copy of the question
  const cleanQuestion = { ...question };
  
  // Remove display-only properties
  const displayProps = [
    'typeDisplay', 
    'difficultyDisplay', 
    'createdAtDisplay', 
    'updatedAtDisplay',
    'shortQuestionText',
    'hasExplanation',
    'hasOptions',
    'correctOptions',
    'tagsDisplay',
    'difficultyColor'
  ];
  
  displayProps.forEach(prop => {
    if (prop in cleanQuestion) {
      delete cleanQuestion[prop];
    }
  });
  
  // Ensure options have required fields
  if (Array.isArray(cleanQuestion.options)) {
    cleanQuestion.options = cleanQuestion.options.map(option => ({
      id: option.id || generateOptionId(),
      text: option.text || '',
      isCorrect: Boolean(option.isCorrect),
      explanation: option.explanation || ''
    }));
  }
  
  // Ensure tags are in the correct format
  if (Array.isArray(cleanQuestion.tags)) {
    cleanQuestion.tags = cleanQuestion.tags.map(tag => {
      if (typeof tag === 'string') {
        return { name: tag };
      }
      return { id: tag.id, name: tag.name };
    });
  }
  
  return cleanQuestion;
};
