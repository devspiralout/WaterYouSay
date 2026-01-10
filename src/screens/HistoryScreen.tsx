import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWater } from '../context/WaterContext';
import { useTheme } from '../context/ThemeContext';
import { mlToDisplay } from '../utils/units';
import { calculateProgress, getTodayDateString } from '../utils/calculations';

interface PeriodStats {
  totalMl: number;
  averageMl: number;
  daysTracked: number;
  bestDay: number;
}

type StatsTab = 'last7' | 'allTime';

export function HistoryScreen() {
  const { state } = useWater();
  const { colors } = useTheme();
  const { history, settings, todayLog } = state;
  const [activeTab, setActiveTab] = useState<StatsTab>('last7');

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
    weeklyCard: { backgroundColor: colors.surface },
    weeklyTitle: { color: colors.text },
    weeklySubtitle: { color: colors.textSecondary },
    statValue: { color: colors.text },
    statLabel: { color: colors.textSecondary },
    statHighlight: { color: colors.primary },
    statSuccess: { color: colors.success },
    divider: { backgroundColor: colors.border },
    tabContainer: { backgroundColor: colors.background },
    tabButton: { backgroundColor: colors.surface },
    tabButtonActive: { backgroundColor: colors.primary },
    tabText: { color: colors.textSecondary },
    tabTextActive: { color: '#FFFFFF' },
    sectionLabel: { color: colors.textSecondary },
  }), [colors]);

  // Calculate last 7 days stats
  const last7DaysStats = useMemo((): PeriodStats => {
    const today = new Date();
    const last7Dates: string[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Dates.push(date.toISOString().split('T')[0]);
    }

    const todayDateStr = getTodayDateString();
    let totalMl = 0;
    let daysTracked = 0;
    let bestDay = 0;

    last7Dates.forEach(dateStr => {
      let dayTotal = 0;

      if (dateStr === todayDateStr) {
        dayTotal = todayLog.totalMl;
      } else {
        const historyEntry = history.find(h => h.date === dateStr);
        if (historyEntry) {
          dayTotal = historyEntry.totalMl;
        }
      }

      if (dayTotal > 0) {
        totalMl += dayTotal;
        daysTracked++;
        if (dayTotal > bestDay) {
          bestDay = dayTotal;
        }
      }
    });

    const averageMl = daysTracked > 0 ? Math.round(totalMl / daysTracked) : 0;

    return { totalMl, averageMl, daysTracked, bestDay };
  }, [history, todayLog]);

  // Calculate all-time stats
  const allTimeStats = useMemo((): PeriodStats => {
    const todayDateStr = getTodayDateString();
    let totalMl = todayLog.totalMl > 0 ? todayLog.totalMl : 0;
    let daysTracked = todayLog.totalMl > 0 ? 1 : 0;
    let bestDay = todayLog.totalMl;

    history.forEach(entry => {
      if (entry.totalMl > 0) {
        totalMl += entry.totalMl;
        daysTracked++;
        if (entry.totalMl > bestDay) {
          bestDay = entry.totalMl;
        }
      }
    });

    const averageMl = daysTracked > 0 ? Math.round(totalMl / daysTracked) : 0;

    return { totalMl, averageMl, daysTracked, bestDay };
  }, [history, todayLog]);

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

  const activeStats = activeTab === 'last7' ? last7DaysStats : allTimeStats;
  const hasStats = activeStats.daysTracked > 0;

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.title]}>History</Text>
      </View>

      {/* Sticky Stats Section */}
      {(last7DaysStats.daysTracked > 0 || allTimeStats.daysTracked > 0) && (
        <View style={[styles.stickyStats, dynamicStyles.tabContainer]}>
          {/* Tab Buttons */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                dynamicStyles.tabButton,
                activeTab === 'last7' && dynamicStyles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('last7')}
            >
              <Text style={[
                styles.tabText,
                dynamicStyles.tabText,
                activeTab === 'last7' && dynamicStyles.tabTextActive,
              ]}>
                Last 7 Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                dynamicStyles.tabButton,
                activeTab === 'allTime' && dynamicStyles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('allTime')}
            >
              <Text style={[
                styles.tabText,
                dynamicStyles.tabText,
                activeTab === 'allTime' && dynamicStyles.tabTextActive,
              ]}>
                All Time
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Card */}
          {hasStats && (
            <View style={[styles.statsCard, dynamicStyles.weeklyCard]}>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, dynamicStyles.statHighlight]}>
                    {mlToDisplay(activeStats.averageMl, settings.unitSystem)}
                  </Text>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Daily Avg</Text>
                </View>

                <View style={[styles.statDivider, dynamicStyles.divider]} />

                <View style={styles.statItem}>
                  <Text style={[styles.statValue, dynamicStyles.statSuccess]}>
                    {mlToDisplay(activeStats.bestDay, settings.unitSystem)}
                  </Text>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Best Day</Text>
                </View>

                <View style={[styles.statDivider, dynamicStyles.divider]} />

                <View style={styles.statItem}>
                  <Text style={[styles.statValue, dynamicStyles.statValue]}>
                    {mlToDisplay(activeStats.totalMl, settings.unitSystem)}
                  </Text>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total</Text>
                </View>
              </View>

            </View>
          )}
        </View>
      )}

      <FlatList
        data={allLogs}
        keyExtractor={item => item.date}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>DAILY LOG</Text>
        }
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
  stickyStats: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
  },
  daysTrackedText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
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
