import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

const DailyAlarm = NativeModules.DailyAlarmModule;

const DAILY_NOTIF_IDS_KEY = 'daily_notif_ids';

export async function setupNotificationHandler(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FayeTide 提醒',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync('period', {
      name: '经期提醒',
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync('daily', {
      name: '每日播报',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 50, 100],
      lightColor: '#C2905A',
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // 加超时保护：启动早期 Activity 未就绪时 requestPermissionsAsync 可能永不 resolve，
    // 会卡死后续流程（通知弹窗/引导卡片/定位都不会执行）
    const result = await Promise.race([
      Notifications.requestPermissionsAsync(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('请求通知权限超时')), 5000)
      ),
    ]);
    return result.status === 'granted';
  } catch (e) {
    console.warn('requestNotificationPermission failed:', e);
    return false;
  }
}

/**
 * Schedule the native daily alarm. The native receiver reads DB + fetches weather
 * at fire time, producing real-time content: phase, weather, life advice, plus
 * contextual alerts (period countdown, end-of-period, delayed, ovulation).
 */
export async function scheduleDailyNotifications(hour: number, minute: number): Promise<void> {
  if (Platform.OS === 'android' && DailyAlarm) {
    try {
      const city = (await AsyncStorage.getItem('city')) || '南昌';
      await DailyAlarm.schedule(hour, minute, city);
      return;
    } catch (e) {
      console.warn('Native alarm failed, falling back to JS daily trigger:', e);
    }
  }
  // JS fallback for iOS / when native module unavailable
  await scheduleJSFallback(hour, minute);
}

/** JS fallback: content is frozen at schedule time (no native receiver) */
async function scheduleJSFallback(hour: number, minute: number): Promise<void> {
  const prevIdsStr = await AsyncStorage.getItem(DAILY_NOTIF_IDS_KEY);
  if (prevIdsStr) {
    let ids: string[] = [];
    try { ids = JSON.parse(prevIdsStr); } catch { /* ignore */ }
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: '🌸 FayeTide', body: '打开 App 查看今日详情' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour, minute,
      channelId: 'daily',
    },
  });
  await AsyncStorage.setItem(DAILY_NOTIF_IDS_KEY, JSON.stringify([id]));
}

/**
 * Combined scheduler: daily alarm + auto-start permission check.
 * Call on cold start and whenever notification time changes.
 * Period countdown / end / delayed / ovulation alerts are handled by
 * the native receiver at fire time — no separate schedule needed.
 */
export async function scheduleAllNotifications(
  hour: number,
  minute: number,
): Promise<void> {
  await setupNotificationHandler();
  // 只检查不弹窗：权限弹窗由启动流程（StartupFlow）统一请求，避免同一启动被请求两次
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Android 12+: prompt for exact alarm permission once
  if (Platform.OS === 'android' && DailyAlarm) {
    try {
      const hasExact = await DailyAlarm.hasExactAlarmPermission();
      if (hasExact === false) {
        const asked = await AsyncStorage.getItem('exact_alarm_asked');
        if (!asked) {
          await AsyncStorage.setItem('exact_alarm_asked', '1');
          DailyAlarm.requestExactAlarmPermission();
        }
      }
    } catch { /* native module may not support these methods yet */ }
  }

  await scheduleDailyNotifications(hour, minute);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
