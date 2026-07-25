import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../db/database';
import { getAllPeriodRecords, PeriodRecord } from '../db/period-records';
import { getAllDietRules, DietRule } from '../db/diet-rules';
import { getAllSymptoms } from '../db/symptoms';
import { SymptomRecord } from '../constants/symptoms';

interface BackupData {
  version: number;
  exportedAt: string;
  settings: {
    city: string;
    notifyHour: number;
    notifyMinute: number;
  };
  periodRecords: PeriodRecord[];
  dietRules: DietRule[];
  symptoms: SymptomRecord[];
}

export async function exportData(): Promise<string> {
  const db = await getDatabase();

  const [records, dietRules, symptoms, cityVal, hourVal, minVal] = await Promise.all([
    getAllPeriodRecords(db),
    getAllDietRules(db),
    getAllSymptoms(db),
    AsyncStorage.getItem('city'),
    AsyncStorage.getItem('notifyHour'),
    AsyncStorage.getItem('notifyMinute'),
  ]);

  const settingsKeys: Record<string, string | null> = {
    city: cityVal,
    notifyHour: hourVal,
    notifyMinute: minVal,
  };

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      city: settingsKeys.city || '南昌',
      notifyHour: settingsKeys.notifyHour ? Number(settingsKeys.notifyHour) : 8,
      notifyMinute: settingsKeys.notifyMinute ? Number(settingsKeys.notifyMinute) : 0,
    },
    periodRecords: records,
    dietRules,
    symptoms,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importData(json: string): Promise<void> {
  let data: BackupData;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('备份数据格式错误，无法解析 JSON');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('无效的备份数据');
  }

  // Prevent importing excessively large datasets
  const MAX_RECORDS = 500;
  if (Array.isArray(data.periodRecords) && data.periodRecords.length > MAX_RECORDS) {
    throw new Error(`经期记录过多（${data.periodRecords.length}条），最多允许${MAX_RECORDS}条`);
  }
  if (Array.isArray(data.symptoms) && data.symptoms.length > MAX_RECORDS) {
    throw new Error(`症状记录过多（${data.symptoms.length}条），最多允许${MAX_RECORDS}条`);
  }

  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    // Restore period records
    if (Array.isArray(data.periodRecords)) {
      await db.runAsync('DELETE FROM period_records');
      for (const rec of data.periodRecords) {
        if (!rec.start_date || typeof rec.start_date !== 'string') continue;
        await db.runAsync(
          'INSERT INTO period_records (start_date, end_date, created_at) VALUES (?, ?, ?)',
          [rec.start_date, rec.end_date ?? null, rec.created_at || new Date().toISOString()]
        );
      }
    }

    // Restore diet rules
    if (Array.isArray(data.dietRules)) {
      await db.runAsync('DELETE FROM diet_rules');
      for (const rule of data.dietRules) {
        if (!rule.phase || !Array.isArray(rule.recommend) || !Array.isArray(rule.avoid)) continue;
        await db.runAsync(
          'INSERT INTO diet_rules (phase, day_offset, recommend, avoid, is_builtin) VALUES (?, ?, ?, ?, ?)',
          [rule.phase, rule.day_offset ?? 0, JSON.stringify(rule.recommend), JSON.stringify(rule.avoid), rule.is_builtin || 0]
        );
      }
    }

    // Restore symptoms
    if (Array.isArray(data.symptoms)) {
      await db.runAsync('DELETE FROM symptoms');
      for (const s of data.symptoms) {
        if (!s.date || typeof s.date !== 'string') continue;
        await db.runAsync(
          `INSERT INTO symptoms (date, flow, cramps, mood, energy, headache, bloating, cravings, backPain, breastPain, skinSensitive, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.date, s.flow ?? null, s.cramps ?? null, s.mood ?? null, s.energy ?? null,
           s.headache ?? 0, s.bloating ?? 0, s.cravings ?? 0,
           s.backPain ?? 0, s.breastPain ?? 0, s.skinSensitive ?? 0, s.notes ?? null,
           s.created_at ?? new Date().toISOString()]
        );
      }
    }
  });

  // Restore settings (outside transaction — AsyncStorage is independent)
  if (data.settings) {
    const pairs: [string, string][] = [];
    if (typeof data.settings.city === 'string') pairs.push(['city', data.settings.city]);
    if (typeof data.settings.notifyHour === 'number') pairs.push(['notifyHour', String(data.settings.notifyHour)]);
    if (typeof data.settings.notifyMinute === 'number') pairs.push(['notifyMinute', String(data.settings.notifyMinute)]);
    for (const [key, value] of pairs) {
      await AsyncStorage.setItem(key, value);
    }
  }
}
