import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, AppSettings, DailyLog } from '../types';
import { STORAGE_KEYS, DEFAULT_DAILY_GOAL_ML } from '../constants';

export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }

  // Return default settings
  return {
    unitSystem: 'metric',
    dailyGoalMl: DEFAULT_DAILY_GOAL_ML,
    onboardingComplete: false,
  };
}

export async function saveTodayLog(log: DailyLog): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TODAY_LOG, JSON.stringify(log));
  } catch (error) {
    console.error('Error saving today log:', error);
  }
}

export async function loadTodayLog(todayDate: string): Promise<DailyLog> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TODAY_LOG);
    if (data) {
      const log: DailyLog = JSON.parse(data);
      // Check if the stored log is for today
      if (log.date === todayDate) {
        return log;
      }
      // If not today, archive it and return empty log
      await archiveLog(log);
    }
  } catch (error) {
    console.error('Error loading today log:', error);
  }

  return {
    date: todayDate,
    entries: [],
    totalMl: 0,
  };
}

export async function archiveLog(log: DailyLog): Promise<void> {
  if (log.entries.length === 0) return;

  try {
    const history = await loadHistory();
    // Don't add duplicates
    if (!history.find(h => h.date === log.date)) {
      history.push(log);
      // Keep only last 90 days
      const sortedHistory = history
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 90);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sortedHistory));
    }
  } catch (error) {
    console.error('Error archiving log:', error);
  }
}

export async function loadHistory(): Promise<DailyLog[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.TODAY_LOG,
      STORAGE_KEYS.HISTORY,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}
