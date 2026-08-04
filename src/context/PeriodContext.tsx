import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { getDatabase } from '../db/database';
import { PeriodRecord, getAllPeriodRecords, insertPeriodRecord, updatePeriodEndDate, deletePeriodRecord, clearAllPeriodRecords } from '../db/period-records';
import { parseDate, diffDays, addDays, formatDate } from '../utils/date';
import { DEFAULT_PERIOD_DAYS } from '../constants/phases';

/** Minimum plausible cycle length — prevents accidental multi-marking within one month */
const MIN_CYCLE_DAYS = 21;
/** Debounce window for batch-operations — merges rapid refreshes */
const REFRESH_DEBOUNCE_MS = 300;

/**
 * 记录新周期时，上一个周期还没有设置结束日期。
 * 核心原则：已结束的周期不能被后续操作修改 —— 必须先补齐上个周期的结束日期，
 * 否则上个周期的经期天数会随全局平均（无 end_date 时按间隔 20% 估算）漂移。
 */
export class MissingEndDateError extends Error {
  /** 上一个周期（缺少结束日期）的开始日期 YYYY-MM-DD */
  prevStart: string;
  constructor(prevStart: string) {
    super(`上个周期（${prevStart}开始）还没有设置结束日期`);
    this.name = 'MissingEndDateError';
    this.prevStart = prevStart;
  }
}

interface PeriodCtx {
  records: PeriodRecord[];
  loading: boolean;
  error: string | null;
  addRecord: (startDate: string) => Promise<void>;
  /** 忽略提醒时使用：按默认天数补齐上个周期结束日期后，再记录新周期 */
  addRecordIgnoringMissingEnd: (startDate: string) => Promise<void>;
  removeRecord: (id: number) => Promise<void>;
  updateEndDate: (startDate: string, endDate: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PeriodCtx>({} as PeriodCtx);
export const usePeriod = () => useContext(Ctx);

/**
 * 找新日期之前、最近一个"缺少结束日期"的周期（从近到远）。
 * 只要存在未设置结束日期的历史周期，录入新周期前都应提醒补齐，
 * 保证"已结束的周期不受后续操作修改"（缺 end_date 的周期会随全局平均漂移）。
 */
function findPrevMissingEndRecord(records: PeriodRecord[], date: Date): PeriodRecord | null {
  const sorted = [...records].sort((a, b) => a.start_date.localeCompare(b.start_date));
  for (let i = sorted.length - 1; i >= 0; i--) {
    const rec = sorted[i];
    if (parseDate(rec.start_date) < date && !rec.end_date) return rec;
  }
  return null;
}

/** 两次经期的最短合理间隔校验；不满足时抛出可读错误。 */
function assertMinCycleDistance(records: PeriodRecord[], newDate: Date): void {
  for (const rec of records) {
    const dist = Math.abs(diffDays(parseDate(rec.start_date), newDate));
    if (dist > 0 && dist < MIN_CYCLE_DAYS) {
      throw new Error(
        `两次经期间隔太近（仅${dist}天），一般至少需要${MIN_CYCLE_DAYS}天。是不是点错了日期？`
      );
    }
  }
}

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
      assertMinCycleDistance(all, newDate);
      // 记录新周期前，检查是否还有未设置结束日期的历史周期。
      // 没有则提醒（MissingEndDateError → UI 弹窗）；用户忽略时走 addRecordIgnoringMissingEnd。
      const prev = findPrevMissingEndRecord(all, newDate);
      if (prev) {
        throw new MissingEndDateError(prev.start_date);
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

  /** 用户选择忽略"缺结束日期"提醒：按默认天数补齐该周期结束日期，再记录新周期。
   *  这样已结束的周期就被固定下来，不再受全局平均天数影响。 */
  const addRecordIgnoringMissingEnd = useCallback(async (startDate: string) => {
    const db = await getDatabase();
    const all = await getAllPeriodRecords(db);
    const newDate = parseDate(startDate);
    // 与 addRecord 共用同一间隔校验，防止绕过 21 天最短周期约束
    assertMinCycleDistance(all, newDate);
    const prev = findPrevMissingEndRecord(all, newDate);
    if (prev) {
      const endDate = formatDate(addDays(parseDate(prev.start_date), DEFAULT_PERIOD_DAYS - 1));
      await updatePeriodEndDate(db, prev.start_date, endDate);
      // Optimistic: 立即把上个周期结束日期写进 UI
      setRecords(prevState => prevState.map(r =>
        r.start_date === prev.start_date ? { ...r, end_date: endDate } : r
      ));
    }
    await insertPeriodRecord(db, startDate);
    setRecords(prevState => {
      const exists = prevState.find(r => r.start_date === startDate);
      if (exists) return prevState;
      return [...prevState, { id: -1, start_date: startDate, end_date: null, created_at: new Date().toISOString() }];
    });
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
    records, loading, error, addRecord, addRecordIgnoringMissingEnd, removeRecord, updateEndDate, clearAll, refresh
  }), [records, loading, error, addRecord, addRecordIgnoringMissingEnd, removeRecord, updateEndDate, clearAll, refresh]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}
