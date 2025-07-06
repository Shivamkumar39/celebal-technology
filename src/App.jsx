import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/auth/AuthForm';
import Dashboard from './components/dashboard/Dashboard';
import { Toaster } from 'react-hot-toast';

const App = () => (
  <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <AppContent />
    </AuthProvider>
);

const AppContent = () => {
  const { isAuthenticated, isLoading, user, profile } = useAuth();

  useEffect(() => {
    console.log('✅ Auth changed:', { isAuthenticated, isLoading, user, profile });
  }, [isAuthenticated, isLoading, user, profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-lg animate-pulse" />
          </div>
          <p className="text-lg font-medium text-gray-600">Loading your account...</p>
          <p className="text-sm mt-2 text-gray-500">Please wait while we set up your workspace</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !profile) {
    return <AuthForm />;
  }

  return <Dashboard />;
};

export default App;
