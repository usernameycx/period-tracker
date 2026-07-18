import { createContext, useContext, useState, ReactNode } from 'react';

interface WeatherData {
  temperature: number | null;
  condition: string;
  location: string;
}

interface WeatherContextType {
  weather: WeatherData;
  setWeather: (data: WeatherData) => void;
}

const WeatherContext = createContext<WeatherContextType>({
  weather: { temperature: null, condition: '', location: '' },
  setWeather: () => {},
});

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: null,
    condition: '',
    location: '',
  });

  return (
    <WeatherContext.Provider value={{ weather, setWeather }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}
