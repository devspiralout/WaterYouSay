import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

interface StravaActivityIconProps {
  activityType: string;
  size?: number;
  color?: string;
}

export function StravaActivityIcon({
  activityType,
  size = 32,
  color = '#FC4C02'
}: StravaActivityIconProps) {
  const type = activityType.toLowerCase();

  // Running
  if (type.includes('run') || type.includes('trail')) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Runner figure */}
          <Circle cx="20" cy="5" r="3" fill={color} />
          <Path
            d="M12 28 L16 20 L14 14 L18 12 L22 14 L20 10 L24 8"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M16 20 L22 22 L26 28"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  // Cycling/Ride
  if (type.includes('ride') || type.includes('cycling') || type.includes('bike')) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Bike wheels */}
          <Circle cx="8" cy="22" r="5" stroke={color} strokeWidth="2" fill="none" />
          <Circle cx="24" cy="22" r="5" stroke={color} strokeWidth="2" fill="none" />
          {/* Frame */}
          <Path
            d="M8 22 L14 14 L20 14 L24 22 M14 14 L16 22 L24 22 M14 14 L14 10"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Handlebars */}
          <Path
            d="M12 10 L16 10"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  // Swimming
  if (type.includes('swim')) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Swimmer */}
          <Circle cx="8" cy="14" r="3" fill={color} />
          <Path
            d="M10 14 L20 14 L26 12"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M14 14 L12 18"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Waves */}
          <Path
            d="M4 22 Q8 19 12 22 Q16 25 20 22 Q24 19 28 22"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity={0.6}
          />
        </Svg>
      </View>
    );
  }

  // Walking/Hiking
  if (type.includes('walk') || type.includes('hike')) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Walker figure */}
          <Circle cx="16" cy="5" r="3" fill={color} />
          <Path
            d="M16 8 L16 18 M16 18 L12 28 M16 18 L20 28"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M10 12 L16 14 L22 12"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  // Yoga/Pilates
  if (type.includes('yoga') || type.includes('pilates')) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Yoga pose */}
          <Circle cx="16" cy="6" r="3" fill={color} />
          <Path
            d="M16 9 L16 18 M8 14 L16 12 L24 14 M12 28 L16 18 L20 28"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  // Weight Training/Workout
  if (type.includes('weight') || type.includes('workout') || type.includes('crossfit')) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Dumbbell */}
          <Rect x="4" y="12" width="4" height="8" rx="1" fill={color} />
          <Rect x="24" y="12" width="4" height="8" rx="1" fill={color} />
          <Rect x="7" y="14" width="3" height="4" fill={color} />
          <Rect x="22" y="14" width="3" height="4" fill={color} />
          <Line x1="10" y1="16" x2="22" y2="16" stroke={color} strokeWidth="3" />
        </Svg>
      </View>
    );
  }

  // Default - generic activity icon
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {/* Lightning bolt / activity */}
        <Path
          d="M18 4 L10 16 L14 16 L12 28 L22 14 L17 14 L20 4 Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
