import { DailyLog, WaterEntry, HistoryEntry } from '../types';
import { generateEntryId, getTodayDateString } from './calculations';

/**
 * Generate mock water entries for today
 */
export function generateMockTodayEntries(count: number): WaterEntry[] {
  const entries: WaterEntry[] = [];
  const now = new Date();

  const amounts = [100, 150, 200, 250, 300, 350, 500];

  for (let i = 0; i < count; i++) {
    const hoursAgo = Math.floor((count - i) * (12 / count)); // Spread throughout the day
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    entries.push({
      id: generateEntryId(),
      amountMl: amounts[Math.floor(Math.random() * amounts.length)],
      timestamp: timestamp.toISOString(),
    });
  }

  return entries;
}

/**
 * Generate mock today's log
 */
export function generateMockTodayLog(entryCount: number): DailyLog {
  const entries = generateMockTodayEntries(entryCount);
  const totalMl = entries.reduce((sum, e) => sum + e.amountMl, 0);

  return {
    date: getTodayDateString(),
    entries,
    totalMl,
  };
}

/**
 * Generate mock history for past days
 */
export function generateMockHistory(days: number, dailyGoalMl: number): HistoryEntry[] {
  const history: HistoryEntry[] = [];
  const today = new Date();

  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Random intake between 50% and 120% of goal
    const variation = 0.5 + Math.random() * 0.7;
    const totalMl = Math.round((dailyGoalMl * variation) / 50) * 50;

    history.push({
      date: dateStr,
      totalMl,
    });
  }

  return history;
}

/**
 * Mock data presets
 */
export const MOCK_PRESETS = {
  // Few activities today
  lightDay: {
    todayEntries: 3,
    historyDays: 7,
    description: 'Light day (3 entries, 1 week history)',
  },
  // Busy day with lots of entries
  busyDay: {
    todayEntries: 12,
    historyDays: 14,
    description: 'Busy day (12 entries, 2 weeks history)',
  },
  // Long history
  longHistory: {
    todayEntries: 5,
    historyDays: 60,
    description: 'Long history (5 entries, 2 months history)',
  },
  // Stress test
  stressTest: {
    todayEntries: 25,
    historyDays: 90,
    description: 'Stress test (25 entries, 3 months history)',
  },
};
