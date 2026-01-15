import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';

interface WeatherAnimationProps {
  temperature: number;
  size?: number;
}

const AnimatedG = Animated.createAnimatedComponent(G);

export function WeatherAnimation({ temperature, size = 40 }: WeatherAnimationProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const driftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sun ray rotation for hot weather
    if (temperature >= 25) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }

    // Pulse animation for warm weather
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wave animation for wind
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Cloud drift animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(driftAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [temperature]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const drift = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  // Hot weather (30°C+) - Bright sun with rotating rays
  if (temperature >= 30) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Svg width={size} height={size} viewBox="0 0 40 40">
            {/* Sun core */}
            <Circle cx="20" cy="20" r="8" fill="#FF9500" />
            <Circle cx="20" cy="20" r="6" fill="#FFCC00" />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.raysContainer, { transform: [{ rotate: spin }] }]}>
          <Svg width={size} height={size} viewBox="0 0 40 40">
            {/* Animated rays */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <Line
                key={i}
                x1="20"
                y1="4"
                x2="20"
                y2="9"
                stroke="#FF9500"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${angle} 20 20)`}
              />
            ))}
          </Svg>
        </Animated.View>
      </View>
    );
  }

  // Warm weather (20-30°C) - Sun with gentle pulse
  if (temperature >= 20) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Svg width={size} height={size} viewBox="0 0 40 40">
            {/* Sun */}
            <Circle cx="20" cy="20" r="10" fill="#FFCC00" />
            <Circle cx="20" cy="20" r="7" fill="#FFD60A" />
            {/* Static rays */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <Line
                key={i}
                x1="20"
                y1="5"
                x2="20"
                y2="8"
                stroke="#FFCC00"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${angle} 20 20)`}
              />
            ))}
          </Svg>
        </Animated.View>
      </View>
    );
  }

  // Mild weather (10-20°C) - Cloud with sun peeking
  if (temperature >= 10) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 40 40">
          {/* Sun behind */}
          <Circle cx="28" cy="14" r="7" fill="#FFCC00" opacity={0.8} />
        </Svg>
        <Animated.View style={[styles.cloudContainer, { transform: [{ translateX: drift }] }]}>
          <Svg width={size} height={size} viewBox="0 0 40 40">
            {/* Cloud */}
            <Path
              d="M10 28 C6 28 4 24 6 21 C4 18 6 14 10 14 C11 10 16 8 20 10 C24 8 30 10 30 16 C34 16 36 20 34 24 C36 27 34 30 30 30 L10 30 C8 30 6 28 10 28"
              fill="#E5E5EA"
            />
            <Path
              d="M12 26 C9 26 7 23 9 21 C8 19 9 16 12 16 C13 13 17 12 20 13 C23 11 27 13 27 17 C30 17 31 20 30 22 C31 24 30 26 27 26 L12 26"
              fill="#F2F2F7"
            />
          </Svg>
        </Animated.View>
      </View>
    );
  }

  // Cool weather (<10°C) - Wind/breeze lines
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={{ transform: [{ translateX: drift }] }}>
        <Svg width={size} height={size} viewBox="0 0 40 40">
          {/* Wind lines */}
          <Path
            d="M4 14 Q12 14 16 10 Q18 8 20 10"
            stroke="#8E8E93"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M2 20 Q14 20 22 20 Q28 20 30 16"
            stroke="#8E8E93"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M6 26 Q16 26 24 26 Q30 26 32 30"
            stroke="#8E8E93"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Snowflake hint */}
          <Circle cx="34" cy="12" r="2" fill="#8E8E93" opacity={0.5} />
          <Circle cx="36" cy="20" r="1.5" fill="#8E8E93" opacity={0.4} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  raysContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cloudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
