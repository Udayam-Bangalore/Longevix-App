import { create } from 'zustand';

interface AppStateState {
  // State
  globalLoading: boolean;
  globalError: string | null;
  isRefreshingToken: boolean;
  pendingRequests: number;
  lastErrorTimestamp: number | null;
  
  // Actions
  setGlobalLoading: (loading: boolean) => void;
  setGlobalError: (error: string | null) => void;
  clearGlobalError: () => void;
  setIsRefreshingToken: (refreshing: boolean) => void;
  incrementPendingRequests: () => void;
  decrementPendingRequests: () => void;
  markErrorTimestamp: () => void;
  shouldRetry: () => boolean;
}

export const useAppStateStore = create<AppStateState>((set, get) => ({
  // Initial State
  globalLoading: false,
  globalError: null,
  isRefreshingToken: false,
  pendingRequests: 0,
  lastErrorTimestamp: null,
  
  // Actions
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  
  setGlobalError: (error) => {
    set({ 
      globalError: error,
      lastErrorTimestamp: error ? Date.now() : get().lastErrorTimestamp 
    });
  },
  
  clearGlobalError: () => set({ globalError: null }),
  
  setIsRefreshingToken: (isRefreshingToken) => set({ isRefreshingToken }),
  
  incrementPendingRequests: () => {
    const newCount = get().pendingRequests + 1;
    set({ 
      pendingRequests: newCount,
      globalLoading: newCount > 0 
    });
  },
  
  decrementPendingRequests: () => {
    const newCount = Math.max(0, get().pendingRequests - 1);
    set({ 
      pendingRequests: newCount,
      globalLoading: newCount > 0 
    });
  },
  
  markErrorTimestamp: () => set({ lastErrorTimestamp: Date.now() }),
  
  shouldRetry: () => {
    const { lastErrorTimestamp } = get();
    if (lastErrorTimestamp) {
      const timeSinceError = Date.now() - lastErrorTimestamp;
      if (timeSinceError < 3000) {
        return false;
      }
    }
    return true;
  },
}));

// Selectors
export const useGlobalLoading = () => useAppStateStore((state) => state.globalLoading);
export const useGlobalError = () => useAppStateStore((state) => state.globalError);
export const useIsRefreshingToken = () => useAppStateStore((state) => state.isRefreshingToken);
export const usePendingRequests = () => useAppStateStore((state) => state.pendingRequests);
