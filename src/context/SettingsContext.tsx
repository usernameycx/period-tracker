import { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsData {
  language: string;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark';
}

interface SettingsContextType {
  settings: SettingsData;
  updateSettings: (data: Partial<SettingsData>) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: { language: 'zh', notificationsEnabled: true, theme: 'light' },
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsData>({
    language: 'zh',
    notificationsEnabled: true,
    theme: 'light',
  });

  const updateSettings = (data: Partial<SettingsData>) => {
    setSettings((prev) => ({ ...prev, ...data }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
