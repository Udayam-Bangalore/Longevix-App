import React, { ReactNode, useEffect, useRef } from 'react';
import { useNotificationsStore, useAuthStore, useMealsStore } from '@/src/store';
import * as Notifications from 'expo-notifications';

interface NotificationsContextType {
  hasPermission: boolean;
  isEnabled: boolean;
  requestPermission: () => Promise<boolean>;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  lastNotificationDate: string | null;
}

const NotificationsContext = React.createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const store = useNotificationsStore();
  const isAuthenticated = !!useAuthStore((state) => state.user);
  const { meals } = useMealsStore();
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize notifications on mount
  useEffect(() => {
    const init = async () => {
      const cleanup = await store.initialize();
      cleanupRef.current = cleanup;
    };
    init();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Check and schedule reminders when auth/meals change
  useEffect(() => {
    if (!isAuthenticated || !store.hasPermission || !store.isEnabled) return;

    const totalItems = meals.reduce((sum, meal) => sum + meal.items.length, 0);
    store.checkAndScheduleReminders(totalItems);
  }, [isAuthenticated, store.hasPermission, store.isEnabled, meals, store.lastNotificationDate]);

  const value: NotificationsContextType = {
    hasPermission: store.hasPermission,
    isEnabled: store.isEnabled,
    requestPermission: store.requestPermission,
    enableNotifications: store.enableNotifications,
    disableNotifications: store.disableNotifications,
    lastNotificationDate: store.lastNotificationDate,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

// Re-export store hooks
export { 
  useNotificationsStore, 
  useHasNotificationPermission, 
  useNotificationsEnabled 
} from '@/src/store';
