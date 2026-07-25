import { SQLiteDatabase } from 'expo-sqlite';
import { SymptomRecord } from '../constants/symptoms';

export async function getSymptomByDate(db: SQLiteDatabase, date: string): Promise<SymptomRecord | null> {
  const row = await db.getFirstAsync<SymptomRecord>(
    'SELECT * FROM symptoms WHERE date = ?',
    [date]
  );
  return row || null;
}

export async function upsertSymptom(
  db: SQLiteDatabase,
  date: string,
  fields: Partial<Omit<SymptomRecord, 'id' | 'date' | 'created_at'>>
): Promise<void> {
  const keys = Object.keys(fields).filter(k => k in fields);
  if (keys.length === 0) return;

  const setClauses = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => (fields as any)[k]);
  const params = [date, ...values, ...values];

  await db.runAsync(
    `INSERT INTO symptoms (date, ${keys.join(', ')})
     VALUES (?, ${keys.map(() => '?').join(', ')})
     ON CONFLICT(date) DO UPDATE SET ${setClauses}`,
    params
  );
}

export async function getAllSymptoms(db: SQLiteDatabase): Promise<SymptomRecord[]> {
  return db.getAllAsync<SymptomRecord>('SELECT * FROM symptoms ORDER BY date DESC LIMIT 500');
}

export async function getSymptomCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM symptoms');
  return row?.cnt ?? 0;
}

export async function clearAllSymptoms(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM symptoms');
}
