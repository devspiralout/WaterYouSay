import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
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
import { mediumTap, warningFeedback } from '../utils/haptics';
import { loadSounds, playWaterSound } from '../utils/sounds';
import { ExpandableCalendar } from '../components/ExpandableCalendar';
import { TrophyIcon } from '../components/TrophyIcon';
import { WaterDropIcon } from '../components/WaterDropIcon';
import { GearIcon } from '../components/GearIcon';

export function HomeScreen() {
  const { state, addWater, clearToday } = useWater();
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const progressRingRef = useRef<ProgressRingRef>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const { todayLog, settings, history } = state;
  const isViewingToday = isToday(selectedDate);
  const isViewingFuture = isFutureDate(selectedDate);

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

  const progress = calculateProgress(selectedDayData.totalMl, settings.dailyGoalMl);
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

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Entries',
      'Are you sure you want to clear all of today\'s water entries?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            warningFeedback();
            clearToday();
          },
        },
      ]
    );
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
        dailyGoalMl={settings.dailyGoalMl}
      />

      <View style={styles.mainContent} {...panResponder.panHandlers}>
        {/* Progress Ring - Centered */}
        <View style={styles.progressContainer}>
          <ProgressRing
            ref={progressRingRef}
            progress={progress}
            currentAmount={mlToDisplay(selectedDayData.totalMl, settings.unitSystem)}
            goalAmount={mlToDisplay(settings.dailyGoalMl, settings.unitSystem)}
            entries={isViewingToday ? todayLog.entries : []}
            goalMl={settings.dailyGoalMl}
            unitSystem={settings.unitSystem}
            onClearAll={handleClearAll}
            showClearAll={isViewingToday && todayLog.entries.length > 0}
          />

          {/* Past day message */}
          {!isViewingToday && !isViewingFuture && selectedDayData.totalMl > 0 && (
            <View style={styles.pastDayMessage}>
              <Text style={[styles.pastDayText, { color: colors.textSecondary }]}>
                You drank {mlToDisplay(selectedDayData.totalMl, settings.unitSystem)} this day
              </Text>
            </View>
          )}

          {/* Future day message */}
          {isViewingFuture && (
            <View style={styles.pastDayMessage}>
              <Text style={[styles.pastDayText, { color: colors.textTertiary }]}>
                Future date
              </Text>
            </View>
          )}
        </View>

        {/* Quick Add Buttons - Bottom (always rendered to maintain layout) */}
        <TouchableWithoutFeedback onPress={() => progressRingRef.current?.clearSelection()}>
          <View style={[styles.quickAddContainer, { opacity: isViewingToday ? 1 : 0 }]} pointerEvents={isViewingToday ? 'auto' : 'none'}>
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
          </View>
        </TouchableWithoutFeedback>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
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
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddContainer: {
    paddingBottom: 40,
  },
  pastDayMessage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 16,
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
});
