import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useWater } from '../context/WaterContext';
import { useTheme } from '../context/ThemeContext';
import { WaterDropIcon } from '../components/WaterDropIcon';
import { GearIcon } from '../components/GearIcon';
import { ACHIEVEMENTS } from '../constants';
import { calculateStreak, getTodayDateString } from '../utils/calculations';
import { Achievement, AchievementId } from '../types';

export function AchievementsScreen() {
  const { state } = useWater();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { history, settings, todayLog, unlockedAchievements } = state;

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    streakCard: { backgroundColor: colors.surface },
    streakValue: { color: colors.primary },
    streakLabel: { color: colors.textSecondary },
    divider: { backgroundColor: colors.border },
    sectionTitle: { color: colors.textSecondary },
    achievementCard: { backgroundColor: colors.surface },
    achievementCardLocked: { backgroundColor: colors.surface, opacity: 0.5 },
    achievementTitle: { color: colors.text },
    achievementDescription: { color: colors.textSecondary },
    achievementDate: { color: colors.textTertiary },
    lockedText: { color: colors.textTertiary },
    progressText: { color: colors.textSecondary },
    categoryTitle: { color: colors.text },
  }), [colors]);

  // Calculate current streak
  const currentStreak = useMemo(() =>
    calculateStreak(history, settings.dailyGoalMl, todayLog.totalMl),
    [history, settings.dailyGoalMl, todayLog.totalMl]
  );

  // Calculate longest streak
  const longestStreak = useMemo(() => {
    const todayDateStr = getTodayDateString();
    const allDays = [
      { date: todayDateStr, totalMl: todayLog.totalMl },
      ...history,
    ].sort((a, b) => a.date.localeCompare(b.date));

    let longest = 0;
    let current = 0;
    let prevDate: Date | null = null;

    for (const day of allDays) {
      if (day.totalMl >= settings.dailyGoalMl) {
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
  }, [history, todayLog, settings.dailyGoalMl]);

  // Check if achievement is unlocked
  const isUnlocked = (id: AchievementId): boolean => {
    return unlockedAchievements.some(a => a.id === id);
  };

  // Get unlock date for achievement
  const getUnlockDate = (id: AchievementId): string | null => {
    const achievement = unlockedAchievements.find(a => a.id === id);
    if (!achievement) return null;
    const date = new Date(achievement.unlockedAt);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group achievements by category
  const achievementsByCategory = useMemo(() => {
    const grouped: Record<string, Achievement[]> = {
      milestone: [],
      streak: [],
      volume: [],
    };
    ACHIEVEMENTS.forEach(a => {
      grouped[a.category].push(a);
    });
    return grouped;
  }, []);

  // Count unlocked achievements
  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  const renderAchievement = (achievement: Achievement) => {
    const unlocked = isUnlocked(achievement.id);
    const unlockDate = getUnlockDate(achievement.id);

    return (
      <View
        key={achievement.id}
        style={[
          styles.achievementCard,
          unlocked ? dynamicStyles.achievementCard : dynamicStyles.achievementCardLocked,
        ]}
      >
        <Text style={styles.achievementIcon}>{unlocked ? achievement.icon : '🔒'}</Text>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, dynamicStyles.achievementTitle]}>
            {achievement.title}
          </Text>
          <Text style={[styles.achievementDescription, dynamicStyles.achievementDescription]}>
            {achievement.description}
          </Text>
          {unlocked && unlockDate && (
            <Text style={[styles.achievementDate, dynamicStyles.achievementDate]}>
              Unlocked {unlockDate}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const getCategoryTitle = (category: string): string => {
    switch (category) {
      case 'milestone': return 'Milestones';
      case 'streak': return 'Streaks';
      case 'volume': return 'Volume';
      default: return category;
    }
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, dynamicStyles.title]}>Achievements</Text>
          <Text style={[styles.progressText, dynamicStyles.progressText]}>
            {unlockedCount}/{totalCount} unlocked
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Today')} style={styles.iconButton}>
            <WaterDropIcon size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
            <GearIcon size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Stats Card */}
        <View style={[styles.streakCard, dynamicStyles.streakCard]}>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={[styles.streakValue, dynamicStyles.streakValue]}>
                {currentStreak}
              </Text>
              <Text style={[styles.streakLabel, dynamicStyles.streakLabel]}>Current Streak</Text>
            </View>

            <View style={[styles.streakDivider, dynamicStyles.divider]} />

            <View style={styles.streakItem}>
              <Text style={[styles.streakValue, dynamicStyles.streakValue]}>
                {longestStreak}
              </Text>
              <Text style={[styles.streakLabel, dynamicStyles.streakLabel]}>Longest Streak</Text>
            </View>
          </View>
        </View>

        {/* Achievements by Category */}
        {(['milestone', 'streak', 'volume'] as const).map(category => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, dynamicStyles.categoryTitle]}>
              {getCategoryTitle(category)}
            </Text>
            {achievementsByCategory[category].map(renderAchievement)}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  streakCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  streakDivider: {
    width: 1,
    height: 60,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
  },
  achievementDate: {
    fontSize: 12,
    marginTop: 4,
  },
});
