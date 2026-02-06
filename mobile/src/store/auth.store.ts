import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService, User } from '@/src/services/auth.service';

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  hasSeenWelcome: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setHasSeenWelcome: (value: boolean) => void;
  
  // Async Actions
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<{ message: string; user?: any }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  verifyPhoneAndSetUsername: (phone: string, token: string, username: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isLoading: true,
      hasSeenWelcome: false,
      
      // Sync Actions
      setUser: (user) => set({ user }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setHasSeenWelcome: (hasSeenWelcome) => set({ hasSeenWelcome }),
      
      // Async Actions
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          await authService.login({ email, password });
          const userData = await authService.getProfile();
          set({ user: userData });
        } finally {
          set({ isLoading: false });
        }
      },
      
      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          const result = await authService.register({ username, email, password });
          return result;
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          set({ user: null });
        } finally {
          set({ isLoading: false });
        }
      },
      
      checkAuth: async () => {
        try {
          const [isAuth, seenWelcome] = await Promise.all([
            authService.isAuthenticated(),
            authService.getHasSeenWelcome(),
          ]);
          
          set({ hasSeenWelcome: seenWelcome });
          
          if (isAuth) {
            const userData = await authService.getProfile();
            set({ user: userData });
          }
        } catch {
          await authService.logout();
          set({ user: null });
        } finally {
          set({ isLoading: false });
        }
      },
      
      sendPhoneOtp: async (phone) => {
        set({ isLoading: true });
        try {
          await authService.sendPhoneOtp({ phone });
        } finally {
          set({ isLoading: false });
        }
      },
      
      verifyPhoneOtp: async (phone, token) => {
        set({ isLoading: true });
        try {
          await authService.verifyPhoneOtp({ phone, token });
          const userData = await authService.getProfile();
          set({ user: userData });
        } finally {
          set({ isLoading: false });
        }
      },
      
      verifyPhoneAndSetUsername: async (phone, token, username) => {
        set({ isLoading: true });
        try {
          await authService.verifyPhoneAndSetUsername({ phone, token, username });
          const userData = await authService.getProfile();
          set({ user: userData });
        } finally {
          set({ isLoading: false });
        }
      },
      
      resendVerificationEmail: async (email) => {
        set({ isLoading: true });
        try {
          await authService.resendVerificationEmail(email);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ hasSeenWelcome: state.hasSeenWelcome }),
    }
  )
);

// Selectors
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useHasSeenWelcome = () => useAuthStore((state) => state.hasSeenWelcome);
