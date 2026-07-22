import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getDatabase } from '../db/database';
import { getAllPeriodRecords } from '../db/period-records';
import { getDietRules } from '../db/diet-rules';
import { getNextPredictedStart, getAveragePeriodDays, getAverageCycleLength, getPhaseForDate } from './prediction';
import { getCachedWeather, geocodeCity } from './weather';
import { getWeatherAdvice } from '../constants/weather-advice';
import { Phase, PHASE_LABELS, DEFAULT_CYCLE_DAYS } from '../constants/phases';
import { parseDate, addDays } from '../utils/date';

const PERIOD_REMINDER_IDS_KEY = 'period_reminder_ids';
const DAILY_NOTIF_IDS_KEY = 'daily_notif_ids';

export function setupNotificationHandler(): void {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'FayeTide 提醒',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
    Notifications.setNotificationChannelAsync('period', {
      name: '经期提醒',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
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
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  // Cancel all previous daily notifications
  const prevIdsStr = await AsyncStorage.getItem(DAILY_NOTIF_IDS_KEY);
  if (prevIdsStr) {
    let ids: string[] = [];
    try { ids = JSON.parse(prevIdsStr); } catch { /* ignore */ }
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  }

  // Pre-build 7 days of notifications, each computed for its target date
  const db = await getDatabase();
  const records = await getAllPeriodRecords(db);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newIds: string[] = [];
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + i);
    const triggerDate = new Date(targetDate);
    triggerDate.setHours(hour, minute, 0, 0);
    if (triggerDate.getTime() <= Date.now()) continue;

    const { title, body } = await buildContentForDate(records, db, targetDate);
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate, channelId: 'default' },
    });
    newIds.push(id);
  }

  await AsyncStorage.setItem(DAILY_NOTIF_IDS_KEY, JSON.stringify(newIds));
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
          sound: 'default',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: day3, channelId: 'period' },
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
          sound: 'default',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: day1, channelId: 'period' },
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
          sound: 'default',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: ovDay, channelId: 'period' },
      });
      newIds.push(id);
    }

    await AsyncStorage.setItem(PERIOD_REMINDER_IDS_KEY, JSON.stringify(newIds));
  } catch (e) {
    console.warn('schedulePeriodReminders failed:', e);
  }
}

async function buildContentForDate(
  records: any[],
  db: any,
  date: Date,
): Promise<{ title: string; body: string }> {
  try {
    if (records.length === 0) {
      return { title: '🌸 FayeTide', body: '打开 App 录入你的经期记录吧' };
    }

    const nextStart = getNextPredictedStart(records);
    const avgDays = getAveragePeriodDays(records);
    const cycleLength = getAverageCycleLength(records) || DEFAULT_CYCLE_DAYS;

    let phase: Phase = 'follicular';
    let dayOffset = 1;
    if (nextStart) {
      const info = getPhaseForDate(date, parseDate(nextStart), avgDays, cycleLength);
      phase = info.phase;
      dayOffset = info.dayOffset;
    }

    const rule = await getDietRules(db, phase, dayOffset);
    const title = `${PHASE_LABELS[phase]} · 第${dayOffset}天`;

    // Weather: only use for today's notification (not future dates)
    const isToday = date.toDateString() === new Date().toDateString();
    const weather = isToday ? await getCachedWeatherForNotification() : null;

    const foods = rule.recommend.slice(0, 3).join('、');
    let body = '';
    if (weather) {
      const wa = getWeatherAdvice(weather.weatherCode);
      body = `${wa.condition}${weather.temperature}° · 推荐${foods}`;
    } else if (rule) {
      body = `推荐饮食：${foods}`;
    }
    if (!body) body = '打开 App 查看今日详情';

    return { title, body };
  } catch {
    return { title: '🌸 FayeTide', body: '打开 App 查看今日详情' };
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
