import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { PeriodProvider } from '../src/context/PeriodContext';
import { WeatherProvider } from '../src/context/WeatherContext';
import { SettingsProvider, useSettings } from '../src/context/SettingsContext';
import { requestNotificationPermission, scheduleDailyNotification } from '../src/services/notifications';

function NotificationScheduler() {
  const { notifyHour, notifyMinute } = useSettings();

  useEffect(() => {
    (async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDailyNotification(notifyHour, notifyMinute);
      }
    })();
  }, [notifyHour, notifyMinute]);

  return null;
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <PeriodProvider>
        <WeatherProvider>
          <NotificationScheduler />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </WeatherProvider>
      </PeriodProvider>
    </SettingsProvider>
  );
}
