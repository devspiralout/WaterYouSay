import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import {
  AppState,
  WaterContextType,
  UserProfile,
  UnitSystem,
  ReminderSettings,
  ThemeMode,
  WaterEntry,
  DailyLog,
  HistoryEntry,
  AchievementId,
  UnlockedAchievement,
  ClimateAdjustmentInfo,
} from '../types';
import { fetchWeather, calculateClimateAdjustment, getAdjustedGoal } from '../utils/weather';
import { DEFAULT_DAILY_GOAL_ML } from '../constants';
import {
  saveProfile,
  loadProfile,
  saveSettings,
  loadSettings,
  saveTodayLog,
  loadTodayLog,
  loadHistory,
  saveHistory,
  loadAchievements,
  saveAchievements,
} from '../utils/storage';
import { getTodayDateString, generateEntryId, calculateDailyWaterGoal } from '../utils/calculations';
import { generateMockTodayLog, generateMockHistory } from '../utils/mockData';
import { checkAchievements } from '../utils/achievements';

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_WATER'; payload: { amountMl: number } }
  | { type: 'REMOVE_ENTRY'; payload: { entryId: string } }
  | { type: 'SET_PROFILE'; payload: { profile: UserProfile } }
  | { type: 'SET_DAILY_GOAL'; payload: { goalMl: number } }
  | { type: 'SET_UNIT_SYSTEM'; payload: { system: UnitSystem } }
  | { type: 'SET_REMINDERS'; payload: { reminders: ReminderSettings } }
  | { type: 'SET_QUICK_ADD_AMOUNTS'; payload: { amounts: number[] } }
  | { type: 'SET_SOUND_ENABLED'; payload: { enabled: boolean } }
  | { type: 'SET_THEME_MODE'; payload: { mode: ThemeMode } }
  | { type: 'SET_CLIMATE_ENABLED'; payload: { enabled: boolean } }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'CLEAR_TODAY' }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: { id: AchievementId } }
  | { type: 'LOAD_MOCK_DATA'; payload: { todayLog: DailyLog; history: HistoryEntry[] } };

const initialState: AppState = {
  profile: null,
  settings: {
    unitSystem: 'metric',
    dailyGoalMl: DEFAULT_DAILY_GOAL_ML,
    onboardingComplete: false,
    reminders: {
      enabled: false,
      intervalHours: 2,
      startHour: 8,
      endHour: 22,
    },
    quickAddAmounts: [100, 250, 500],
    soundEnabled: true,
    themeMode: 'system',
    climate: {
      enabled: true, // On by default
    },
  },
  todayLog: {
    date: getTodayDateString(),
    entries: [],
    totalMl: 0,
  },
  history: [],
  unlockedAchievements: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    case 'ADD_WATER': {
      const newEntry: WaterEntry = {
        id: generateEntryId(),
        amountMl: action.payload.amountMl,
        timestamp: new Date().toISOString(),
      };
      const newEntries = [...state.todayLog.entries, newEntry];
      const newTotal = state.todayLog.totalMl + action.payload.amountMl;
      return {
        ...state,
        todayLog: {
          ...state.todayLog,
          entries: newEntries,
          totalMl: newTotal,
        },
      };
    }

    case 'REMOVE_ENTRY': {
      const entry = state.todayLog.entries.find(e => e.id === action.payload.entryId);
      if (!entry) return state;
      const newEntries = state.todayLog.entries.filter(e => e.id !== action.payload.entryId);
      const newTotal = Math.max(0, state.todayLog.totalMl - entry.amountMl);
      return {
        ...state,
        todayLog: {
          ...state.todayLog,
          entries: newEntries,
          totalMl: newTotal,
        },
      };
    }

    case 'SET_PROFILE': {
      const { profile } = action.payload;
      let newGoal = state.settings.dailyGoalMl;
      if (profile.useCalculatedGoal) {
        newGoal = calculateDailyWaterGoal(profile);
      }
      return {
        ...state,
        profile,
        settings: {
          ...state.settings,
          dailyGoalMl: newGoal,
        },
      };
    }

    case 'SET_DAILY_GOAL':
      return {
        ...state,
        settings: {
          ...state.settings,
          dailyGoalMl: action.payload.goalMl,
        },
      };

    case 'SET_UNIT_SYSTEM':
      return {
        ...state,
        settings: {
          ...state.settings,
          unitSystem: action.payload.system,
        },
      };

    case 'SET_REMINDERS':
      return {
        ...state,
        settings: {
          ...state.settings,
          reminders: action.payload.reminders,
        },
      };

    case 'SET_QUICK_ADD_AMOUNTS':
      return {
        ...state,
        settings: {
          ...state.settings,
          quickAddAmounts: action.payload.amounts,
        },
      };

    case 'SET_SOUND_ENABLED':
      return {
        ...state,
        settings: {
          ...state.settings,
          soundEnabled: action.payload.enabled,
        },
      };

    case 'SET_THEME_MODE':
      return {
        ...state,
        settings: {
          ...state.settings,
          themeMode: action.payload.mode,
        },
      };

    case 'SET_CLIMATE_ENABLED':
      return {
        ...state,
        settings: {
          ...state.settings,
          climate: {
            ...state.settings.climate,
            enabled: action.payload.enabled,
          },
        },
      };

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        settings: {
          ...state.settings,
          onboardingComplete: true,
        },
      };

    case 'RESET_ONBOARDING':
      return {
        ...state,
        profile: null,
        settings: {
          ...state.settings,
          onboardingComplete: false,
        },
      };

    case 'CLEAR_TODAY':
      return {
        ...state,
        todayLog: {
          date: getTodayDateString(),
          entries: [],
          totalMl: 0,
        },
      };

    case 'UNLOCK_ACHIEVEMENT': {
      // Don't add if already unlocked
      if (state.unlockedAchievements.find(a => a.id === action.payload.id)) {
        return state;
      }
      const newAchievement: UnlockedAchievement = {
        id: action.payload.id,
        unlockedAt: new Date().toISOString(),
      };
      return {
        ...state,
        unlockedAchievements: [...state.unlockedAchievements, newAchievement],
      };
    }

    case 'LOAD_MOCK_DATA':
      return {
        ...state,
        todayLog: action.payload.todayLog,
        history: action.payload.history,
      };

    default:
      return state;
  }
}

