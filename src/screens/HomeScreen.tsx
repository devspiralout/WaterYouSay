import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  PanResponder,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../types';
import { useWater } from '../context/WaterContext';
import { useTheme } from '../context/ThemeContext';
import { ProgressRing, ProgressRingRef } from '../components/ProgressRing';
import { WaterBackground } from '../components/WaterBackground';
import { calculateProgress, getTodayDateString, isToday, isFutureDate, formatDateString } from '../utils/calculations';
import { mlToDisplay, getQuickAddAmounts } from '../utils/units';
import { mediumTap, lightTap } from '../utils/haptics';
import { loadSounds, playWaterSound, playRemoveSound, playClearAllSound } from '../utils/sounds';
import { ExpandableCalendar } from '../components/ExpandableCalendar';
// Trophy icon hidden for now
// import { TrophyIcon } from '../components/TrophyIcon';
import { WaterDropIcon } from '../components/WaterDropIcon';
import { GearIcon } from '../components/GearIcon';
import { CloseIcon } from '../components/CloseIcon';
import { WeatherAnimation } from '../components/WeatherAnimation';
import Svg, { Path } from 'react-native-svg';

const STRAVA_ORANGE = '#FC4C02';

function StravaLogo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path
        d="M41.03 47.852l-5.572-10.976h-8.172L41.03 64l13.736-27.124h-8.18l-5.556 10.976z"
        fill={STRAVA_ORANGE}
        opacity={0.6}
      />
      <Path
        d="M27.898 21.944l7.564 14.928h11.124L27.898 0 9.23 36.872h11.124l7.544-14.928z"
        fill={STRAVA_ORANGE}
      />
    </Svg>
  );
}

