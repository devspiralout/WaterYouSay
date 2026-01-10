import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Achievement } from '../types';

interface AchievementUnlockModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementUnlockModal({
  visible,
  achievement,
  onDismiss,
}: AchievementUnlockModalProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleDismiss}
        >
          <Animated.View
            style={[
              styles.content,
              {
                backgroundColor: colors.surface,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.label}>Achievement Unlocked!</Text>
            <Text style={styles.icon}>{achievement.icon}</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              {achievement.title}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {achievement.description}
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleDismiss}
            >
              <Text style={styles.buttonText}>Awesome!</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
