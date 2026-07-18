import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../db/database';
import { getAllPeriodRecords, PeriodRecord } from '../db/period-records';
import { getAllDietRules, DietRule } from '../db/diet-rules';

interface BackupData {
  version: number;
  exportedAt: string;
  settings: {
    city: string;
    useGPS: boolean;
    notifyHour: number;
    notifyMinute: number;
  };
  periodRecords: PeriodRecord[];
  dietRules: DietRule[];
}

export async function exportData(): Promise<string> {
  const db = await getDatabase();

  const [records, dietRules, settingsKeys] = await Promise.all([
    getAllPeriodRecords(db),
    getAllDietRules(db),
    AsyncStorage.getMany(['city', 'useGPS', 'notifyHour', 'notifyMinute']),
  ]);

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      city: settingsKeys.city || '成都',
      useGPS: settingsKeys.useGPS === 'true',
      notifyHour: settingsKeys.notifyHour ? Number(settingsKeys.notifyHour) : 8,
      notifyMinute: settingsKeys.notifyMinute ? Number(settingsKeys.notifyMinute) : 0,
    },
    periodRecords: records,
    dietRules,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importData(json: string): Promise<void> {
  const data: BackupData = JSON.parse(json);

  if (!data || typeof data !== 'object') {
    throw new Error('无效的备份数据');
  }

  const db = await getDatabase();

  // Restore settings
  if (data.settings) {
    const pairs: [string, string][] = [];
    if (data.settings.city) pairs.push(['city', data.settings.city]);
    pairs.push(['useGPS', String(!!data.settings.useGPS)]);
    if (data.settings.notifyHour !== undefined) pairs.push(['notifyHour', String(data.settings.notifyHour)]);
    if (data.settings.notifyMinute !== undefined) pairs.push(['notifyMinute', String(data.settings.notifyMinute)]);
    for (const [key, value] of pairs) {
      await AsyncStorage.setItem(key, value);
    }
  }

  // Restore period records
  if (Array.isArray(data.periodRecords)) {
    await db.runAsync('DELETE FROM period_records');
    for (const rec of data.periodRecords) {
      await db.runAsync(
        'INSERT INTO period_records (start_date, end_date, created_at) VALUES (?, ?, ?)',
        [rec.start_date, rec.end_date, rec.created_at || new Date().toISOString()]
      );
    }
  }

  // Restore diet rules
  if (Array.isArray(data.dietRules)) {
    await db.runAsync('DELETE FROM diet_rules');
    for (const rule of data.dietRules) {
      await db.runAsync(
        'INSERT INTO diet_rules (phase, day_offset, recommend, avoid, is_builtin) VALUES (?, ?, ?, ?, ?)',
        [rule.phase, rule.day_offset, JSON.stringify(rule.recommend), JSON.stringify(rule.avoid), rule.is_builtin || 0]
      );
    }
  }
}
