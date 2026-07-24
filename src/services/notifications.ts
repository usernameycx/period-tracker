import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { getDatabase } from '../db/database';
import { getAllPeriodRecords } from '../db/period-records';
import { getNextPredictedStart, getAveragePeriodDays, getAverageCycleLength, getPhaseForDate } from './prediction';
import { getCachedWeather, geocodeCity } from './weather';
import { getWeatherAdvice } from '../constants/weather-advice';
import { getLifeAdvice } from './advice';
import { Phase, PHASE_LABELS, DEFAULT_CYCLE_DAYS } from '../constants/phases';
import { parseDate, addDays, isSameDay } from '../utils/date';

const DailyAlarm = NativeModules.DailyAlarmModule;

const PERIOD_REMINDER_IDS_KEY = 'period_reminder_ids';
const DAILY_NOTIF_IDS_KEY = 'daily_notif_ids';

export async function setupNotificationHandler(): Promise<void> {
  if (Platform.OS === 'android') {
    // 'default' channel — only used for general/first-time prompts
    // Keep importance at DEFAULT so it doesn't disturb, but still shows.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FayeTide 提醒',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    // 'period' channel — HIGH importance so reminders are visible even
    // on Chinese ROMs with strict background restrictions.
    await Notifications.setNotificationChannelAsync('period', {
      name: '经期提醒',
      importance: Notifications.AndroidImportance.HIGH,
    });
    // 'daily' channel — HIGH importance for the daily check-in notification.
    // Separate from 'period' to let users control them independently.
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
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a native AlarmManager-based daily notification.
 * The native receiver fetches fresh data (phase + weather + advice) at fire time,
 * so content is always real-time accurate. Falls back to JS scheduling
 * on non-Android platforms or if the native module is unavailable.
 */
export async function scheduleDailyNotifications(hour: number, minute: number): Promise<void> {
  if (Platform.OS === 'android' && DailyAlarm) {
    try {
      const city = (await AsyncStorage.getItem('city')) || '南昌';
      await DailyAlarm.schedule(hour, minute, city);
      return;
    } catch (e) {
      console.warn('Native alarm failed, falling back to JS:', e);
    }
  }
  // Fallback: JS-based one-time scheduling (still used for iOS / native-unavailable)
  await scheduleJSFallback(hour, minute);
}

/** JS fallback: simple DAILY trigger for when native alarm isn't available */
async function scheduleJSFallback(hour: number, minute: number): Promise<void> {
  const prevIdsStr = await AsyncStorage.getItem(DAILY_NOTIF_IDS_KEY);
  if (prevIdsStr) {
    let ids: string[] = [];
    try { ids = JSON.parse(prevIdsStr); } catch { /* ignore */ }
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  }
  const db = await getDatabase();
  const records = await getAllPeriodRecords(db);
  const content = await buildContentForDate(new Date(), records);
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: content.title, body: content.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour, minute,
      channelId: 'daily',
    },
  });
  await AsyncStorage.setItem(DAILY_NOTIF_IDS_KEY, JSON.stringify([id]));
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

/**
 * Combined scheduler: reschedule DAILY notification + period reminders.
 * Call this on app cold start (NOT just when records change) so that
 * period-approaching reminders survive app kills + reboots.
 */
export async function scheduleAllNotifications(
  hour: number,
  minute: number,
): Promise<void> {
  await setupNotificationHandler();
  const granted = await requestNotificationPermission();
  if (!granted) return;
  // Android 12+: check exact alarm permission for precise timing
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
  await schedulePeriodReminders();
}

/** Build notification content for a specific date — phase + weather (today only) + life advice. */
async function buildContentForDate(
  date: Date,
  records: any[],
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

    const title = `${PHASE_LABELS[phase]} · 第${dayOffset}天`;

    // Weather: only include for today (can't predict future weather)
    const isToday = isSameDay(date, new Date());
    const weather = isToday ? await getCachedWeatherForNotification() : null;

    let body = '';
    if (weather) {
      const wa = getWeatherAdvice(weather.weatherCode);
      const life = getLifeAdvice(phase, {
        temperature: weather.temperature,
        weatherCode: weather.weatherCode,
        condition: wa.condition,
        advice: wa.advice,
      });
      body = `${wa.icon} ${wa.condition} ${weather.temperature}° · ${life.phaseAdvice}`;
    } else {
      const life = getLifeAdvice(phase, {
        temperature: 20, weatherCode: 0, condition: '未知', advice: '保持好心情',
      });
      body = life.phaseAdvice;
    }

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
