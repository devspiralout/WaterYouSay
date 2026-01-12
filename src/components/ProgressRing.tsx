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

interface SelectedSegment {
  entry: WaterEntry;
  index: number;
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
  const [selectedSegment, setSelectedSegment] = useState<SelectedSegment | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(progress);
  const animationRef = useRef(new Animated.Value(progress)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const radius = (size - strokeWidth) / 2;
  const expandedStrokeWidth = strokeWidth + 6;
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

  // Animate selection
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selectedSegment ? 1.02 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [selectedSegment, scaleAnim]);

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
  const createArcPath = (startAngle: number, sweepAngle: number, arcRadius: number) => {
    if (sweepAngle <= 0) return '';

    // SVG arcs can't draw a full circle (start and end points would be same)
    // So for full circles, draw two half-circles
    if (sweepAngle >= 359.9) {
      const topX = center;
      const topY = center - arcRadius;
      const bottomX = center;
      const bottomY = center + arcRadius;
      return `M ${topX} ${topY} A ${arcRadius} ${arcRadius} 0 1 1 ${bottomX} ${bottomY} A ${arcRadius} ${arcRadius} 0 1 1 ${topX} ${topY}`;
    }

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + sweepAngle) * Math.PI) / 180;

    const x1 = center + arcRadius * Math.cos(startRad);
    const y1 = center + arcRadius * Math.sin(startRad);
    const x2 = center + arcRadius * Math.cos(endRad);
    const y2 = center + arcRadius * Math.sin(endRad);

    const largeArc = sweepAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const handleSegmentPress = (segment: typeof segments[0]) => {
    if (selectedSegment?.index === segment.index) {
      // Deselect if tapping same segment
      setSelectedSegment(null);
    } else {
      setSelectedSegment({
        entry: segment.entry,
        index: segment.index,
      });

      // Auto-deselect after 4 seconds
      setTimeout(() => {
        setSelectedSegment((current) =>
          current?.index === segment.index ? null : current
        );
      }, 4000);
    }
  };

  const handleContainerPress = () => {
    if (selectedSegment) {
      setSelectedSegment(null);
    }
  };

  // Format time for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Determine what to show in center
  const centerContent = useMemo(() => {
    if (selectedSegment) {
      return {
        main: mlToDisplay(selectedSegment.entry.amountMl, unitSystem),
        sub: formatTime(selectedSegment.entry.timestamp),
        detail: `Entry ${selectedSegment.index + 1} of ${entries.length}`,
      };
    }
    return {
      main: currentAmount,
      sub: `of ${goalAmount}`,
      detail: entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : '',
    };
  }, [selectedSegment, currentAmount, goalAmount, entries.length, unitSystem]);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={handleContainerPress}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
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

          {/* Entry segments - non-selected */}
          {segments.map((segment) => {
            const isSelected = selectedSegment?.index === segment.index;
            if (isSelected) return null; // Render selected segment last

            return (
              <Path
                key={segment.entry.id}
                d={createArcPath(segment.startAngle, segment.sweepAngle, radius)}
                stroke={selectedSegment ? segment.color + '60' : segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                fill="none"
                onPress={() => handleSegmentPress(segment)}
              />
            );
          })}

          {/* Selected segment - rendered last to be on top */}
          {selectedSegment && segments[selectedSegment.index] && (
            <Path
              d={createArcPath(
                segments[selectedSegment.index].startAngle,
                segments[selectedSegment.index].sweepAngle,
                radius
              )}
              stroke={segments[selectedSegment.index].color}
              strokeWidth={expandedStrokeWidth}
              strokeLinecap="round"
              fill="none"
              onPress={() => handleSegmentPress(segments[selectedSegment.index])}
            />
          )}

          {/* If no entries but has progress, show single arc */}
          {entries.length === 0 && animatedProgress > 0 && (
            <Path
              d={createArcPath(-90, (animatedProgress / 100) * 360, radius)}
              stroke={goalMet ? colors.success : colors.primary}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              fill="none"
            />
          )}
        </Svg>
      </Animated.View>

      <View style={[styles.textContainer, { width: size, height: size }]}>
        <Animated.View style={[styles.centerContent, { transform: [{ scale: scaleAnim }] }]}>
          <Text
            style={[
              styles.currentAmount,
              { color: selectedSegment ? colors.primary : colors.text },
              selectedSegment && styles.selectedAmount,
            ]}
          >
            {centerContent.main}
          </Text>
          <View style={styles.goalContainer}>
            <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>
              {centerContent.sub}
            </Text>
          </View>
          <Text
            style={[
              styles.entryCount,
              { color: centerContent.detail ? colors.textTertiary : 'transparent' }
            ]}
          >
            {centerContent.detail || 'no entries'}
          </Text>
        </Animated.View>
      </View>
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
  centerContent: {
    alignItems: 'center',
  },
  currentAmount: {
    fontSize: 56,
    fontWeight: '200',
    letterSpacing: -2,
  },
  selectedAmount: {
    fontSize: 48,
    fontWeight: '300',
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
});
