import {
  calculateDailyWaterGoal,
  calculateProgress,
  getTodayDateString,
  generateEntryId,
  calculateStreak,
  getWeekDates,
  isToday,
  isFutureDate,
  formatDateString,
  getCalculationBreakdown,
} from '../utils/calculations';
import { UserProfile } from '../types';

describe('calculateDailyWaterGoal', () => {
  const baseProfile: UserProfile = {
    age: 30,
    sex: 'male',
    weightKg: 70,
    activityLevel: 'sedentary',
    useCalculatedGoal: true,
  };

  it('should calculate base goal for sedentary male', () => {
    const goal = calculateDailyWaterGoal(baseProfile);
    // 70kg * 33ml * 1.1 (male) * 1.0 (sedentary) = 2541ml, rounded to 2550
    expect(goal).toBe(2550);
  });

  it('should calculate goal for female (no sex multiplier)', () => {
    const profile: UserProfile = { ...baseProfile, sex: 'female' };
    const goal = calculateDailyWaterGoal(profile);
    // 70kg * 33ml * 1.0 (female) * 1.0 (sedentary) = 2310ml, rounded to 2300
    expect(goal).toBe(2300);
  });

  it('should apply age adjustment for 50-59 years', () => {
    const profile: UserProfile = { ...baseProfile, age: 55 };
    const goal = calculateDailyWaterGoal(profile);
    // 70kg * 33ml * 1.1 (male) * 0.95 (age 50-59) * 1.0 (sedentary) = 2413.95ml, rounded to 2400
    expect(goal).toBe(2400);
  });

  it('should apply age adjustment for 60+ years', () => {
    const profile: UserProfile = { ...baseProfile, age: 65 };
    const goal = calculateDailyWaterGoal(profile);
    // 70kg * 33ml * 1.1 (male) * 0.9 (age 60+) * 1.0 (sedentary) = 2286.9ml, rounded to 2300
    expect(goal).toBe(2300);
  });

  it('should apply activity multipliers correctly', () => {
    const lightProfile: UserProfile = { ...baseProfile, activityLevel: 'light' };
    const moderateProfile: UserProfile = { ...baseProfile, activityLevel: 'moderate' };
    const activeProfile: UserProfile = { ...baseProfile, activityLevel: 'active' };
    const veryActiveProfile: UserProfile = { ...baseProfile, activityLevel: 'very_active' };

    expect(calculateDailyWaterGoal(lightProfile)).toBe(2850); // * 1.12
    expect(calculateDailyWaterGoal(moderateProfile)).toBe(3200); // * 1.25
    expect(calculateDailyWaterGoal(activeProfile)).toBe(3500); // * 1.37
    expect(calculateDailyWaterGoal(veryActiveProfile)).toBe(3850); // * 1.5
  });
});

describe('getCalculationBreakdown', () => {
  const baseProfile: UserProfile = {
    age: 30,
    sex: 'male',
    weightKg: 70,
    activityLevel: 'moderate',
    useCalculatedGoal: true,
  };

  it('should return correct breakdown for male', () => {
    const breakdown = getCalculationBreakdown(baseProfile);
    expect(breakdown.baseAmount).toBe(2310); // 70 * 33
    expect(breakdown.sexAdjustment).toBe('+10%');
    expect(breakdown.ageAdjustment).toBe('none');
    expect(breakdown.activityMultiplier).toBe(1.25);
    expect(breakdown.activityLabel).toBe('Moderate (×1.25)');
  });

  it('should return correct breakdown for female over 60', () => {
    const profile: UserProfile = { ...baseProfile, sex: 'female', age: 65 };
    const breakdown = getCalculationBreakdown(profile);
    expect(breakdown.sexAdjustment).toBe('none');
    expect(breakdown.ageAdjustment).toBe('-10%');
  });
});

describe('calculateProgress', () => {
  it('should calculate correct percentage', () => {
    expect(calculateProgress(1250, 2500)).toBe(50);
    expect(calculateProgress(2500, 2500)).toBe(100);
    expect(calculateProgress(0, 2500)).toBe(0);
  });

  it('should cap progress at 100%', () => {
    expect(calculateProgress(3000, 2500)).toBe(100);
  });

  it('should handle zero goal', () => {
    expect(calculateProgress(1000, 0)).toBe(0);
  });

  it('should handle negative goal', () => {
    expect(calculateProgress(1000, -100)).toBe(0);
  });
});

describe('getTodayDateString', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const dateStr = getTodayDateString();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return today\'s date', () => {
    const today = new Date();
    const expected = today.toISOString().split('T')[0];
    expect(getTodayDateString()).toBe(expected);
  });
});

describe('generateEntryId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateEntryId();
    const id2 = generateEntryId();
    expect(id1).not.toBe(id2);
  });

  it('should contain timestamp and random portion', () => {
    const id = generateEntryId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

describe('calculateStreak', () => {
  const goalMl = 2500;

  it('should return 0 if no history and today goal not met', () => {
    expect(calculateStreak([], goalMl, 1000)).toBe(0);
  });

  it('should return 1 if today goal is met with no history', () => {
    expect(calculateStreak([], goalMl, 2500)).toBe(1);
  });

  it('should count consecutive days meeting goal', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const history = [
      { date: yesterday.toISOString().split('T')[0], totalMl: 3000 },
      { date: twoDaysAgo.toISOString().split('T')[0], totalMl: 2800 },
    ];

    // Today met + 2 days history = 3
    expect(calculateStreak(history, goalMl, 2500)).toBe(3);
  });

  it('should break streak on missed day', () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const history = [
      // Missing yesterday breaks the streak
      { date: twoDaysAgo.toISOString().split('T')[0], totalMl: 3000 },
    ];

    expect(calculateStreak(history, goalMl, 2500)).toBe(1);
  });
});

describe('getWeekDates', () => {
  it('should return 7 dates', () => {
    const dates = getWeekDates();
    expect(dates).toHaveLength(7);
  });

  it('should start on Monday', () => {
    const dates = getWeekDates(new Date('2024-01-15')); // Monday
    expect(dates[0].getDay()).toBe(1); // Monday
  });

  it('should end on Sunday', () => {
    const dates = getWeekDates(new Date('2024-01-15'));
    expect(dates[6].getDay()).toBe(0); // Sunday
  });

  it('should handle Sunday input correctly', () => {
    const sunday = new Date('2024-01-14'); // Sunday
    const dates = getWeekDates(sunday);
    // Should return previous Monday through this Sunday
    expect(dates[0].toISOString().split('T')[0]).toBe('2024-01-08');
    expect(dates[6].toISOString().split('T')[0]).toBe('2024-01-14');
  });
});

describe('isToday', () => {
  it('should return true for today', () => {
    const today = getTodayDateString();
    expect(isToday(today)).toBe(true);
  });

  it('should return false for other dates', () => {
    expect(isToday('2020-01-01')).toBe(false);
  });
});

describe('isFutureDate', () => {
  it('should return false for today', () => {
    const today = getTodayDateString();
    expect(isFutureDate(today)).toBe(false);
  });

  it('should return false for past dates', () => {
    expect(isFutureDate('2020-01-01')).toBe(false);
  });

  it('should return true for future dates', () => {
    expect(isFutureDate('2099-12-31')).toBe(true);
  });
});

describe('formatDateString', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2024-03-15T12:00:00');
    expect(formatDateString(date)).toBe('2024-03-15');
  });
});
