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
import { useWater } from '../context/WaterContext';
import { ActivityLevel, Sex, UserProfile } from '../types';
import { COLORS, ACTIVITY_LEVELS, DEFAULT_DAILY_GOAL_ML } from '../constants';
import { calculateDailyWaterGoal } from '../utils/calculations';
import { mlToDisplay } from '../utils/units';

type OnboardingMode = 'choice' | 'calculated' | 'manual';

export function OnboardingScreen() {
  const { setProfile, setDailyGoal, completeOnboarding, state } = useWater();
  const [mode, setMode] = useState<OnboardingMode>('choice');

  // Calculated goal form state
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  // Manual goal state
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>WaterYouSay?</Text>
          <Text style={styles.subtitle}>Let's set your daily water goal</Text>
        </View>

        <View style={styles.choiceContainer}>
          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => setMode('calculated')}
          >
            <Text style={styles.choiceIcon}>📊</Text>
            <Text style={styles.choiceTitle}>Calculate My Goal</Text>
            <Text style={styles.choiceDescription}>
              Enter your age, sex, weight, and activity level to get a personalized recommendation
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => setMode('manual')}
          >
            <Text style={styles.choiceIcon}>🎯</Text>
            <Text style={styles.choiceTitle}>Set My Own Goal</Text>
            <Text style={styles.choiceDescription}>
              Choose your own daily water intake target
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'manual') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setMode('choice')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Set Your Goal</Text>
          <Text style={styles.subtitle}>How much water do you want to drink daily?</Text>
        </View>

        <View style={styles.manualContainer}>
          <View style={styles.manualInputContainer}>
            <TextInput
              style={styles.manualInput}
              value={manualGoal}
              onChangeText={setManualGoal}
              keyboardType="numeric"
              placeholder="2500"
            />
            <Text style={styles.manualUnit}>ml</Text>
          </View>

          <View style={styles.presetContainer}>
            <Text style={styles.presetLabel}>Quick presets:</Text>
            <View style={styles.presetRow}>
              {[2000, 2500, 3000, 3500].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.presetButton,
                    manualGoal === amount.toString() && styles.presetButtonActive,
                  ]}
                  onPress={() => setManualGoal(amount.toString())}
                >
                  <Text
                    style={[
                      styles.presetText,
                      manualGoal === amount.toString() && styles.presetTextActive,
                    ]}
                  >
                    {amount / 1000}L
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !manualGoal && styles.submitButtonDisabled]}
          onPress={handleManualSubmit}
          disabled={!manualGoal}
        >
          <Text style={styles.submitText}>Start Tracking</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculated mode
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => setMode('choice')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.subtitle}>We'll calculate your ideal daily intake</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="25"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sex</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="70"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activity Level</Text>
            {ACTIVITY_LEVELS.map(level => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.activityOption,
                  activityLevel === level.value && styles.activityOptionActive,
                ]}
                onPress={() => setActivityLevel(level.value)}
              >
                <Text
                  style={[
                    styles.activityLabel,
                    activityLevel === level.value && styles.activityLabelActive,
                  ]}
                >
                  {level.label}
                </Text>
                <Text style={styles.activityDescription}>{level.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isCalculatedFormValid() && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Your recommended daily intake:</Text>
              <Text style={styles.previewValue}>{getPreviewGoal()}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !isCalculatedFormValid() && styles.submitButtonDisabled]}
          onPress={handleCalculatedSubmit}
          disabled={!isCalculatedFormValid()}
        >
          <Text style={styles.submitText}>Start Tracking</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  choiceContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  choiceCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  choiceIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  choiceDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 16,
    color: COLORS.text,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activityOption: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  activityOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '20',
  },
  activityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityLabelActive: {
    color: COLORS.primary,
  },
  activityDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  previewContainer: {
    backgroundColor: COLORS.primary + '15',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  previewValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 24,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  manualContainer: {
    paddingHorizontal: 24,
    gap: 24,
  },
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  manualInput: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 150,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  manualUnit: {
    fontSize: 24,
    color: COLORS.textLight,
  },
  presetContainer: {
    gap: 12,
  },
  presetLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  presetButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetText: {
    fontSize: 16,
    color: COLORS.text,
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
