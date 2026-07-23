import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { PeriodProvider } from '../src/context/PeriodContext';
import { WeatherProvider } from '../src/context/WeatherContext';
import { SettingsProvider, useSettings } from '../src/context/SettingsContext';
import { requestNotificationPermission, scheduleDailyNotification, setupNotificationHandler } from '../src/services/notifications';
import ErrorBoundary from '../src/components/ErrorBoundary';

// 阻止启动屏自动隐藏，由我们控制何时消失
preventAutoHideAsync();

function NotificationScheduler() {
  const { notifyHour, notifyMinute, ready } = useSettings();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready) return;
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
  const onLayoutRootView = useCallback(async () => {
    // 保持启动屏至少展示 1 秒，避免一闪而过
    await new Promise(resolve => setTimeout(resolve, 1000));
    await hideAsync();
  }, []);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

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
