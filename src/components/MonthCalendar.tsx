import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatDateString, isToday, isFutureDate } from '../utils/calculations';
import { DailyLog, HistoryEntry } from '../types';

interface MonthCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  todayLog: DailyLog;
  history: HistoryEntry[];
  dailyGoalMl: number;
  onClose: () => void;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthCalendar({
  selectedDate,
  onSelectDate,
  todayLog,
  history,
  dailyGoalMl,
  onClose,
}: MonthCalendarProps) {
  const { colors } = useTheme();
  const today = new Date();
  const [viewingMonth, setViewingMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthData = useMemo(() => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    // Get day of week (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6; // Sunday becomes 6

    // Get number of days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build calendar grid
    const days: (Date | null)[] = [];

    // Add empty slots for days before first of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [viewingMonth]);

  const monthLabel = viewingMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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

  const goToPrevMonth = () => {
    setViewingMonth(new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() + 1, 1);
    // Don't go beyond current month
    if (nextMonth <= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setViewingMonth(nextMonth);
    }
  };

  const canGoNext = viewingMonth < new Date(today.getFullYear(), today.getMonth(), 1);

  const handleSelectDate = (date: Date) => {
    const dateStr = formatDateString(date);
    if (!isFutureDate(dateStr)) {
      onSelectDate(dateStr);
      onClose();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <Text style={[styles.navText, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={styles.navButton}
          disabled={!canGoNext}
        >
          <Text style={[styles.navText, { color: canGoNext ? colors.primary : colors.textTertiary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map(label => (
          <View key={label} style={styles.dayLabelCell}>
            <Text style={[styles.dayLabelText, { color: colors.textSecondary }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {monthData.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const dateStr = formatDateString(date);
          const isTodayDate = isToday(dateStr);
          const isFuture = isFutureDate(dateStr);
          const isSelected = selectedDate === dateStr;
          const { progress } = getDayData(dateStr);
          const metGoal = progress >= 1;
          const hasData = progress > 0;

          return (
            <TouchableOpacity
              key={dateStr}
              style={styles.dayCell}
              onPress={() => handleSelectDate(date)}
              disabled={isFuture}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dayCircle,
                  { backgroundColor: colors.background },
                  isTodayDate && { borderColor: colors.primary, borderWidth: 2 },
                  isSelected && { backgroundColor: colors.primary },
                  isFuture && { opacity: 0.3 },
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
                {!isFuture && hasData && !isSelected && (
                  <View
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor: metGoal ? colors.success : colors.primary,
                        opacity: metGoal ? 1 : 0.6,
                      },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Today button */}
      <TouchableOpacity
        style={[styles.todayButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          onSelectDate(formatDateString(today));
          onClose();
        }}
      >
        <Text style={styles.todayButtonText}>Go to Today</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    width: 44,
    alignItems: 'center',
  },
  navText: {
    fontSize: 28,
    fontWeight: '300',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressDot: {
    position: 'absolute',
    bottom: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  todayButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
