import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar } from 'lucide-react';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, authUser, loading } = useAuth();
  const location = useLocation();

  // Show spinner while:
  // 1. Initial session is still being checked (loading = true)
  // 2. Auth user exists but profile hasn't loaded yet (authUser set, user/currentUser still null)
  if (loading || (authUser && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-primary-50 to-accent-50">
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow animate-pulse">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Loading your account…</p>
        </div>
      </div>
    );
  }

  // No auth user at all → redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Admin-only route check
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
