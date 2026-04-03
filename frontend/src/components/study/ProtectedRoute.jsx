import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();

  if (!user) {
    // Not logged in, send to login page
    return <Navigate to="/login" replace />;
  }

  // If a role is specified, make sure the user has that role
  if (allowedRole && user.role !== allowedRole) {
    // Redirect Student away from Volunteer dash, or Volunteer away from Student dash
    if (user.role === 'Student') return <Navigate to="/study/student-dashboard" replace />;
    if (user.role === 'Volunteer') return <Navigate to="/study/volunteer-dashboard" replace />; 
    return <Navigate to="/" replace />;
  }

  return children;
}
