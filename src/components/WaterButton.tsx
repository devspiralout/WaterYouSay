import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface WaterButtonProps {
  amount: string;
  onPress: () => void;
}

export function WaterButton({ amount, onPress }: WaterButtonProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: colors.surface }]} 
      onPress={onPress} 
      activeOpacity={0.6}
    >
      <Text style={[styles.amount, { color: colors.text }]}>{amount}</Text>
    </TouchableOpacity>
  );
}

interface CustomAmountButtonProps {
  onPress: () => void;
}

export function CustomAmountButton({ onPress }: CustomAmountButtonProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity 
      style={[styles.customButton, { backgroundColor: colors.surface }]} 
      onPress={onPress} 
      activeOpacity={0.6}
    >
      <Text style={[styles.customText, { color: colors.primary }]}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
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
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  customButton: {
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
    fontSize: 24,
    fontWeight: '300',
  },
});