const WaterContext = createContext<WaterContextType | undefined>(undefined);

export function WaterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [pendingAchievement, setPendingAchievement] = useState<AchievementId | null>(null);
  const [climateAdjustment, setClimateAdjustment] = useState<ClimateAdjustmentInfo | null>(null);

  // Load saved data on mount
  useEffect(() => {
    async function loadSavedData() {
      const [profile, settings, todayLog, history, unlockedAchievements] = await Promise.all([
        loadProfile(),
        loadSettings(),
        loadTodayLog(getTodayDateString()),
        loadHistory(),
        loadAchievements(),
      ]);

      dispatch({
        type: 'LOAD_STATE',
        payload: {
          profile,
          settings,
          todayLog,
          history,
          unlockedAchievements,
        },
      });
    }
    loadSavedData();
  }, []);

  // Save profile when it changes
  useEffect(() => {
    if (state.profile) {
      saveProfile(state.profile);
    }
  }, [state.profile]);

  // Save settings when they change
  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  // Save today's log when it changes
  useEffect(() => {
    saveTodayLog(state.todayLog);
  }, [state.todayLog]);

  // Save achievements when they change
  useEffect(() => {
    if (state.unlockedAchievements.length > 0) {
      saveAchievements(state.unlockedAchievements);
    }
  }, [state.unlockedAchievements]);

  // Check for new achievements when relevant state changes
  useEffect(() => {
    const newAchievements = checkAchievements({
      todayLog: state.todayLog,
      history: state.history,
      dailyGoalMl: state.settings.dailyGoalMl,
      unlockedAchievements: state.unlockedAchievements,
    });

    // Unlock each new achievement and queue first one for display
    if (newAchievements.length > 0) {
      newAchievements.forEach(id => {
        dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: { id } });
      });
      // Show popup for the first new achievement
      if (!pendingAchievement) {
        setPendingAchievement(newAchievements[0]);
      }
    }
  }, [state.todayLog, state.history, state.settings.dailyGoalMl, state.unlockedAchievements, pendingAchievement]);

  // Fetch weather and calculate climate adjustment
  const refreshClimate = async () => {
    const { climate, dailyGoalMl } = state.settings;

    if (!climate.enabled) {
      setClimateAdjustment(null);
      return;
    }

    const weather = await fetchWeather();
    if (weather) {
      const adjustment = calculateClimateAdjustment(weather);
      const adjustedGoal = getAdjustedGoal(dailyGoalMl, adjustment);

      setClimateAdjustment({
        percentage: adjustment.percentage,
        reason: adjustment.reason,
        temperature: adjustment.temperature,
        temperatureHigh: weather.temperatureHigh,
        temperatureLow: weather.temperatureLow,
        locationName: weather.locationName,
        adjustedGoalMl: adjustedGoal,
      });
    } else {
      setClimateAdjustment(null);
    }
  };

  // Refresh climate on mount and when settings change
  useEffect(() => {
    if (state.settings.climate.enabled) {
      refreshClimate();
    } else {
      setClimateAdjustment(null);
    }
  }, [state.settings.climate.enabled, state.settings.dailyGoalMl]);

  // Calculate max allowed intake (150% of effective goal)
  const effectiveGoal = climateAdjustment?.adjustedGoalMl ?? state.settings.dailyGoalMl;
  const maxDailyIntake = Math.round(effectiveGoal * 1.5);

  const contextValue: WaterContextType = {
    state,
    addWater: (amountMl: number) => {
      const currentTotal = state.todayLog.totalMl;
      const remainingAllowed = maxDailyIntake - currentTotal;

      if (remainingAllowed <= 0) {
        // Already at limit, don't add
        return;
      }

      // Cap the amount if it would exceed the limit
      const actualAmount = Math.min(amountMl, remainingAllowed);
      dispatch({ type: 'ADD_WATER', payload: { amountMl: actualAmount } });
    },
    removeEntry: (entryId: string) => {
      dispatch({ type: 'REMOVE_ENTRY', payload: { entryId } });
    },
    setProfile: (profile: UserProfile) => {
      dispatch({ type: 'SET_PROFILE', payload: { profile } });
    },
    setDailyGoal: (goalMl: number) => {
      dispatch({ type: 'SET_DAILY_GOAL', payload: { goalMl } });
    },
    setUnitSystem: (system: UnitSystem) => {
      dispatch({ type: 'SET_UNIT_SYSTEM', payload: { system } });
    },
    setReminders: (reminders: ReminderSettings) => {
      dispatch({ type: 'SET_REMINDERS', payload: { reminders } });
    },
    setQuickAddAmounts: (amounts: number[]) => {
      dispatch({ type: 'SET_QUICK_ADD_AMOUNTS', payload: { amounts } });
    },
    setSoundEnabled: (enabled: boolean) => {
      dispatch({ type: 'SET_SOUND_ENABLED', payload: { enabled } });
    },
    setThemeMode: (mode: ThemeMode) => {
      dispatch({ type: 'SET_THEME_MODE', payload: { mode } });
    },
    setClimateEnabled: (enabled: boolean) => {
      dispatch({ type: 'SET_CLIMATE_ENABLED', payload: { enabled } });
    },
    climateAdjustment,
    refreshClimate,
    completeOnboarding: () => {
      dispatch({ type: 'COMPLETE_ONBOARDING' });
    },
    resetOnboarding: () => {
      dispatch({ type: 'RESET_ONBOARDING' });
    },
    clearToday: () => {
      dispatch({ type: 'CLEAR_TODAY' });
    },
    unlockAchievement: (id: AchievementId) => {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: { id } });
    },
    pendingAchievement,
    clearPendingAchievement: () => {
      setPendingAchievement(null);
    },
    loadMockData: async (todayEntries: number, historyDays: number) => {
      const todayLog = generateMockTodayLog(todayEntries);
      const history = generateMockHistory(historyDays, state.settings.dailyGoalMl);

      // Save to storage
      await saveTodayLog(todayLog);
      await saveHistory(history);

      dispatch({ type: 'LOAD_MOCK_DATA', payload: { todayLog, history } });
    },
    dailyLimitMl: maxDailyIntake,
    isAtDailyLimit: state.todayLog.totalMl >= maxDailyIntake,
  };

  return (
    <WaterContext.Provider value={contextValue}>
      {children}
    </WaterContext.Provider>
  );
}

export function useWater(): WaterContextType {
  const context = useContext(WaterContext);
  if (!context) {
    throw new Error('useWater must be used within a WaterProvider');
  }
  return context;
}
