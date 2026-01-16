import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface WaterButtonProps {
  amount: string;
  onPress: () => void;
  disabled?: boolean;
}

export function WaterButton({ amount, onPress, disabled }: WaterButtonProps) {
  const { colors, isDark } = useTheme();

  const translucentBg = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.7)';
  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.15)'
    : 'rgba(0, 0, 0, 0.06)';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: translucentBg,
          borderColor: borderColor,
          opacity: disabled ? 0.4 : 1,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.amount, { color: colors.text }]}>{amount}</Text>
    </TouchableOpacity>
  );
}

interface CustomAmountButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function CustomAmountButton({ onPress, disabled }: CustomAmountButtonProps) {
  const { colors, isDark } = useTheme();

  const translucentBg = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.7)';
  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.15)'
    : 'rgba(0, 0, 0, 0.06)';

  return (
    <TouchableOpacity
      style={[
        styles.customButton,
        {
          backgroundColor: translucentBg,
          borderColor: borderColor,
          opacity: disabled ? 0.4 : 1,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.customText, { color: colors.primary }]}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  customText: {
    fontSize: 24,
    fontWeight: '300',
  },
});
