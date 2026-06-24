import React from 'react';
import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../services/postsApi';

export const RequireSuperAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  if (!token) return <Navigate to="/login" replace />;

  const user = getStoredUser();
  if (user?.role !== 'super_admin') return <Navigate to="/" replace />;

  return <>{children}</>;
};
