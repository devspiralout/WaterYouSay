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

export interface AppSettings {
  unitSystem: UnitSystem;
  dailyGoalMl: number;
  onboardingComplete: boolean;
}

export interface AppState {
  profile: UserProfile | null;
  settings: AppSettings;
  todayLog: DailyLog;
  history: HistoryEntry[];
}

export interface WaterContextType {
  state: AppState;
  addWater: (amountMl: number) => void;
  removeEntry: (entryId: string) => void;
  setProfile: (profile: UserProfile) => void;
  setDailyGoal: (goalMl: number) => void;
  setUnitSystem: (system: UnitSystem) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  loadMockData: (todayEntries: number, historyDays: number) => Promise<void>;
}
