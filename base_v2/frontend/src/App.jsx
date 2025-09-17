import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuestionProvider } from './contexts/QuestionContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QuestionProvider>
          <AppRoutes />
        </QuestionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
