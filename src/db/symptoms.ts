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
  await db.runAsync(
    `INSERT INTO symptoms (date, flow, cramps, mood, energy, headache, bloating, cravings, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       flow = COALESCE(excluded.flow, flow),
       cramps = COALESCE(excluded.cramps, cramps),
       mood = COALESCE(excluded.mood, mood),
       energy = COALESCE(excluded.energy, energy),
       headache = COALESCE(excluded.headache, headache),
       bloating = COALESCE(excluded.bloating, bloating),
       cravings = COALESCE(excluded.cravings, cravings),
       notes = COALESCE(excluded.notes, notes)`,
    [
      date,
      fields.flow || null,
      fields.cramps || null,
      fields.mood || null,
      fields.energy || null,
      fields.headache ?? 0,
      fields.bloating ?? 0,
      fields.cravings ?? 0,
      fields.notes || null,
    ]
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
