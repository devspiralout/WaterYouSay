import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface TrophyIconProps {
  size?: number;
  color: string;
}

export function TrophyIcon({ size = 24, color }: TrophyIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cup body */}
      <Path
        d="M6 4h12v6c0 3.314-2.686 6-6 6s-6-2.686-6-6V4z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Left handle */}
      <Path
        d="M6 6H4a2 2 0 0 0-2 2v1a3 3 0 0 0 3 3h1"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right handle */}
      <Path
        d="M18 6h2a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3h-1"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Stem */}
      <Rect
        x="10"
        y="16"
        width="4"
        height="3"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Base */}
      <Rect
        x="7"
        y="19"
        width="10"
        height="2"
        rx="1"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Star decoration */}
      <Circle cx="12" cy="9" r="1.5" fill={color} />
    </Svg>
  );
}
