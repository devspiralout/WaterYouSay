import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, ThemeMode, LIGHT_COLORS, DARK_COLORS } from '../constants';
import { useWater } from './WaterContext';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { state } = useWater();
  const themeMode = state.settings.themeMode || 'system';

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
