import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWater } from '../context/WaterContext';
import { ProgressRing } from '../components/ProgressRing';
import { WaterButton, CustomAmountButton } from '../components/WaterButton';
import { IntakeLog } from '../components/IntakeLog';
import { WaterBackground } from '../components/WaterBackground';
import { CelebrationSplash } from '../components/CelebrationSplash';
import { UndoToast } from '../components/UndoToast';
import { COLORS } from '../constants';
import { calculateProgress, calculateStreak } from '../utils/calculations';
import { mlToDisplay, getQuickAddAmounts } from '../utils/units';
import { mediumTap, successFeedback, warningFeedback } from '../utils/haptics';
import { loadSounds, playWaterSound } from '../utils/sounds';

export function HomeScreen() {
  const { state, addWater, removeEntry, setUnitSystem } = useWater();
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const hasShownCelebration = useRef(false);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [lastDeletedAmount, setLastDeletedAmount] = useState<number | null>(null);

  const { todayLog, settings, history } = state;
  const progress = calculateProgress(todayLog.totalMl, settings.dailyGoalMl);
  const streak = calculateStreak(history, settings.dailyGoalMl, todayLog.totalMl);
  const quickAddAmounts = getQuickAddAmounts(settings.unitSystem, settings.quickAddAmounts);

  // Load sounds on mount
  useEffect(() => {
    loadSounds();
  }, []);

  // Show celebration when goal is reached for the first time today
  useEffect(() => {
    if (progress >= 100 && !hasShownCelebration.current) {
      hasShownCelebration.current = true;
      successFeedback();
      setShowCelebration(true);
    } else if (progress < 100) {
      // Reset if progress drops below 100 (e.g., removed entries)
      hasShownCelebration.current = false;
    }
  }, [progress]);

  const handleQuickAdd = (amountMl: number) => {
    mediumTap();
    if (settings.soundEnabled) {
      playWaterSound();
    }
    addWater(amountMl);
  };

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount, 10);
    if (amount > 0) {
      mediumTap();
      if (settings.soundEnabled) {
        playWaterSound();
      }
      addWater(amount);
      setCustomAmount('');
      setCustomModalVisible(false);
    }
  };

  const handleRemoveEntry = (entryId: string) => {
    // Find the entry to get its amount before removing
    const entry = todayLog.entries.find(e => e.id === entryId);
    if (entry) {
      setLastDeletedAmount(entry.amountMl);
      warningFeedback();
      removeEntry(entryId);
      setUndoToastVisible(true);
    }
  };

  const handleUndo = () => {
    if (lastDeletedAmount) {
      mediumTap();
      addWater(lastDeletedAmount);
      setLastDeletedAmount(null);
    }
  };

  const handleDismissUndo = () => {
    setUndoToastVisible(false);
    setLastDeletedAmount(null);
  };

  const toggleUnits = () => {
    setUnitSystem(settings.unitSystem === 'metric' ? 'imperial' : 'metric');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WaterBackground progress={progress} />

      {/* Sticky Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Today</Text>
          <Text style={[styles.streakText, { opacity: streak > 0 ? 1 : 0 }]}>
            {streak > 0 ? `${streak} day streak` : ' '}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleUnits} style={styles.unitToggle}>
          <Text style={styles.unitToggleText}>
            {settings.unitSystem === 'metric' ? 'ML' : 'OZ'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Ring */}
        <View style={styles.progressContainer}>
          <ProgressRing
            progress={progress}
            currentAmount={mlToDisplay(todayLog.totalMl, settings.unitSystem)}
            goalAmount={mlToDisplay(settings.dailyGoalMl, settings.unitSystem)}
          />
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddContainer}>
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

        {/* Today's Log */}
        <View style={styles.logContainer}>
          <View style={styles.logCard}>
            <IntakeLog
              entries={todayLog.entries}
              unitSystem={settings.unitSystem}
              onRemoveEntry={handleRemoveEntry}
            />
          </View>
        </View>
      </ScrollView>

      {/* Custom Amount Modal */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Water</Text>
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                autoFocus
              />
              <Text style={styles.customUnit}>
                {settings.unitSystem === 'metric' ? 'ml' : 'oz'}
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setCustomAmount('');
                  setCustomModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalAddButton,
                  !customAmount && styles.modalAddButtonDisabled,
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

      {/* Undo Toast */}
      <UndoToast
        visible={undoToastVisible}
        message={lastDeletedAmount ? `Removed ${mlToDisplay(lastDeletedAmount, settings.unitSystem)}` : ''}
        onUndo={handleUndo}
        onDismiss={handleDismissUndo}
      />

      {/* Celebration Animation - rendered last to overlay everything */}
      <CelebrationSplash
        visible={showCelebration}
        onDismiss={() => setShowCelebration(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
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
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  streakText: {
    fontSize: 15,
    color: COLORS.streak,
    fontWeight: '500',
    marginTop: 4,
  },
  unitToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  unitToggleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  quickAddContainer: {
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  logContainer: {
    flex: 1,
  },
  logCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  customInput: {
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
  customUnit: {
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
  modalAddButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  modalAddButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  modalAddText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
