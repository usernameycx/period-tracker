import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { PeriodProvider } from '../src/context/PeriodContext';
import { WeatherProvider } from '../src/context/WeatherContext';
import { SettingsProvider, useSettings } from '../src/context/SettingsContext';
import { requestNotificationPermission, scheduleDailyNotification, setupNotificationHandler } from '../src/services/notifications';
import CityOnboardingModal from '../src/components/CityOnboardingModal';
import ErrorBoundary from '../src/components/ErrorBoundary';

function NotificationScheduler() {
  const { notifyHour, notifyMinute, ready } = useSettings();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't schedule until settings are loaded from AsyncStorage
    if (!ready) return;

    // Debounce: rapid TimeWheelPicker scrolling shouldn't flood the notification system
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      (async () => {
        setupNotificationHandler();
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleDailyNotification(notifyHour, notifyMinute);
        }
      })().catch(e => { console.warn('NotificationScheduler failed:', e); });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [notifyHour, notifyMinute, ready]);

  return null;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <PeriodProvider>
          <WeatherProvider>
            <NotificationScheduler />
            <CityOnboardingModal />
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
