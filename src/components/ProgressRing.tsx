import React, { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { WaterEntry } from '../types';
import { mlToDisplay } from '../utils/units';
import { lightTap, warningFeedback } from '../utils/haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  currentAmount: string;
  goalAmount: string;
  entries?: WaterEntry[];
  goalMl?: number;
  unitSystem?: 'metric' | 'imperial';
  onDeleteEntry?: (entryId: string) => void;
  onDeleteStart?: () => void;
}

export interface ProgressRingRef {
  clearSelection: () => void;
}

interface SelectedSegment {
  entry: WaterEntry;
  index: number;
}

export const ProgressRing = forwardRef<ProgressRingRef, ProgressRingProps>(({
  progress,
  size = 280,
  strokeWidth = 12,
  currentAmount,
  goalAmount,
  entries = [],
  goalMl = 2500,
  unitSystem = 'metric',
  onDeleteEntry,
  onDeleteStart,
}, ref) => {
  const { colors } = useTheme();
  const [selectedSegment, setSelectedSegment] = useState<SelectedSegment | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(progress);
  const animationRef = useRef(new Animated.Value(progress)).current;

  // Delete animation state
  const [deletingSegmentId, setDeletingSegmentId] = useState<string | null>(null);
  const [deletingSegmentIndex, setDeletingSegmentIndex] = useState<number | null>(null);
  const [justDeletedId, setJustDeletedId] = useState<string | null>(null);
  const deleteAnimProgress = useRef(new Animated.Value(0)).current;

  // Expose clearSelection method to parent
  useImperativeHandle(ref, () => ({
    clearSelection: () => setSelectedSegment(null),
  }));

  const expandedStrokeWidth = strokeWidth + 6;
  const padding = (expandedStrokeWidth - strokeWidth) / 2; // Extra space for expanded segments
  const svgSize = size + padding * 2;
  const radius = (size - strokeWidth) / 2;
  const center = svgSize / 2;

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


  // Clear selection and justDeletedId when entries change
  useEffect(() => {
    setSelectedSegment(null);
    setJustDeletedId(null);
  }, [entries]);

  // Check if goal is met (use threshold for floating point precision)
  const goalMet = animatedProgress >= 99.9;

  // Gap between segments in degrees - more visible gap
  const gapDegrees = entries.length > 1 ? 1 : 0;

  // Calculate segments with animated progress for smooth fill animation
  const segments = useMemo(() => {
    if (entries.length === 0) return [];

    const totalMl = entries.reduce((sum, e) => sum + e.amountMl, 0);
    if (totalMl === 0) return [];

    // Use animated progress for smooth fill animation (capped at 100%)
    const cappedProgress = Math.min(animatedProgress, 100);
    const totalAngle = (cappedProgress / 100) * 360;

    // When ring is full (100%), add gap after last segment too
    const isRingFull = cappedProgress >= 99.9;
    const numGaps = isRingFull ? entries.length : Math.max(0, entries.length - 1);
    const totalGapAngle = gapDegrees * numGaps;
    const availableAngle = Math.max(0, totalAngle - totalGapAngle);

    // Green when goal met, blue otherwise
    const segmentColor = goalMet ? colors.success : colors.primary;

    // Offset start angle slightly when ring is full to center the gap at top
    let currentAngle = -90 + (isRingFull ? gapDegrees / 2 : 0);

    return entries.map((entry, index) => {
      // Each segment sized by its proportion of total intake
      const proportion = entry.amountMl / totalMl;
      const sweepAngle = proportion * availableAngle;

      const startAngle = currentAngle;
      currentAngle = currentAngle + sweepAngle + gapDegrees;

      return {
        entry,
        startAngle,
        sweepAngle,
        color: segmentColor,
        index,
      };
    });
  }, [entries, goalMl, colors, gapDegrees, goalMet, animatedProgress]);


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
    // Don't allow interaction while deleting
    if (deletingSegmentId) return;

    lightTap();
    if (selectedSegment?.index === segment.index) {
      // Deselect if tapping same segment
      setSelectedSegment(null);
    } else {
      setSelectedSegment({
        entry: segment.entry,
        index: segment.index,
      });
    }
  };

  const handleSegmentLongPress = useCallback((segment: typeof segments[0]) => {
    // Only allow deletion if handler is provided and not already deleting
    if (!onDeleteEntry || deletingSegmentId) return;

    warningFeedback();
    onDeleteStart?.();
    setDeletingSegmentId(segment.entry.id);
    setDeletingSegmentIndex(segment.index);
    setSelectedSegment(null);

    // Reset animation value for new delete
    deleteAnimProgress.setValue(0);

    // Animate: grow, then pop off, then pause to show empty space
    Animated.sequence([
      // Grow phase - segment expands
      Animated.timing(deleteAnimProgress, {
        toValue: 0.3,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      // Pop off phase - segment flies out and fades
      Animated.timing(deleteAnimProgress, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      // Pause to show empty space
      Animated.delay(250),
    ]).start(() => {
      // Mark as just deleted to prevent ghost rendering
      setJustDeletedId(segment.entry.id);
      // Clear deleting state first (keeps opacity at 0 since we don't reset deleteAnimProgress)
      setDeletingSegmentId(null);
      setDeletingSegmentIndex(null);
      // Then remove the entry (triggers slide animation)
      onDeleteEntry(segment.entry.id);
    });
  }, [onDeleteEntry, onDeleteStart, deletingSegmentId, deleteAnimProgress]);

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
    if (goalMet) {
      return {
        main: currentAmount,
        sub: `of ${goalAmount}`,
        detail: entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : '',
      };
    }
    return {
      main: currentAmount,
      sub: `of ${goalAmount}`,
      detail: entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : '',
    };
  }, [selectedSegment, currentAmount, goalAmount, entries.length, unitSystem, goalMet]);

  return (
    <TouchableOpacity
      style={[styles.container, { width: svgSize, height: svgSize }]}
      activeOpacity={1}
      onPress={handleContainerPress}
    >
      <View style={[styles.svgContainer, { width: svgSize, height: svgSize }]}>
        <Svg width={svgSize} height={svgSize}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Entry segments - non-selected, non-deleting */}
          {segments.map((segment) => {
            const isSelected = selectedSegment?.index === segment.index;
            const isDeleting = deletingSegmentId === segment.entry.id;
            const isJustDeleted = justDeletedId === segment.entry.id;
            if (isSelected || isDeleting || isJustDeleted) return null; // Render these last or not at all

            // Dim segments when one is selected or being deleted
            const isDimmed = selectedSegment || deletingSegmentId;

            const { startAngle, sweepAngle } = segment;

            return (
              <Path
                key={segment.entry.id}
                d={createArcPath(startAngle, sweepAngle, radius)}
                stroke={isDimmed ? segment.color + '60' : segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                fill="none"
                onPress={() => handleSegmentPress(segment)}
                onLongPress={() => handleSegmentLongPress(segment)}
                delayLongPress={400}
              />
            );
          })}

          {/* Selected segment - rendered on top */}
          {selectedSegment && segments[selectedSegment.index] && !deletingSegmentId && (() => {
            const segment = segments[selectedSegment.index];
            const { startAngle, sweepAngle } = segment;

            return (
              <Path
                d={createArcPath(startAngle, sweepAngle, radius)}
                stroke={segment.color}
                strokeWidth={expandedStrokeWidth}
                strokeLinecap="butt"
                fill="none"
                onPress={() => handleSegmentPress(segment)}
                onLongPress={() => handleSegmentLongPress(segment)}
                delayLongPress={400}
              />
            );
          })()}

          {/* Deleting segment - animated grow and pop-off */}
          {deletingSegmentId && (() => {
            const deletingSegment = segments.find(s => s.entry.id === deletingSegmentId);
            if (!deletingSegment) return null;

            // Interpolate values for animation
            const animatedStrokeWidth = deleteAnimProgress.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [strokeWidth, strokeWidth + 8, strokeWidth + 4],
            });

            const animatedRadius = deleteAnimProgress.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [radius, radius, radius + 20],
            });

            const animatedOpacity = deleteAnimProgress.interpolate({
              inputRange: [0, 0.4, 0.7, 1],
              outputRange: [1, 1, 0.5, 0],
            });

            // We need to listen to the animated values to update the path
            // Since Path d can't be animated directly, we use the current radius for the path
            // and animate strokeWidth/opacity for the visual effect
            return (
              <AnimatedPath
                d={createArcPath(deletingSegment.startAngle, deletingSegment.sweepAngle, radius)}
                stroke={deletingSegment.color}
                strokeWidth={animatedStrokeWidth}
                strokeLinecap="butt"
                fill="none"
                opacity={animatedOpacity}
              />
            );
          })()}

          {/* If no entries but has progress, show single arc (but not right after deletion) */}
          {entries.length === 0 && animatedProgress > 0 && !justDeletedId && (
            <Path
              d={createArcPath(-90, Math.min(animatedProgress / 100, 1) * 360, radius)}
              stroke={goalMet ? colors.success : colors.primary}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              fill="none"
            />
          )}
        </Svg>
      </View>

      <View style={[styles.textContainer, { width: svgSize, height: svgSize }]}>
        <View style={styles.centerContent}>
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
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
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
