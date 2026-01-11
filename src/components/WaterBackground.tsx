import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Wave cycle width - the animation will translate by this amount for seamless loop
const WAVE_CYCLE = 120;
const SVG_WIDTH = SCREEN_WIDTH + WAVE_CYCLE * 2;
const SVG_HEIGHT = SCREEN_HEIGHT + 30;

interface WaterBackgroundProps {
  progress: number; // 0-100
}

export function WaterBackground({ progress }: WaterBackgroundProps) {
  const { colors } = useTheme();
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // Animate water level smoothly when progress changes
  useEffect(() => {
    // Calculate how far down the water should be (0% = at bottom/SCREEN_HEIGHT, 100% = at top/0)
    const targetY = SCREEN_HEIGHT - (clampedProgress / 100) * SCREEN_HEIGHT;
    Animated.timing(riseAnim, {
      toValue: targetY,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [clampedProgress, riseAnim]);

  useEffect(() => {
    // First wave - moves right
    const animation1 = Animated.loop(
      Animated.timing(waveAnim1, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Second wave - moves right but slower for parallax
    const animation2 = Animated.loop(
      Animated.timing(waveAnim2, {
        toValue: 1,
        duration: 5500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation1.start();
    animation2.start();

    return () => {
      animation1.stop();
      animation2.stop();
    };
  }, [waveAnim1, waveAnim2]);

  // Wave path generator - creates a repeating wave pattern
  const createWavePath = (offset: number) => {
    const amplitude = 10;
    const wavelength = WAVE_CYCLE;
    let path = `M 0 ${amplitude}`;

    for (let x = 0; x <= SVG_WIDTH; x += 4) {
      const y = amplitude * Math.sin((x / wavelength) * Math.PI * 2 + offset);
      path += ` L ${x} ${y + amplitude}`;
    }

    path += ` L ${SVG_WIDTH} ${SVG_HEIGHT} L 0 ${SVG_HEIGHT} Z`;
    return path;
  };

  // Both waves move in the same direction (right) by translating from -WAVE_CYCLE to 0
  const translateX1 = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-WAVE_CYCLE, 0],
  });

  const translateX2 = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [-WAVE_CYCLE, 0],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.waterContainer,
          {
            transform: [
              { translateY: riseAnim },
              { translateX: translateX1 },
            ],
          },
        ]}
      >
        <Svg width={SVG_WIDTH} height={SVG_HEIGHT}>
          <Path
            d={createWavePath(0)}
            fill={colors.primary + '15'}
          />
        </Svg>
      </Animated.View>

      {/* Second wave layer for depth */}
      <Animated.View
        style={[
          styles.waterContainer,
          styles.wave2Offset,
          {
            transform: [
              { translateY: riseAnim },
              { translateX: translateX2 },
            ],
          },
        ]}
      >
        <Svg width={SVG_WIDTH} height={SVG_HEIGHT}>
          <Path
            d={createWavePath(Math.PI / 3)}
            fill={colors.primary + '10'}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  waterContainer: {
    position: 'absolute',
    left: -WAVE_CYCLE,
    top: 0,
  },
  wave2Offset: {
    top: 7, // Slight offset for second wave
  },
});
