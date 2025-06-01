import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmployeeDashboard from './dashboard/EmployeeDashboard';
import AgentDashboard from './dashboard/AgentDashboard';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // If auth check is complete and no user is found, redirect to login
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading || !user || (user.role !== 'employee' && user.role !== 'agent')) {
    // Stay in loading state if still loading, no user, or user role is not yet a valid type
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="py-6">
        {user.role === 'employee' ? (
          <EmployeeDashboard />
        ) : (
          <AgentDashboard />
        )}
      </main>
    </div>
  );
};

export default Dashboard; 