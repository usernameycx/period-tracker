import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { fetchWeather, getCachedWeather, WeatherData } from '../services/weather';
import { useSettings } from './SettingsContext';
import * as Location from 'expo-location';

interface WeatherCtx {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<WeatherCtx>({} as WeatherCtx);
export const useWeather = () => useContext(Ctx);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { useGPS } = useSettings();
  const lastCoords = useRef<{ lat: number; lon: number } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (useGPS) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('定位权限未授权');
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        lastCoords.current = { lat, lon };

        // Try cache first
        const cached = await getCachedWeather(lat, lon);
        if (cached) {
          setWeather(cached);
          setLoading(false);
          return;
        }

        const data = await fetchWeather(lat, lon);
        setWeather(data);
      }
    } catch (e: any) {
      setError(e.message);
      // Fallback to stale cache
      if (lastCoords.current) {
        const cached = await getCachedWeather(lastCoords.current.lat, lastCoords.current.lon);
        if (cached) setWeather(cached);
      }
    } finally {
      setLoading(false);
    }
  }, [useGPS]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <Ctx.Provider value={{ weather, loading, error, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
