import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    console.log('Navbar user state changed:', user);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const confirmLogout = async () => {
    await handleLogout();
    closeLogoutModal();
  };

  if (loading) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-800 dark:text-white">WorkAid</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-gray-800 dark:text-white">WorkAid</span>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{user.firstName} {user.lastName}</span>
                {user.role === 'agent' && user.department && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-200 text-gray-800">
                    {user.department.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={openLogoutModal}
                className="px-3 py-1 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400 dark:hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Confirm Logout</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Are you sure you want to log out?
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 mr-2"
                >
                  Yes, Logout
                </button>
                <button
                  onClick={closeLogoutModal}
                  className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;