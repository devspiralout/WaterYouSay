import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface WaterButtonProps {
  amount: string;
  onPress: () => void;
}

export function WaterButton({ amount, onPress }: WaterButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.amount}>{amount}</Text>
    </TouchableOpacity>
  );
}

interface CustomAmountButtonProps {
  onPress: () => void;
}

export function CustomAmountButton({ onPress }: CustomAmountButtonProps) {
  return (
    <TouchableOpacity style={styles.customButton} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.customText}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  amount: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  customButton: {
    backgroundColor: COLORS.surface,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  customText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '300',
  },
});
