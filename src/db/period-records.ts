import { SQLiteDatabase } from 'expo-sqlite';

export interface PeriodRecord {
  id: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export async function getAllPeriodRecords(db: SQLiteDatabase): Promise<PeriodRecord[]> {
  return await db.getAllAsync<PeriodRecord>(
    'SELECT * FROM period_records ORDER BY start_date DESC'
  );
}

export async function insertPeriodRecord(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<void> {
  await db.runAsync(
    'INSERT INTO period_records (start_date, end_date) VALUES (?, ?)',
    [startDate, endDate]
  );
}

export async function updatePeriodRecord(
  db: SQLiteDatabase,
  id: number,
  startDate: string,
  endDate: string
): Promise<void> {
  await db.runAsync(
    'UPDATE period_records SET start_date = ?, end_date = ? WHERE id = ?',
    [startDate, endDate, id]
  );
}

export async function deletePeriodRecord(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM period_records WHERE id = ?', [id]);
}
