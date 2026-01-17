import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { StravaAdjustmentInfo, StravaActivitySummary } from '../types';
import { useTheme } from '../context/ThemeContext';

interface StravaWidgetProps {
  adjustment: StravaAdjustmentInfo;
  onPress: () => void;
}

const STRAVA_ORANGE = '#FC4C02';

function StravaLogo({ size = 24 }: { size?: number }) {
  // Official Strava logo - two chevrons
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Back chevron (lighter) */}
      <Path
        d="M41.03 47.852l-5.572-10.976h-8.172L41.03 64l13.736-27.124h-8.18l-5.556 10.976z"
        fill={STRAVA_ORANGE}
        opacity={0.6}
      />
      {/* Front chevron */}
      <Path
        d="M27.898 21.944l7.564 14.928h11.124L27.898 0 9.23 36.872h11.124l7.544-14.928z"
        fill={STRAVA_ORANGE}
      />
    </Svg>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  const km = meters / 1000;
  return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

function getMainActivity(activities: StravaActivitySummary[]): StravaActivitySummary | null {
  if (activities.length === 0) return null;
  // Return the activity with the longest duration
  return activities.reduce((longest, current) =>
    current.movingTimeSeconds > longest.movingTimeSeconds ? current : longest
  );
}

export function StravaWidget({ adjustment, onPress }: StravaWidgetProps) {
  const { colors } = useTheme();

  if (adjustment.activitiesCount === 0) {
    return null;
  }

  const mainActivity = getMainActivity(adjustment.activities);
  const hasMultiple = adjustment.activitiesCount > 1;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <StravaLogo size={36} />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {hasMultiple
              ? `${adjustment.activitiesCount} Activities`
              : mainActivity?.name || 'Workout'}
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {formatDuration(adjustment.totalDurationMinutes * 60)}
          {adjustment.totalDistanceMeters > 0 && ` \u2022 ${formatDistance(adjustment.totalDistanceMeters)}`}
        </Text>
      </View>

      {adjustment.percentage > 0 && (
        <View style={[styles.badge, { backgroundColor: STRAVA_ORANGE + '20' }]}>
          <Text style={[styles.badgeText, { color: STRAVA_ORANGE }]}>
            +{adjustment.percentage}%
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
