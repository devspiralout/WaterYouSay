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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../types';
import { useWater } from '../context/WaterContext';
import { useTheme } from '../context/ThemeContext';
import { ProgressRing, ProgressRingRef } from '../components/ProgressRing';
import { WaterButton, CustomAmountButton } from '../components/WaterButton';
import { WaterBackground } from '../components/WaterBackground';
import { calculateProgress, getTodayDateString, isToday, isFutureDate, formatDateString } from '../utils/calculations';
import { mlToDisplay, getQuickAddAmounts } from '../utils/units';
import { mediumTap, lightTap } from '../utils/haptics';
import { loadSounds, playWaterSound } from '../utils/sounds';
import { ExpandableCalendar } from '../components/ExpandableCalendar';
import { TrophyIcon } from '../components/TrophyIcon';
import { WaterDropIcon } from '../components/WaterDropIcon';
import { GearIcon } from '../components/GearIcon';
import { WeatherAnimation } from '../components/WeatherAnimation';

export function HomeScreen() {
  const { state, addWater, removeEntry, climateAdjustment, isAtDailyLimit } = useWater();
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [weatherModalVisible, setWeatherModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const progressRingRef = useRef<ProgressRingRef>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const { todayLog, settings, history } = state;
  const isViewingToday = isToday(selectedDate);
  const isViewingFuture = isFutureDate(selectedDate);

  // Calculate effective goal with climate adjustment
  const effectiveGoalMl = climateAdjustment
    ? climateAdjustment.adjustedGoalMl
    : settings.dailyGoalMl;

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
    greeting: { color: colors.text },
    modalContent: { backgroundColor: colors.surface },
    modalTitle: { color: colors.text },
    customInput: { backgroundColor: colors.background, color: colors.text },
    customUnit: { color: colors.textTertiary },
    modalCancelButton: { backgroundColor: colors.background },
    modalCancelText: { color: colors.textSecondary },
    modalAddButton: { backgroundColor: colors.primary },
    modalAddButtonDisabled: { backgroundColor: colors.border },
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
      setCustomModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <WaterBackground progress={progress} />

      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, dynamicStyles.greeting]}>{headerTitle}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => setSelectedDate(getTodayDateString())} style={styles.iconButton}>
            <WaterDropIcon size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Awards')} style={styles.iconButton}>
            <TrophyIcon size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
            <GearIcon size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
            currentAmount={mlToDisplay(selectedDayData.totalMl, settings.unitSystem)}
            goalAmount={mlToDisplay(effectiveGoalMl, settings.unitSystem)}
            entries={isViewingToday ? todayLog.entries : []}
            goalMl={effectiveGoalMl}
            unitSystem={settings.unitSystem}
            onDeleteEntry={isViewingToday ? removeEntry : undefined}
          />

          {/* Past day message - sits under the ring */}
          {!isViewingToday && !isViewingFuture && selectedDayData.totalMl > 0 && (
            <Text style={[styles.pastDayText, { color: colors.textSecondary, marginTop: 20 }]}>
              You drank {mlToDisplay(selectedDayData.totalMl, settings.unitSystem)} this day
            </Text>
          )}

          {/* Future day message */}
          {isViewingFuture && (
            <Text style={[styles.pastDayText, { color: colors.textTertiary, marginTop: 20 }]}>
              Future date
            </Text>
          )}
        </View>

        {/* Weather Widget & Quick Add Buttons - Bottom (only on today) */}
        {isViewingToday && (
          <TouchableWithoutFeedback onPress={() => progressRingRef.current?.clearSelection()}>
            <View style={[styles.quickAddContainer, { opacity: !calendarExpanded ? 1 : 0 }]} pointerEvents={!calendarExpanded ? 'auto' : 'none'}>
            {/* Weather Widget */}
            {climateAdjustment && (
              <TouchableOpacity
                style={[styles.weatherWidget, { backgroundColor: colors.surface }]}
                onPress={() => {
                  lightTap();
                  setWeatherModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <WeatherAnimation temperature={climateAdjustment.temperature} size={36} />
                <View style={styles.weatherContent}>
                  <View style={styles.weatherTempRow}>
                    <Text style={[styles.weatherTemp, { color: colors.text }]}>
                      {climateAdjustment.temperature}°
                    </Text>
                    <Text style={[styles.weatherHighLow, { color: colors.textSecondary }]}>
                      H:{climateAdjustment.temperatureHigh}° L:{climateAdjustment.temperatureLow}°
                    </Text>
                  </View>
                  <Text style={[styles.weatherLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                    {climateAdjustment.locationName}
                  </Text>
                </View>
                {climateAdjustment.percentage > 0 && (
                  <View style={[styles.weatherBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.weatherBadgeText, { color: colors.primary }]}>
                      +{climateAdjustment.percentage}%
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {isAtDailyLimit ? (
              <View style={styles.limitReachedContainer}>
                <Text style={[styles.limitReachedText, { color: colors.textSecondary }]}>
                  Daily limit reached (150%)
                </Text>
                <Text style={[styles.limitReachedSubtext, { color: colors.textTertiary }]}>
                  Great job staying hydrated!
                </Text>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                {quickAddAmounts.map(({ ml, display }) => (
                  <WaterButton
                    key={ml}
                    amount={display}
                    onPress={() => handleQuickAdd(ml)}
                  />
                ))}
                <CustomAmountButton onPress={() => setCustomModalVisible(true)} />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
        )}

        {/* Spacer for past/future days to match today's button area height */}
        {!isViewingToday && <View style={styles.bottomSpacer} />}
      </View>

      {/* Custom Amount Modal */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Add Water</Text>
            <View style={styles.customInputContainer}>
              <TextInput
                style={[styles.customInput, dynamicStyles.customInput]}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
              <Text style={[styles.customUnit, dynamicStyles.customUnit]}>
                {settings.unitSystem === 'metric' ? 'ml' : 'oz'}
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelButton, dynamicStyles.modalCancelButton]}
                onPress={() => {
                  setCustomAmount('');
                  setCustomModalVisible(false);
                }}
              >
                <Text style={[styles.modalCancelText, dynamicStyles.modalCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalAddButton,
                  dynamicStyles.modalAddButton,
                  !customAmount && [styles.modalAddButtonDisabled, dynamicStyles.modalAddButtonDisabled],
                ]}
                onPress={handleCustomAdd}
                disabled={!customAmount}
              >
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
                        Hydration Impact
                      </Text>
                      {climateAdjustment.percentage > 0 ? (
                        <>
                          <Text style={[styles.weatherModalValue, { color: colors.primary }]}>
                            +{climateAdjustment.percentage}% increase recommended
                          </Text>
                          <Text style={[styles.weatherModalReason, { color: colors.textSecondary }]}>
                            {climateAdjustment.reason}
                          </Text>
                        </>
                      ) : (
                        <Text style={[styles.weatherModalValue, { color: colors.success }]}>
                          No adjustment needed
                        </Text>
                      )}
                    </View>

                    <View style={[styles.weatherModalDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.weatherModalSection}>
                      <Text style={[styles.weatherModalLabel, { color: colors.textSecondary }]}>
                        Your Goal Today
                      </Text>
                      <View style={styles.weatherModalGoalRow}>
                        <Text style={[styles.weatherModalGoalBase, { color: colors.textSecondary }]}>
                          {mlToDisplay(settings.dailyGoalMl, settings.unitSystem)} base
                        </Text>
                        {climateAdjustment.percentage > 0 && (
                          <>
                            <Text style={[styles.weatherModalGoalArrow, { color: colors.textTertiary }]}>
                              →
                            </Text>
                            <Text style={[styles.weatherModalGoalAdjusted, { color: colors.primary }]}>
                              {mlToDisplay(climateAdjustment.adjustedGoalMl, settings.unitSystem)}
                            </Text>
                          </>
                        )}
                      </View>
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 8,
  },
  quickAddContainer: {
    paddingBottom: 24,
    minHeight: 160,
    justifyContent: 'flex-end',
  },
  bottomSpacer: {
    height: 160,
  },
  weatherWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  weatherContent: {
    flex: 1,
  },
  weatherTempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weatherTemp: {
    fontSize: 22,
    fontWeight: '600',
  },
  weatherHighLow: {
    fontSize: 13,
    fontWeight: '500',
  },
  weatherLocation: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  weatherBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  weatherBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pastDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  limitReachedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  limitReachedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  limitReachedSubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
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
    marginBottom: 24,
    letterSpacing: -0.3,
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
});
