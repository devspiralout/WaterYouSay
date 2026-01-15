import type { NavigatorScreenParams } from '@react-navigation/native';

// Navigation types
export type RootTabParamList = {
  Today: undefined;
  Awards: undefined;
  Settings: undefined;
};

export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type UnitSystem = 'metric' | 'imperial';

export interface UserProfile {
  age: number;
  sex: Sex;
  weightKg: number;
  activityLevel: ActivityLevel;
  useCalculatedGoal: boolean;
}

export interface WaterEntry {
  id: string;
  amountMl: number;
  timestamp: string; // ISO string
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  entries: WaterEntry[];
  totalMl: number;
}

export interface HistoryEntry {
  date: string; // YYYY-MM-DD
  totalMl: number;
}

export interface ReminderSettings {
  enabled: boolean;
  intervalHours: number;
  startHour: number;
  endHour: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ClimateSettings {
  enabled: boolean;
}

export interface AppSettings {
  unitSystem: UnitSystem;
  dailyGoalMl: number;
  onboardingComplete: boolean;
  reminders: ReminderSettings;
  quickAddAmounts: number[]; // in ml
  soundEnabled: boolean;
  themeMode: ThemeMode;
  climate: ClimateSettings;
}

export interface AppState {
  profile: UserProfile | null;
  settings: AppSettings;
  todayLog: DailyLog;
  history: HistoryEntry[];
  unlockedAchievements: UnlockedAchievement[];
}

export type AchievementId =
  | 'first_sip'
  | 'goal_crusher'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'days_10'
  | 'days_30'
  | 'days_100'
  | 'volume_10l'
  | 'volume_100l';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'milestone' | 'volume';
}

export interface UnlockedAchievement {
  id: AchievementId;
  unlockedAt: string; // ISO date string
}

export interface ClimateAdjustmentInfo {
  percentage: number;
  reason: string;
  temperature: number;
  temperatureHigh: number;
  temperatureLow: number;
  locationName: string;
  adjustedGoalMl: number;
}

export interface WaterContextType {
  state: AppState;
  addWater: (amountMl: number) => void;
  removeEntry: (entryId: string) => void;
  setProfile: (profile: UserProfile) => void;
  setDailyGoal: (goalMl: number) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setReminders: (reminders: ReminderSettings) => void;
  setQuickAddAmounts: (amounts: number[]) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setClimateEnabled: (enabled: boolean) => void;
  climateAdjustment: ClimateAdjustmentInfo | null;
  refreshClimate: () => Promise<void>;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  clearToday: () => void;
  unlockAchievement: (id: AchievementId) => void;
  pendingAchievement: AchievementId | null;
  clearPendingAchievement: () => void;
  loadMockData: (todayEntries: number, historyDays: number) => Promise<void>;
  dailyLimitMl: number;
  isAtDailyLimit: boolean;
}
