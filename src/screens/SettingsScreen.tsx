import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWater } from '../context/WaterContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, ACTIVITY_LEVELS } from '../constants';
import { ThemeMode } from '../types';
import { mlToDisplay, formatWeight } from '../utils/units';
import { clearAllData } from '../utils/storage';
import { getCalculationBreakdown } from '../utils/calculations';
import { MOCK_PRESETS } from '../utils/mockData';
import { scheduleWaterReminders, requestNotificationPermissions } from '../utils/notifications';

const INTERVAL_OPTIONS = [
  { value: 1, label: 'Every hour' },
  { value: 2, label: 'Every 2 hours' },
  { value: 3, label: 'Every 3 hours' },
  { value: 4, label: 'Every 4 hours' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function SettingsScreen() {
  const { state, setDailyGoal, setUnitSystem, setReminders, setQuickAddAmounts, setSoundEnabled, setThemeMode, resetOnboarding, loadMockData } = useWater();
  const { colors } = useTheme();
  const { settings, profile } = state;
  const [showDebug, setShowDebug] = useState(false);

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState(settings.dailyGoalMl.toString());
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);
  const [editingAmounts, setEditingAmounts] = useState<string[]>(
    settings.quickAddAmounts.map(a => a.toString())
  );

  // Schedule reminders when settings change
  useEffect(() => {
    scheduleWaterReminders(settings.reminders);
  }, [settings.reminders]);

  const handleToggleReminders = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive reminders.'
        );
        return;
      }
    }
    setReminders({ ...settings.reminders, enabled });
  };

  const handleSetInterval = (intervalHours: number) => {
    setReminders({ ...settings.reminders, intervalHours });
    setReminderModalVisible(false);
  };

  const getIntervalLabel = () => {
    const option = INTERVAL_OPTIONS.find(o => o.value === settings.reminders.intervalHours);
    return option?.label || `Every ${settings.reminders.intervalHours} hours`;
  };

  const handleOpenQuickAddModal = () => {
    setEditingAmounts(settings.quickAddAmounts.map(a => a.toString()));
    setQuickAddModalVisible(true);
  };

  const handleSaveQuickAddAmounts = () => {
    const amounts = editingAmounts
      .map(a => parseInt(a, 10))
      .filter(a => a > 0 && a < 10000)
      .sort((a, b) => a - b);

    if (amounts.length === 3) {
      setQuickAddAmounts(amounts);
      setQuickAddModalVisible(false);
    } else {
      Alert.alert('Invalid Amounts', 'Please enter 3 valid amounts between 1 and 9999 ml.');
    }
  };

  const updateEditingAmount = (index: number, value: string) => {
    const newAmounts = [...editingAmounts];
    newAmounts[index] = value;
    setEditingAmounts(newAmounts);
  };

  const handleSaveGoal = () => {
    const goal = parseInt(newGoal, 10);
    if (goal > 0 && goal < 10000) {
      setDailyGoal(goal);
      setGoalModalVisible(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your data including history and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            resetOnboarding();
          },
        },
      ]
    );
  };

  const getActivityLabel = () => {
    if (!profile) return 'Not set';
    const activity = ACTIVITY_LEVELS.find(a => a.value === profile.activityLevel);
    return activity?.label || profile.activityLevel;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GOAL</Text>
          <TouchableOpacity
            style={[styles.settingRow, styles.settingRowFirst]}
            onPress={() => {
              setNewGoal(settings.dailyGoalMl.toString());
              setGoalModalVisible(true);
            }}
          >
            <Text style={styles.settingLabel}>Daily Target</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {mlToDisplay(settings.dailyGoalMl, settings.unitSystem)}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingRow, styles.settingRowLast]}
            onPress={handleOpenQuickAddModal}
          >
            <Text style={styles.settingLabel}>Quick Add Buttons</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {settings.quickAddAmounts.map(a => `${a}ml`).join(', ')}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Units */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UNITS</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Measurement</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segment,
                  settings.unitSystem === 'metric' && styles.segmentActive,
                ]}
                onPress={() => setUnitSystem('metric')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    settings.unitSystem === 'metric' && styles.segmentTextActive,
                  ]}
                >
                  Metric
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segment,
                  settings.unitSystem === 'imperial' && styles.segmentActive,
                ]}
                onPress={() => setUnitSystem('imperial')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    settings.unitSystem === 'imperial' && styles.segmentTextActive,
                  ]}
                >
                  Imperial
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REMINDERS</Text>
          <View style={styles.reminderCard}>
            <View style={styles.reminderRow}>
              <View>
                <Text style={styles.settingLabel}>Water Reminders</Text>
                <Text style={styles.reminderSubtext}>
                  {settings.reminders.enabled
                    ? `Active ${settings.reminders.startHour}:00 - ${settings.reminders.endHour}:00`
                    : 'Receive notifications to drink water'}
                </Text>
              </View>
              <Switch
                value={settings.reminders.enabled}
                onValueChange={handleToggleReminders}
                trackColor={{ false: COLORS.border, true: COLORS.primaryMuted }}
                thumbColor={settings.reminders.enabled ? COLORS.primary : COLORS.textTertiary}
              />
            </View>
            {settings.reminders.enabled && (
              <TouchableOpacity
                style={styles.intervalRow}
                onPress={() => setReminderModalVisible(true)}
              >
                <Text style={styles.settingLabel}>Frequency</Text>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>{getIntervalLabel()}</Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sound */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOUND</Text>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.reminderSubtext}>Play sound when logging water</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={settings.soundEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
          <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
            <View style={[styles.segmentedControl, { backgroundColor: colors.background }]}>
              {THEME_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segment,
                    settings.themeMode === option.value && [styles.segmentActive, { backgroundColor: colors.surface }],
                  ]}
                  onPress={() => setThemeMode(option.value)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: colors.textSecondary },
                      settings.themeMode === option.value && { color: colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Profile */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROFILE</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileGrid}>
                <View style={styles.profileItem}>
                  <Text style={styles.profileValue}>{profile.age}</Text>
                  <Text style={styles.profileLabel}>Age</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileValue}>
                    {profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)}
                  </Text>
                  <Text style={styles.profileLabel}>Sex</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileValue}>
                    {formatWeight(profile.weightKg, settings.unitSystem)}
                  </Text>
                  <Text style={styles.profileLabel}>Weight</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileValue}>{getActivityLabel()}</Text>
                  <Text style={styles.profileLabel}>Activity</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Calculation Breakdown */}
        {profile && profile.useCalculatedGoal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOW YOUR GOAL IS CALCULATED</Text>
            <View style={styles.breakdownCard}>
              {(() => {
                const breakdown = getCalculationBreakdown(profile);
                return (
                  <View style={styles.breakdownList}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>
                        Base ({profile.weightKg}kg × 33ml)
                      </Text>
                      <Text style={styles.breakdownValue}>{breakdown.baseAmount}ml</Text>
                    </View>
                    {breakdown.sexAdjustment !== 'none' && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Sex adjustment</Text>
                        <Text style={styles.breakdownValue}>{breakdown.sexAdjustment}</Text>
                      </View>
                    )}
                    {breakdown.ageAdjustment !== 'none' && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Age adjustment</Text>
                        <Text style={styles.breakdownValue}>{breakdown.ageAdjustment}</Text>
                      </View>
                    )}
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Activity level</Text>
                      <Text style={styles.breakdownValue}>{breakdown.activityLabel}</Text>
                    </View>
                    <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                      <Text style={styles.breakdownTotalLabel}>Recommended</Text>
                      <Text style={styles.breakdownTotalValue}>
                        {mlToDisplay(breakdown.finalAmount, settings.unitSystem)}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>
            <Text style={styles.disclaimer}>
              This is a general guideline based on common recommendations, not medical advice.
              Individual needs vary based on climate, health conditions, and other factors.
            </Text>
          </View>
        )}

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <TouchableOpacity style={styles.settingRow} onPress={handleResetData}>
            <Text style={styles.dangerText}>Reset All Data</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Tools - tap version to reveal */}
        {showDebug && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEBUG TOOLS</Text>
            <View style={styles.debugCard}>
              <Text style={styles.debugDescription}>
                Load mock data to test different app states
              </Text>
              {Object.entries(MOCK_PRESETS).map(([key, preset]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.debugButton}
                  onPress={() => {
                    loadMockData(preset.todayEntries, preset.historyDays);
                    Alert.alert('Mock Data Loaded', preset.description);
                  }}
                >
                  <Text style={styles.debugButtonText}>{preset.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* About */}
        <TouchableOpacity
          style={styles.aboutSection}
          onPress={() => setShowDebug(!showDebug)}
          activeOpacity={0.8}
        >
          <Text style={styles.appName}>WaterYouSay?</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          {showDebug && <Text style={styles.debugLabel}>Debug Mode Active</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Goal Modal */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Goal</Text>
            <View style={styles.goalInputWrapper}>
              <TextInput
                style={styles.goalInput}
                value={newGoal}
                onChangeText={setNewGoal}
                keyboardType="numeric"
                placeholder="2500"
                placeholderTextColor={COLORS.textTertiary}
                autoFocus
              />
              <Text style={styles.goalUnit}>ml</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveGoal}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reminder Interval Modal */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reminder Frequency</Text>
            <View style={styles.intervalOptions}>
              {INTERVAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.intervalOption,
                    settings.reminders.intervalHours === option.value && styles.intervalOptionActive,
                  ]}
                  onPress={() => handleSetInterval(option.value)}
                >
                  <Text
                    style={[
                      styles.intervalOptionText,
                      settings.reminders.intervalHours === option.value && styles.intervalOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setReminderModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quick Add Amounts Modal */}
      <Modal
        visible={quickAddModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quick Add Buttons</Text>
            <Text style={styles.quickAddHint}>Enter 3 amounts in milliliters</Text>
            <View style={styles.quickAddInputs}>
              {editingAmounts.map((amount, index) => (
                <View key={index} style={styles.quickAddInputRow}>
                  <TextInput
                    style={styles.quickAddInput}
                    value={amount}
                    onChangeText={(value) => updateEditingAmount(index, value)}
                    keyboardType="numeric"
                    placeholder={`Amount ${index + 1}`}
                    placeholderTextColor={COLORS.textTertiary}
                  />
                  <Text style={styles.quickAddUnit}>ml</Text>
                </View>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setQuickAddModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveQuickAddAmounts}
              >
                <Text style={styles.modalSaveText}>Save</Text>
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
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingRow: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingRowFirst: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  settingRowLast: {
    marginTop: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  settingLabel: {
    fontSize: 17,
    color: COLORS.text,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 17,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textTertiary,
    fontWeight: '300',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  reminderSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  intervalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  intervalOptions: {
    marginBottom: 16,
  },
  intervalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  intervalOptionActive: {
    backgroundColor: COLORS.primary,
  },
  intervalOptionText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  intervalOptionTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  quickAddHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  quickAddInputs: {
    marginBottom: 24,
  },
  quickAddInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickAddInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
  },
  quickAddUnit: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 12,
    width: 30,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.text,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 14,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  profileItem: {
    width: '50%',
    paddingVertical: 12,
  },
  profileValue: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  breakdownCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
  },
  breakdownList: {
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  breakdownTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  disclaimer: {
    fontSize: 13,
    color: COLORS.textTertiary,
    lineHeight: 18,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  dangerText: {
    fontSize: 17,
    color: COLORS.error,
  },
  aboutSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 40,
  },
  appName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  version: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  debugLabel: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: '500',
  },
  debugCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
  },
  debugDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  debugButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  debugButtonText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  goalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  goalInput: {
    backgroundColor: COLORS.background,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    width: 140,
    color: COLORS.text,
  },
  goalUnit: {
    fontSize: 18,
    color: COLORS.textTertiary,
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
    backgroundColor: COLORS.background,
  },
  modalCancelText: {
    fontSize: 17,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.text,
  },
  modalSaveText: {
    fontSize: 17,
    color: COLORS.surface,
    fontWeight: '600',
  },
});
