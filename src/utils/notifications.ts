import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Check if running in Expo Go (notifications have limited support there)
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

// Only set up notification handler if not in Expo Go
if (!isExpoGo()) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface ReminderSettings {
  enabled: boolean;
  intervalHours: number;
  startHour: number; // 24-hour format (e.g., 8 for 8am)
  endHour: number;   // 24-hour format (e.g., 22 for 10pm)
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  intervalHours: 2,
  startHour: 8,
  endHour: 22,
};

const REMINDER_MESSAGES = [
  "Time for a water break! 💧",
  "Stay hydrated! Drink some water.",
  "Your body needs water. Take a sip!",
  "Hydration check! Have you had water recently?",
  "Water break time! Keep up the good work.",
];

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleWaterReminders(settings: ReminderSettings): Promise<void> {
  // Cancel all existing reminders first
  await cancelAllReminders();

  if (!settings.enabled) return;

  // Skip scheduling in Expo Go - notifications don't work there
  if (isExpoGo()) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Schedule reminders for each interval during active hours
  const { intervalHours, startHour, endHour } = settings;

  // Calculate how many reminders per day
  const activeHours = endHour - startHour;
  const remindersPerDay = Math.floor(activeHours / intervalHours);

  for (let i = 0; i < remindersPerDay; i++) {
    const hour = startHour + (i * intervalHours);
    const message = REMINDER_MESSAGES[i % REMINDER_MESSAGES.length];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'WaterYouSay?',
        body: message,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hour,
        minute: 0,
      },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
