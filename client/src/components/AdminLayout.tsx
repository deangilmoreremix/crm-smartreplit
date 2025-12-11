import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from './RoleBasedAccess';
import Navbar from './Navbar';
import { LoadingSpinner } from './ui/LoadingSpinner';

const AdminLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { isSuperAdmin, isLoading: roleLoading } = useRole();

  // Show loading state while auth is being checked
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Check if user is not authenticated at all
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user is admin using the role system
  const isAdmin = isSuperAdmin();

  // Redirect non-admins to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default AdminLayout;
