import React, { useState } from 'react';
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
import { COLORS } from '../constants';
import { calculateProgress, calculateStreak } from '../utils/calculations';
import { mlToDisplay, getQuickAddAmounts } from '../utils/units';

export function HomeScreen() {
  const { state, addWater, removeEntry, setUnitSystem } = useWater();
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const { todayLog, settings, history } = state;
  const progress = calculateProgress(todayLog.totalMl, settings.dailyGoalMl);
  const streak = calculateStreak(history, settings.dailyGoalMl, todayLog.totalMl);
  const quickAddAmounts = getQuickAddAmounts(settings.unitSystem);

  const handleQuickAdd = (amountMl: number) => {
    addWater(amountMl);
  };

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount, 10);
    if (amount > 0) {
      addWater(amount);
      setCustomAmount('');
      setCustomModalVisible(false);
    }
  };

  const toggleUnits = () => {
    setUnitSystem(settings.unitSystem === 'metric' ? 'imperial' : 'metric');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Today's Progress</Text>
          <TouchableOpacity onPress={toggleUnits} style={styles.unitToggle}>
            <Text style={styles.unitToggleText}>
              {settings.unitSystem === 'metric' ? 'ml/L' : 'oz'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Ring */}
        <View style={styles.progressContainer}>
          <ProgressRing
            progress={progress}
            currentAmount={mlToDisplay(todayLog.totalMl, settings.unitSystem)}
            goalAmount={mlToDisplay(settings.dailyGoalMl, settings.unitSystem)}
          />
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak} day streak!</Text>
            </View>
          )}
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddContainer}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
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
          <IntakeLog
            entries={todayLog.entries}
            unitSystem={settings.unitSystem}
            onRemoveEntry={removeEntry}
          />
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
            <Text style={styles.modalTitle}>Add Custom Amount</Text>
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  unitToggle: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitToggleText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  streakBadge: {
    marginTop: 16,
    backgroundColor: COLORS.warning + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    color: COLORS.warning,
    fontWeight: '600',
  },
  quickAddContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  logContainer: {
    flex: 1,
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
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  customInput: {
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
  customUnit: {
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
  modalAddButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  modalAddButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  modalAddText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
