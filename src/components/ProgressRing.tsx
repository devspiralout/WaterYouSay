import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { WaterEntry } from '../types';
import { mlToDisplay } from '../utils/units';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  currentAmount: string;
  goalAmount: string;
  entries?: WaterEntry[];
  goalMl?: number;
  unitSystem?: 'metric' | 'imperial';
}

interface TooltipData {
  amount: string;
  time: string;
  x: number;
  y: number;
}

export function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 12,
  currentAmount,
  goalAmount,
  entries = [],
  goalMl = 2500,
  unitSystem = 'metric',
}: ProgressRingProps) {
  const { colors } = useTheme();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(progress);
  const animationRef = useRef(new Animated.Value(progress)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  // Animate progress changes
  useEffect(() => {
    const listener = animationRef.addListener(({ value }) => {
      setAnimatedProgress(value);
    });

    Animated.timing(animationRef, {
      toValue: progress,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animationRef.removeListener(listener);
    };
  }, [progress, animationRef]);

  // Check if goal is met (use threshold for floating point precision)
  const goalMet = animatedProgress >= 99.9;

  // Gap between segments in degrees (1px approximate)
  const gapDegrees = entries.length > 1 ? 1 : 0;

  // Calculate segments with animated progress
  const segments = useMemo(() => {
    if (entries.length === 0) return [];

    const totalMl = entries.reduce((sum, e) => sum + e.amountMl, 0);
    if (totalMl === 0) return [];

    // Maximum angle is based on animated progress (max 360)
    const maxAngle = Math.min((animatedProgress / 100) * 360, 360);
    const totalGapAngle = gapDegrees * (entries.length - 1);
    const availableAngle = Math.max(maxAngle - totalGapAngle, 0);

    let currentAngle = -90; // Start at top (12 o'clock)

    return entries.map((entry, index) => {
      const proportion = entry.amountMl / totalMl;
      const sweepAngle = proportion * availableAngle;

      const startAngle = currentAngle;
      currentAngle = currentAngle + sweepAngle + gapDegrees;

      // Single color - primary blue (or success green when goal met)
      const segmentColor = goalMet ? colors.success : colors.primary;

      return {
        entry,
        startAngle,
        sweepAngle,
        color: segmentColor,
        index,
      };
    });
  }, [entries, animatedProgress, colors, gapDegrees, goalMet]);

  // Convert angle to SVG arc path
  const createArcPath = (startAngle: number, sweepAngle: number) => {
    if (sweepAngle <= 0) return '';

    // SVG arcs can't draw a full circle (start and end points would be same)
    // So for full circles, draw two half-circles
    if (sweepAngle >= 359.9) {
      const topX = center;
      const topY = center - radius;
      const bottomX = center;
      const bottomY = center + radius;
      return `M ${topX} ${topY} A ${radius} ${radius} 0 1 1 ${bottomX} ${bottomY} A ${radius} ${radius} 0 1 1 ${topX} ${topY}`;
    }

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + sweepAngle) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = sweepAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Get position for tooltip based on segment midpoint
  const getSegmentMidpoint = (startAngle: number, sweepAngle: number) => {
    const midAngle = ((startAngle + sweepAngle / 2) * Math.PI) / 180;
    const tooltipRadius = radius + 40;
    return {
      x: center + tooltipRadius * Math.cos(midAngle),
      y: center + tooltipRadius * Math.sin(midAngle),
    };
  };

  const handleSegmentPress = (segment: typeof segments[0]) => {
    const { x, y } = getSegmentMidpoint(segment.startAngle, segment.sweepAngle);
    const time = new Date(segment.entry.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    setTooltip({
      amount: mlToDisplay(segment.entry.amountMl, unitSystem),
      time,
      x,
      y,
    });

    // Auto-hide tooltip
    setTimeout(() => setTooltip(null), 2500);
  };

  const dismissTooltip = () => setTooltip(null);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={dismissTooltip}
    >
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Entry segments */}
        {segments.map((segment) => (
          <Path
            key={segment.entry.id}
            d={createArcPath(segment.startAngle, segment.sweepAngle)}
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            fill="none"
            onPress={() => handleSegmentPress(segment)}
          />
        ))}

        {/* If no entries but has progress, show single arc */}
        {entries.length === 0 && animatedProgress > 0 && (
          <Path
            d={createArcPath(-90, (animatedProgress / 100) * 360)}
            stroke={goalMet ? colors.success : colors.primary}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            fill="none"
          />
        )}
      </Svg>

      <View style={[styles.textContainer, { width: size, height: size }]}>
        <Text style={[styles.currentAmount, { color: colors.text }]}>{currentAmount}</Text>
        <View style={styles.goalContainer}>
          <Text style={[styles.goalLabel, { color: colors.textTertiary }]}>of </Text>
          <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>{goalAmount}</Text>
        </View>
        <Text style={[styles.entryCount, { color: entries.length > 0 ? colors.textTertiary : 'transparent' }]}>
          {entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : 'no entries'}
        </Text>
      </View>

      {/* Tooltip */}
      {tooltip && (
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.surface,
              left: tooltip.x - 50,
              top: tooltip.y - 20,
              shadowColor: colors.text,
            },
          ]}
        >
          <Text style={[styles.tooltipAmount, { color: colors.text }]}>{tooltip.amount}</Text>
          <Text style={[styles.tooltipTime, { color: colors.textSecondary }]}>{tooltip.time}</Text>
        </View>
      )}
    </TouchableOpacity>
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
  entryCount: {
    fontSize: 13,
    marginTop: 8,
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  tooltipTime: {
    fontSize: 12,
    marginTop: 2,
  },
});
