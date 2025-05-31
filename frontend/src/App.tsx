import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to WorkAid AI</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your internal helpdesk solution powered by AI
        </p>
        <div className="space-y-4">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
          >
            Get Started
          </a>
        </div>
      </header>
    </div>
  );
}

export default App;
