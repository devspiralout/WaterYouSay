import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWater } from '../context/WaterContext';
import { useTheme } from '../context/ThemeContext';
import { mlToDisplay } from '../utils/units';
import { calculateProgress } from '../utils/calculations';

export function HistoryScreen() {
  const { state } = useWater();
  const { colors } = useTheme();
  const { history, settings, todayLog } = state;

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    dateText: { color: colors.textSecondary },
    goalBadge: { backgroundColor: colors.success + '18' },
    goalBadgeText: { color: colors.success },
    amountText: { color: colors.text },
    percentText: { color: colors.textSecondary },
    progressBarContainer: { backgroundColor: colors.border },
    progressBar: { backgroundColor: colors.primary },
    progressBarSuccess: { backgroundColor: colors.success },
    historyItem: { borderBottomColor: colors.border },
    emptyText: { color: colors.textSecondary },
    emptySubtext: { color: colors.textTertiary },
  }), [colors]);

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
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  if (allLogs.length === 0 || (allLogs.length === 1 && todayLog.entries.length === 0)) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, dynamicStyles.title]}>History</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No history yet</Text>
          <Text style={[styles.emptySubtext, dynamicStyles.emptySubtext]}>Start tracking your water intake</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.title]}>History</Text>
      </View>

      <FlatList
        data={allLogs}
        keyExtractor={item => item.date}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const progress = calculateProgress(item.totalMl, settings.dailyGoalMl);
          const metGoal = item.totalMl >= settings.dailyGoalMl;

          return (
            <View style={[styles.historyItem, dynamicStyles.historyItem]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.dateText, dynamicStyles.dateText]}>
                  {formatDate(item.date, 'isToday' in item && item.isToday)}
                </Text>
                {metGoal && (
                  <View style={[styles.goalBadge, dynamicStyles.goalBadge]}>
                    <Text style={[styles.goalBadgeText, dynamicStyles.goalBadgeText]}>Goal met</Text>
                  </View>
                )}
              </View>

              <View style={styles.statsRow}>
                <Text style={[styles.amountText, dynamicStyles.amountText]}>
                  {mlToDisplay(item.totalMl, settings.unitSystem)}
                </Text>
                <Text style={[styles.percentText, dynamicStyles.percentText]}>{Math.round(progress)}%</Text>
              </View>

              <View style={[styles.progressBarContainer, dynamicStyles.progressBarContainer]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: metGoal ? colors.success : colors.primary,
                    },
                  ]}
                />
              </View>
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
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  historyItem: {
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
  },
  goalBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  percentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
  },
});
