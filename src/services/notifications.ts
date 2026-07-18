import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../db/database';
import { getAllPeriodRecords } from '../db/period-records';
import { getDietRules } from '../db/diet-rules';
import { getNextPredictedStart, getAveragePeriodDays, getPhaseForDate } from './prediction';
import { getCachedWeather } from './weather';
import { Phase, PHASE_LABELS } from '../constants/phases';
import { parseDate } from '../utils/date';

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌸 每日小贴士',
      body: await buildNotificationBody(),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function buildNotificationBody(): Promise<string> {
  try {
    const db = await getDatabase();
    const records = await getAllPeriodRecords(db);
    if (records.length === 0) return '打开 App 录入你的经期记录吧~';

    const nextStart = getNextPredictedStart(records);
    const avgDays = getAveragePeriodDays(records);
    const today = new Date();

    let phase: Phase = 'follicular';
    let dayOffset = 1;
    if (nextStart) {
      const info = getPhaseForDate(today, parseDate(nextStart), avgDays);
      phase = info.phase;
      dayOffset = info.dayOffset;
    }

    const rule = await getDietRules(db, phase, dayOffset);
    const weather = await getCachedWeatherForNotification();

    let body = `${PHASE_LABELS[phase]}第${dayOffset}天`;
    if (weather) body += ` | ${weather.icon} ${weather.temperature}° ${weather.condition}`;
    if (rule) body += ` | ✅${rule.recommend.slice(0, 3).join('、')}`;
    return body;
  } catch {
    return '打开 App 查看今日的天气和饮食建议吧~';
  }
}

/** Retrieves cached weather using the last-known coordinates stored in AsyncStorage. */
async function getCachedWeatherForNotification() {
  try {
    const keys = await AsyncStorage.getMany(['last_lat', 'last_lon']);
    const lat = Number(keys.last_lat);
    const lon = Number(keys.last_lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      return await getCachedWeather(lat, lon);
    }
  } catch {
    // ignore — no weather data available
  }
  return null;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
