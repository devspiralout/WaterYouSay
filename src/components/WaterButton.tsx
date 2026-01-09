import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants';

interface WaterButtonProps {
  amount: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export function WaterButton({
  amount,
  onPress,
  variant = 'primary',
  size = 'medium',
}: WaterButtonProps) {
  const buttonStyle = [
    styles.button,
    variant === 'secondary' && styles.buttonSecondary,
    size === 'small' && styles.buttonSmall,
    size === 'large' && styles.buttonLarge,
  ];

  const textStyle = [
    styles.text,
    variant === 'secondary' && styles.textSecondary,
    size === 'small' && styles.textSmall,
    size === 'large' && styles.textLarge,
  ];

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.plus}>+</Text>
      <Text style={textStyle}>{amount}</Text>
    </TouchableOpacity>
  );
}

interface CustomAmountButtonProps {
  onPress: () => void;
}

export function CustomAmountButton({ onPress }: CustomAmountButtonProps) {
  return (
    <TouchableOpacity style={styles.customButton} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.customText}>Custom</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    flexDirection: 'row',
    gap: 4,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonSmall: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 70,
  },
  buttonLarge: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    minWidth: 110,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textSecondary: {
    color: COLORS.primary,
  },
  textSmall: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 18,
  },
  plus: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  customText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
});
