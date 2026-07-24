import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { PeriodProvider } from '../src/context/PeriodContext';
import { WeatherProvider } from '../src/context/WeatherContext';
import { SettingsProvider, useSettings } from '../src/context/SettingsContext';
import { scheduleAllNotifications } from '../src/services/notifications';
import ErrorBoundary from '../src/components/ErrorBoundary';

preventAutoHideAsync();

function NotificationScheduler() {
  const { notifyHour, notifyMinute, ready } = useSettings();

  useEffect(() => {
    if (!ready) return;
    scheduleAllNotifications(notifyHour, notifyMinute).catch(e => {
      console.warn('NotificationScheduler cold-start failed:', e);
    });
  }, [ready]);

  return null;
}

export default function RootLayout() {
  const onReady = useCallback(async () => {
    await hideAsync();
  }, []);

  useEffect(() => { onReady(); }, [onReady]);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
