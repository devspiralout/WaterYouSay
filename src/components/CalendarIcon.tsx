import React from 'react';
import Svg, { Rect, Line, Circle } from 'react-native-svg';

interface CalendarIconProps {
  size?: number;
  color: string;
}

export function CalendarIcon({ size = 24, color }: CalendarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Calendar body */}
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="3"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Top line */}
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      {/* Hanging loops */}
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Date dots */}
      <Circle cx="8" cy="14" r="1.5" fill={color} />
      <Circle cx="12" cy="14" r="1.5" fill={color} />
      <Circle cx="16" cy="14" r="1.5" fill={color} />
      <Circle cx="8" cy="18" r="1.5" fill={color} />
      <Circle cx="12" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}
