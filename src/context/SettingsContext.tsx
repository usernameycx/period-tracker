import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  city: string;
  setCity: (c: string) => void;
  notifyHour: number;
  setNotifyHour: (h: number) => void;
  notifyMinute: number;
  setNotifyMinute: (m: number) => void;
  ready: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Settings>({} as Settings);
export const useSettings = () => useContext(Ctx);

function loadSettings(): Promise<{ city: string; notifyHour: number; notifyMinute: number }> {
  return Promise.all([
    AsyncStorage.getItem('city'),
    AsyncStorage.getItem('notifyHour'),
    AsyncStorage.getItem('notifyMinute'),
  ]).then(([city, h, m]) => ({
    city: city || '南昌',
    notifyHour: h ? Number(h) : 8,
    notifyMinute: m ? Number(m) : 0,
  }));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState('南昌');
  const [notifyHour, setNotifyHourState] = useState(8);
  const [notifyMinute, setNotifyMinuteState] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSettings()
      .then(s => {
        setCityState(s.city);
        setNotifyHourState(s.notifyHour);
        setNotifyMinuteState(s.notifyMinute);
      })
      .catch(e => { console.warn('SettingsContext: failed to load settings', e); })
      .finally(() => { setReady(true); });
  }, []);

  const setCity = useCallback((c: string) => {
    setCityState(c);
    AsyncStorage.setItem('city', c).catch(e => console.warn('setCity failed:', e));
  }, []);

  const setNotifyHour = useCallback((h: number) => {
    setNotifyHourState(h);
    AsyncStorage.setItem('notifyHour', String(h)).catch(e => console.warn('setNotifyHour failed:', e));
  }, []);

  const setNotifyMinute = useCallback((m: number) => {
    setNotifyMinuteState(m);
    AsyncStorage.setItem('notifyMinute', String(m)).catch(e => console.warn('setNotifyMinute failed:', e));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const s = await loadSettings();
      setCityState(s.city);
      setNotifyHourState(s.notifyHour);
      setNotifyMinuteState(s.notifyMinute);
    } catch (e) {
      console.warn('SettingsContext.refresh failed:', e);
    }
  }, []);

  return (
    <Ctx.Provider value={{ city, setCity, notifyHour, setNotifyHour, notifyMinute, setNotifyMinute, ready, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
