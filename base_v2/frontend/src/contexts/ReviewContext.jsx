import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useQuestions } from './QuestionContext';
import api from '../utils/api';

const ReviewContext = createContext();

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};

export const ReviewProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { updateQuestionStatus, voteQuestion, getQuestionStatusHistory } = useQuestions();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [filters, setFilters] = useState({
    status: 'pending_review',
    search: '',
    category: '',
    difficulty: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch status history for a question
  const fetchStatusHistory = useCallback(async (questionId) => {
    try {
      setLoading(true);
      const history = await getQuestionStatusHistory(questionId);
      setStatusHistory(history);
      return history;
    } catch (err) {
      setError(err.message || 'Failed to fetch status history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getQuestionStatusHistory]);

  // Add a comment to a question
  const addComment = useCallback(async (questionId, content) => {
    try {
      setLoading(true);
      const response = await api.post(`/api/questions/${questionId}/comments`, {
        content,
        userId: currentUser?.id,
        companyId: currentUser?.company_id,
      });
      
      // Update local comments state
      setComments(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch comments for a question
  const fetchComments = useCallback(async (questionId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/questions/${questionId}/comments`);
      setComments(response.data);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch comments');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update question status
  const updateStatus = useCallback(async (questionId, status, comment = '') => {
    try {
      setLoading(true);
      const updatedQuestion = await updateQuestionStatus(questionId, {
        status,
        comment,
        updatedBy: currentUser?.id,
      });
      
      // Refresh status history
      await fetchStatusHistory(questionId);
      
      return updatedQuestion;
    } catch (err) {
      setError(err.message || 'Failed to update status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchStatusHistory, updateQuestionStatus]);

  // Vote on a question
  const vote = useCallback(async (questionId, voteType) => {
    try {
      setLoading(true);
      const result = await voteQuestion(questionId, voteType);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to process vote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [voteQuestion]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    loading,
    error,
    statusHistory,
    comments,
    filters,
    fetchStatusHistory,
    addComment,
    fetchComments,
    updateStatus,
    vote,
    updateFilters,
    clearError,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};

export default ReviewContext;
