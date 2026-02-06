export async function configureNotifications() {
  try {
    const Notifications = await import('expo-notifications');
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    // Notifications not available
  }
}

async function getNotificationsModule(): Promise<typeof import('expo-notifications') | null> {
  try {
    return await import('expo-notifications');
  } catch (error) {
    return null;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function checkNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<string | null> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;

    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: 'high' as const,
        data: { type: 'daily_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return identifier;
  } catch (error) {
    return null;
  }
}

export async function scheduleDailyReminders(reminders: {
  hour: number;
  minute: number;
  title: string;
  body: string;
}[]): Promise<string[]> {
  const identifiers: string[] = [];

  for (const reminder of reminders) {
    const id = await scheduleDailyReminder(
      reminder.hour,
      reminder.minute,
      reminder.title,
      reminder.body
    );
    if (id) {
      identifiers.push(id);
    }
  }

  return identifiers;
}

export async function cancelNotification(identifier: string): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllNotifications(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return [];
  
  return await Notifications.getAllScheduledNotificationsAsync();
}

export function addNotificationReceivedListener(
  callback: (notification: any) => void
) {
  return {
    remove: () => {},
  };
}

export function addNotificationResponseListener(
  callback: (response: any) => void
) {
  return {
    remove: () => {},
  };
}

export function removeNotificationSubscription(subscription: any): void {
}
