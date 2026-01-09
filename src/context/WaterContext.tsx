import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  AppState,
  WaterContextType,
  UserProfile,
  UnitSystem,
  WaterEntry,
  DailyLog,
} from '../types';
import { DEFAULT_DAILY_GOAL_ML } from '../constants';
import {
  saveProfile,
  loadProfile,
  saveSettings,
  loadSettings,
  saveTodayLog,
  loadTodayLog,
  loadHistory,
} from '../utils/storage';
import { getTodayDateString, generateEntryId, calculateDailyWaterGoal } from '../utils/calculations';

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_WATER'; payload: { amountMl: number } }
  | { type: 'REMOVE_ENTRY'; payload: { entryId: string } }
  | { type: 'SET_PROFILE'; payload: { profile: UserProfile } }
  | { type: 'SET_DAILY_GOAL'; payload: { goalMl: number } }
  | { type: 'SET_UNIT_SYSTEM'; payload: { system: UnitSystem } }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' };

const initialState: AppState = {
  profile: null,
  settings: {
    unitSystem: 'metric',
    dailyGoalMl: DEFAULT_DAILY_GOAL_ML,
    onboardingComplete: false,
  },
  todayLog: {
    date: getTodayDateString(),
    entries: [],
    totalMl: 0,
  },
  history: [],
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

    default:
      return state;
  }
}

const WaterContext = createContext<WaterContextType | undefined>(undefined);

export function WaterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load saved data on mount
  useEffect(() => {
    async function loadSavedData() {
      const [profile, settings, todayLog, history] = await Promise.all([
        loadProfile(),
        loadSettings(),
        loadTodayLog(getTodayDateString()),
        loadHistory(),
      ]);

      dispatch({
        type: 'LOAD_STATE',
        payload: {
          profile,
          settings,
          todayLog,
          history,
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

  const contextValue: WaterContextType = {
    state,
    addWater: (amountMl: number) => {
      dispatch({ type: 'ADD_WATER', payload: { amountMl } });
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
    completeOnboarding: () => {
      dispatch({ type: 'COMPLETE_ONBOARDING' });
    },
    resetOnboarding: () => {
      dispatch({ type: 'RESET_ONBOARDING' });
    },
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
