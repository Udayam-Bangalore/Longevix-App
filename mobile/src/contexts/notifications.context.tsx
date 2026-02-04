import * as notificationsService from '@/src/services/notifications.service';
import * as Notifications from 'expo-notifications';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './auth.context';
import { useMeals } from './meals.context';

interface NotificationsContextType {
  hasPermission: boolean;
  isEnabled: boolean;
  requestPermission: () => Promise<boolean>;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  lastNotificationDate: string | null;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const DEFAULT_REMINDERS = [
  { hour: 9, minute: 0, title: 'Good Morning!', body: 'Start your day right - log your breakfast in Longevix!' },
  { hour: 13, minute: 0, title: 'Lunch Time', body: 'Don\'t forget to track your lunch meal!' },
  { hour: 19, minute: 0, title: 'Dinner Reminder', body: 'Log your dinner to complete today\'s nutrition tracking!' },
  { hour: 21, minute: 30, title: 'Daily Check-in', body: 'You haven\'t logged any food today. Take a moment to track your meals!' },
];

const LAST_NOTIFICATION_CHECK_KEY = '@last_notification_check';

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { isAuthenticated } = useAuth();
  const { meals, refreshMeals } = useMeals();
  const [hasPermission, setHasPermission] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastNotificationDate, setLastNotificationDate] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    notificationsService.configureNotifications();
    checkPermission();

    notificationListener.current = notificationsService.addNotificationReceivedListener(
      () => {
        // Notification received
      }
    );

    responseListener.current = notificationsService.addNotificationResponseListener(
      () => {
        // Notification tapped
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationsService.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        notificationsService.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !hasPermission || !isEnabled) return;

    const checkAndScheduleReminders = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        if (lastNotificationDate === today) {
          return;
        }

        const totalItems = meals.reduce((sum, meal) => sum + meal.items.length, 0);
        
        if (totalItems === 0) {
          await scheduleReminders();
        } else {
          await scheduleMealTimeRemindersOnly();
        }

        setLastNotificationDate(today);
      } catch (error) {
        // Error checking meals for notifications
      }
    };

    checkAndScheduleReminders();
  }, [isAuthenticated, hasPermission, isEnabled, meals, lastNotificationDate]);

  const checkPermission = async () => {
    const granted = await notificationsService.checkNotificationPermissions();
    setHasPermission(granted);
  };

  const requestPermission = async (): Promise<boolean> => {
    const granted = await notificationsService.requestNotificationPermissions();
    setHasPermission(granted);
    return granted;
  };

  const scheduleReminders = async () => {
    try {
      await notificationsService.cancelAllNotifications();
      await notificationsService.scheduleDailyReminders(DEFAULT_REMINDERS);
    } catch (error) {
      // Error scheduling reminders
    }
  };

  const scheduleMealTimeRemindersOnly = async () => {
    try {
      await notificationsService.cancelAllNotifications();
      const mealTimeReminders = DEFAULT_REMINDERS.filter(
        r => r.hour !== 21 || r.minute !== 30
      );
      await notificationsService.scheduleDailyReminders(mealTimeReminders);
    } catch (error) {
      // Error scheduling meal time reminders
    }
  };

  const enableNotifications = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        setIsEnabled(true);
        await scheduleReminders();
      }
    } catch (error) {
      // Error enabling notifications
    }
  };

  const disableNotifications = async () => {
    try {
      await notificationsService.cancelAllNotifications();
      setIsEnabled(false);
    } catch (error) {
      // Error disabling notifications
    }
  };

  const value: NotificationsContextType = {
    hasPermission,
    isEnabled,
    requestPermission,
    enableNotifications,
    disableNotifications,
    lastNotificationDate,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
