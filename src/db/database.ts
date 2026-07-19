import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedDietRules } from './diet-rules';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (!initPromise) {
    initPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('period_tracker.db');
      await initTables(database);
      await seedDietRules(database);
      db = database;
      return database;
    })();
  }
  return initPromise;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
  }
}

async function initTables(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable WAL mode — allows concurrent reads while writing, no more UI jank
  await db.execAsync('PRAGMA journal_mode=WAL');
  await db.execAsync('PRAGMA foreign_keys=ON');

  // Always create tables first (safe on fresh DB with IF NOT EXISTS)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS period_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diet_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase TEXT NOT NULL,
      day_offset INTEGER NOT NULL,
      recommend TEXT NOT NULL DEFAULT '[]',
      avoid TEXT NOT NULL DEFAULT '[]',
      is_builtin INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS symptoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      flow TEXT,
      cramps TEXT,
      mood TEXT,
      energy TEXT,
      headache INTEGER DEFAULT 0,
      bloating INTEGER DEFAULT 0,
      cravings INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Performance indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_diet_rules_phase_day ON diet_rules(phase, day_offset);
    CREATE INDEX IF NOT EXISTS idx_period_records_date ON period_records(start_date);
  `);

  // One-time migration: clean up old end_date column if upgrading from old schema
  const migrationDone = await AsyncStorage.getItem('db_migrated_v1');
  if (!migrationDone) {
    try {
      const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(period_records)");
      const hasEndDate = cols.some(c => c.name === 'end_date');
      if (hasEndDate) {
        // Recreate without end_date
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS period_records_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_date TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          INSERT INTO period_records_new (id, start_date, created_at)
            SELECT id, start_date, created_at FROM period_records;
          DROP TABLE period_records;
          ALTER TABLE period_records_new RENAME TO period_records;
        `);
      }
    } catch {
      // Fresh install on an empty DB — PRAGMA table_info returns nothing and that's fine.
      // We still set the flag so we don't re-run PRAGMA on every startup.
    }
    await AsyncStorage.setItem('db_migrated_v1', '1');
  }
}
