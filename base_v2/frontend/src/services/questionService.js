import api from '../utils/api';

const questionService = {
  // Get all questions with optional filters
  getQuestions: async (filters = {}) => {
    try {
      const response = await api.get('/api/questions', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  // Get a single question by ID
  getQuestion: async (id) => {
    try {
      const response = await api.get(`/api/questions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching question ${id}:`, error);
      throw error;
    }
  },

  // Create a new question
  createQuestion: async (questionData) => {
    try {
      const response = await api.post('/api/questions', questionData);
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },

  // Update an existing question
  updateQuestion: async (id, questionData) => {
    try {
      const response = await api.put(`/api/questions/${id}`, questionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating question ${id}:`, error);
      throw error;
    }
  },

  // Delete a question
  deleteQuestion: async (id) => {
    try {
      await api.delete(`/api/questions/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting question ${id}:`, error);
      throw error;
    }
  },

  // Get question status history
  getQuestionStatusHistory: async (questionId) => {
    try {
      const response = await api.get(`/api/questions/${questionId}/status-history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching status history for question ${questionId}:`, error);
      throw error;
    }
  },

  // Update question status
  updateQuestionStatus: async (questionId, statusData) => {
    try {
      const response = await api.post(
        `/api/questions/${questionId}/status`,
        statusData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating status for question ${questionId}:`, error);
      throw error;
    }
  },

  // Get valid status transitions for a question
  getStatusTransitions: async (statusId, roleId) => {
    try {
      const response = await api.get(
        `/api/question-statuses/transitions/${statusId}?role_id=${roleId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching status transitions:', error);
      throw error;
    }
  },

  // Add a comment to a question
  addComment: async (questionId, comment) => {
    try {
      const response = await api.post(`/api/questions/${questionId}/comments`, {
        content: comment,
      });
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to question ${questionId}:`, error);
      throw error;
    }
  },

  // Get all comments for a question
  getComments: async (questionId) => {
    try {
      const response = await api.get(`/api/questions/${questionId}/comments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for question ${questionId}:`, error);
      throw error;
    }
  },

  // Vote on a question
  voteQuestion: async (questionId, voteType) => {
    try {
      const response = await api.post(`/api/questions/${questionId}/vote`, {
        voteType,
      });
      return response.data;
    } catch (error) {
      console.error(`Error voting on question ${questionId}:`, error);
      throw error;
    }
  },

  // Get user's vote on a question
  getUserVote: async (questionId) => {
    try {
      const response = await api.get(`/api/questions/${questionId}/vote`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { voteType: null }; // User hasn't voted yet
      }
      console.error(`Error getting user vote for question ${questionId}:`, error);
      throw error;
    }
  },

  // Get all question categories
  getCategories: async () => {
    try {
      const response = await api.get('/api/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get all question statuses
  getStatuses: async () => {
    try {
      const response = await api.get('/api/question-statuses');
      return response.data;
    } catch (error) {
      console.error('Error fetching question statuses:', error);
      throw error;
    }
  },

  // Get all tags
  getTags: async () => {
    try {
      const response = await api.get('/api/tags');
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  },

  // Export questions
  exportQuestions: async (filters = {}) => {
    try {
      const response = await api.get('/api/questions/export', {
        params: filters,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting questions:', error);
      throw error;
    }
  },

  // Import questions
  importQuestions: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add any additional options to the form data
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await api.post('/api/questions/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error importing questions:', error);
      throw error;
    }
  },
};

export default questionService;
