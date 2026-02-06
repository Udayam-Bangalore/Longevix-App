import React, { ReactNode } from 'react';
import { useAppStateStore } from '@/src/store';

interface AppStateContextType {
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
  clearGlobalError: () => void;
  isRefreshingToken: boolean;
  setIsRefreshingToken: (refreshing: boolean) => void;
  pendingRequests: number;
  incrementPendingRequests: () => void;
  decrementPendingRequests: () => void;
  lastErrorTimestamp: number | null;
  shouldRetry: () => boolean;
  markErrorTimestamp: () => void;
}

const AppStateContext = React.createContext<AppStateContextType | undefined>(undefined);

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const store = useAppStateStore();

  const value: AppStateContextType = {
    globalLoading: store.globalLoading,
    setGlobalLoading: store.setGlobalLoading,
    globalError: store.globalError,
    setGlobalError: store.setGlobalError,
    clearGlobalError: store.clearGlobalError,
    isRefreshingToken: store.isRefreshingToken,
    setIsRefreshingToken: store.setIsRefreshingToken,
    pendingRequests: store.pendingRequests,
    incrementPendingRequests: store.incrementPendingRequests,
    decrementPendingRequests: store.decrementPendingRequests,
    lastErrorTimestamp: store.lastErrorTimestamp,
    shouldRetry: store.shouldRetry,
    markErrorTimestamp: store.markErrorTimestamp,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = React.useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// Re-export store hooks for direct usage
export { useAppStateStore, useGlobalLoading, useGlobalError, useIsRefreshingToken, usePendingRequests } from '@/src/store';
