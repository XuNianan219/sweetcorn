import React from 'react';
import { Navigate } from 'react-router-dom';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};