export function HomeScreen() {
  const { state, addWater, removeEntry, clearToday, climateAdjustment, stravaAdjustment } = useWater();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [addCardExpanded, setAddCardExpanded] = useState(false);
  const [weatherModalVisible, setWeatherModalVisible] = useState(false);
  const [stravaModalVisible, setStravaModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const progressRingRef = useRef<ProgressRingRef>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  // Animation for add card
  const addCardAnim = useRef(new Animated.Value(0)).current;

  const toggleAddCard = (expand: boolean) => {
    setAddCardExpanded(expand);
    Animated.timing(addCardAnim, {
      toValue: expand ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const { todayLog, settings, history } = state;
  const isViewingToday = isToday(selectedDate);
  const isViewingFuture = isFutureDate(selectedDate);

  // Calculate effective goal with climate adjustment (which now includes strava)
  const effectiveGoalMl = climateAdjustment
    ? climateAdjustment.adjustedGoalMl
    : settings.dailyGoalMl;

  // Calculate combined percentage for display (climate + strava, capped at 75%)
  const climatePercentage = climateAdjustment?.percentage ?? 0;
  const stravaPercentage = stravaAdjustment?.percentage ?? 0;
  const combinedPercentage = Math.min(75, climatePercentage + stravaPercentage);

  // Swipe gesture handler for changing days
  const panResponder = useMemo(() => {
    const SWIPE_THRESHOLD = 50;

    const changeDate = (days: number) => {
      const current = new Date(selectedDate + 'T12:00:00');
      current.setDate(current.getDate() + days);
      const newDateStr = formatDateString(current);

      // Don't allow swiping to future dates
      if (days > 0 && isFutureDate(newDateStr)) {
        return;
      }

      mediumTap();
      setSelectedDate(newDateStr);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right - go to previous day
          changeDate(-1);
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left - go to next day
          changeDate(1);
        }
      },
    });
  }, [selectedDate]);

  // Get data for the selected date
  const selectedDayData = useMemo(() => {
    if (isViewingToday) {
      return { totalMl: todayLog.totalMl, entries: todayLog.entries };
    }
    const historyEntry = history.find(h => h.date === selectedDate);
    return { totalMl: historyEntry?.totalMl || 0, entries: [] };
  }, [selectedDate, isViewingToday, todayLog, history]);

  const progress = calculateProgress(selectedDayData.totalMl, effectiveGoalMl);
  const quickAddAmounts = getQuickAddAmounts(settings.unitSystem, settings.quickAddAmounts);

  // Format selected date for header
  const headerTitle = useMemo(() => {
    if (isViewingToday) return 'Today';
    const date = new Date(selectedDate + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [selectedDate, isViewingToday]);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    modalContent: { backgroundColor: colors.surface },
  }), [colors]);

  // Load sounds on mount
  useEffect(() => {
    loadSounds();
  }, []);

  const handleQuickAdd = (amountMl: number) => {
    mediumTap();
    if (settings.soundEnabled) {
      playWaterSound();
    }
    addWater(amountMl);
  };

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      mediumTap();
      if (settings.soundEnabled) {
        playWaterSound();
      }
      addWater(amount);
      setCustomAmount('');
      toggleAddCard(false);
    }
  };

  const handleDeleteStart = () => {
    if (settings.soundEnabled) {
      playRemoveSound();
    }
  };

  // Helper functions for Strava modal
  const formatActivityDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const formatActivityDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    const km = meters / 1000;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <WaterBackground progress={progress} />

      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>{headerTitle}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
          <GearIcon size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Expandable Calendar */}
      <ExpandableCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        todayLog={todayLog}
        history={history}
        dailyGoalMl={effectiveGoalMl}
        onExpandedChange={setCalendarExpanded}
      />

      <View style={styles.mainContent} {...panResponder.panHandlers}>
        {/* Progress Ring - Centered */}
        <View style={styles.progressContainer}>
          <ProgressRing
            ref={progressRingRef}
            progress={progress}
            currentAmount={mlToDisplay(Math.min(selectedDayData.totalMl, effectiveGoalMl), settings.unitSystem)}
            goalAmount={mlToDisplay(effectiveGoalMl, settings.unitSystem)}
            baseGoalAmount={isViewingToday && combinedPercentage > 0 ? mlToDisplay(settings.dailyGoalMl, settings.unitSystem) : undefined}
            entries={isViewingToday ? todayLog.entries : []}
            goalMl={effectiveGoalMl}
            unitSystem={settings.unitSystem}
            onDeleteEntry={isViewingToday ? removeEntry : undefined}
            onDeleteStart={isViewingToday ? handleDeleteStart : undefined}
          />

          {/* Status Pills - Above action buttons */}
          {isViewingToday && !calendarExpanded && (climateAdjustment || (stravaAdjustment && stravaAdjustment.activitiesCount > 0)) && (
            <View style={styles.statusPillsRow}>
              {climateAdjustment && (
                <TouchableOpacity
                  style={[styles.statusPill, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    lightTap();
                    setWeatherModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <WeatherAnimation temperature={climateAdjustment.temperature} size={18} />
                  <Text style={[styles.statusPillText, { color: colors.text }]}>
                    {climateAdjustment.temperature}°
                  </Text>
                  {climatePercentage > 0 && (
                    <Text style={[styles.statusPillBadge, { color: colors.primary }]}>
                      +{climatePercentage}%
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              {stravaAdjustment && stravaAdjustment.activitiesCount > 0 && (
                <TouchableOpacity
                  style={[styles.statusPill, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    lightTap();
                    setStravaModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <StravaLogo size={16} />
                  <Text style={[styles.statusPillText, { color: colors.text }]}>
                    {stravaAdjustment.totalDurationMinutes}m
                  </Text>
                  {stravaAdjustment.percentage > 0 && (
                    <Text style={[styles.statusPillBadge, { color: STRAVA_ORANGE }]}>
                      +{stravaAdjustment.percentage}%
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Future day message */}
          {isViewingFuture && (
            <Text style={[styles.pastDayText, { color: colors.textTertiary, marginTop: 20 }]}>
              Future date
            </Text>
          )}
        </View>

        {/* Spacer for past/future days to match today's button area height */}
        {!isViewingToday && <View style={styles.bottomSpacer} />}
      </View>

      {/* Add Water Card - Inline with animation */}
      {isViewingToday && !calendarExpanded && addCardExpanded && (
        <Animated.View
          style={[
            styles.addCard,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
            },
            {
              opacity: addCardAnim,
              transform: [{
                translateY: addCardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.quickAddRow}>
            {quickAddAmounts.map(({ ml, display }) => (
              <TouchableOpacity
                key={ml}
                style={[
                  styles.quickAddOption,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                onPress={() => {
                  handleQuickAdd(ml);
                  toggleAddCard(false);
                }}
              >
                <Text style={[styles.quickAddOptionText, { color: colors.text }]}>{display}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customInputRow}>
            <TextInput
              style={[
                styles.inlineCustomInput,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: colors.text,
                },
              ]}
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="numeric"
              placeholder="Custom"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={[styles.customUnit, { color: colors.textTertiary }]}>
              {settings.unitSystem === 'metric' ? 'ml' : 'oz'}
            </Text>
            <TouchableOpacity
              style={[
                styles.inlineAddButton,
                { backgroundColor: customAmount ? colors.primary : colors.border }
              ]}
              onPress={handleCustomAdd}
              disabled={!customAmount}
            >
              <Text style={styles.inlineAddButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Bottom Action Buttons */}
      {isViewingToday && !calendarExpanded && (
        <View style={styles.bottomButtonRow}>
          {/* Add custom amount */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                opacity: progress >= 100 ? 0.4 : 1,
              }
            ]}
            onPress={() => {
              lightTap();
              toggleAddCard(!addCardExpanded);
            }}
            disabled={progress >= 100}
            activeOpacity={0.7}
          >
            <Animated.Text
              style={[
                styles.actionButtonText,
                { color: colors.text },
                {
                  transform: [{
                    rotate: addCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '45deg'],
                    }),
                  }],
                },
              ]}
            >
              +
            </Animated.Text>
          </TouchableOpacity>

          {/* Water drop - quick add */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonLarge,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                opacity: progress >= 100 ? 0.4 : 1,
              }
            ]}
            onPress={() => handleQuickAdd(quickAddAmounts[0]?.ml || 250)}
            disabled={progress >= 100}
            activeOpacity={0.7}
          >
            <WaterDropIcon size={36} color={colors.primary} />
          </TouchableOpacity>

          {/* Clear all */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                opacity: todayLog.entries.length === 0 ? 0.4 : 1,
              }
            ]}
            onPress={() => {
              lightTap();
              if (settings.soundEnabled) {
                playClearAllSound();
              }
              clearToday();
            }}
            disabled={todayLog.entries.length === 0}
            activeOpacity={0.7}
          >
            <CloseIcon size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Strava Details Modal */}
      <Modal
        visible={stravaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStravaModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setStravaModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.stravaModalContent, dynamicStyles.modalContent]}>
                {stravaAdjustment && stravaAdjustment.activitiesCount > 0 && (
                  <>
                    <View style={styles.stravaModalHeader}>
                      <StravaLogo size={48} />
                      <View style={styles.stravaModalHeaderText}>
                        <Text style={[styles.stravaModalTitle, { color: colors.text }]}>
                          Today's Activity
                        </Text>
                        <Text style={[styles.stravaModalSubtitle, { color: colors.textSecondary }]}>
                          {stravaAdjustment.activitiesCount} {stravaAdjustment.activitiesCount === 1 ? 'workout' : 'workouts'}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.stravaModalDivider, { backgroundColor: colors.border }]} />

                    {/* Activity List */}
                    <View style={styles.stravaModalSection}>
                      {stravaAdjustment.activities.map((activity) => (
                        <View key={activity.id} style={styles.stravaActivityRow}>
                          <Text style={[styles.stravaActivityName, { color: colors.text }]} numberOfLines={1}>
                            {activity.name}
                          </Text>
                          <Text style={[styles.stravaActivityDetails, { color: colors.textSecondary }]}>
                            {formatActivityDuration(activity.movingTimeSeconds)}
                            {activity.distanceMeters > 0 && ` \u2022 ${formatActivityDistance(activity.distanceMeters)}`}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.stravaModalDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.stravaModalSection}>
                      <Text style={[styles.stravaModalLabel, { color: colors.textSecondary }]}>
                        Hydration Impact
                      </Text>
                      {stravaAdjustment.percentage > 0 ? (
                        <Text style={[styles.stravaModalValue, { color: STRAVA_ORANGE }]}>
                          +{stravaAdjustment.percentage}% increase recommended
                        </Text>
                      ) : (
                        <Text style={[styles.stravaModalValue, { color: colors.success }]}>
                          No adjustment needed
                        </Text>
                      )}
                      <Text style={[styles.stravaModalReason, { color: colors.textSecondary }]}>
                        Based on {stravaAdjustment.totalDurationMinutes} min of activity
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.stravaModalClose, { backgroundColor: STRAVA_ORANGE }]}
                      onPress={() => setStravaModalVisible(false)}
                    >
                      <Text style={styles.stravaModalCloseText}>Got it</Text>
                    </TouchableOpacity>

                    <View style={styles.poweredByStrava}>
                      <StravaLogo size={14} />
                      <Text style={[styles.poweredByStravaText, { color: colors.textTertiary }]}>
                        Powered by Strava
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Weather Details Modal */}
      <Modal
        visible={weatherModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeatherModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setWeatherModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.weatherModalContent, dynamicStyles.modalContent]}>
                {climateAdjustment && (
                  <>
                    <View style={styles.weatherModalHeader}>
                      <WeatherAnimation temperature={climateAdjustment.temperature} size={56} />
                      <View style={styles.weatherModalHeaderText}>
                        <Text style={[styles.weatherModalTemp, { color: colors.text }]}>
                          {climateAdjustment.temperature}°C
                        </Text>
                        <Text style={[styles.weatherModalLocation, { color: colors.textSecondary }]}>
                          {climateAdjustment.locationName}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.weatherModalDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.weatherModalSection}>
                      <Text style={[styles.weatherModalLabel, { color: colors.textSecondary }]}>
                        Today's Range
                      </Text>
                      <Text style={[styles.weatherModalValue, { color: colors.text }]}>
                        {climateAdjustment.temperatureLow}° — {climateAdjustment.temperatureHigh}°
                      </Text>
                    </View>

                    <View style={[styles.weatherModalDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.weatherModalSection}>
                      <Text style={[styles.weatherModalLabel, { color: colors.textSecondary }]}>
                        Weather Impact
                      </Text>
                      {climatePercentage > 0 ? (
                        <Text style={[styles.weatherModalValue, { color: colors.primary }]}>
                          +{climatePercentage}%
                          {climateAdjustment.reason ? ` (${climateAdjustment.reason.toLowerCase()})` : ''}
                        </Text>
                      ) : (
                        <Text style={[styles.weatherModalValue, { color: colors.success }]}>
                          No adjustment needed
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.weatherModalClose, { backgroundColor: colors.primary }]}
                      onPress={() => setWeatherModalVisible(false)}
                    >
                      <Text style={styles.weatherModalCloseText}>Got it</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  statusPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  statusPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusPillBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  greeting: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  iconButton: {
    padding: 8,
  },
  bottomSpacer: {
    height: 160,
  },
  pastDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 24,
  },
  addCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineCustomInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 17,
    fontWeight: '500',
  },
  inlineAddButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  inlineAddButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  actionButtonMain: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  actionButtonLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  actionButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  quickAddOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  quickAddOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  orDivider: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  customInput: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    width: 140,
  },
  customUnit: {
    fontSize: 18,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalAddButtonDisabled: {
    // Handled by dynamic styles
  },
  modalAddText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weatherModalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  weatherModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  weatherModalHeaderText: {
    flex: 1,
  },
  weatherModalTemp: {
    fontSize: 32,
    fontWeight: '600',
  },
  weatherModalLocation: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  weatherModalDivider: {
    height: 1,
    marginVertical: 16,
  },
  weatherModalSection: {
    gap: 4,
  },
  weatherModalLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weatherModalValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  weatherModalReason: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
  },
  weatherModalGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherModalGoalBase: {
    fontSize: 17,
    fontWeight: '500',
  },
  weatherModalGoalArrow: {
    fontSize: 16,
  },
  weatherModalGoalAdjusted: {
    fontSize: 20,
    fontWeight: '700',
  },
  weatherModalClose: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  weatherModalCloseText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Strava Modal Styles
  stravaModalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  stravaModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  stravaModalHeaderText: {
    flex: 1,
  },
  stravaModalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  stravaModalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  stravaModalDivider: {
    height: 1,
    marginVertical: 16,
  },
  stravaModalSection: {
    gap: 8,
  },
  stravaActivityRow: {
    paddingVertical: 8,
  },
  stravaActivityName: {
    fontSize: 16,
    fontWeight: '500',
  },
  stravaActivityDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  stravaModalLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stravaModalValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  stravaModalReason: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
  },
  stravaModalClose: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  stravaModalCloseText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  poweredByStrava: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  poweredByStravaText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
