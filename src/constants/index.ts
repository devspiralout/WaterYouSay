import { ActivityLevel } from '../types';

export const COLORS = {
  primary: '#4A90D9',
  primaryLight: '#7AB3E8',
  primaryDark: '#2E6AAB',
  secondary: '#5DADE2',
  background: '#F5F9FC',
  surface: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  border: '#E0E6ED',
};

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise, desk job' },
  { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Very hard exercise, physical job' },
];

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.0,
  light: 1.12,
  moderate: 1.25,
  active: 1.37,
  very_active: 1.5,
};

export const QUICK_ADD_AMOUNTS_ML = [100, 250, 500];

export const DEFAULT_DAILY_GOAL_ML = 2500;

export const ML_PER_OZ = 29.5735;
export const ML_PER_CUP = 236.588;

export const STORAGE_KEYS = {
  PROFILE: '@wateryousay_profile',
  SETTINGS: '@wateryousay_settings',
  TODAY_LOG: '@wateryousay_today',
  HISTORY: '@wateryousay_history',
};
