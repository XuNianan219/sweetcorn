import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken, clearUser, getStoredUser, saveUser } from '../services/postsApi';
import type { ApiUser } from '../services/usersApi';

interface UserContextValue {
  user: ApiUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  setUser: (user: ApiUser | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUserState] = useState<ApiUser | null>(() => getStoredUser());

  const setUser = useCallback((next: ApiUser | null) => {
    setUserState(next);
    if (next) saveUser(next);
    else clearUser();
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearUser();
    setUserState(null);
    navigate('/login');
  }, [navigate]);

  const value = useMemo<UserContextValue>(() => {
    const token = localStorage.getItem('sweetcorn_jwt_token');
    const isLoggedIn = !!token && !!user;
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    return { user, isLoggedIn, isAdmin, setUser, logout };
  }, [user, setUser, logout]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export function useCurrentUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useCurrentUser 必须在 <UserProvider> 内使用');
  }
  return ctx;
}
