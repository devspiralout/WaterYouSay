import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Wave cycle width - the animation will translate by this amount for seamless loop
const WAVE_CYCLE = 120;
const SVG_WIDTH = SCREEN_WIDTH + WAVE_CYCLE * 2;

interface WaterBackgroundProps {
  progress: number; // 0-100
}

export function WaterBackground({ progress }: WaterBackgroundProps) {
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // Calculate water height (inverted - 0% = bottom, 100% = top)
  const waterHeight = (clampedProgress / 100) * SCREEN_HEIGHT;

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
  const createWavePath = (offset: number, svgHeight: number) => {
    const amplitude = 10;
    const wavelength = WAVE_CYCLE;
    let path = `M 0 ${amplitude}`;

    for (let x = 0; x <= SVG_WIDTH; x += 4) {
      const y = amplitude * Math.sin((x / wavelength) * Math.PI * 2 + offset);
      path += ` L ${x} ${y + amplitude}`;
    }

    path += ` L ${SVG_WIDTH} ${svgHeight} L 0 ${svgHeight} Z`;
    return path;
  };

  // Both waves move in the same direction (right) by translating from -WAVE_CYCLE to 0
  // This creates seamless looping since the wave pattern repeats every WAVE_CYCLE pixels
  const translateX1 = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-WAVE_CYCLE, 0],
  });

  const translateX2 = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [-WAVE_CYCLE, 0],
  });

  const wave1Height = waterHeight + 25;
  const wave2Height = waterHeight + 18;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.waterContainer,
          {
            height: wave1Height,
            bottom: 0,
            transform: [{ translateX: translateX1 }],
          },
        ]}
      >
        <Svg
          width={SVG_WIDTH}
          height={wave1Height}
          style={styles.wave}
        >
          <Path
            d={createWavePath(0, wave1Height)}
            fill={clampedProgress >= 100 ? COLORS.success + '25' : COLORS.primary + '15'}
          />
        </Svg>
      </Animated.View>

      {/* Second wave layer for depth */}
      <Animated.View
        style={[
          styles.waterContainer,
          {
            height: wave2Height,
            bottom: 0,
            transform: [{ translateX: translateX2 }],
          },
        ]}
      >
        <Svg
          width={SVG_WIDTH}
          height={wave2Height}
          style={styles.wave}
        >
          <Path
            d={createWavePath(Math.PI / 3, wave2Height)}
            fill={clampedProgress >= 100 ? COLORS.success + '18' : COLORS.primary + '10'}
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
  },
  wave: {
    position: 'absolute',
    top: 0,
  },
});
