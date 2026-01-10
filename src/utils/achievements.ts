import { AchievementId, DailyLog, HistoryEntry, UnlockedAchievement } from '../types';
import { getTodayDateString } from './calculations';

interface AchievementCheckParams {
  todayLog: DailyLog;
  history: HistoryEntry[];
  dailyGoalMl: number;
  unlockedAchievements: UnlockedAchievement[];
}

/**
 * Check which achievements should be unlocked based on current state
 * Returns array of achievement IDs that should be newly unlocked
 */
export function checkAchievements(params: AchievementCheckParams): AchievementId[] {
  const { todayLog, history, dailyGoalMl, unlockedAchievements } = params;
  const newlyUnlocked: AchievementId[] = [];

  const isAlreadyUnlocked = (id: AchievementId): boolean => {
    return unlockedAchievements.some(a => a.id === id);
  };

  // Calculate stats
  const totalDaysTracked = countDaysTracked(todayLog, history);
  const totalVolumeMl = calculateTotalVolume(todayLog, history);
  const currentStreak = calculateCurrentStreak(todayLog, history, dailyGoalMl);
  const longestStreak = calculateLongestStreak(todayLog, history, dailyGoalMl);
  const hasReachedGoalToday = todayLog.totalMl >= dailyGoalMl;
  const hasAnyEntry = todayLog.entries.length > 0 || history.length > 0;

  // Check milestone achievements
  if (!isAlreadyUnlocked('first_sip') && hasAnyEntry) {
    newlyUnlocked.push('first_sip');
  }

  if (!isAlreadyUnlocked('goal_crusher') && hasReachedGoalToday) {
    newlyUnlocked.push('goal_crusher');
  }

  if (!isAlreadyUnlocked('days_10') && totalDaysTracked >= 10) {
    newlyUnlocked.push('days_10');
  }

  if (!isAlreadyUnlocked('days_30') && totalDaysTracked >= 30) {
    newlyUnlocked.push('days_30');
  }

  if (!isAlreadyUnlocked('days_100') && totalDaysTracked >= 100) {
    newlyUnlocked.push('days_100');
  }

  // Check streak achievements (use longest streak ever)
  if (!isAlreadyUnlocked('streak_3') && longestStreak >= 3) {
    newlyUnlocked.push('streak_3');
  }

  if (!isAlreadyUnlocked('streak_7') && longestStreak >= 7) {
    newlyUnlocked.push('streak_7');
  }

  if (!isAlreadyUnlocked('streak_14') && longestStreak >= 14) {
    newlyUnlocked.push('streak_14');
  }

  if (!isAlreadyUnlocked('streak_30') && longestStreak >= 30) {
    newlyUnlocked.push('streak_30');
  }

  // Check volume achievements (in ml, convert to liters)
  if (!isAlreadyUnlocked('volume_10l') && totalVolumeMl >= 10000) {
    newlyUnlocked.push('volume_10l');
  }

  if (!isAlreadyUnlocked('volume_100l') && totalVolumeMl >= 100000) {
    newlyUnlocked.push('volume_100l');
  }

  return newlyUnlocked;
}

function countDaysTracked(todayLog: DailyLog, history: HistoryEntry[]): number {
  let count = todayLog.totalMl > 0 ? 1 : 0;
  count += history.filter(h => h.totalMl > 0).length;
  return count;
}

function calculateTotalVolume(todayLog: DailyLog, history: HistoryEntry[]): number {
  let total = todayLog.totalMl;
  history.forEach(h => {
    total += h.totalMl;
  });
  return total;
}

function calculateCurrentStreak(todayLog: DailyLog, history: HistoryEntry[], goalMl: number): number {
  const today = getTodayDateString();
  const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;

  // Check if today's goal is met
  if (todayLog.totalMl >= goalMl) {
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
  if (todayLog.totalMl < goalMl) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (const log of sortedHistory) {
    const expectedDate = checkDate.toISOString().split('T')[0];

    if (log.date === expectedDate && log.totalMl >= goalMl) {
      if (todayLog.totalMl >= goalMl || log.date !== today) {
        streak++;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (log.date < expectedDate) {
      break;
    }
  }

  return streak;
}

function calculateLongestStreak(todayLog: DailyLog, history: HistoryEntry[], goalMl: number): number {
  const todayDateStr = getTodayDateString();
  const allDays = [
    { date: todayDateStr, totalMl: todayLog.totalMl },
    ...history,
  ].sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0;
  let current = 0;
  let prevDate: Date | null = null;

  for (const day of allDays) {
    if (day.totalMl >= goalMl) {
      const thisDate = new Date(day.date + 'T00:00:00');
      if (prevDate) {
        const diffDays = Math.round((thisDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          current++;
        } else {
          current = 1;
        }
      } else {
        current = 1;
      }
      prevDate = thisDate;
      if (current > longest) {
        longest = current;
      }
    } else {
      current = 0;
      prevDate = null;
    }
  }

  return longest;
}
