import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getDatabase } from '../db/database';
import { PeriodRecord, getAllPeriodRecords, insertPeriodRecord, deletePeriodRecord, clearAllPeriodRecords } from '../db/period-records';
import { schedulePeriodReminders } from '../services/notifications';

interface PeriodCtx {
  records: PeriodRecord[];
  loading: boolean;
  error: string | null;
  addRecord: (startDate: string) => Promise<void>;
  removeRecord: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PeriodCtx>({} as PeriodCtx);
export const usePeriod = () => useContext(Ctx);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PeriodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const db = await getDatabase();
      const all = await getAllPeriodRecords(db);
      setRecords(all);
    } catch (e: any) {
      console.warn('PeriodContext.refresh failed:', e);
      setError(e?.message || '加载经期数据失败');
    } finally {
      setLoading(false);
    }
    // Reschedule period reminders whenever records change
    try { await schedulePeriodReminders(); } catch { /* non-critical — notification scheduling can fail */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addRecord = async (startDate: string) => {
    const db = await getDatabase();
    try {
      await insertPeriodRecord(db, startDate);
    } catch (e: any) {
      // Only treat genuine UNIQUE constraint violations as toggle-off.
      // All other errors (DB locked, disk full, etc.) must surface.
      const msg = e?.message || '';
      if (msg.includes('UNIQUE') || msg.includes('unique')) {
        const all = await getAllPeriodRecords(db);
        const existing = all.find(r => r.start_date === startDate);
        if (existing) await deletePeriodRecord(db, existing.id);
      } else {
        throw e;
      }
    }
    await refresh();
  };

  const removeRecord = async (id: number) => {
    const db = await getDatabase();
    await deletePeriodRecord(db, id);
    await refresh();
  };

  const clearAll = async () => {
    const db = await getDatabase();
    await clearAllPeriodRecords(db);
    await refresh();
  };

  return (
    <Ctx.Provider value={{ records, loading, error, addRecord, removeRecord, clearAll, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
