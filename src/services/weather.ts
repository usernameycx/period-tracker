import { getWeatherAdvice, getUVAdvice } from '../constants/weather-advice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

function cacheKey(lat: number, lon: number): string {
  return `weather_cache_${lat}_${lon}`;
}

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

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error(`网络请求失败: ${(e as Error).message}`);
  }
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error('解析天气数据失败');
  }
  if (!json.current) throw new Error('无效的天气数据');

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

  await cacheWeather(lat, lon, data);
  return data;
}

async function cacheWeather(lat: number, lon: number, data: WeatherData): Promise<void> {
  const cached: CachedWeather = { data, timestamp: Date.now() };
  await AsyncStorage.setItem(cacheKey(lat, lon), JSON.stringify(cached));
}

export async function getCachedWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(lat, lon));
    if (!raw) return null;
    const cached: CachedWeather = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_DURATION_MS) return null;
    return cached.data;
  } catch {
    return null;
  }
}
