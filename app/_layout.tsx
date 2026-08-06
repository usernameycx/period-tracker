import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { Platform, ToastAndroid } from 'react-native';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { PeriodProvider } from '../src/context/PeriodContext';
import { WeatherProvider, useWeather } from '../src/context/WeatherContext';
import { SettingsProvider, useSettings } from '../src/context/SettingsContext';
import { scheduleAllNotifications } from '../src/services/notifications';
import { requestLocationPermission, getCurrentLocation } from '../src/services/location';
import ErrorBoundary from '../src/components/ErrorBoundary';

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
 * 启动定位流程（每次冷启动执行一次）：
 * 1. 主动请求定位权限（系统仅首次弹窗）
 * 2. 定位成功 → 自动切换城市并强制刷新天气（忽略缓存）
 * 3. 定位失败 → 保留上次正常地区数据，仅轻提示
 * 4. 定位期间用户手动切换过城市 → 尊重用户选择，不覆盖，只强制刷新当前城市
 */
function LocationStarter() {
  const { city, setCity, ready } = useSettings();
  const { refresh } = useWeather();
  const cityRef = useRef(city);
  cityRef.current = city;

  useEffect(() => {
    if (!ready) return;
    const initialCity = cityRef.current; // 本次启动时的城市
    let cancelled = false;
    (async () => {
      const granted = await requestLocationPermission();
      if (cancelled) return;
      if (!granted) {
        showToast('未开启定位权限，使用手动设置的城市');
        refresh();
        return;
      }
      const loc = await getCurrentLocation();
      if (cancelled) return;
      if (loc.result && loc.result.city) {
        // 定位完成 → 立即更新城市并强制刷新天气
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
            <LocationStarter />
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
