import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  city: string;
  setCity: (c: string) => void;
  useGPS: boolean;
  setUseGPS: (v: boolean) => void;
  notifyHour: number;
  setNotifyHour: (h: number) => void;
  notifyMinute: number;
  setNotifyMinute: (m: number) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Settings>({} as Settings);
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState('成都');
  const [useGPS, setUseGPSState] = useState(true);
  const [notifyHour, setNotifyHourState] = useState(8);
  const [notifyMinute, setNotifyMinuteState] = useState(0);

  useEffect(() => {
    AsyncStorage.getMany(['city', 'useGPS', 'notifyHour', 'notifyMinute']).then(m => {
      if (m.city) setCityState(m.city);
      if (m.useGPS !== null) setUseGPSState(m.useGPS === 'true');
      if (m.notifyHour) setNotifyHourState(Number(m.notifyHour));
      if (m.notifyMinute) setNotifyMinuteState(Number(m.notifyMinute));
    });
  }, []);

  const setCity = (c: string) => { setCityState(c); AsyncStorage.setItem('city', c); };
  const setUseGPS = (v: boolean) => { setUseGPSState(v); AsyncStorage.setItem('useGPS', String(v)); };
  const setNotifyHour = (h: number) => { setNotifyHourState(h); AsyncStorage.setItem('notifyHour', String(h)); };
  const setNotifyMinute = (m: number) => { setNotifyMinuteState(m); AsyncStorage.setItem('notifyMinute', String(m)); };

  const refresh = async () => {
    const m = await AsyncStorage.getMany(['city', 'useGPS', 'notifyHour', 'notifyMinute']);
    if (m.city) setCityState(m.city);
    if (m.useGPS !== null) setUseGPSState(m.useGPS === 'true');
    if (m.notifyHour) setNotifyHourState(Number(m.notifyHour));
    if (m.notifyMinute) setNotifyMinuteState(Number(m.notifyMinute));
  };

  return (
    <Ctx.Provider value={{ city, setCity, useGPS, setUseGPS, notifyHour, setNotifyHour, notifyMinute, setNotifyMinute, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
