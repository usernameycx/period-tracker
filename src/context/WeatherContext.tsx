import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { fetchRawWeather, getCachedWeather, geocodeCity, RawWeather } from '../services/weather';
import { getWeatherAdvice, getUVAdvice } from '../constants/weather-advice';
import { useSettings } from './SettingsContext';

export interface DisplayWeather {
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  uvIndex: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  advice: string;
  uvAdvice: string;
  icon: string;
  updatedAt: string;
}

/** Derive display strings from raw data — always uses current mapping, never stale. */
function toDisplay(raw: RawWeather): DisplayWeather {
  const wa = getWeatherAdvice(raw.weatherCode, raw.temperature);
  return {
    ...raw,
    condition: wa.condition,
    advice: wa.advice,
    icon: wa.icon,
    uvAdvice: getUVAdvice(raw.uvIndex),
  };
}

interface WeatherCtx {
  weather: DisplayWeather | null;
  loading: boolean;
  error: string | null;
  refresh: (cityName?: string) => Promise<void>;
}

const Ctx = createContext<WeatherCtx>({} as WeatherCtx);
export const useWeather = () => useContext(Ctx);

const DEFAULT_CITY = '南昌';

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<RawWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { city, ready } = useSettings();
  const lastCoords = useRef<{ lat: number; lon: number } | null>(null);
  // Keep the latest city in a ref so refresh() always uses the current value,
  // even when called right after setCity() before the state re-renders.
  const cityRef = useRef(city);
  cityRef.current = city;
  // 请求代际保护：快速连续切换城市时，丢弃过期请求的响应，
  // 避免"界面显示 B 城市名 + A 城市天气"的错位。
  const requestSeq = useRef(0);
  // 最近一次手动刷新过的城市：切城市场景已手动 refresh(cityName)，effect 跳过重复请求
  const manuallyRefreshedCity = useRef<string | null>(null);

  const refresh = useCallback(async (cityName?: string) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    // Prefer explicit override (切换城市时立即使用新值), otherwise latest city.
    const target = (cityName ?? (cityRef.current || DEFAULT_CITY)).trim();
    if (cityName) manuallyRefreshedCity.current = target;
    const isStale = () => seq !== requestSeq.current;
    try {
      const geo = await geocodeCity(target);
      if (isStale()) return;
      if (geo) {
        const { lat, lon } = geo;
        lastCoords.current = { lat, lon };

        const cached = await getCachedWeather(lat, lon);
        if (isStale()) return;
        if (cached) {
          setRaw(cached);
          setLoading(false);
          return;
        }

        const data = await fetchRawWeather(lat, lon);
        if (isStale()) return;
        setRaw(data);
      } else {
        if (lastCoords.current) {
          const cached = await getCachedWeather(lastCoords.current.lat, lastCoords.current.lon);
          if (isStale()) return;
          if (cached) setRaw(cached);
          else setError(`无法找到城市"${target}"`);
        } else {
          setError(`无法找到城市"${target}"`);
        }
      }
    } catch (e: any) {
      if (isStale()) return;
      setError(e.message);
      if (lastCoords.current) {
        const cached = await getCachedWeather(lastCoords.current.lat, lastCoords.current.lon);
        if (isStale()) return;
        if (cached) setRaw(cached);
      }
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, []);

  // Wait for settings (city) to load before the first weather request, so the
  // app never fetches weather for the default city and then re-fetches again.
  useEffect(() => {
    if (!ready) return;
    // 该城市刚被手动 refresh(cityName) 请求过（切城市场景），跳过自动重复请求
    if (manuallyRefreshedCity.current === cityRef.current) return;
    refresh();
  }, [ready, city, refresh]);

  const weather = raw ? toDisplay(raw) : null;

  const value = useMemo(() => ({
    weather, loading, error, refresh
  }), [weather, loading, error, refresh]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}
