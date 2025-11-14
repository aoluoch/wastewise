import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login',
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className="text-gray-600 dark:text-gray-400 font-['Poppins']">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const roleDashboard = {
      admin: '/admin/dashboard',
      collector: '/collector/dashboard',
      resident: '/resident/dashboard',
    };

    if (!user.role) {
      return <Navigate to='/login' replace />;
    }

    // Additional safety check for valid role
    if (!roleDashboard[user.role]) {
      return <Navigate to='/login' replace />;
    }

    return <Navigate to={roleDashboard[user.role]} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
