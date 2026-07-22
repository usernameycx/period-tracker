import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
  const wa = getWeatherAdvice(raw.weatherCode);
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
  refresh: () => Promise<void>;
}

const Ctx = createContext<WeatherCtx>({} as WeatherCtx);
export const useWeather = () => useContext(Ctx);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<RawWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { city } = useSettings();
  const lastCoords = useRef<{ lat: number; lon: number } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const geo = await geocodeCity(city || '南昌');
      if (geo) {
        const { lat, lon } = geo;
        lastCoords.current = { lat, lon };

        const cached = await getCachedWeather(lat, lon);
        if (cached) {
          setRaw(cached);
          setLoading(false);
          return;
        }

        const data = await fetchRawWeather(lat, lon);
        setRaw(data);
      } else {
        if (lastCoords.current) {
          const cached = await getCachedWeather(lastCoords.current.lat, lastCoords.current.lon);
          if (cached) setRaw(cached);
          else setError(`无法找到城市"${city}"`);
        } else {
          setError(`无法找到城市"${city}"`);
        }
      }
    } catch (e: any) {
      setError(e.message);
      if (lastCoords.current) {
        const cached = await getCachedWeather(lastCoords.current.lat, lastCoords.current.lon);
        if (cached) setRaw(cached);
      }
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => { refresh(); }, [refresh]);

  const weather = raw ? toDisplay(raw) : null;

  return (
    <Ctx.Provider value={{ weather, loading, error, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
