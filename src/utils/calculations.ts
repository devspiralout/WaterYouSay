import { UserProfile, ActivityLevel, Sex } from '../types';
import { ACTIVITY_MULTIPLIERS } from '../constants';

export interface CalculationBreakdown {
  baseAmount: number;
  sexAdjustment: string;
  ageAdjustment: string;
  activityMultiplier: number;
  activityLabel: string;
  finalAmount: number;
}

/**
 * Calculate recommended daily water intake in milliliters
 * Based on weight, age, sex, and activity level
 */
export function calculateDailyWaterGoal(profile: UserProfile): number {
  const { weightKg, age, sex, activityLevel } = profile;

  // Base calculation: 30-35ml per kg of body weight
  // Using 33ml as middle ground
  let baseMl = weightKg * 33;

  // Sex adjustment: males typically need ~10% more
  if (sex === 'male') {
    baseMl *= 1.1;
  }

  // Age adjustment: slight reduction for elderly (60+)
  if (age >= 60) {
    baseMl *= 0.9;
  } else if (age >= 50) {
    baseMl *= 0.95;
  }

  // Activity level multiplier
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  baseMl *= activityMultiplier;

  // Round to nearest 50ml
  return Math.round(baseMl / 50) * 50;
}

/**
 * Get a breakdown of the calculation for display
 */
export function getCalculationBreakdown(profile: UserProfile): CalculationBreakdown {
  const { weightKg, age, sex, activityLevel } = profile;

  const baseAmount = Math.round(weightKg * 33);

  let sexAdjustment = 'none';
  if (sex === 'male') {
    sexAdjustment = '+10%';
  }

  let ageAdjustment = 'none';
  if (age >= 60) {
    ageAdjustment = '-10%';
  } else if (age >= 50) {
    ageAdjustment = '-5%';
  }

  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];

  const activityLabels: Record<ActivityLevel, string> = {
    sedentary: 'Sedentary (×1.0)',
    light: 'Light (×1.12)',
    moderate: 'Moderate (×1.25)',
    active: 'Active (×1.37)',
    very_active: 'Very Active (×1.5)',
  };

  return {
    baseAmount,
    sexAdjustment,
    ageAdjustment,
    activityMultiplier,
    activityLabel: activityLabels[activityLevel],
    finalAmount: calculateDailyWaterGoal(profile),
  };
}

/**
 * Calculate percentage of daily goal completed
 */
export function calculateProgress(currentMl: number, goalMl: number): number {
  if (goalMl <= 0) return 0;
  return Math.min((currentMl / goalMl) * 100, 100);
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Generate a unique ID for water entries
 */
export function generateEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate current streak of days meeting the goal
 */
export function calculateStreak(
  history: { date: string; totalMl: number }[],
  goalMl: number,
  todayTotal: number
): number {
  const today = getTodayDateString();
  const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;

  // Check if today's goal is met
  if (todayTotal >= goalMl) {
    streak = 1;
  } else {
    // If today's goal isn't met yet, check if yesterday started a streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayLog = sortedHistory.find(log => log.date === yesterdayStr);
    if (!yesterdayLog || yesterdayLog.totalMl < goalMl) {
      return 0;
    }
  }

  // Count consecutive days meeting goal (going backwards)
  let checkDate = new Date();
  if (todayTotal < goalMl) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (const log of sortedHistory) {
    const expectedDate = checkDate.toISOString().split('T')[0];

    if (log.date === expectedDate && log.totalMl >= goalMl) {
      if (todayTotal >= goalMl || log.date !== today) {
        streak++;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (log.date < expectedDate) {
      break;
    }
  }

  return streak;
}
