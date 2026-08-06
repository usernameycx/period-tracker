import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { PeriodProvider } from '../src/context/PeriodContext';
import { WeatherProvider, useWeather } from '../src/context/WeatherContext';
import { SettingsProvider, useSettings } from '../src/context/SettingsContext';
import { scheduleAllNotifications, requestNotificationPermission } from '../src/services/notifications';
import { requestLocationPermission, getCurrentLocation } from '../src/services/location';
import ErrorBoundary from '../src/components/ErrorBoundary';
import OnboardingModal from '../src/components/OnboardingModal';

preventAutoHideAsync();

/** 轻提示：Android 用 Toast，其他平台静默 */
function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

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

/**
 * 启动流程（每次冷启动执行一次），严格按顺序：
 * ① 请求定位权限（系统弹窗）→ ② 请求通知权限（系统弹窗）→ ③ 放行引导卡片
 * → ④ 高德定位并自动切换城市、强制刷新天气
 * 定位失败：保留上次正常地区数据，仅轻提示具体原因；
 * 定位期间用户手动切换过城市：尊重用户选择，不覆盖。
 */
function StartupFlow({ onPermissionsDone }: { onPermissionsDone: () => void }) {
  const { city, setCity, ready } = useSettings();
  const { refresh } = useWeather();
  const cityRef = useRef(city);
  cityRef.current = city;
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ready || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    (async () => {
      // ① 定位权限（必须先于通知权限，避免 Android 弹窗互抢）
      const locGranted = await requestLocationPermission();
      if (cancelled) return;
      // ② 通知权限
      await requestNotificationPermission().catch(e => {
        console.warn('notification permission request failed:', e);
      });
      if (cancelled) return;
      // ③ 权限流程完成 → 放行首次启动引导卡片
      onPermissionsDone();
      // ④ 定位并刷新天气
      const initialCity = cityRef.current;
      if (!locGranted) {
        showToast('未开启定位权限，使用手动设置的城市');
        refresh();
        return;
      }
      const loc = await getCurrentLocation();
      if (cancelled) return;
      if (loc.result && loc.result.city) {
        // 定位期间用户已手动切城市：不覆盖用户选择，仅强制刷新当前城市
        const userChanged = cityRef.current !== initialCity;
        if (userChanged) {
          refresh(cityRef.current, true);
        } else {
          setCity(loc.result.city);
          refresh(loc.result.city, true);
        }
      } else {
        // 定位失败：保留最后一次正常数据，并给出具体原因便于诊断
        showToast(`定位失败：${loc.error || '未知原因'}，已保留上次地区天气`);
        refresh();
      }
    })();
    return () => { cancelled = true; };
  }, [ready]);

  return null;
}

export default function RootLayout() {
  const [permissionsDone, setPermissionsDone] = useState(false);
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
            <StartupFlow onPermissionsDone={() => setPermissionsDone(true)} />
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
            {/* 引导卡片：等权限流程完成后才显示（先权限后指引） */}
            <OnboardingModal permissionGate={permissionsDone} />
          </WeatherProvider>
        </PeriodProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
