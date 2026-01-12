import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_CACHE_KEY = '@weather_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export interface WeatherData {
  temperature: number; // Celsius
  humidity: number; // Percentage
  location: string;
  timestamp: number;
}

export interface ClimateAdjustment {
  percentage: number; // e.g., 15 means +15%
  reason: string;
  temperature: number;
}

interface CachedWeather {
  data: WeatherData;
  cachedAt: number;
}

// Open-Meteo API - completely free, no API key required
const API_BASE = 'https://api.open-meteo.com/v1/forecast';

export async function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

export async function fetchWeather(): Promise<WeatherData | null> {
  // Check cache first
  const cached = await getCachedWeather();
  if (cached) {
    return cached;
  }

  const location = await getLocation();
  if (!location) {
    return null;
  }

  try {
    const url = `${API_BASE}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Weather API error:', response.status);
      return null;
    }

    const data = await response.json();

    const weatherData: WeatherData = {
      temperature: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      location: `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`,
      timestamp: Date.now(),
    };

    // Cache the result
    await cacheWeather(weatherData);

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

async function getCachedWeather(): Promise<WeatherData | null> {
  try {
    const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (!cached) return null;

    const { data, cachedAt }: CachedWeather = JSON.parse(cached);

    // Check if cache is still valid
    if (Date.now() - cachedAt < CACHE_DURATION_MS) {
      return data;
    }

    return null;
  } catch {
    return null;
  }
}

async function cacheWeather(data: WeatherData): Promise<void> {
  try {
    const cached: CachedWeather = {
      data,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching weather:', error);
  }
}

export function calculateClimateAdjustment(weather: WeatherData | null): ClimateAdjustment {
  if (!weather) {
    return { percentage: 0, reason: '', temperature: 0 };
  }

  const temp = weather.temperature;
  let percentage = 0;
  let reason = '';

  if (temp >= 35) {
    percentage = 25;
    reason = 'Very hot weather';
  } else if (temp >= 30) {
    percentage = 20;
    reason = 'Hot weather';
  } else if (temp >= 25) {
    percentage = 15;
    reason = 'Warm weather';
  } else if (temp >= 20) {
    percentage = 10;
    reason = 'Mild warm weather';
  } else {
    percentage = 0;
    reason = '';
  }

  // Add extra for high humidity in heat (feels hotter)
  if (temp >= 25 && weather.humidity >= 70) {
    percentage += 5;
    reason = reason ? `${reason} + high humidity` : 'High humidity';
  }

  return {
    percentage,
    reason,
    temperature: temp,
  };
}

export function getAdjustedGoal(baseGoalMl: number, adjustment: ClimateAdjustment): number {
  if (adjustment.percentage === 0) {
    return baseGoalMl;
  }
  return Math.round(baseGoalMl * (1 + adjustment.percentage / 100));
}

export async function clearWeatherCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WEATHER_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing weather cache:', error);
  }
}
