import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <LandingPage />
    </AuthProvider>
  );
}

export default App;
