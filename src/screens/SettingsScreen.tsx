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
import { calculateDailyWaterGoal } from '../utils/calculations';
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
      <Text style={styles.title}>Settings</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Daily Goal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goal</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              setNewGoal(settings.dailyGoalMl.toString());
              setGoalModalVisible(true);
            }}
          >
            <Text style={styles.settingLabel}>Target Intake</Text>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>
                {mlToDisplay(settings.dailyGoalMl, settings.unitSystem)}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Units Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Units</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Measurement System</Text>
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  settings.unitSystem === 'metric' && styles.unitOptionActive,
                ]}
                onPress={() => setUnitSystem('metric')}
              >
                <Text
                  style={[
                    styles.unitOptionText,
                    settings.unitSystem === 'metric' && styles.unitOptionTextActive,
                  ]}
                >
                  Metric
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  settings.unitSystem === 'imperial' && styles.unitOptionActive,
                ]}
                onPress={() => setUnitSystem('imperial')}
              >
                <Text
                  style={[
                    styles.unitOptionText,
                    settings.unitSystem === 'imperial' && styles.unitOptionTextActive,
                  ]}
                >
                  Imperial
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Profile Section */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Profile</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Age</Text>
                <Text style={styles.profileValue}>{profile.age} years</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Sex</Text>
                <Text style={styles.profileValue}>
                  {profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)}
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Weight</Text>
                <Text style={styles.profileValue}>
                  {formatWeight(profile.weightKg, settings.unitSystem)}
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Activity Level</Text>
                <Text style={styles.profileValue}>{getActivityLabel()}</Text>
              </View>
              {profile.useCalculatedGoal && (
                <View style={styles.calculatedNote}>
                  <Text style={styles.calculatedNoteText}>
                    Your goal is calculated based on this profile
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetData}
          >
            <Text style={[styles.settingLabel, { color: COLORS.error }]}>
              Reset All Data
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>WaterYouSay?</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.tagline}>Stay hydrated, stay healthy!</Text>
          </View>
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
            <Text style={styles.modalTitle}>Edit Daily Goal</Text>
            <View style={styles.goalInputContainer}>
              <TextInput
                style={styles.goalInput}
                value={newGoal}
                onChangeText={setNewGoal}
                keyboardType="numeric"
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: 20,
    paddingBottom: 10,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  settingItem: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textLight,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 2,
  },
  unitOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  unitOptionActive: {
    backgroundColor: COLORS.primary,
  },
  unitOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  unitOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileLabel: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  profileValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  calculatedNote: {
    marginTop: 12,
    padding: 10,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  calculatedNoteText: {
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
  },
  aboutCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  version: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  goalInput: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 10,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    width: 150,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalUnit: {
    fontSize: 20,
    color: COLORS.textLight,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  modalSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
