import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../db/database';
import { getAllPeriodRecords } from '../db/period-records';
import { getDietRules } from '../db/diet-rules';
import { getNextPredictedStart, getAveragePeriodDays, getAverageCycleLength, getPhaseForDate } from './prediction';
import { getCachedWeather, geocodeCity } from './weather';
import { getWeatherAdvice } from '../constants/weather-advice';
import { Phase, PHASE_LABELS, DEFAULT_CYCLE_DAYS } from '../constants/phases';
import { parseDate, addDays } from '../utils/date';

const PERIOD_REMINDER_IDS_KEY = 'period_reminder_ids';
const DAILY_NOTIF_ID_KEY = 'daily_notif_id';

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
  // Cancel previous daily notification
  const prevId = await AsyncStorage.getItem(DAILY_NOTIF_ID_KEY);
  if (prevId) {
    await Notifications.cancelScheduledNotificationAsync(prevId);
  }

  const { title, body } = await buildNotificationContent();

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(DAILY_NOTIF_ID_KEY, id);
}

/** Schedule period-approaching reminders. Call whenever records change. */
export async function schedulePeriodReminders(): Promise<void> {
  try {
    const storedIds = await AsyncStorage.getItem(PERIOD_REMINDER_IDS_KEY);
    if (storedIds) {
      let ids: string[] = [];
      try { ids = JSON.parse(storedIds); } catch { /* ignore */ }
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }

    const db = await getDatabase();
    const records = await getAllPeriodRecords(db);
    if (records.length === 0) return;

    const nextStart = getNextPredictedStart(records);
    if (!nextStart) return;

    const predictedDate = parseDate(nextStart);
    const avgDays = getAveragePeriodDays(records);
    const cycleLength = getAverageCycleLength(records) || DEFAULT_CYCLE_DAYS;

    const newIds: string[] = [];

    // 3 days before
    const day3 = addDays(predictedDate, -3);
    if (day3.getTime() > Date.now()) {
      const info3 = getPhaseForDate(day3, predictedDate, avgDays, cycleLength);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ 经期临近',
          body: `当前${PHASE_LABELS[info3.phase]}第${info3.dayOffset}天，预计3天后经期开始`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: day3 },
      });
      newIds.push(id);
    }

    // 1 day before
    const day1 = addDays(predictedDate, -1);
    if (day1.getTime() > Date.now()) {
      const info1 = getPhaseForDate(day1, predictedDate, avgDays, cycleLength);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌸 经期将至',
          body: `当前${PHASE_LABELS[info1.phase]}第${info1.dayOffset}天，预计明天经期开始，注意保暖`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: day1 },
      });
      newIds.push(id);
    }

    // Ovulation reminder (mid-cycle, if not in period)
    const ovDay = addDays(predictedDate, -14);
    if (ovDay.getTime() > Date.now() && records.length >= 2) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🥚 排卵期',
          body: '今天可能是排卵期，状态通常会比较好',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: ovDay },
      });
      newIds.push(id);
    }

    await AsyncStorage.setItem(PERIOD_REMINDER_IDS_KEY, JSON.stringify(newIds));
  } catch (e) {
    console.warn('schedulePeriodReminders failed:', e);
  }
}

async function buildNotificationContent(): Promise<{ title: string; body: string }> {
  try {
    const db = await getDatabase();
    const records = await getAllPeriodRecords(db);
    if (records.length === 0) {
      return {
        title: '🌸 FayeTide',
        body: '打开 App 录入你的经期记录吧',
      };
    }

    const nextStart = getNextPredictedStart(records);
    const avgDays = getAveragePeriodDays(records);
    const cycleLength = getAverageCycleLength(records) || DEFAULT_CYCLE_DAYS;
    const today = new Date();

    let phase: Phase = 'follicular';
    let dayOffset = 1;
    if (nextStart) {
      const info = getPhaseForDate(today, parseDate(nextStart), avgDays, cycleLength);
      phase = info.phase;
      dayOffset = info.dayOffset;
    }

    const rule = await getDietRules(db, phase, dayOffset);
    const weather = await getCachedWeatherForNotification();

    const title = `${PHASE_LABELS[phase]} · 第${dayOffset}天`;

    let body = '';
    if (weather && rule) {
      const wa = getWeatherAdvice(weather.weatherCode);
      const foods = rule.recommend.slice(0, 3).join('、');
      body = `今天${wa.condition}${weather.temperature}°，适合吃${foods}`;
    } else if (weather) {
      const wa = getWeatherAdvice(weather.weatherCode);
      body = `今天${wa.condition}${weather.temperature}°`;
    } else if (rule) {
      const foods = rule.recommend.slice(0, 3).join('、');
      body = `推荐${foods}`;
    }
    if (!body) body = '打开 App 查看今日详情';

    return { title, body };
  } catch {
    return {
      title: '🌸 FayeTide',
      body: '打开 App 查看今日的天气和饮食建议吧',
    };
  }
}

/** Retrieves cached weather using the user's city setting. */
async function getCachedWeatherForNotification() {
  try {
    const cityKey = (await AsyncStorage.getItem('city')) || '南昌';
    const geo = await geocodeCity(cityKey);
    if (geo) {
      return await getCachedWeather(geo.lat, geo.lon);
    }
  } catch {
    // ignore — no weather data available
  }
  return null;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
