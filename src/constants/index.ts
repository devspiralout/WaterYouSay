import { ActivityLevel, Achievement } from '../types';

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
  warningMuted: string;
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
  warningMuted: '#FFF3E0',
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
  warningMuted: '#3D2F00',
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

// Default Strava settings
export const DEFAULT_STRAVA_SETTINGS = {
  enabled: false,
  connected: false,
};

// Strava activity intensity multipliers for hydration calculation
export const STRAVA_ACTIVITY_MULTIPLIERS: Record<string, number> = {
  Run: 1.2,
  TrailRun: 1.2,
  VirtualRun: 1.2,
  Ride: 1.0,
  VirtualRide: 1.0,
  MountainBikeRide: 1.0,
  GravelRide: 1.0,
  EBikeRide: 0.8,
  Swim: 0.7,
  Walk: 0.6,
  Hike: 0.9,
  Workout: 1.0,
  WeightTraining: 0.8,
  Crossfit: 1.1,
  Elliptical: 0.9,
  StairStepper: 0.9,
  Yoga: 0.4,
  Pilates: 0.4,
  RockClimbing: 0.9,
  Soccer: 1.1,
  Tennis: 1.0,
  Golf: 0.5,
  Rowing: 1.0,
  Kayaking: 0.8,
  Surfing: 0.7,
  Skiing: 0.9,
  Snowboard: 0.8,
  IceSkate: 0.7,
  Other: 0.8,
};

export const STORAGE_KEYS = {
  PROFILE: '@wateryousay_profile',
  SETTINGS: '@wateryousay_settings',
  TODAY_LOG: '@wateryousay_today',
  HISTORY: '@wateryousay_history',
  ACHIEVEMENTS: '@wateryousay_achievements',
};

export const ACHIEVEMENTS: Achievement[] = [
  // Milestone achievements
  {
    id: 'first_sip',
    title: 'First Sip',
    description: 'Log your first water entry',
    icon: '💧',
    category: 'milestone',
  },
  {
    id: 'goal_crusher',
    title: 'Goal Crusher',
    description: 'Reach your daily goal for the first time',
    icon: '🎯',
    category: 'milestone',
  },
  {
    id: 'days_10',
    title: 'Getting Started',
    description: 'Track water for 10 days',
    icon: '📅',
    category: 'milestone',
  },
  {
    id: 'days_30',
    title: 'Committed',
    description: 'Track water for 30 days',
    icon: '📆',
    category: 'milestone',
  },
  {
    id: 'days_100',
    title: 'Centurion',
    description: 'Track water for 100 days',
    icon: '💯',
    category: 'milestone',
  },
  // Streak achievements
  {
    id: 'streak_3',
    title: 'Hat Trick',
    description: 'Reach a 3-day streak',
    icon: '🔥',
    category: 'streak',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: '⚡',
    category: 'streak',
  },
  {
    id: 'streak_14',
    title: 'Fortnight Force',
    description: 'Reach a 14-day streak',
    icon: '💪',
    category: 'streak',
  },
  {
    id: 'streak_30',
    title: 'Month Master',
    description: 'Reach a 30-day streak',
    icon: '👑',
    category: 'streak',
  },
  // Volume achievements
  {
    id: 'volume_10l',
    title: 'Hydration Hero',
    description: 'Drink 10 liters total',
    icon: '🌊',
    category: 'volume',
  },
  {
    id: 'volume_100l',
    title: 'Ocean',
    description: 'Drink 100 liters total',
    icon: '🏊',
    category: 'volume',
  },
];
