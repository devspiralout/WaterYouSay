import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getWeekDates, formatDateString, isToday, isFutureDate } from '../utils/calculations';
import { DailyLog, HistoryEntry } from '../types';
import { lightTap } from '../utils/haptics';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  todayLog: DailyLog;
  history: HistoryEntry[];
  dailyGoalMl: number;
  onExpandedChange?: (expanded: boolean) => void;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ExpandableCalendar({
  selectedDate,
  onSelectDate,
  todayLog,
  history,
  dailyGoalMl,
  onExpandedChange,
}: ExpandableCalendarProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get all weeks for the month of the selected date
  const monthWeeks = useMemo(() => {
    const selectedDateObj = new Date(selectedDate + 'T12:00:00');
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);

    const weeks: Date[][] = [];

    // Start from the Monday of the week containing the 1st
    let currentDate = new Date(firstDay);
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + mondayOffset);

    // Generate weeks until we've passed the last day of the month
    while (currentDate <= lastDay || weeks.length === 0) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);

      // Stop if we've gone past the month
      if (currentDate.getMonth() !== month && currentDate > lastDay) {
        break;
      }
    }

    return weeks;
  }, [selectedDate]);

  // Get current week dates for collapsed view
  const currentWeekDates = useMemo(() => {
    const selectedDateObj = new Date(selectedDate + 'T12:00:00');
    return getWeekDates(selectedDateObj);
  }, [selectedDate]);

  // Get month/year label
  const monthLabel = useMemo(() => {
    const date = new Date(selectedDate + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  // Navigate to previous/next month
  const changeMonth = (direction: -1 | 1) => {
    lightTap();
    const current = new Date(selectedDate + 'T12:00:00');
    current.setMonth(current.getMonth() + direction);
    // Set to first day of the month
    current.setDate(1);

    // Don't allow navigating to future months
    const today = new Date();
    if (direction === 1 && current > today) {
      return;
    }

    onSelectDate(formatDateString(current));
  };

  const canGoNext = useMemo(() => {
    const current = new Date(selectedDate + 'T12:00:00');
    const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    const today = new Date();
    return nextMonth <= today;
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

  const toggleExpanded = () => {
    lightTap();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  const handleDateSelect = (dateStr: string) => {
    onSelectDate(dateStr);
    if (isExpanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(false);
      onExpandedChange?.(false);
    }
  };

  const renderDay = (date: Date, showLabel: boolean = false, index: number = 0) => {
    const dateStr = formatDateString(date);
    const isTodayDate = isToday(dateStr);
    const isFuture = isFutureDate(dateStr);
    const isSelected = selectedDate === dateStr;
    const { progress } = getDayData(dateStr);
    const metGoal = progress >= 1;

    // Check if date is in current month
    const selectedMonth = new Date(selectedDate + 'T12:00:00').getMonth();
    const dateMonth = date.getMonth();
    const isCurrentMonth = dateMonth === selectedMonth;

    return (
      <TouchableOpacity
        key={dateStr}
        style={styles.dayContainer}
        onPress={() => !isFuture && handleDateSelect(dateStr)}
        disabled={isFuture}
        activeOpacity={0.7}
      >
        {showLabel && (
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
        )}
        <View
          style={[
            styles.dayCircle,
            { backgroundColor: colors.surface },
            !isCurrentMonth && { opacity: 0.3 },
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
              opacity: isFuture || !isCurrentMonth ? 0 : (progress > 0 ? (metGoal ? 1 : 0.6) : 0.8),
            },
          ]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Month label with navigation when expanded */}
      {isExpanded && (
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            style={styles.monthArrow}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.monthArrowText, { color: colors.primary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={!canGoNext}
          >
            <Text style={[styles.monthArrowText, { color: canGoNext ? colors.primary : colors.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Calendar content */}
      <View style={styles.container}>
        {isExpanded ? (
          // Expanded: show all weeks
          <View style={styles.monthContainer}>
            {/* Day labels header */}
            <View style={styles.weekRow}>
              {DAY_LABELS.map((label, index) => (
                <View key={label} style={styles.dayContainer}>
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
            {/* Week rows */}
            {monthWeeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((date, dayIndex) => renderDay(date, false, dayIndex))}
              </View>
            ))}
          </View>
        ) : (
          // Collapsed: show current week
          <View style={styles.weekRow}>
            {currentWeekDates.map((date, index) => renderDay(date, true, index))}
          </View>
        )}
      </View>

      {/* Pull handle */}
      <TouchableOpacity
        style={styles.handleContainer}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  monthContainer: {
    gap: 8,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 15,
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
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  monthArrow: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  monthArrowDisabled: {
    opacity: 0.3,
  },
  monthArrowText: {
    fontSize: 28,
    fontWeight: '300',
  },
});
