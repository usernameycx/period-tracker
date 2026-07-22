import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

function cacheKey(lat: number, lon: number): string {
  return `weather_cache_v2_${lat}_${lon}`;
}

/** Raw weather data from API — no derived text (avoids stale cache when mappings change). */
export interface RawWeather {
  temperature: number;
  weatherCode: number;
  uvIndex: number;
  humidity: number;
  windSpeed: number;
  updatedAt: string;
}

interface CachedWeather {
  data: RawWeather;
  timestamp: number;
}

const AMAP_KEY = (Constants.expoConfig?.extra as { amapApiKey?: string })?.amapApiKey ?? '';

/** Convert city name to {lat, lon} using Amap (高德) geocoding API. */
export async function geocodeCity(cityName: string): Promise<{ lat: number; lon: number } | null> {
  if (!AMAP_KEY) {
    console.warn('geocodeCity: missing amapApiKey in app.json extra');
    return null;
  }
  try {
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(cityName)}&output=JSON`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status === '1' && json.geocodes?.length > 0) {
      const [lng, lat] = json.geocodes[0].location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lon: lng };
      }
    }
  } catch {
    // fall through
  }
  return null;
}

export async function fetchRawWeather(lat: number, lon: number): Promise<RawWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,uv_index,wind_speed_10m&timezone=auto`;

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
  const data: RawWeather = {
    temperature: Math.round(current.temperature_2m),
    weatherCode: current.weather_code,
    uvIndex: Math.round(current.uv_index ?? 0),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    updatedAt: new Date().toISOString(),
  };

  await cacheWeather(lat, lon, data);
  return data;
}

async function cacheWeather(lat: number, lon: number, data: RawWeather): Promise<void> {
  const cached: CachedWeather = { data, timestamp: Date.now() };
  await AsyncStorage.setItem(cacheKey(lat, lon), JSON.stringify(cached));
  await AsyncStorage.setItem('last_lat', String(lat));
  await AsyncStorage.setItem('last_lon', String(lon));
}

export async function getCachedWeather(lat: number, lon: number): Promise<RawWeather | null> {
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
