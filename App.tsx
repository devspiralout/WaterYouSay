import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WaterProvider, useWater } from './src/context/WaterContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';
// Achievement screen hidden for now
// import { AchievementsScreen } from './src/screens/AchievementsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
// Achievement features hidden for now
// import { AchievementUnlockModal } from './src/components/AchievementUnlockModal';
// import { ACHIEVEMENTS } from './src/constants';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide tab bar - navigation via header icons
      }}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      {/* Awards screen hidden for now */}
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { state } = useWater();
  const { isDark } = useTheme();

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {state.settings.onboardingComplete ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Achievement modal hidden for now */}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WaterProvider>
        <ThemeProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </WaterProvider>
    </SafeAreaProvider>
  );
}
