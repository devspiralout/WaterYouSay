import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface WaterDropIconProps {
  size?: number;
  color: string;
}

export function WaterDropIcon({ size = 24, color }: WaterDropIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Water drop shape */}
      <Path
        d="M12 2.5c0 0-6.5 7.5-6.5 12a6.5 6.5 0 0 0 13 0c0-4.5-6.5-12-6.5-12z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Highlight reflection */}
      <Path
        d="M9 14.5c0 1.5 1.5 2.5 3 2.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
    </Svg>
  );
}
