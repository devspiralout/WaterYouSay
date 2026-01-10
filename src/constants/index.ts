import { ActivityLevel } from '../types';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryMuted: string;
  accent: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  divider: string;
  streak: string;
  water: string;
}

export const LIGHT_COLORS: ThemeColors = {
  primary: '#0A84FF',
  primaryMuted: '#B4D4FF',
  accent: '#32D74B',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF453A',
  border: '#F2F2F7',
  divider: '#E5E5EA',
  streak: '#FF9F0A',
  water: '#0A84FF',
};

export const DARK_COLORS: ThemeColors = {
  primary: '#0A84FF',
  primaryMuted: '#1C3A5E',
  accent: '#32D74B',
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF453A',
  border: '#38383A',
  divider: '#38383A',
  streak: '#FF9F0A',
  water: '#0A84FF',
};

// Default export for backward compatibility
export const COLORS = LIGHT_COLORS;

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
