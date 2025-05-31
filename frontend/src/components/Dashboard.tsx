import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmployeeDashboard from './dashboard/EmployeeDashboard';
import AgentDashboard from './dashboard/AgentDashboard';
import Navbar from './Navbar';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Please log in to access the dashboard</div>
      </div>
    );
  }
console.log('dashboard', user.role, user.firstName)
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
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