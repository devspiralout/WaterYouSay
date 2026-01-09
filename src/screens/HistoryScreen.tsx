import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWater } from '../context/WaterContext';
import { COLORS } from '../constants';
import { mlToDisplay } from '../utils/units';
import { calculateProgress } from '../utils/calculations';

export function HistoryScreen() {
  const { state } = useWater();
  const { history, settings, todayLog } = state;

  // Combine today with history for display
  const allLogs = [
    { ...todayLog, isToday: true },
    ...history.map(log => ({ ...log, isToday: false })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const formatDate = (dateString: string, isToday: boolean): string => {
    if (isToday) return 'Today';

    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return COLORS.success;
    if (progress >= 75) return COLORS.primary;
    if (progress >= 50) return COLORS.warning;
    return COLORS.error;
  };

  if (allLogs.length === 0 || (allLogs.length === 1 && todayLog.entries.length === 0)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>History</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No history yet</Text>
          <Text style={styles.emptySubtext}>Start tracking your water intake!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>History</Text>

      <FlatList
        data={allLogs}
        keyExtractor={item => item.date}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const progress = calculateProgress(item.totalMl, settings.dailyGoalMl);
          const progressColor = getProgressColor(progress);
          const metGoal = item.totalMl >= settings.dailyGoalMl;

          return (
            <View style={styles.historyItem}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  {formatDate(item.date, 'isToday' in item && item.isToday)}
                </Text>
                {metGoal && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <View style={styles.statsContainer}>
                <Text style={styles.amountText}>
                  {mlToDisplay(item.totalMl, settings.unitSystem)}
                </Text>
                <Text style={styles.goalText}>
                  / {mlToDisplay(settings.dailyGoalMl, settings.unitSystem)}
                </Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor },
                  ]}
                />
              </View>

              <Text style={[styles.progressText, { color: progressColor }]}>
                {Math.round(progress)}%
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: 20,
    paddingBottom: 10,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  historyItem: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  checkmark: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  goalText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});
