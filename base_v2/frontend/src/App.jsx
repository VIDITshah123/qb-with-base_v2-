import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuestionProvider } from './contexts/QuestionContext';
import { ReviewProvider } from './contexts/ReviewContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QuestionProvider>
          <ReviewProvider>
            <AppRoutes />
          </ReviewProvider>
        </QuestionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
