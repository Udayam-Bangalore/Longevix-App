import React, { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/src/store';
import { User } from '@/src/services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<{ message: string; user?: any }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasSeenWelcome: boolean;
  setHasSeenWelcome: () => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  verifyPhoneAndSetUsername: (phone: string, token: string, username: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const store = useAuthStore();
  
  useEffect(() => {
    store.checkAuth();
  }, []);

  const setHasSeenWelcome = async () => {
    store.setHasSeenWelcome(true);
  };

  const value: AuthContextType = {
    user: store.user,
    isLoading: store.isLoading,
    isAuthenticated: !!store.user,
    login: store.login,
    register: store.register,
    logout: store.logout,
    checkAuth: store.checkAuth,
    hasSeenWelcome: store.hasSeenWelcome,
    setHasSeenWelcome,
    sendPhoneOtp: store.sendPhoneOtp,
    verifyPhoneOtp: store.verifyPhoneOtp,
    verifyPhoneAndSetUsername: store.verifyPhoneAndSetUsername,
    resendVerificationEmail: store.resendVerificationEmail,
    setUser: store.setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export store hooks for direct usage
export { useAuthStore, useIsAuthenticated, useAuthUser, useAuthLoading, useHasSeenWelcome } from '@/src/store';
