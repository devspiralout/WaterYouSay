import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWater } from '../context/WaterContext';
import { ActivityLevel, Sex, UserProfile } from '../types';
import { COLORS, ACTIVITY_LEVELS, DEFAULT_DAILY_GOAL_ML } from '../constants';
import { calculateDailyWaterGoal } from '../utils/calculations';
import { mlToDisplay } from '../utils/units';

type OnboardingMode = 'choice' | 'calculated' | 'manual';

export function OnboardingScreen() {
  const { setProfile, setDailyGoal, completeOnboarding, state } = useWater();
  const [mode, setMode] = useState<OnboardingMode>('choice');

  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [manualGoal, setManualGoal] = useState(DEFAULT_DAILY_GOAL_ML.toString());

  const handleCalculatedSubmit = () => {
    const profile: UserProfile = {
      age: parseInt(age, 10),
      sex,
      weightKg: parseFloat(weight),
      activityLevel,
      useCalculatedGoal: true,
    };
    setProfile(profile);
    completeOnboarding();
  };

  const handleManualSubmit = () => {
    setDailyGoal(parseInt(manualGoal, 10));
    completeOnboarding();
  };

  const isCalculatedFormValid = () => {
    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    return ageNum > 0 && ageNum < 120 && weightNum > 20 && weightNum < 300;
  };

  const getPreviewGoal = (): string => {
    if (!isCalculatedFormValid()) return '--';
    const profile: UserProfile = {
      age: parseInt(age, 10),
      sex,
      weightKg: parseFloat(weight),
      activityLevel,
      useCalculatedGoal: true,
    };
    const goal = calculateDailyWaterGoal(profile);
    return mlToDisplay(goal, state.settings.unitSystem);
  };

  if (mode === 'choice') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>WaterYouSay?</Text>
            <Text style={styles.welcomeSubtitle}>
              Track your daily hydration
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setMode('calculated')}
              activeOpacity={0.7}
            >
              <Text style={styles.optionTitle}>Personalized Goal</Text>
              <Text style={styles.optionDescription}>
                We'll calculate your ideal intake based on your profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setMode('manual')}
              activeOpacity={0.7}
            >
              <Text style={styles.optionTitle}>Set My Own</Text>
              <Text style={styles.optionDescription}>
                Choose your own daily water target
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'manual') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setMode('choice')} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.manualContent}>
          <Text style={styles.screenTitle}>Daily Goal</Text>
          <Text style={styles.screenSubtitle}>How much water do you want to drink?</Text>

          <View style={styles.goalInputWrapper}>
            <TextInput
              style={styles.goalInput}
              value={manualGoal}
              onChangeText={setManualGoal}
              keyboardType="numeric"
              placeholder="2500"
              placeholderTextColor={COLORS.textTertiary}
            />
            <Text style={styles.goalUnit}>ml</Text>
          </View>

          <View style={styles.presetsWrapper}>
            {[2000, 2500, 3000, 3500].map(amount => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.presetChip,
                  manualGoal === amount.toString() && styles.presetChipActive,
                ]}
                onPress={() => setManualGoal(amount.toString())}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    manualGoal === amount.toString() && styles.presetChipTextActive,
                  ]}
                >
                  {amount / 1000}L
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !manualGoal && styles.continueButtonDisabled]}
            onPress={handleManualSubmit}
            disabled={!manualGoal}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setMode('choice')} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Your Profile</Text>
          <Text style={styles.screenSubtitle}>Help us calculate your ideal intake</Text>

          <View style={styles.formSection}>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Age</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="25"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="70"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            </View>

            <View style={styles.formFieldFull}>
              <Text style={styles.fieldLabel}>Sex</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[styles.segment, sex === 'male' && styles.segmentActive]}
                  onPress={() => setSex('male')}
                >
                  <Text style={[styles.segmentText, sex === 'male' && styles.segmentTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, sex === 'female' && styles.segmentActive]}
                  onPress={() => setSex('female')}
                >
                  <Text style={[styles.segmentText, sex === 'female' && styles.segmentTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formFieldFull}>
              <Text style={styles.fieldLabel}>Activity Level</Text>
              <View style={styles.activityList}>
                {ACTIVITY_LEVELS.map(level => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.activityItem,
                      activityLevel === level.value && styles.activityItemActive,
                    ]}
                    onPress={() => setActivityLevel(level.value)}
                  >
                    <Text
                      style={[
                        styles.activityItemTitle,
                        activityLevel === level.value && styles.activityItemTitleActive,
                      ]}
                    >
                      {level.label}
                    </Text>
                    <Text style={styles.activityItemDesc}>{level.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isCalculatedFormValid() && (
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Recommended daily intake</Text>
                <Text style={styles.resultValue}>{getPreviewGoal()}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !isCalculatedFormValid() && styles.continueButtonDisabled]}
            onPress={handleCalculatedSubmit}
            disabled={!isCalculatedFormValid()}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  welcomeHeader: {
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -1,
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  screenHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '500',
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  manualContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  goalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  goalInput: {
    fontSize: 64,
    fontWeight: '200',
    color: COLORS.text,
    textAlign: 'center',
    minWidth: 180,
    letterSpacing: -2,
  },
  goalUnit: {
    fontSize: 24,
    color: COLORS.textTertiary,
    fontWeight: '400',
    marginLeft: 4,
  },
  presetsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  presetChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  presetChipActive: {
    backgroundColor: COLORS.text,
  },
  presetChipText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  presetChipTextActive: {
    color: COLORS.surface,
  },
  formScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  formSection: {
    gap: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formField: {
    flex: 1,
  },
  formFieldFull: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  fieldInput: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 17,
    color: COLORS.text,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: COLORS.text,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.surface,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityItemActive: {
    borderColor: COLORS.primary,
  },
  activityItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  activityItemTitleActive: {
    color: COLORS.primary,
  },
  activityItemDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resultCard: {
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 36,
    fontWeight: '300',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  continueButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.divider,
  },
  continueButtonText: {
    color: COLORS.surface,
    fontSize: 17,
    fontWeight: '600',
  },
});
