import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_CACHE_KEY = '@weather_cache';
const LOCATION_NAME_CACHE_KEY = '@location_name_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const LOCATION_NAME_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOCATION_CHANGE_THRESHOLD_KM = 5; // Only re-geocode if moved more than 5km

export interface WeatherData {
  temperature: number; // Celsius
  temperatureHigh: number; // Daily high
  temperatureLow: number; // Daily low
  humidity: number; // Percentage
  locationName: string; // City/area name
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

interface CachedLocationName {
  name: string;
  latitude: number;
  longitude: number;
  cachedAt: number;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

async function getCachedLocationName(latitude: number, longitude: number): Promise<string | null> {
  try {
    const cached = await AsyncStorage.getItem(LOCATION_NAME_CACHE_KEY);
    if (!cached) return null;

    const data: CachedLocationName = JSON.parse(cached);
    const age = Date.now() - data.cachedAt;
    const distance = calculateDistanceKm(latitude, longitude, data.latitude, data.longitude);

    // Use cache if it's fresh enough and we haven't moved far
    if (age < LOCATION_NAME_CACHE_DURATION_MS && distance < LOCATION_CHANGE_THRESHOLD_KM) {
      return data.name;
    }
    return null;
  } catch {
    return null;
  }
}

async function cacheLocationName(name: string, latitude: number, longitude: number): Promise<void> {
  try {
    const data: CachedLocationName = {
      name,
      latitude,
      longitude,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(LOCATION_NAME_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching location name:', error);
  }
}

async function getLocationName(latitude: number, longitude: number): Promise<string> {
  // Check cache first to avoid rate limits
  const cached = await getCachedLocationName(latitude, longitude);
  if (cached) {
    return cached;
  }

  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const { city, subregion, region } = results[0];
      const name = city || subregion || region || 'Unknown location';

      // Cache the result
      if (name !== 'Unknown location') {
        await cacheLocationName(name, latitude, longitude);
      }

      return name;
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error);

    // If rate limited, try to use any existing cached name regardless of distance
    try {
      const fallback = await AsyncStorage.getItem(LOCATION_NAME_CACHE_KEY);
      if (fallback) {
        const data: CachedLocationName = JSON.parse(fallback);
        return data.name;
      }
    } catch {
      // Ignore
    }
  }
  return 'Unknown location';
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
    // Fetch current weather and daily high/low
    const url = `${API_BASE}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Weather API error:', response.status);
      return null;
    }

    const data = await response.json();

    // Get location name via reverse geocoding
    const locationName = await getLocationName(location.latitude, location.longitude);

    const weatherData: WeatherData = {
      temperature: Math.round(data.current.temperature_2m),
      temperatureHigh: Math.round(data.daily.temperature_2m_max[0]),
      temperatureLow: Math.round(data.daily.temperature_2m_min[0]),
      humidity: data.current.relative_humidity_2m,
      locationName,
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
