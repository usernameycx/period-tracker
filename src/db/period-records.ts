import { SQLiteDatabase } from 'expo-sqlite';

export interface PeriodRecord {
  id: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export async function getAllPeriodRecords(db: SQLiteDatabase): Promise<PeriodRecord[]> {
  return await db.getAllAsync<PeriodRecord>(
    'SELECT * FROM period_records ORDER BY start_date DESC LIMIT 500'
  );
}

export async function insertPeriodRecord(
  db: SQLiteDatabase,
  startDate: string
): Promise<void> {
  await db.runAsync(
    'INSERT INTO period_records (start_date) VALUES (?)',
    [startDate]
  );
}

export async function updatePeriodEndDate(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<void> {
  await db.runAsync(
    'UPDATE period_records SET end_date = ? WHERE start_date = ?',
    [endDate, startDate]
  );
}

export async function deletePeriodRecord(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM period_records WHERE id = ?', [id]);
}

export async function clearAllPeriodRecords(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM period_records');
}
