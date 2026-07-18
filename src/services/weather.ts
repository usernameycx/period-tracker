import { getWeatherAdvice, getUVAdvice } from '../constants/weather-advice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/date';

const CACHE_KEY = 'weather_cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  uvIndex: number;
  humidity: number;
  condition: string;
  advice: string;
  uvAdvice: string;
  icon: string;
  updatedAt: string;
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,uv_index&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const json = await res.json();

  const current = json.current;
  const code = current.weather_code;
  const uv = Math.round(current.uv_index ?? 0);
  const wa = getWeatherAdvice(code);
  const uvAdvice = getUVAdvice(uv);

  const data: WeatherData = {
    temperature: Math.round(current.temperature_2m),
    weatherCode: code,
    uvIndex: uv,
    humidity: current.relative_humidity_2m,
    condition: wa.condition,
    advice: wa.advice,
    uvAdvice,
    icon: wa.icon,
    updatedAt: new Date().toISOString(),
  };

  await cacheWeather(data);
  return data;
}

async function cacheWeather(data: WeatherData): Promise<void> {
  const cached: CachedWeather = { data, timestamp: Date.now() };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
}

export async function getCachedWeather(): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedWeather = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_DURATION_MS) return null;
    return cached.data;
  } catch {
    return null;
  }
}
