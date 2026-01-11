import React, { useState, useEffect, useMemo } from 'react';
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
import { ACTIVITY_LEVELS } from '../constants';
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

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    sectionTitle: { color: colors.textSecondary },
    settingRow: { backgroundColor: colors.surface },
    settingLabel: { color: colors.text },
    settingValue: { color: colors.textSecondary },
    chevron: { color: colors.textTertiary },
    segmentedControl: { backgroundColor: colors.background },
    segmentActive: { backgroundColor: colors.surface },
    segmentText: { color: colors.textSecondary },
    segmentTextActive: { color: colors.text },
    reminderCard: { backgroundColor: colors.surface },
    reminderSubtext: { color: colors.textSecondary },
    intervalRow: { borderTopColor: colors.border },
    intervalOption: { backgroundColor: colors.background },
    intervalOptionActive: { backgroundColor: colors.primary },
    intervalOptionText: { color: colors.text },
    intervalOptionTextActive: { color: colors.surface },
    profileCard: { backgroundColor: colors.surface },
    profileValue: { color: colors.text },
    profileLabel: { color: colors.textSecondary },
    breakdownCard: { backgroundColor: colors.surface },
    breakdownLabel: { color: colors.textSecondary },
    breakdownValue: { color: colors.text },
    breakdownTotal: { borderTopColor: colors.border },
    breakdownTotalLabel: { color: colors.text },
    breakdownTotalValue: { color: colors.primary },
    disclaimer: { color: colors.textTertiary },
    dangerText: { color: colors.error },
    appName: { color: colors.textSecondary },
    version: { color: colors.textTertiary },
    debugLabel: { color: colors.primary },
    debugCard: { backgroundColor: colors.surface },
    debugDescription: { color: colors.textSecondary },
    debugButton: { backgroundColor: colors.background },
    debugButtonText: { color: colors.text },
    modalContent: { backgroundColor: colors.surface },
    modalTitle: { color: colors.text },
    goalInput: { backgroundColor: colors.background, color: colors.text },
    goalUnit: { color: colors.textTertiary },
    modalCancelButton: { backgroundColor: colors.background },
    modalCancelText: { color: colors.textSecondary },
    modalSaveButton: { backgroundColor: colors.text },
    modalSaveText: { color: colors.surface },
    quickAddHint: { color: colors.textSecondary },
    quickAddInput: { backgroundColor: colors.background, color: colors.text },
    quickAddUnit: { color: colors.textSecondary },
  }), [colors]);

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
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.title]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Goal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>GOAL</Text>
          <TouchableOpacity
            style={[styles.settingRow, styles.settingRowFirst, dynamicStyles.settingRow]}
            onPress={() => {
              setNewGoal(settings.dailyGoalMl.toString());
              setGoalModalVisible(true);
            }}
          >
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Daily Target</Text>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, dynamicStyles.settingValue]}>
                {mlToDisplay(settings.dailyGoalMl, settings.unitSystem)}
              </Text>
              <Text style={[styles.chevron, dynamicStyles.chevron]}>›</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingRow, styles.settingRowLast, dynamicStyles.settingRow]}
            onPress={handleOpenQuickAddModal}
          >
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Quick Add Buttons</Text>
            <View style={styles.settingRight}>
              <Text style={[styles.chevron, dynamicStyles.chevron]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Units */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>UNITS</Text>
          <View style={[styles.settingRow, dynamicStyles.settingRow]}>
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Measurement</Text>
            <View style={[styles.segmentedControl, dynamicStyles.segmentedControl]}>
              <TouchableOpacity
                style={[
                  styles.segment,
                  settings.unitSystem === 'metric' && [styles.segmentActive, dynamicStyles.segmentActive],
                ]}
                onPress={() => setUnitSystem('metric')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    dynamicStyles.segmentText,
                    settings.unitSystem === 'metric' && dynamicStyles.segmentTextActive,
                  ]}
                >
                  Metric
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segment,
                  settings.unitSystem === 'imperial' && [styles.segmentActive, dynamicStyles.segmentActive],
                ]}
                onPress={() => setUnitSystem('imperial')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    dynamicStyles.segmentText,
                    settings.unitSystem === 'imperial' && dynamicStyles.segmentTextActive,
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
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>REMINDERS</Text>
          <View style={[styles.reminderCard, dynamicStyles.reminderCard]}>
            <View style={styles.reminderRow}>
              <View>
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Water Reminders</Text>
                <Text style={[styles.reminderSubtext, dynamicStyles.reminderSubtext]}>
                  {settings.reminders.enabled
                    ? `Active ${settings.reminders.startHour}:00 - ${settings.reminders.endHour}:00`
                    : 'Receive notifications to drink water'}
                </Text>
              </View>
              <Switch
                value={settings.reminders.enabled}
                onValueChange={handleToggleReminders}
                trackColor={{ false: colors.border, true: colors.primaryMuted }}
                thumbColor={settings.reminders.enabled ? colors.primary : colors.textTertiary}
              />
            </View>
            {settings.reminders.enabled && (
              <TouchableOpacity
                style={[styles.intervalRow, dynamicStyles.intervalRow]}
                onPress={() => setReminderModalVisible(true)}
              >
                <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Frequency</Text>
                <View style={styles.settingRight}>
                  <Text style={[styles.settingValue, dynamicStyles.settingValue]}>{getIntervalLabel()}</Text>
                  <Text style={[styles.chevron, dynamicStyles.chevron]}>›</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sound */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>SOUND</Text>
          <View style={[styles.settingRow, dynamicStyles.settingRow]}>
            <View>
              <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Sound Effects</Text>
              <Text style={[styles.reminderSubtext, dynamicStyles.reminderSubtext]}>Play sound when logging water</Text>
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
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>APPEARANCE</Text>
          <View style={[styles.settingRow, dynamicStyles.settingRow]}>
            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Theme</Text>
            <View style={[styles.segmentedControl, dynamicStyles.segmentedControl]}>
              {THEME_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segment,
                    settings.themeMode === option.value && [styles.segmentActive, dynamicStyles.segmentActive],
                  ]}
                  onPress={() => setThemeMode(option.value)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      dynamicStyles.segmentText,
                      settings.themeMode === option.value && dynamicStyles.segmentTextActive,
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
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>PROFILE</Text>
            <View style={[styles.profileCard, dynamicStyles.profileCard]}>
              <View style={styles.profileGrid}>
                <View style={styles.profileItem}>
                  <Text style={[styles.profileValue, dynamicStyles.profileValue]}>{profile.age}</Text>
                  <Text style={[styles.profileLabel, dynamicStyles.profileLabel]}>Age</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={[styles.profileValue, dynamicStyles.profileValue]}>
                    {profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)}
                  </Text>
                  <Text style={[styles.profileLabel, dynamicStyles.profileLabel]}>Sex</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={[styles.profileValue, dynamicStyles.profileValue]}>
                    {formatWeight(profile.weightKg, settings.unitSystem)}
                  </Text>
                  <Text style={[styles.profileLabel, dynamicStyles.profileLabel]}>Weight</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={[styles.profileValue, dynamicStyles.profileValue]}>{getActivityLabel()}</Text>
                  <Text style={[styles.profileLabel, dynamicStyles.profileLabel]}>Activity</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Calculation Breakdown */}
        {profile && profile.useCalculatedGoal && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>HOW YOUR GOAL IS CALCULATED</Text>
            <View style={[styles.breakdownCard, dynamicStyles.breakdownCard]}>
              {(() => {
                const breakdown = getCalculationBreakdown(profile);
                return (
                  <View style={styles.breakdownList}>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, dynamicStyles.breakdownLabel]}>
                        Base ({profile.weightKg}kg × 33ml)
                      </Text>
                      <Text style={[styles.breakdownValue, dynamicStyles.breakdownValue]}>{breakdown.baseAmount}ml</Text>
                    </View>
                    {breakdown.sexAdjustment !== 'none' && (
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, dynamicStyles.breakdownLabel]}>Sex adjustment</Text>
                        <Text style={[styles.breakdownValue, dynamicStyles.breakdownValue]}>{breakdown.sexAdjustment}</Text>
                      </View>
                    )}
                    {breakdown.ageAdjustment !== 'none' && (
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, dynamicStyles.breakdownLabel]}>Age adjustment</Text>
                        <Text style={[styles.breakdownValue, dynamicStyles.breakdownValue]}>{breakdown.ageAdjustment}</Text>
                      </View>
                    )}
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, dynamicStyles.breakdownLabel]}>Activity level</Text>
                      <Text style={[styles.breakdownValue, dynamicStyles.breakdownValue]}>{breakdown.activityLabel}</Text>
                    </View>
                    <View style={[styles.breakdownRow, styles.breakdownTotal, dynamicStyles.breakdownTotal]}>
                      <Text style={[styles.breakdownTotalLabel, dynamicStyles.breakdownTotalLabel]}>Recommended</Text>
                      <Text style={[styles.breakdownTotalValue, dynamicStyles.breakdownTotalValue]}>
                        {mlToDisplay(breakdown.finalAmount, settings.unitSystem)}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>
            <Text style={[styles.disclaimer, dynamicStyles.disclaimer]}>
              This is a general guideline based on common recommendations, not medical advice.
              Individual needs vary based on climate, health conditions, and other factors.
            </Text>
          </View>
        )}

        {/* Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>DATA</Text>
          <TouchableOpacity style={[styles.settingRow, dynamicStyles.settingRow]} onPress={handleResetData}>
            <Text style={[styles.dangerText, dynamicStyles.dangerText]}>Reset All Data</Text>
            <Text style={[styles.chevron, dynamicStyles.chevron]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Tools - tap version to reveal */}
        {showDebug && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>DEBUG TOOLS</Text>
            <View style={[styles.debugCard, dynamicStyles.debugCard]}>
              <Text style={[styles.debugDescription, dynamicStyles.debugDescription]}>
                Load mock data to test different app states
              </Text>
              {Object.entries(MOCK_PRESETS).map(([key, preset]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.debugButton, dynamicStyles.debugButton]}
                  onPress={() => {
                    loadMockData(preset.todayEntries, preset.historyDays);
                    Alert.alert('Mock Data Loaded', preset.description);
                  }}
                >
                  <Text style={[styles.debugButtonText, dynamicStyles.debugButtonText]}>{preset.description}</Text>
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
          <Text style={[styles.appName, dynamicStyles.appName]}>WaterYouSay?</Text>
          <Text style={[styles.version, dynamicStyles.version]}>Version 1.0.0</Text>
          {showDebug && <Text style={[styles.debugLabel, dynamicStyles.debugLabel]}>Debug Mode Active</Text>}
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
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Daily Goal</Text>
            <View style={styles.goalInputWrapper}>
              <TextInput
                style={[styles.goalInput, dynamicStyles.goalInput]}
                value={newGoal}
                onChangeText={setNewGoal}
                keyboardType="numeric"
                placeholder="2500"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
              <Text style={[styles.goalUnit, dynamicStyles.goalUnit]}>ml</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelButton, dynamicStyles.modalCancelButton]}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, dynamicStyles.modalCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, dynamicStyles.modalSaveButton]}
                onPress={handleSaveGoal}
              >
                <Text style={[styles.modalSaveText, dynamicStyles.modalSaveText]}>Save</Text>
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
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Reminder Frequency</Text>
            <View style={styles.intervalOptions}>
              {INTERVAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.intervalOption,
                    dynamicStyles.intervalOption,
                    settings.reminders.intervalHours === option.value && dynamicStyles.intervalOptionActive,
                  ]}
                  onPress={() => handleSetInterval(option.value)}
                >
                  <Text
                    style={[
                      styles.intervalOptionText,
                      dynamicStyles.intervalOptionText,
                      settings.reminders.intervalHours === option.value && dynamicStyles.intervalOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalCancelButton, dynamicStyles.modalCancelButton]}
              onPress={() => setReminderModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, dynamicStyles.modalCancelText]}>Cancel</Text>
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
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Quick Add Buttons</Text>
            <Text style={[styles.quickAddHint, dynamicStyles.quickAddHint]}>Enter 3 amounts in milliliters</Text>
            <View style={styles.quickAddInputs}>
              {editingAmounts.map((amount, index) => (
                <View key={index} style={styles.quickAddInputRow}>
                  <TextInput
                    style={[styles.quickAddInput, dynamicStyles.quickAddInput]}
                    value={amount}
                    onChangeText={(value) => updateEditingAmount(index, value)}
                    keyboardType="numeric"
                    placeholder={`Amount ${index + 1}`}
                    placeholderTextColor={colors.textTertiary}
                  />
                  <Text style={[styles.quickAddUnit, dynamicStyles.quickAddUnit]}>ml</Text>
                </View>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelButton, dynamicStyles.modalCancelButton]}
                onPress={() => setQuickAddModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, dynamicStyles.modalCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, dynamicStyles.modalSaveButton]}
                onPress={handleSaveQuickAddAmounts}
              >
                <Text style={[styles.modalSaveText, dynamicStyles.modalSaveText]}>Save</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
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
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingRow: {
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
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 17,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderCard: {
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
    marginTop: 2,
  },
  intervalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  intervalOptions: {
    marginBottom: 16,
  },
  intervalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  intervalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  quickAddHint: {
    fontSize: 14,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 18,
    textAlign: 'center',
  },
  quickAddUnit: {
    fontSize: 16,
    marginLeft: 12,
    width: 30,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileCard: {
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
    marginBottom: 4,
  },
  profileLabel: {
    fontSize: 14,
  },
  breakdownCard: {
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
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  breakdownTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  dangerText: {
    fontSize: 17,
  },
  aboutSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 40,
  },
  appName: {
    fontSize: 17,
    fontWeight: '600',
  },
  version: {
    fontSize: 14,
    marginTop: 4,
  },
  debugLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  debugCard: {
    padding: 16,
    borderRadius: 14,
  },
  debugDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  debugButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  debugButtonText: {
    fontSize: 15,
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
  goalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  goalInput: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    width: 140,
  },
  goalUnit: {
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
  modalSaveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
