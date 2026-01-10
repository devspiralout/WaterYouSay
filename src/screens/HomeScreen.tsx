import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWater } from '../context/WaterContext';
import { useTheme } from '../context/ThemeContext';
import { ProgressRing } from '../components/ProgressRing';
import { WaterButton, CustomAmountButton } from '../components/WaterButton';
import { IntakeLog } from '../components/IntakeLog';
import { WaterBackground } from '../components/WaterBackground';
import { CelebrationSplash } from '../components/CelebrationSplash';
import { UndoToast } from '../components/UndoToast';
import { calculateProgress } from '../utils/calculations';
import { mlToDisplay, getQuickAddAmounts } from '../utils/units';
import { mediumTap, successFeedback, warningFeedback } from '../utils/haptics';
import { loadSounds, playWaterSound } from '../utils/sounds';

export function HomeScreen() {
  const { state, addWater, removeEntry, clearToday, setUnitSystem } = useWater();
  const { colors } = useTheme();
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const hasShownCelebration = useRef(false);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [lastDeletedAmount, setLastDeletedAmount] = useState<number | null>(null);

  const { todayLog, settings } = state;
  const progress = calculateProgress(todayLog.totalMl, settings.dailyGoalMl);
  const quickAddAmounts = getQuickAddAmounts(settings.unitSystem, settings.quickAddAmounts);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    greeting: { color: colors.text },
    unitToggleText: { color: colors.textSecondary },
    logCard: { 
      backgroundColor: colors.surface + 'BF', // 75% opacity
      borderColor: colors.surface + '80', // 50% opacity
    },
    modalContent: { backgroundColor: colors.surface },
    modalTitle: { color: colors.text },
    customInput: { backgroundColor: colors.background, color: colors.text },
    customUnit: { color: colors.textTertiary },
    modalCancelButton: { backgroundColor: colors.background },
    modalCancelText: { color: colors.textSecondary },
    modalAddButton: { backgroundColor: colors.primary },
    modalAddButtonDisabled: { backgroundColor: colors.border },
    logHeader: { color: colors.textSecondary },
    clearAllText: { color: colors.error },
  }), [colors]);

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
        <Text style={[styles.greeting, dynamicStyles.greeting]}>Today</Text>
        <TouchableOpacity onPress={toggleUnits} style={styles.unitToggle}>
          <Text style={[styles.unitToggleText, dynamicStyles.unitToggleText]}>
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
          {todayLog.entries.length > 0 && (
            <View style={styles.logHeaderRow}>
              <Text style={[styles.logHeaderText, dynamicStyles.logHeader]}>Today's Entries</Text>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={[styles.clearAllText, dynamicStyles.clearAllText]}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={[styles.logCard, dynamicStyles.logCard]}>
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
    letterSpacing: -0.5,
  },
  unitToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  unitToggleText: {
    fontSize: 13,
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
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  logHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
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
