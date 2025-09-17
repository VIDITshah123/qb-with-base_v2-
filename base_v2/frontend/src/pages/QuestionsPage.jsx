import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import QuestionList from '../components/questions/QuestionList';
import QuestionForm from '../components/questions/QuestionForm';
import QuestionDetail from '../components/questions/QuestionDetail';

const QuestionsPage = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  // Check if user has permission to access questions
  if (!currentUser?.permissions?.includes('view_questions')) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2, px: 2 }}>
        <Tabs
          value={path}
          indicatorColor="primary"
          textColor="primary"
          aria-label="question navigation"
        >
          <Tab 
            label="All Questions" 
            value="/questions" 
            onClick={() => window.location.href = '/questions'} 
          />
          <Tab 
            label="New Question" 
            value="/questions/new" 
            onClick={() => window.location.href = '/questions/new'}
            disabled={!currentUser?.permissions?.includes('create_questions')}
          />
        </Tabs>
      </Paper>

      <Routes>
        <Route path="/" element={<QuestionList />} />
        <Route 
          path="new" 
          element={
            currentUser?.permissions?.includes('create_questions') ? (
              <QuestionForm />
            ) : (
              <Navigate to="/unauthorized" />
            )
          } 
        />
        <Route 
          path="edit/:id" 
          element={
            currentUser?.permissions?.includes('edit_questions') ? (
              <QuestionForm />
            ) : (
              <Navigate to="/unauthorized" />
            )
          } 
        />
        <Route path=":id" element={<QuestionDetail />} />
      </Routes>
    </Box>
  );
};

export default QuestionsPage;
