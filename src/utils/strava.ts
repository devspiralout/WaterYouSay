import * as SecureStore from 'expo-secure-store';
import { StravaAdjustmentInfo } from '../types';
import { STRAVA_ACTIVITY_MULTIPLIERS } from '../constants';

const STRAVA_ACCESS_TOKEN_KEY = 'strava_access_token';
const STRAVA_REFRESH_TOKEN_KEY = 'strava_refresh_token';
const STRAVA_TOKEN_EXPIRY_KEY = 'strava_token_expiry';
const STRAVA_CACHE_KEY = 'strava_activities_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  moving_time: number; // in seconds
  elapsed_time: number; // in seconds
  distance: number; // in meters
  start_date: string; // ISO date
  start_date_local: string;
}

interface CachedActivities {
  activities: StravaActivity[];
  cachedAt: number;
}

// Token Management

export async function saveStravaTokens(tokens: StravaTokens): Promise<void> {
  try {
    await SecureStore.setItemAsync(STRAVA_ACCESS_TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(STRAVA_REFRESH_TOKEN_KEY, tokens.refreshToken);
    await SecureStore.setItemAsync(STRAVA_TOKEN_EXPIRY_KEY, tokens.expiresAt.toString());
  } catch (error) {
    console.error('Error saving Strava tokens:', error);
    throw error;
  }
}

export async function getStravaTokens(): Promise<StravaTokens | null> {
  try {
    const accessToken = await SecureStore.getItemAsync(STRAVA_ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(STRAVA_REFRESH_TOKEN_KEY);
    const expiresAtStr = await SecureStore.getItemAsync(STRAVA_TOKEN_EXPIRY_KEY);

    if (!accessToken || !refreshToken || !expiresAtStr) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAtStr, 10),
    };
  } catch (error) {
    console.error('Error getting Strava tokens:', error);
    return null;
  }
}

export async function clearStravaTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STRAVA_ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(STRAVA_REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(STRAVA_TOKEN_EXPIRY_KEY);
    await clearStravaCache();
  } catch (error) {
    console.error('Error clearing Strava tokens:', error);
  }
}

export async function refreshStravaToken(
  clientId: string,
  clientSecret: string
): Promise<StravaTokens | null> {
  const tokens = await getStravaTokens();
  if (!tokens) {
    return null;
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Strava token:', response.status);
      return null;
    }

    const data = await response.json();
    const newTokens: StravaTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };

    await saveStravaTokens(newTokens);
    return newTokens;
  } catch (error) {
    console.error('Error refreshing Strava token:', error);
    return null;
  }
}

async function getValidAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const tokens = await getStravaTokens();
  if (!tokens) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  const now = Math.floor(Date.now() / 1000);
  if (tokens.expiresAt < now + 300) {
    const refreshedTokens = await refreshStravaToken(clientId, clientSecret);
    return refreshedTokens?.accessToken || null;
  }

  return tokens.accessToken;
}

// Cache Management

async function getCachedActivities(): Promise<StravaActivity[] | null> {
  try {
    const cached = await SecureStore.getItemAsync(STRAVA_CACHE_KEY);
    if (!cached) return null;

    const { activities, cachedAt }: CachedActivities = JSON.parse(cached);

    // Check if cache is still valid
    if (Date.now() - cachedAt < CACHE_DURATION_MS) {
      return activities;
    }

    return null;
  } catch {
    return null;
  }
}

async function cacheActivities(activities: StravaActivity[]): Promise<void> {
  try {
    const cached: CachedActivities = {
      activities,
      cachedAt: Date.now(),
    };
    await SecureStore.setItemAsync(STRAVA_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching Strava activities:', error);
  }
}

async function clearStravaCache(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STRAVA_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing Strava cache:', error);
  }
}

// API Functions

export async function fetchTodayActivities(
  clientId: string,
  clientSecret: string
): Promise<StravaActivity[] | null> {
  // Check cache first
  const cached = await getCachedActivities();
  if (cached) {
    return cached;
  }

  const accessToken = await getValidAccessToken(clientId, clientSecret);
  if (!accessToken) {
    return null;
  }

  try {
    // Get start of today in epoch seconds (local timezone)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const afterTimestamp = Math.floor(startOfDay.getTime() / 1000);

    const url = `${STRAVA_API_BASE}/athlete/activities?after=${afterTimestamp}&per_page=50`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Strava activities:', response.status);
      return null;
    }

    const activities: StravaActivity[] = await response.json();

    // Cache the result
    await cacheActivities(activities);

    return activities;
  } catch (error) {
    console.error('Error fetching Strava activities:', error);
    return null;
  }
}

// Hydration Adjustment Calculation

export function calculateStravaAdjustment(
  activities: StravaActivity[] | null
): StravaAdjustmentInfo {
  if (!activities || activities.length === 0) {
    return {
      percentage: 0,
      reason: '',
      totalDurationMinutes: 0,
      totalDistanceMeters: 0,
      activitySummary: '',
      activitiesCount: 0,
      lastSyncedAt: null,
      activities: [],
    };
  }

  let totalIntensityMinutes = 0;
  const activityCounts: Record<string, number> = {};

  for (const activity of activities) {
    const durationMinutes = activity.moving_time / 60;
    const activityType = activity.sport_type || activity.type;
    const multiplier = STRAVA_ACTIVITY_MULTIPLIERS[activityType] ?? STRAVA_ACTIVITY_MULTIPLIERS.Other;

    totalIntensityMinutes += durationMinutes * multiplier;

    // Count activities by type for summary
    const displayType = formatActivityType(activityType);
    activityCounts[displayType] = (activityCounts[displayType] || 0) + 1;
  }

  // Calculate percentage: ~8% per 30 intensity-adjusted minutes, capped at 50%
  const percentage = Math.min(50, Math.round((totalIntensityMinutes / 30) * 8));

  // Generate activity summary
  const summaryParts = Object.entries(activityCounts).map(([type, count]) =>
    count > 1 ? `${count} ${type}s` : `${count} ${type}`
  );
  const activitySummary = summaryParts.join(', ');

  // Calculate total duration in minutes
  const totalDurationMinutes = Math.round(
    activities.reduce((sum, a) => sum + a.moving_time / 60, 0)
  );

  // Calculate total distance in meters
  const totalDistanceMeters = activities.reduce((sum, a) => sum + (a.distance || 0), 0);

  // Generate reason text
  let reason = '';
  if (percentage > 0) {
    reason = `${totalDurationMinutes}-min workout`;
    if (activities.length > 1) {
      reason = `${activities.length} workouts (${totalDurationMinutes} min total)`;
    }
  }

  // Map activities to summary format
  const activitySummaries = activities.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    sportType: a.sport_type,
    movingTimeSeconds: a.moving_time,
    distanceMeters: a.distance || 0,
    startDateLocal: a.start_date_local,
  }));

  return {
    percentage,
    reason,
    totalDurationMinutes,
    totalDistanceMeters,
    activitySummary,
    activitiesCount: activities.length,
    lastSyncedAt: new Date().toISOString(),
    activities: activitySummaries,
  };
}

function formatActivityType(type: string): string {
  // Convert CamelCase to readable format
  const formatted = type
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Check if user has Strava connected
export async function isStravaConnected(): Promise<boolean> {
  const tokens = await getStravaTokens();
  return tokens !== null;
}
