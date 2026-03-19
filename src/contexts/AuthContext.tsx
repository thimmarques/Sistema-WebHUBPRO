import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { UserProfile } from '@/types';
import { MOCK_USERS } from '@/data/mockUsers';
import { logLogin, logLogout } from '../services/activityLogger';

interface AuthContextType {
  currentUser: UserProfile | null;
  login: (email: string, password: string) => boolean;
  loginAs: (userId: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('whp_current_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, password: string): boolean => {
    const user = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!user) return false;
    const { password: _, ...profile } = user;
    setCurrentUser(profile);
    localStorage.setItem('whp_current_user', JSON.stringify(profile));
    logLogin(profile.id, profile.email);
    return true;
  }, []);

  const loginAs = useCallback((userId: string) => {
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) return;
    const { password: _, ...profile } = user;
    setCurrentUser(profile);
    localStorage.setItem('whp_current_user', JSON.stringify(profile));
    logLogin(profile.id, profile.email);
  }, []);

  const logout = useCallback(() => {
    if (currentUser) {
      logLogout(currentUser.id, currentUser.email);
    }
    setCurrentUser(null);
    localStorage.removeItem('whp_current_user');
  }, [currentUser]);

  const isAdmin = useCallback(() => currentUser?.role === 'admin', [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, login, loginAs, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
