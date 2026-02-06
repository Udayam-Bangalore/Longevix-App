import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationsService from '@/src/services/notifications.service';

const DEFAULT_REMINDERS = [
  { hour: 9, minute: 0, title: 'Good Morning!', body: 'Start your day right - log your breakfast in Longevix!' },
  { hour: 14, minute: 0, title: 'Lunch Time', body: "Don't forget to track your lunch meal!" },
  { hour: 18, minute: 0, title: 'Snack Time', body: 'Time for a healthy snack! Log it in Longevix.' },
  { hour: 22, minute: 0, title: 'Dinner Reminder', body: 'Log your dinner to complete today\'s nutrition tracking!' },
];

interface NotificationsState {
  // State
  hasPermission: boolean;
  isEnabled: boolean;
  lastNotificationDate: string | null;
  hasSeenPrompt: boolean; // Track if user has seen notification prompt
  
  // Actions
  setHasPermission: (hasPermission: boolean) => void;
  setIsEnabled: (isEnabled: boolean) => void;
  setLastNotificationDate: (date: string | null) => void;
  setHasSeenPrompt: (hasSeenPrompt: boolean) => void;
  
  // Async Actions
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  scheduleReminders: () => Promise<void>;
  scheduleMealTimeRemindersOnly: () => Promise<void>;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  initialize: () => Promise<() => void>;
  checkAndScheduleReminders: (mealsItemCount: number) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      // Initial State
      hasPermission: false,
      isEnabled: false,
      lastNotificationDate: null,
      hasSeenPrompt: false,
      
      // Actions
      setHasPermission: (hasPermission) => set({ hasPermission }),
      setIsEnabled: (isEnabled) => set({ isEnabled }),
      setLastNotificationDate: (lastNotificationDate) => set({ lastNotificationDate }),
      setHasSeenPrompt: (hasSeenPrompt) => set({ hasSeenPrompt }),
  
  // Async Actions
  checkPermission: async () => {
    const granted = await notificationsService.checkNotificationPermissions();
    set({ hasPermission: granted });
  },
  
  requestPermission: async () => {
    const granted = await notificationsService.requestNotificationPermissions();
    set({ hasPermission: granted });
    return granted;
  },
  
  scheduleReminders: async () => {
    try {
      await notificationsService.cancelAllNotifications();
      await notificationsService.scheduleDailyReminders(DEFAULT_REMINDERS);
    } catch (error) {
      // Error scheduling reminders
    }
  },
  
  scheduleMealTimeRemindersOnly: async () => {
    try {
      await notificationsService.cancelAllNotifications();
      await notificationsService.scheduleDailyReminders(DEFAULT_REMINDERS);
    } catch (error) {
      // Error scheduling meal time reminders
    }
  },
  
  enableNotifications: async () => {
    try {
      const granted = await get().requestPermission();
      if (granted) {
        set({ isEnabled: true });
        await get().scheduleReminders();
      }
    } catch (error) {
      // Error enabling notifications
    }
  },
  
  disableNotifications: async () => {
    try {
      await notificationsService.cancelAllNotifications();
      set({ isEnabled: false });
    } catch (error) {
      // Error disabling notifications
    }
  },
  
  initialize: async () => {
    notificationsService.configureNotifications();
    await get().checkPermission();
    
    // Set up listeners
    const notificationListener = notificationsService.addNotificationReceivedListener(
      () => {
        // Notification received
      }
    );

    const responseListener = notificationsService.addNotificationResponseListener(
      () => {
        // Notification tapped
      }
    );

    // Return cleanup function
    return () => {
      notificationsService.removeNotificationSubscription(notificationListener);
      notificationsService.removeNotificationSubscription(responseListener);
    };
  },
  
  checkAndScheduleReminders: async (mealsItemCount) => {
    const { isEnabled, hasPermission, lastNotificationDate } = get();
    
    if (!isEnabled || !hasPermission) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    if (lastNotificationDate === today) {
      return;
    }
    
    if (mealsItemCount === 0) {
      await get().scheduleReminders();
    } else {
      await get().scheduleMealTimeRemindersOnly();
    }
    
    set({ lastNotificationDate: today });
  },
}),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenPrompt: state.hasSeenPrompt,
        isEnabled: state.isEnabled,
      }),
    }
  )
);

// Selectors
export const useHasNotificationPermission = () => useNotificationsStore((state) => state.hasPermission);
export const useNotificationsEnabled = () => useNotificationsStore((state) => state.isEnabled);
