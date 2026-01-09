import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CelebrationSplashProps {
  visible: boolean;
  onDismiss: () => void;
}

interface Droplet {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  targetY: number;
  targetX: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CelebrationSplash({ visible, onDismiss }: CelebrationSplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [droplets] = useState<Droplet[]>(() => generateDroplets());

  function generateDroplets(): Droplet[] {
    const drops: Droplet[] = [];
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;

    // Create droplets that burst outward from center
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
      const distance = 150 + Math.random() * 250;
      drops.push({
        id: i,
        x: centerX,
        y: centerY,
        size: 8 + Math.random() * 20,
        delay: Math.random() * 200,
        duration: 600 + Math.random() * 400,
        targetX: centerX + Math.cos(angle) * distance,
        targetY: centerY + Math.sin(angle) * distance,
      });
    }

    // Add some extra droplets from top
    for (let i = 30; i < 50; i++) {
      drops.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: -50,
        size: 10 + Math.random() * 25,
        delay: Math.random() * 300,
        duration: 800 + Math.random() * 500,
        targetX: Math.random() * SCREEN_WIDTH,
        targetY: SCREEN_HEIGHT * 0.3 + Math.random() * SCREEN_HEIGHT * 0.5,
      });
    }

    return drops;
  }

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto dismiss after animation
      const timer = setTimeout(() => {
        handleDismiss();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={styles.touchable}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        {visible && (
          <>
            {/* Droplets */}
            {droplets.map((droplet) => (
              <DropletAnimation key={droplet.id} droplet={droplet} />
            ))}

            {/* Center splash ring */}
            <SplashRing />

            {/* Celebration text */}
            <Animated.View style={styles.textContainer}>
              <Text style={styles.celebrationText}>Goal Reached!</Text>
              <Text style={styles.subText}>Great job staying hydrated</Text>
            </Animated.View>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function DropletAnimation({ droplet }: { droplet: Droplet }) {
  const posX = useRef(new Animated.Value(droplet.x)).current;
  const posY = useRef(new Animated.Value(droplet.y)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animations = Animated.parallel([
      Animated.sequence([
        Animated.delay(droplet.delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(droplet.delay),
        Animated.timing(posX, {
          toValue: droplet.targetX,
          duration: droplet.duration,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(droplet.delay),
        Animated.timing(posY, {
          toValue: droplet.targetY,
          duration: droplet.duration,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(droplet.delay),
        Animated.timing(scale, {
          toValue: 1,
          duration: droplet.duration * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: droplet.duration * 0.5,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(droplet.delay + droplet.duration * 0.7),
        Animated.timing(opacity, {
          toValue: 0,
          duration: droplet.duration * 0.3,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animations.start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.droplet,
        {
          width: droplet.size,
          height: droplet.size,
          borderRadius: droplet.size / 2,
          opacity,
          transform: [
            { translateX: Animated.subtract(posX, droplet.size / 2) },
            { translateY: Animated.subtract(posY, droplet.size / 2) },
            { scale },
          ],
        },
      ]}
    />
  );
}

function SplashRing() {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 3,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.splashRing,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    zIndex: 1000,
  },
  touchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  droplet: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    opacity: 0.8,
  },
  splashRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.primary,
    top: SCREEN_HEIGHT / 2 - 50,
    left: SCREEN_WIDTH / 2 - 50,
  },
  textContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  celebrationText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
