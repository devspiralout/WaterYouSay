import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getWeekDates, formatDateString, isToday, isFutureDate } from '../utils/calculations';
import { DailyLog, HistoryEntry } from '../types';

interface WeekCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  todayLog: DailyLog;
  history: HistoryEntry[];
  dailyGoalMl: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekCalendar({
  selectedDate,
  onSelectDate,
  todayLog,
  history,
  dailyGoalMl,
}: WeekCalendarProps) {
  const { colors } = useTheme();

  // Get week dates based on selected date (so calendar follows when swiping to different weeks)
  const weekDates = useMemo(() => {
    const selectedDateObj = new Date(selectedDate + 'T12:00:00');
    return getWeekDates(selectedDateObj);
  }, [selectedDate]);

  const getDayData = (dateStr: string): { totalMl: number; progress: number } => {
    if (isToday(dateStr)) {
      return {
        totalMl: todayLog.totalMl,
        progress: dailyGoalMl > 0 ? Math.min(todayLog.totalMl / dailyGoalMl, 1) : 0,
      };
    }

    const historyEntry = history.find(h => h.date === dateStr);
    if (historyEntry) {
      return {
        totalMl: historyEntry.totalMl,
        progress: dailyGoalMl > 0 ? Math.min(historyEntry.totalMl / dailyGoalMl, 1) : 0,
      };
    }

    return { totalMl: 0, progress: 0 };
  };

  return (
    <View style={styles.container}>
      {weekDates.map((date, index) => {
        const dateStr = formatDateString(date);
        const isTodayDate = isToday(dateStr);
        const isFuture = isFutureDate(dateStr);
        const isSelected = selectedDate === dateStr;
        const { progress } = getDayData(dateStr);
        const metGoal = progress >= 1;

        return (
          <TouchableOpacity
            key={dateStr}
            style={styles.dayContainer}
            onPress={() => !isFuture && onSelectDate(dateStr)}
            disabled={isFuture}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dayLabel,
                { color: colors.textSecondary },
                isTodayDate && { color: colors.primary, fontWeight: '600' },
                isFuture && { color: colors.textTertiary },
              ]}
            >
              {DAY_LABELS[index]}
            </Text>
            <View
              style={[
                styles.dayCircle,
                { backgroundColor: colors.surface },
                isTodayDate && { borderColor: colors.primary, borderWidth: 2 },
                isSelected && { backgroundColor: colors.primary },
                isFuture && { opacity: 0.4 },
              ]}
            >
              <Text
                style={[
                  styles.dayNumber,
                  { color: colors.text },
                  isSelected && { color: '#FFFFFF' },
                  isFuture && { color: colors.textTertiary },
                ]}
              >
                {date.getDate()}
              </Text>
            </View>
            <View
              style={[
                styles.progressDot,
                {
                  backgroundColor: progress > 0
                    ? (metGoal ? colors.success : colors.primary)
                    : colors.textTertiary,
                  opacity: isFuture ? 0 : (progress > 0 ? (metGoal ? 1 : 0.6) : 0.8),
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 1.5,
    marginTop: 5,
  },
});
