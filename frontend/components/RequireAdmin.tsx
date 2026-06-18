import React from 'react';
import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../services/postsApi';

export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  if (!token) return <Navigate to="/login" replace />;

  const user = getStoredUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};
