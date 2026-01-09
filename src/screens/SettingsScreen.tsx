import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWater } from '../context/WaterContext';
import { COLORS, ACTIVITY_LEVELS } from '../constants';
import { mlToDisplay, formatWeight } from '../utils/units';
import { clearAllData } from '../utils/storage';

export function SettingsScreen() {
  const { state, setDailyGoal, setUnitSystem, resetOnboarding } = useWater();
  const { settings, profile } = state;

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState(settings.dailyGoalMl.toString());

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GOAL</Text>
          <TouchableOpacity
            style={styles.settingRow}
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

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <TouchableOpacity style={styles.settingRow} onPress={handleResetData}>
            <Text style={styles.dangerText}>Reset All Data</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.aboutSection}>
          <Text style={styles.appName}>WaterYouSay?</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
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
