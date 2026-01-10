import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  currentAmount: string;
  goalAmount: string;
}

export function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 8,
  currentAmount,
  goalAmount,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.min(progress, 100),
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // strokeDashoffset doesn't support native driver
    }).start();
  }, [progress, animatedProgress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progress >= 100 ? colors.success : colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.textContainer, { width: size, height: size }]}>
        <Text style={[styles.currentAmount, { color: colors.text }]}>{currentAmount}</Text>
        <View style={styles.goalContainer}>
          <Text style={[styles.goalLabel, { color: colors.textTertiary }]}>of </Text>
          <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>{goalAmount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentAmount: {
    fontSize: 56,
    fontWeight: '200',
    letterSpacing: -2,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  goalLabel: {
    fontSize: 15,
    fontWeight: '400',
  },
  goalAmount: {
    fontSize: 15,
    fontWeight: '500',
  },
});
