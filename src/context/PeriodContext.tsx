import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { getDatabase } from '../db/database';
import { PeriodRecord, getAllPeriodRecords, insertPeriodRecord, updatePeriodEndDate, deletePeriodRecord, clearAllPeriodRecords } from '../db/period-records';
import { parseDate, diffDays } from '../utils/date';

/** Minimum plausible cycle length — prevents accidental multi-marking within one month */
const MIN_CYCLE_DAYS = 21;
/** Debounce window for batch-operations — merges rapid refreshes */
const REFRESH_DEBOUNCE_MS = 300;

interface PeriodCtx {
  records: PeriodRecord[];
  loading: boolean;
  error: string | null;
  addRecord: (startDate: string) => Promise<void>;
  removeRecord: (id: number) => Promise<void>;
  updateEndDate: (startDate: string, endDate: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PeriodCtx>({} as PeriodCtx);
export const usePeriod = () => useContext(Ctx);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PeriodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRefresh = useRef<() => Promise<void>>(() => Promise.resolve());

  const doRefresh = useCallback(async () => {
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
  }, []);

  /** Debounced refresh — merges rapid successive calls into a single DB query */
  const refresh = useCallback(async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    return new Promise<void>(resolve => {
      latestRefresh.current = async () => { await doRefresh(); resolve(); };
      refreshTimer.current = setTimeout(() => {
        refreshTimer.current = null;
        latestRefresh.current();
      }, REFRESH_DEBOUNCE_MS);
    });
  }, [doRefresh]);

  useEffect(() => { doRefresh(); }, [doRefresh]);

  const addRecord = useCallback(async (startDate: string) => {
    const db = await getDatabase();
    try {
      const all = await getAllPeriodRecords(db);
      const newDate = parseDate(startDate);
      for (const rec of all) {
        const dist = Math.abs(diffDays(parseDate(rec.start_date), newDate));
        if (dist > 0 && dist < MIN_CYCLE_DAYS) {
          throw new Error(
            `两次经期间隔太近（仅${dist}天），一般至少需要${MIN_CYCLE_DAYS}天。是不是点错了日期？`
          );
        }
      }
      await insertPeriodRecord(db, startDate);
      // Optimistic: update UI immediately, then debounce DB refresh
      setRecords(prev => {
        const exists = prev.find(r => r.start_date === startDate);
        if (exists) return prev;
        return [...prev, { id: -1, start_date: startDate, end_date: null, created_at: new Date().toISOString() }];
      });
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('UNIQUE') || msg.includes('unique')) {
        const all = await getAllPeriodRecords(db);
        const existing = all.find(r => r.start_date === startDate);
        if (existing) {
          await deletePeriodRecord(db, existing.id);
          setRecords(prev => prev.filter(r => r.start_date !== startDate));
        }
      } else {
        throw e;
      }
    }
    // Debounced full refresh to sync IDs and re-schedule reminders
    refresh();
  }, [refresh]);

  const removeRecord = useCallback(async (id: number) => {
    const db = await getDatabase();
    await deletePeriodRecord(db, id);
    refresh();
  }, [refresh]);

  const updateEndDate = useCallback(async (startDate: string, endDate: string) => {
    const db = await getDatabase();
    await updatePeriodEndDate(db, startDate, endDate);
    // Optimistic
    setRecords(prev => prev.map(r =>
      r.start_date === startDate ? { ...r, end_date: endDate } : r
    ));
    refresh();
  }, [refresh]);

  const clearAll = useCallback(async () => {
    const db = await getDatabase();
    await clearAllPeriodRecords(db);
    await refresh();
  }, [refresh]);

  const value = useMemo(() => ({
    records, loading, error, addRecord, removeRecord, updateEndDate, clearAll, refresh
  }), [records, loading, error, addRecord, removeRecord, updateEndDate, clearAll, refresh]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}
