import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import questionService from '../services/questionService';

const QuestionContext = createContext();

export const useQuestions = () => {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error('useQuestions must be used within a QuestionProvider');
  }
  return context;
};

export const QuestionProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    difficulty: '',
    category: '',
    status: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Fetch questions with current filters and pagination
  const fetchQuestions = async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Merge custom filters with current filters
      const mergedFilters = { ...filters, ...customFilters };
      
      // Prepare query params
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...mergedFilters,
        companyId: currentUser?.company_id,
      };

      const data = await questionService.getQuestions(params);
      
      setQuestions(data.questions);
      setPagination({
        ...pagination,
        total: data.total,
        totalPages: Math.ceil(data.total / pagination.limit),
      });
      
      return data;
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message || 'Failed to fetch questions');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage + 1, // MUI TablePagination is 0-based, our API is 1-based
    }));
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    setPagination({
      ...pagination,
      page: 1, // Reset to first page
      limit: parseInt(event.target.value, 10),
    });
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  // Handle sort
  const handleSort = (property) => {
    const isAsc = filters.sortBy === property && filters.sortOrder === 'asc';
    setFilters(prev => ({
      ...prev,
      sortBy: property,
      sortOrder: isAsc ? 'desc' : 'asc',
    }));
  };

  // Create a new question
  const createQuestion = async (questionData) => {
    try {
      setLoading(true);
      const newQuestion = await questionService.createQuestion({
        ...questionData,
        companyId: currentUser?.company_id,
      });
      
      // Refresh the questions list
      await fetchQuestions();
      return newQuestion;
    } catch (err) {
      console.error('Error creating question:', err);
      setError(err.message || 'Failed to create question');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing question
  const updateQuestion = async (id, questionData) => {
    try {
      setLoading(true);
      const updatedQuestion = await questionService.updateQuestion(id, questionData);
      
      // Update the questions list
      setQuestions(prevQuestions =>
        prevQuestions.map(question =>
          question.id === id ? { ...question, ...updatedQuestion } : question
        )
      );
      
      return updatedQuestion;
    } catch (err) {
      console.error(`Error updating question ${id}:`, err);
      setError(err.message || 'Failed to update question');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a question
  const deleteQuestion = async (id) => {
    try {
      setLoading(true);
      await questionService.deleteQuestion(id);
      
      // Update the questions list
      setQuestions(prevQuestions =>
        prevQuestions.filter(question => question.id !== id)
      );
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
        totalPages: Math.ceil((prev.total - 1) / prev.limit),
      }));
      
      return true;
    } catch (err) {
      console.error(`Error deleting question ${id}:`, err);
      setError(err.message || 'Failed to delete question');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get a single question
  const getQuestion = async (id) => {
    try {
      setLoading(true);
      const question = await questionService.getQuestion(id);
      return question;
    } catch (err) {
      console.error(`Error fetching question ${id}:`, err);
      setError(err.message || 'Failed to fetch question');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update question status
  const updateQuestionStatus = async (questionId, statusData) => {
    try {
      setLoading(true);
      const updatedQuestion = await questionService.updateQuestionStatus(questionId, statusData);
      
      // Update the questions list
      setQuestions(prevQuestions =>
        prevQuestions.map(question =>
          question.id === questionId ? { ...question, ...updatedQuestion } : question
        )
      );
      
      return updatedQuestion;
    } catch (err) {
      console.error(`Error updating status for question ${questionId}:`, err);
      setError(err.message || 'Failed to update question status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get status history for a question
  const getQuestionStatusHistory = async (questionId) => {
    try {
      setLoading(true);
      const history = await questionService.getQuestionStatusHistory(questionId);
      return history;
    } catch (err) {
      console.error(`Error fetching status history for question ${questionId}:`, err);
      setError(err.message || 'Failed to fetch status history');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get valid status transitions
  const getStatusTransitions = async (statusId, roleId) => {
    try {
      const transitions = await questionService.getStatusTransitions(statusId, roleId);
      return transitions;
    } catch (err) {
      console.error('Error fetching status transitions:', err);
      setError(err.message || 'Failed to fetch status transitions');
      throw err;
    }
  };

  // Add a comment to a question
  const addComment = async (questionId, comment) => {
    try {
      const newComment = await questionService.addComment(questionId, comment);
      return newComment;
    } catch (err) {
      console.error(`Error adding comment to question ${questionId}:`, err);
      setError(err.message || 'Failed to add comment');
      throw err;
    }
  };

  // Get comments for a question
  const getComments = async (questionId) => {
    try {
      const comments = await questionService.getComments(questionId);
      return comments;
    } catch (err) {
      console.error(`Error fetching comments for question ${questionId}:`, err);
      setError(err.message || 'Failed to fetch comments');
      throw err;
    }
  };

  // Vote on a question
  const voteQuestion = async (questionId, voteType) => {
    try {
      const result = await questionService.voteQuestion(questionId, voteType);
      
      // Update the question in the list
      setQuestions(prevQuestions =>
        prevQuestions.map(question =>
          question.id === questionId 
            ? { 
                ...question, 
                upvotes: result.upvotes, 
                downvotes: result.downvotes 
              } 
            : question
        )
      );
      
      return result;
    } catch (err) {
      console.error(`Error voting on question ${questionId}:`, err);
      setError(err.message || 'Failed to process vote');
      throw err;
    }
  };

  // Get user's vote on a question
  const getUserVote = async (questionId) => {
    try {
      const result = await questionService.getUserVote(questionId);
      return result.voteType;
    } catch (err) {
      console.error(`Error getting user vote for question ${questionId}:`, err);
      setError(err.message || 'Failed to get user vote');
      return null;
    }
  };

  // Get all categories
  const getCategories = async () => {
    try {
      const categories = await questionService.getCategories();
      return categories;
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to fetch categories');
      return [];
    }
  };

  // Get all statuses
  const getStatuses = async () => {
    try {
      const statuses = await questionService.getStatuses();
      return statuses;
    } catch (err) {
      console.error('Error fetching question statuses:', err);
      setError(err.message || 'Failed to fetch statuses');
      return [];
    }
  };

  // Get all tags
  const getTags = async () => {
    try {
      const tags = await questionService.getTags();
      return tags;
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError(err.message || 'Failed to fetch tags');
      return [];
    }
  };

  // Export questions
  const exportQuestions = async (exportFilters = {}) => {
    try {
      const mergedFilters = { ...filters, ...exportFilters };
      const blob = await questionService.exportQuestions({
        ...mergedFilters,
        companyId: currentUser?.company_id,
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questions-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      return true;
    } catch (err) {
      console.error('Error exporting questions:', err);
      setError(err.message || 'Failed to export questions');
      throw err;
    }
  };

  // Import questions
  const importQuestions = async (file, options = {}) => {
    try {
      const result = await questionService.importQuestions(file, {
        ...options,
        companyId: currentUser?.company_id,
      });
      
      // Refresh the questions list
      await fetchQuestions();
      
      return result;
    } catch (err) {
      console.error('Error importing questions:', err);
      setError(err.message || 'Failed to import questions');
      throw err;
    }
  };

  // Effect to fetch questions when filters or pagination change
  useEffect(() => {
    if (currentUser?.company_id) {
      fetchQuestions();
    }
  }, [filters, pagination.page, pagination.limit, currentUser?.company_id]);

  // Initial data load
  useEffect(() => {
    if (currentUser?.company_id) {
      fetchQuestions();
    }
  }, [currentUser?.company_id]);

  const value = {
    questions,
    loading,
    error,
    pagination,
    filters,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestion,
    updateQuestionStatus,
    getQuestionStatusHistory,
    getStatusTransitions,
    addComment,
    getComments,
    voteQuestion,
    getUserVote,
    getCategories,
    getStatuses,
    getTags,
    exportQuestions,
    importQuestions,
    handlePageChange,
    handleRowsPerPageChange,
    handleFilterChange,
    handleSort,
    setError,
  };

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
};

export default QuestionContext;
